/**
 * «Wie weit noch?» (#242): die laufende Anfahrt als Speicher ausserhalb von
 * React – nach dem Muster der Wanderungs-Aufzeichnung (lib/hikeTracking.ts),
 * aber deutlich sparsamer.
 *
 * Der Unterschied zum Wander-Tracking ist Absicht. Eine Wanderung braucht
 * jeden Fix auf den Meter genau, weil daraus eine Strecke wird. Hier zählt
 * nur, wie weit es noch ist – und das ändert sich auf der Autobahn im
 * Minutentakt um Kilometer. Darum:
 *
 * - `enableHighAccuracy: false` – der grobe Standort aus Funkzellen und WLAN
 *   reicht vollkommen und kostet einen Bruchteil der Energie.
 * - EIN Fix pro Minute über einen Timer statt `watchPosition`. Ein Watch
 *   feuert bei jeder Bewegung; im Auto wäre das dauernd.
 * - `maximumAge` fast so gross wie das Intervall: eine eben erst ermittelte
 *   Position darf wiederverwendet werden, statt neu zu messen.
 *
 * Anders als beim Wander-Tracking wird KEINE Punktliste geführt: gespeichert
 * sind nur Start, Ziel und der letzte Standort. Eine Anfahrt überlebt damit
 * ein Neuladen der App, ohne dass irgendwo ein Bewegungsprofil entsteht.
 */
import { useEffect, useState } from "react";
import { highestPercent } from "@shared/arrivalProgress";

const STORAGE_KEY = "campmesser.arrivalTrip";

/** So oft wird der Standort geholt (Millisekunden). */
export const ARRIVAL_FIX_INTERVAL_MS = 60_000;

/** Eine laufende Anfahrt. */
export interface ArrivalTrip {
  /** Anzeigename des Ziels (Platzname oder Reisetitel). */
  targetName: string;
  targetLat: number;
  targetLon: number;
  /** Verknüpfter Platz-Favorit; null bei frei gewähltem Ziel. */
  spotId: number | null;
  /** Standort beim Losfahren. */
  startLat: number;
  startLon: number;
  startedAt: number;
  /** Zuletzt gemessener Standort. */
  currentLat: number;
  currentLon: number;
  /** Zeitpunkt des letzten Fixes; null = noch keiner seit dem Neuladen. */
  lastFixAt: number | null;
  /** Höchster bisher erreichter Fortschritt in Prozent – Meilensteine bleiben verdient. */
  maxPercent: number;
}

/** Warum kommt gerade kein Standort? Steuert den Hinweis in der Anzeige. */
export type ArrivalGeoError = "unsupported" | "denied" | "failed" | null;

function loadTrip(): ArrivalTrip | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const t = parsed as Partial<ArrivalTrip>;
    const numbers = [
      t.targetLat,
      t.targetLon,
      t.startLat,
      t.startLon,
      t.currentLat,
      t.currentLon,
    ];
    if (numbers.some(value => typeof value !== "number" || !isFinite(value))) {
      return null;
    }
    return {
      targetName: typeof t.targetName === "string" ? t.targetName : "",
      targetLat: t.targetLat as number,
      targetLon: t.targetLon as number,
      spotId: typeof t.spotId === "number" ? t.spotId : null,
      startLat: t.startLat as number,
      startLon: t.startLon as number,
      startedAt: typeof t.startedAt === "number" ? t.startedAt : Date.now(),
      currentLat: t.currentLat as number,
      currentLon: t.currentLon as number,
      lastFixAt: typeof t.lastFixAt === "number" ? t.lastFixAt : null,
      maxPercent:
        typeof t.maxPercent === "number" && isFinite(t.maxPercent)
          ? t.maxPercent
          : 0,
    };
  } catch {
    return null;
  }
}

function storeTrip(trip: ArrivalTrip | null): void {
  try {
    if (trip === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  } catch {
    /* Speicher blockiert – die Anfahrt läuft für diese Sitzung trotzdem */
  }
}

let trip: ArrivalTrip | null =
  typeof window === "undefined" ? null : loadTrip();
let geoError: ArrivalGeoError = null;
const listeners: Array<() => void> = [];
let timerId: number | null = null;

function emit(): void {
  listeners.forEach(fn => fn());
}

function commit(next: ArrivalTrip | null): void {
  trip = next;
  storeTrip(next);
  emit();
}

export function getArrivalTrip(): ArrivalTrip | null {
  return trip;
}

export function getArrivalGeoError(): ArrivalGeoError {
  return geoError;
}

/** Auf Änderungen hören; gibt die Abmelde-Funktion zurück. */
export function subscribeArrivalTrip(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}

/** Sparsame Optionen: grober Standort, gecachte Position erlaubt. */
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: ARRIVAL_FIX_INTERVAL_MS - 5_000,
  timeout: 30_000,
};

