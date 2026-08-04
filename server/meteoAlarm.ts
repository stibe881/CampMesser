/**
 * Amtliche Unwetterwarnungen holen (MeteoAlarm/MeteoSchweiz).
 *
 * ZWEI WEGE, UND DAS MIT ABSICHT:
 *
 * 1. Der Cronjob holt den Feed regelmässig ab. Das funktioniert immer,
 *    ist aber nur so schnell wie der Cron-Takt.
 * 2. Der Feed hat einen WebSub-Hub. Wer sich dort anmeldet, bekommt in
 *    dem Moment eine Meldung, in dem MeteoSchweiz etwas ausgibt – ohne
 *    zu fragen. Das ist der schnelle Weg.
 *
 * DER HUB LIEFERT NUR DAS SIGNAL, NIE DIE DATEN. Wenn eine Meldung
 * eintrifft, wird der Zwischenspeicher verworfen und der Feed NEU von
 * MeteoAlarm geholt. Damit ist es egal, ob jemand Fremdes an unseren
 * Endpunkt POSTet: Er kostet uns höchstens einen zusätzlichen Abruf,
 * kann aber keine erfundene Warnung in die App schieben.
 *
 * DER FEED IST GROSS (rund 1 MB, weil jedes Warngebiet als Polygon
 * drinsteht). Deshalb wird er zwischengespeichert und nicht pro Nutzer
 * geholt.
 */
import {
  METEOALARM_FEED_URL,
  METEOALARM_HUB_URL,
  parseMeteoAlarmFeed,
  type OfficialWarning,
} from "@shared/meteoAlarm";

/** So lange gilt ein geholter Feed als frisch. */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Abbruch, bevor der Cronjob wegen eines hängenden Abrufs stirbt. */
const FETCH_TIMEOUT_MS = 12_000;

let cache: { at: number; warnings: OfficialWarning[] } | null = null;
let inFlight: Promise<OfficialWarning[]> | null = null;

/** Zwischenspeicher verwerfen – der Hub hat eine Änderung gemeldet. */
export function invalidateWarnings(): void {
  cache = null;
}

async function loadFeed(): Promise<OfficialWarning[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(METEOALARM_FEED_URL, {
      signal: controller.signal,
      headers: { Accept: "application/atom+xml, application/xml" },
    });
    if (!response.ok) throw new Error(`Feed antwortete ${response.status}`);
    return parseMeteoAlarmFeed(await response.text());
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Die aktuellen amtlichen Warnungen.
 *
 * Ein Fehler liefert eine LEERE Liste und keinen Ausnahme-Wurf: Wenn
 * MeteoAlarm nicht erreichbar ist, sollen die eigenen Warnungen der App
 * trotzdem rausgehen. Lieber eine Quelle weniger als gar kein Push.
 *
 * Parallele Aufrufe teilen sich einen Abruf – der Cronjob prüft viele
 * Orte, der Feed ist für alle derselbe.
 */
export async function getOfficialWarnings(
  now = Date.now()
): Promise<OfficialWarning[]> {
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.warnings;
  if (inFlight) return inFlight;
  inFlight = loadFeed()
    .then(warnings => {
      cache = { at: now, warnings };
      return warnings;
    })
    .catch(error => {
      console.error("[MeteoAlarm] Feed nicht erreichbar:", error);
      // Ein alter Stand ist besser als nichts – aber nur, wenn es einen gibt
      return cache?.warnings ?? [];
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

// ── WebSub ────────────────────────────────────────────────────────────

/**
 * Wie lange ein Abo laufen soll. Der Hub darf kürzen; deshalb wird bei
 * jedem Cron-Lauf erneuert – ein zweites `subscribe` auf dieselbe
 * Adresse verlängert bloss, es entsteht kein zweites Abo.
 */
export const LEASE_SECONDS = 60 * 60 * 24 * 7;

/** Wird der Hub überhaupt genutzt? Ohne öffentliche Adresse geht es nicht. */
export function hubConfigured(): boolean {
  return Boolean(process.env.APP_URL || process.env.PUBLIC_URL);
}

/** Öffentliche Adresse unseres Empfangs-Endpunkts. */
export function hubCallbackUrl(): string | null {
  const base = (process.env.APP_URL || process.env.PUBLIC_URL || "").replace(
    /\/+$/,
    ""
  );
  if (!base) return null;
  return `${base}/api/warnings/hub`;
}

/**
 * Beim Hub anmelden bzw. das Abo verlängern.
 *
 * Scheitert das, ist es kein Beinbruch: Der Cronjob holt den Feed
 * weiterhin selbst ab. Der Hub ist die Abkürzung, nicht die Grundlage.
 */
export async function subscribeToHub(): Promise<
  "ok" | "nicht-konfiguriert" | "fehler"
> {
  const callback = hubCallbackUrl();
  if (!callback) return "nicht-konfiguriert";
  const body = new URLSearchParams({
    "hub.mode": "subscribe",
    "hub.topic": METEOALARM_FEED_URL,
    "hub.callback": callback,
    "hub.lease_seconds": String(LEASE_SECONDS),
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(METEOALARM_HUB_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    // 202 Accepted ist der Normalfall: Der Hub prüft die Adresse gleich
    // mit einem GET auf unseren Endpunkt.
    if (!response.ok) throw new Error(`Hub antwortete ${response.status}`);
    return "ok";
  } catch (error) {
    console.error("[MeteoAlarm] Hub-Anmeldung fehlgeschlagen:", error);
    return "fehler";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Prüfung des Hubs beantworten: Er ruft unseren Endpunkt mit einer
 * Zufallszeichenkette auf, die wir zurückgeben müssen.
 *
 * Nur für UNSER Thema – sonst könnte jemand unseren Endpunkt benutzen,
 * um sich bei beliebigen Feeds anzumelden.
 */
export function verifyChallenge(query: {
  "hub.mode"?: unknown;
  "hub.topic"?: unknown;
  "hub.challenge"?: unknown;
}): string | null {
  const mode = query["hub.mode"];
  const topic = query["hub.topic"];
  const challenge = query["hub.challenge"];
  if (typeof challenge !== "string" || !challenge) return null;
  if (mode !== "subscribe" && mode !== "unsubscribe") return null;
  if (topic !== METEOALARM_FEED_URL) return null;
  return challenge;
}
