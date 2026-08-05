/**
 * Anreise-Navigation: Karten-App wählen und die Route dorthin öffnen.
 *
 * FRÜHER entschied das Gerät allein: iPhone und iPad bekamen Apple Karten,
 * alle anderen Google Maps. Das geht an der Wirklichkeit vorbei – viele
 * iPhone-Nutzerinnen navigieren mit Google Maps (gespeicherte Orte,
 * Verkehrslage, Offline-Karten), und wer im Auto CarPlay mit Apple Karten
 * fährt, will genau das andere. Ein Link, der ungefragt die falsche App
 * aufreisst, kostet auf dem Parkplatz Zeit und Nerven.
 *
 * NEU wird beim ersten Mal GEFRAGT und die Antwort behalten. Der Dialog
 * (components/DirectionsPrompt.tsx) hängt am AppShell und wird über ein
 * Fenster-Ereignis ausgelöst – so kommen alle Routen-Knöpfe der App damit
 * aus, auch die von Hand gebauten Karten-Sprechblasen in MapView, ohne dass
 * jede Stelle einen eigenen Dialog mitschleppt. Ändern lässt sich die Wahl
 * jederzeit im Profil.
 */
import { isNativeApp, NATIVE_MESSAGES, postToNative } from "./nativeBridge";

/** Karten-Apps, die wir ansteuern können. */
export const MAPS_PROVIDERS = ["apple", "google"] as const;
export type MapsProvider = (typeof MAPS_PROVIDERS)[number];

/** Gespeicherte Wahl – «ask» heisst: beim nächsten Mal wieder fragen. */
export type MapsPreference = MapsProvider | "ask";

const STORAGE_KEY = "campmesser.mapsApp";

/** Ereignisname des Dialog-Aufrufs (siehe DirectionsPrompt). */
export const DIRECTIONS_EVENT = "campmesser:directions";

/** Ziel einer Routen-Anfrage, wie es im Ereignis mitgeschickt wird. */
export interface DirectionsRequest {
  lat: number;
  lon: number;
}

/**
 * Welche App schlägt das Gerät vor? Das ist nur die Vorauswahl im Dialog –
 * die Entscheidung trifft die Person.
 */
export function defaultProvider(
  userAgent: string = typeof navigator === "undefined"
    ? ""
    : navigator.userAgent
): MapsProvider {
  return /iPhone|iPad|iPod/i.test(userAgent) ? "apple" : "google";
}

/** Route zu einem Punkt in der gewählten App – als Web-Adresse. */
export function directionsUrl(
  lat: number,
  lon: number,
  provider: MapsProvider
): string {
  const destination = `${lat},${lon}`;
  return provider === "apple"
    ? `https://maps.apple.com/?daddr=${destination}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

/**
 * Dieselbe Route als APP-Adresse (#326).
 *
 * WARUM ES DIE ZWEITE FASSUNG BRAUCHT: Im Browser ist eine `https`-Adresse
 * richtig – das Betriebssystem entscheidet dann selbst, ob es die Karten-App
 * öffnet oder die Webseite. Im WebView der nativen App gilt das NICHT: Dort
 * landet `https://www.google.com/maps/…` in der App selbst oder bestenfalls
 * in Safari, und man steht in der Web-Ansicht von Google Maps – ohne
 * gespeicherte Orte, ohne Sprachnavigation, und ohne Weg zurück.
 *
 * Die App-Schemata umgehen das: Sie sprechen die installierte App direkt an.
 * Ist sie nicht installiert, lässt `Linking.canOpenURL` das erkennen, und der
 * native Rahmen fällt auf die Web-Adresse oben zurück.
 *
 * `directionsmode=driving` bei Google ist Absicht: Der Knopf heisst
 * «Anreise», und angereist wird mit dem Fahrzeug. Ohne Angabe nimmt Google
 * die zuletzt benutzte Art – nach einer Wanderung wäre das zu Fuss.
 */
export function directionsAppUrl(
  lat: number,
  lon: number,
  provider: MapsProvider
): string {
  const destination = `${lat},${lon}`;
  return provider === "apple"
    ? `maps://?daddr=${destination}&dirflg=d`
    : `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
}

/** Gespeicherte Wahl lesen (Standard: fragen). */
export function loadMapsPreference(): MapsPreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "apple" || raw === "google" || raw === "ask") return raw;
  } catch {
    /* egal */
  }
  return "ask";
}

/** Wahl speichern; «ask» räumt den Eintrag weg (es wird wieder gefragt). */
export function saveMapsPreference(preference: MapsPreference): void {
  try {
    if (preference === "ask") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    /* egal */
  }
}

/**
 * Karten-App öffnen.
 *
 * IM BROWSER: eine Web-Adresse in einem neuen Tab, ohne Rückverweis auf uns.
 * Das Betriebssystem darf selbst entscheiden, ob daraus die Karten-App wird.
 *
 * IN DER NATIVEN APP: über die Brücke, damit der native Rahmen zuerst die
 * echte App versucht (#326). `window.open` würde dort die Web-Ansicht von
 * Google Maps im WebView öffnen – der Grund, warum es sich vorher nicht wie
 * eine App anfühlte.
 */
export function openInMaps(
  lat: number,
  lon: number,
  provider: MapsProvider
): void {
  if (isNativeApp()) {
    postToNative(NATIVE_MESSAGES.openDirections, {
      appUrl: directionsAppUrl(lat, lon, provider),
      webUrl: directionsUrl(lat, lon, provider),
    });
    return;
  }
  window.open(directionsUrl(lat, lon, provider), "_blank", "noopener");
}

/**
 * Route öffnen: mit gespeicherter Wahl direkt, sonst fragt der Dialog.
 *
 * Bewusst aus dem Klick heraus aufgerufen: Ein `window.open` ausserhalb
 * einer Nutzer-Aktion würde vom Browser als Popup abgefangen. Beim Weg über
 * den Dialog ist der Knopf im Dialog die Aktion – das zählt genauso.
 */
export function openDirections(lat: number, lon: number): void {
  const preference = loadMapsPreference();
  if (preference !== "ask") {
    openInMaps(lat, lon, preference);
    return;
  }
  window.dispatchEvent(
    new CustomEvent<DirectionsRequest>(DIRECTIONS_EVENT, {
      detail: { lat, lon },
    })
  );
}
