/**
 * Amtliche Unwetterwarnungen (MeteoAlarm/MeteoSchweiz).
 *
 * WARUM ZUSÄTZLICH UND NICHT STATT: Die bisherigen Warnungen der App
 * rechnet `detectAlerts` selbst aus der Prognose – Wind am Zelt, Hitze,
 * Starkregen, mit EIGENEN Schwellen, die man im Profil verstellen kann.
 * Dafür gibt es keine amtliche Warnung: MeteoSchweiz warnt nicht, weil
 * dein Vorzelt bei 60 km/h Mühe hat. Umgekehrt sieht die Prognose ein
 * Gewitter nicht so scharf wie ein Meteorologe mit dem Radar.
 * Beides zusammen ist besser als eines allein.
 *
 * WOHER: MeteoAlarm (EUMETNET) veröffentlicht die amtlichen Warnungen
 * der nationalen Wetterdienste – für die Schweiz also die von
 * MeteoSchweiz, dieselben, die auch in Wetter-Alarm stecken. Das Format
 * ist CAP in einem Atom-Feed.
 *
 * QUELLENANGABE IST PFLICHT: Die Daten stehen unter einer CC-BY-nahen
 * Lizenz. Wer sie zeigt, nennt Herausgeber und Quelle – dafür gibt es
 * `ATTRIBUTION` weiter unten, und die Ansicht zeigt sie an.
 *
 * KEIN XML-PARSER ALS ABHÄNGIGKEIT: Der Feed ist maschinell erzeugt,
 * flach und ohne Attribute in den Feldern, die uns interessieren. Ein
 * paar Ausdrücke reichen und sparen ein Paket, das im Browser-Bundle
 * landen würde.
 */
import { l4, pick, type L4, type Language } from "./i18n";
import type { AlertSeverity } from "./weather";

/** Öffentlicher Feed der Schweizer Warnungen. */
export const METEOALARM_FEED_URL =
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-switzerland";

/** WebSub-Hub des Feeds – darüber kommt die Meldung ohne Abfrage. */
export const METEOALARM_HUB_URL = "https://pubsubhubbub.appspot.com/";

/** Quellenangabe, wie sie bei jeder Anzeige stehen muss. */
export const ATTRIBUTION = {
  issuer: "MeteoSchweiz",
  source: "MeteoAlarm",
  url: "https://meteoalarm.org",
} as const;

/** Eine amtliche Warnung, so wie sie aus dem Feed kommt. */
export interface OfficialWarning {
  /** Eindeutige CAP-Kennung – Grundlage für «schon gemeldet». */
  id: string;
  /** Ereignis in der Sprache des Feeds (Englisch), z. B. «Heavy thunderstorm». */
  event: string;
  /** Gebiets-Name des Herausgebers, z. B. «Ajoie». */
  areaDesc: string;
  /** CAP-Stufe: Minor | Moderate | Severe | Extreme. */
  severity: string;
  /** Beginn und Ende als ISO-Zeit (UTC). */
  onset: string;
  expires: string;
  /** Umrisse des Warngebiets: Ringe aus [lat, lon]-Paaren. */
  polygons: [number, number][][];
}

// ── Feed lesen ────────────────────────────────────────────────────────

function tag(entry: string, name: string): string {
  const match = entry.match(
    new RegExp(`<(?:cap:)?${name}>([\\s\\S]*?)</(?:cap:)?${name}>`)
  );
  return match ? match[1].trim() : "";
}

/**
 * Ein Polygon des Feeds lesen: «lat,lon lat,lon …».
 *
 * Fehlerhafte Paare werden übersprungen statt den ganzen Eintrag zu
 * verwerfen – eine Warnung mit einem kaputten Punkt ist immer noch eine
 * Warnung.
 */