/** Einmal den Standort holen – die Ausgangsposition beim Losfahren. */
export function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      geoError = "unsupported";
      emit();
      reject(new Error("geolocation unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        geoError = null;
        emit();
        resolve(position);
      },
      error => {
        geoError = error.code === error.PERMISSION_DENIED ? "denied" : "failed";
        emit();
        reject(error);
      },
      GEO_OPTIONS
    );
  });
}

/** Einen frischen Standort in die laufende Anfahrt eintragen. */
function applyPosition(position: GeolocationPosition): void {
  const current = trip;
  if (!current) return;
  geoError = null;
  commit({
    ...current,
    currentLat: position.coords.latitude,
    currentLon: position.coords.longitude,
    lastFixAt: Date.now(),
  });
}

function requestFix(): void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    geoError = "unsupported";
    emit();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    applyPosition,
    error => {
      geoError = error.code === error.PERMISSION_DENIED ? "denied" : "failed";
      emit();
    },
    GEO_OPTIONS
  );
}

function startTimer(): void {
  if (timerId !== null) return;
  if (typeof window === "undefined") return;
  timerId = window.setInterval(requestFix, ARRIVAL_FIX_INTERVAL_MS);
}

function stopTimer(): void {
  if (timerId === null) return;
  window.clearInterval(timerId);
  timerId = null;
}

/** Anfahrt beginnen: Ziel merken, aktuellen Standort als Start setzen. */
export function startArrivalTrip(target: {
  name: string;
  lat: number;
  lon: number;
  spotId: number | null;
  startLat: number;
  startLon: number;
}): void {
  geoError = null;
  commit({
    targetName: target.name,
    targetLat: target.lat,
    targetLon: target.lon,
    spotId: target.spotId,
    startLat: target.startLat,
    startLon: target.startLon,
    startedAt: Date.now(),
    currentLat: target.startLat,
    currentLon: target.startLon,
    lastFixAt: Date.now(),
    maxPercent: 0,
  });
  startTimer();
}

/** Erreichten Höchststand festhalten (Meilensteine bleiben verdient). */
export function recordArrivalPercent(percent: number): void {
  const current = trip;
  if (!current) return;
  const next = highestPercent(current.maxPercent, percent);
  if (next === current.maxPercent) return;
  commit({ ...current, maxPercent: next });
}

/** Anfahrt beenden und den Speicher räumen. */
export function stopArrivalTrip(): void {
  stopTimer();
  commit(null);
}

/** Sofort einen Standort nachholen (Knopf «Jetzt aktualisieren»). */
export function refreshArrivalPosition(): void {
  if (!trip) return;
  requestFix();
}

// Nach einem Neuladen läuft der Timer nicht mehr – er wird beim Einhängen
// der Anzeige (useArrivalTrip) wieder gestartet, solange eine Anfahrt läuft.

/** React-Anbindung: laufende Anfahrt und Fehlerzustand. */
export function useArrivalTrip(): {
  trip: ArrivalTrip | null;
  geoError: ArrivalGeoError;
} {
  const [state, setState] = useState<{
    trip: ArrivalTrip | null;
    geoError: ArrivalGeoError;
  }>(() => ({ trip: getArrivalTrip(), geoError: getArrivalGeoError() }));

  useEffect(() => {
    setState({ trip: getArrivalTrip(), geoError: getArrivalGeoError() });
    return subscribeArrivalTrip(() =>
      setState({ trip: getArrivalTrip(), geoError: getArrivalGeoError() })
    );
  }, []);

  // Der Timer gehört zur laufenden Anfahrt, nicht zur Anzeige: läuft eine
  // Anfahrt (auch aus localStorage nach einem Neuladen), wird gemessen.
  // Ein Seitenwechsel beendet die Messung bewusst NICHT – wer auf die Karte
  // wechselt, findet den Balken beim Zurückkommen aktuell vor.
  const running = state.trip !== null;
  useEffect(() => {
    if (!running) {
      stopTimer();
      return;
    }
    startTimer();
  }, [running]);

  return state;
}