export function parsePolygon(raw: string): [number, number][] {
  const ring: [number, number][] = [];
  raw
    .trim()
    .split(/\s+/)
    .forEach(pair => {
      const parts = pair.split(",");
      if (parts.length !== 2) return;
      const lat = Number(parts[0]);
      const lon = Number(parts[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      ring.push([lat, lon]);
    });
  return ring;
}

/**
 * Den Atom-Feed in Warnungen übersetzen.
 *
 * Nur `status=Actual` und `message_type=Alert` zählen: Testmeldungen und
 * Übungen dürfen niemandem den Abend verderben. Einträge ohne Kennung
 * oder ohne brauchbares Polygon fallen weg – ohne Gebiet lässt sich
 * nicht sagen, ob es einen betrifft.
 */
export function parseMeteoAlarmFeed(xml: string): OfficialWarning[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const warnings: OfficialWarning[] = [];
  entries.forEach(entry => {
    const status = tag(entry, "status");
    const messageType = tag(entry, "message_type");
    if (status && status !== "Actual") return;
    if (messageType && messageType !== "Alert") return;
    const id = tag(entry, "identifier");
    if (!id) return;
    const polygons = (
      entry.match(/<cap:polygon>[\s\S]*?<\/cap:polygon>/g) ?? []
    )
      .map(raw => parsePolygon(raw.replace(/<\/?cap:polygon>/g, "")))
      .filter(ring => ring.length >= 3);
    if (polygons.length === 0) return;
    warnings.push({
      id,
      event: tag(entry, "event"),
      areaDesc: tag(entry, "areaDesc"),
      severity: tag(entry, "severity"),
      onset: tag(entry, "onset") || tag(entry, "effective"),
      expires: tag(entry, "expires"),
      polygons,
    });
  });
  return warnings;
}

// ── Betrifft mich das? ────────────────────────────────────────────────

/**
 * Liegt der Punkt im Ring? Strahlenschnitt-Verfahren.
 *
 * Die Warngebiete sind klein genug, dass die Erdkrümmung keine Rolle
 * spielt – gerechnet wird flach in Grad. Ein Punkt genau auf der Kante
 * kann so oder so fallen; bei einer Wetterwarnung ist das ohne Belang.
 */
export function pointInRing(
  lat: number,
  lon: number,
  ring: readonly [number, number][]
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lonI] = ring[i];
    const [latJ, lonJ] = ring[j];
    const crosses = latI > lat !== latJ > lat;
    if (!crosses) continue;
    const lonAt = ((lonJ - lonI) * (lat - latI)) / (latJ - latI) + lonI;
    if (lon < lonAt) inside = !inside;
  }
  return inside;
}

export function warningCoversPoint(
  warning: OfficialWarning,
  lat: number,
  lon: number
): boolean {
  return warning.polygons.some(ring => pointInRing(lat, lon, ring));
}

/** Läuft die Warnung zum Zeitpunkt `now` noch? */
export function isWarningActive(
  warning: OfficialWarning,
  now: number
): boolean {
  const expires = Date.parse(warning.expires);
  if (Number.isFinite(expires) && expires <= now) return false;
  return true;
}

/**
 * Die Warnungen für einen Ort – abgelaufene weg, schärfste zuerst.
 *
 * SCHÄRFSTE ZUERST, weil bei mehreren Warnungen für denselben Ort die
 * schlimmste den Ton angibt: Wer «Gewitter» und «Hitze» hat, soll das
 * Gewitter zuoberst sehen.
 */
export function warningsForPoint(
  warnings: readonly OfficialWarning[],
  lat: number,
  lon: number,
  now: number
): OfficialWarning[] {
  return warnings
    .filter(w => isWarningActive(w, now) && warningCoversPoint(w, lat, lon))
    .slice()
    .sort(
      (a, b) =>
        severityRank(b.severity) - severityRank(a.severity) ||
        Date.parse(a.onset) - Date.parse(b.onset)
    );
}

// ── Stufen und Wörter ─────────────────────────────────────────────────

/** CAP-Stufe als Zahl – nur zum Sortieren. */
export function severityRank(severity: string): number {
  if (severity === "Extreme") return 4;
  if (severity === "Severe") return 3;
  if (severity === "Moderate") return 2;
  if (severity === "Minor") return 1;
  return 0;
}

/**
 * CAP-Stufe in die Stufen der App übersetzen.
 *
 * Extreme und Severe sind «Gefahr» – das sind die roten und orangen
 * Warnungen von MeteoSchweiz, bei denen man das Vorzelt einholt.
 * Moderate ist «Warnung», alles Kleinere «Info».
 */
export function severityToAlert(severity: string): AlertSeverity {
  const rank = severityRank(severity);
  if (rank >= 3) return "gefahr";
  if (rank === 2) return "warnung";
  return "info";
}

/**
 * Ab dieser Stufe wird eine amtliche Warnung als Push verschickt.
 *
 * Bewusst dieselbe Grenze wie bei den eigenen Warnungen: Ein Push mitten
 * in der Nacht muss etwas bedeuten. Wer alles sehen will, findet auch
 * die schwächeren Warnungen in der Wetter-Ansicht.
 */
export function isPushWorthy(warning: OfficialWarning): boolean {
  return severityRank(warning.severity) >= 3;
}

/**
 * Ereignis-Namen des Feeds in unsere vier Sprachen.
 *
 * Der Feed liefert Englisch. Die Liste deckt ab, was MeteoSchweiz
 * tatsächlich sendet; ein unbekanntes Ereignis wird UNVERÄNDERT
 * durchgereicht statt weggelassen – lieber ein englisches Wort als eine
 * verschwiegene Warnung.
 */
export const EVENT_LABELS: Record<string, L4> = {
  "Heavy thunderstorm": l4(
    "Kräftiges Gewitter",
    "Orage violent",
    "Temporale forte",
    "Heavy thunderstorm"
  ),
  "Violent thunderstorm": l4(
    "Schweres Gewitter",
    "Orage très violent",
    "Temporale molto forte",
    "Violent thunderstorm"
  ),
  "Widespread heavy thunderstorms possible": l4(
    "Verbreitet kräftige Gewitter möglich",
    "Orages violents étendus possibles",
    "Possibili temporali forti diffusi",
    "Widespread heavy thunderstorms possible"
  ),
  "Heat wave": l4("Hitzewelle", "Canicule", "Ondata di caldo", "Heat wave"),
  "Extreme heat wave": l4(
    "Extreme Hitzewelle",
    "Canicule extrême",
    "Ondata di caldo estrema",
    "Extreme heat wave"
  ),
  Wind: l4("Wind", "Vent", "Vento", "Wind"),
  Rain: l4("Regen", "Pluie", "Pioggia", "Rain"),
  "Rain-Flood": l4(
    "Regen und Hochwasser",
    "Pluie et crues",
    "Pioggia e piene",
    "Rain and flooding"
  ),
  Flood: l4("Hochwasser", "Crues", "Piene", "Flooding"),
  "Snow/Ice": l4(
    "Schnee und Eis",
    "Neige et verglas",
    "Neve e ghiaccio",
    "Snow and ice"
  ),
  Avalanches: l4("Lawinen", "Avalanches", "Valanghe", "Avalanches"),
  "Forest fire": l4(
    "Waldbrandgefahr",
    "Danger d'incendie de forêt",
    "Pericolo di incendi boschivi",
    "Forest fire danger"
  ),
  "Low temperature": l4("Frost", "Gel", "Gelo", "Frost"),
  "Coastal event": l4(
    "Küstenereignis",
    "Phénomène côtier",
    "Fenomeno costiero",
    "Coastal event"
  ),
};

/** Ereignis benennen; Unbekanntes bleibt, wie es kam. */
export function eventLabel(event: string, lang: Language): string {
  const label = EVENT_LABELS[event];
  return label ? pick(label, lang) : event;
}

/**
 * Schlüssel für «schon gemeldet».
 *
 * Die CAP-Kennung allein genügt: MeteoSchweiz vergibt für jede
 * Aktualisierung einer Warnung eine neue: Wird eine Warnung verschärft,
 * darf sie erneut melden – das ist genau der Fall, in dem man es wissen
 * will.
 */
export function warningKey(warning: OfficialWarning): string {
  return `amtlich:${warning.id}`;
}

/**
 * Alle Warnungen eines Orts zu einem Schlüssel – ändert er sich, hat
 * sich die Lage geändert.
 */
export function warningsKey(warnings: readonly OfficialWarning[]): string {
  return warnings.map(warningKey).sort().join("|");
}
