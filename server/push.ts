/**
 * Web-Push für Unwetter-Warnungen an gespeicherten Zeltplätzen und am
 * Heim-Standort, MHD-Erinnerungen für die Kühlbox (Lebensmittel, die heute
 * oder morgen ablaufen), Trip-Countdowns (3 Tage vor der Anreise, inkl.
 * Pack-Fortschritt), Zelt-Trocknungs-Erinnerungen am Tag nach der
 * Heimkehr (bei Regen am Platz) und Sternschnuppen-Tipps, wenn am Heim-Ort
 * eine klare, mondarme Nacht auf ein aktives Strom-Maximum trifft.
 * Jede erfolgreich versendete Meldung landet zusätzlich im
 * Benachrichtigungs-Verlauf (#201, Tabelle pushLog) – einmal pro Konto,
 * nicht pro Gerät.
 * Der Check läuft über /api/push/check (konsoleH-Cronjob), weil Passenger
 * den Node-Prozess bei Inaktivität schlafen legt und ein interner Scheduler
 * deshalb unzuverlässig wäre.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import {
  campSpots,
  foodItems,
  gearTasks,
  homeLocations,
  packItems,
  pushLog,
  pushSubscriptions,
  tripLogs,
} from "../drizzle/schema";
import {
  isShowerActive,
  meteorShowers,
  type MeteorShower,
} from "../shared/astro";
import { expiryInfo } from "../shared/food";
import { gearTaskDue, type GearTaskLike } from "../shared/gearTasks";
import { heatAdvice } from "../shared/heatCare";
import { pick } from "../shared/i18n";
import { getMoonInfo } from "../shared/moon";
import { daysUntilTrip } from "../shared/trips";
import {
  detectAlerts,
  nightCloudCover,
  type AlertThresholds,
  type HourlyWeather,
} from "../shared/weather";
import { getDb } from "./db";

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configureWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:webmaster@campmesser.ch",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

export async function saveSubscription(
  userId: number,
  endpoint: string,
  p256dh: string,
  auth: string
) {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db
    .insert(pushSubscriptions)
    .values({ userId, endpoint, p256dh, auth })
    .onDuplicateKeyUpdate({ set: { userId, p256dh, auth } });
}

export async function deleteSubscription(userId: number, endpoint: string) {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );
}

/** Mitteilungs-Arten, die pro Abo (Gerät) einzeln abschaltbar sind. */
export type PushKind = "weather" | "food" | "trip" | "astro" | "gear" | "heat";

/**
 * Arten im Benachrichtigungs-Verlauf (#201): wie PushKind, aber mit den beiden
 * Sonderfällen, die am Flag «trip» hängen und trotzdem eigene Meldungen sind.
 */
export type PushLogKind = PushKind | "drying" | "evepack";

/** So viele Einträge behält der Verlauf pro Konto (ältere fallen weg). */
export const PUSH_LOG_LIMIT = 50;
/** So viele überzählige Einträge räumt ein Durchgang höchstens weg. */
const PUSH_LOG_PRUNE_BATCH = 200;

/** Text auf die Spaltenlänge kürzen – der Verlauf ist nur eine Kopie. */
function clamp(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text;
}

/**
 * Einen versendeten Push im Verlauf festhalten und dabei aufräumen: alles
 * jenseits der PUSH_LOG_LIMIT neuesten Einträge desselben Kontos fällt weg.
 * Der Verlauf hängt am KONTO, nicht am Gerät – bei mehreren Geräten schreibt
 * checkAndNotify deshalb nur einen Eintrag pro Meldung (Dedup pro Lauf).
 */
export async function recordPushLog(entry: {
  userId: number;
  kind: PushLogKind;
  title: string;
  body: string;
  url: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(pushLog).values({
    userId: entry.userId,
    kind: entry.kind,
    title: clamp(entry.title, 160),
    body: clamp(entry.body, 500),
    url: entry.url === null ? null : clamp(entry.url, 200),
  });
  const stale = await db
    .select({ id: pushLog.id })
    .from(pushLog)
    .where(eq(pushLog.userId, entry.userId))
    .orderBy(desc(pushLog.sentAt), desc(pushLog.id))
    .limit(PUSH_LOG_PRUNE_BATCH)
    .offset(PUSH_LOG_LIMIT);
  if (stale.length > 0) {
    await db.delete(pushLog).where(
      inArray(
        pushLog.id,
        stale.map(row => row.id)
      )
    );
  }
}

/** Eigener Benachrichtigungs-Verlauf, neueste zuerst (max. PUSH_LOG_LIMIT). */
export async function getPushLog(userId: number, limit = PUSH_LOG_LIMIT) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: pushLog.id,
      kind: pushLog.kind,
      title: pushLog.title,
      body: pushLog.body,
      url: pushLog.url,
      sentAt: pushLog.sentAt,
    })
    .from(pushLog)
    .where(eq(pushLog.userId, userId))
    .orderBy(desc(pushLog.sentAt), desc(pushLog.id))
    .limit(Math.max(1, Math.min(limit, PUSH_LOG_LIMIT)));
}

/**
 * Mitteilungs-Einstellungen eines Abos: die fünf Flags (Default: alles an)
 * plus die eigenen Warn-Schwellen des Unwetter-Pushes (null = Standard).
 */
export interface PushPrefs {
  wantsWeather: boolean;
  wantsFood: boolean;
  wantsTrips: boolean;
  wantsAstro: boolean;
  wantsGear: boolean;
  /** Sonnencreme- und Trink-Erinnerung an heissen Tagen (#260/#261) */
  wantsHeat: boolean;
  /** Böenspitze in km/h ab «Gefahr» (null = Standard 90) */
  windThresholdKmh: number | null;
  /** Regenmenge in mm/h ab «Gefahr» (null = Standard 15) */
  rainThresholdMm: number | null;
}

/**
 * Eigene Warn-Schwellen eines Abos in die Form von detectAlerts bringen –
 * null bzw. fehlende Werte bedeuten «Standard-Schwelle». Reine Funktion
 * (für Tests exportiert, Muster subscriptionWants).
 */
export function subscriptionThresholds(sub: {
  windThresholdKmh: number | null;
  rainThresholdMm: number | null;
}): AlertThresholds {
  return {
    windKmh: sub.windThresholdKmh ?? undefined,
    rainMm: sub.rainThresholdMm ?? undefined,
  };
}

/**
 * Will dieses Abo die Mitteilungs-Art erhalten? Reine Funktion (für Tests
 * exportiert, Muster buildTripAlert) – checkAndNotify filtert damit pro Abo.
 */
export function subscriptionWants(prefs: PushPrefs, kind: PushKind): boolean {
  switch (kind) {
    case "weather":
      return prefs.wantsWeather;
    case "food":
      return prefs.wantsFood;
    case "trip":
      return prefs.wantsTrips;
    case "astro":
      return prefs.wantsAstro;
    case "gear":
      return prefs.wantsGear;
    case "heat":
      return prefs.wantsHeat;
  }
}

/** Mitteilungs-Einstellungen des Abos mit diesem Endpoint (null = kein Abo). */
export async function getSubscriptionPrefs(
  userId: number,
  endpoint: string
): Promise<PushPrefs | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      wantsWeather: pushSubscriptions.wantsWeather,
      wantsFood: pushSubscriptions.wantsFood,
      wantsTrips: pushSubscriptions.wantsTrips,
      wantsAstro: pushSubscriptions.wantsAstro,
      wantsGear: pushSubscriptions.wantsGear,
      wantsHeat: pushSubscriptions.wantsHeat,
      windThresholdKmh: pushSubscriptions.windThresholdKmh,
      rainThresholdMm: pushSubscriptions.rainThresholdMm,
    })
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Mitteilungs-Einstellungen des Abos mit diesem Endpoint setzen (teilweise erlaubt). */
export async function setSubscriptionPrefs(
  userId: number,
  endpoint: string,
  prefs: Partial<PushPrefs>
): Promise<void> {
  if (Object.keys(prefs).length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db
    .update(pushSubscriptions)
    .set(prefs)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );
}

export async function hasSubscription(
  userId: number,
  endpoint: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    )
    .limit(1);
  return rows.length > 0;
}

/**
 * Stunden-Prognose (2 Tage) für einen Punkt laden – Warnungen berechnet
 * detectAlerts daraus, die Nacht-Bewölkung der Sternschnuppen-Check.
 */
async function hourlyFor(lat: number, lon: number): Promise<HourlyWeather[]> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    timezone: "auto",
    forecast_days: "2",
    hourly:
      "temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,weather_code,cape,cloud_cover,uv_index",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );
  if (!res.ok) throw new Error(`Wetterdienst antwortet nicht (${res.status})`);
  const json = (await res.json()) as {
    hourly: Record<string, (number | null)[]> & { time: string[] };
  };
  const hourly: HourlyWeather[] = json.hourly.time.map((time, i) => ({
    time,
    temperatureC: Number(json.hourly.temperature_2m[i] ?? 0),
    apparentC: Number(json.hourly.apparent_temperature[i] ?? 0),
    precipitationMm: Number(json.hourly.precipitation[i] ?? 0),
    precipitationProbability: Number(
      json.hourly.precipitation_probability?.[i] ?? 0
    ),
    windSpeedKmh: Number(json.hourly.wind_speed_10m[i] ?? 0),
    windGustsKmh: Number(json.hourly.wind_gusts_10m[i] ?? 0),
    weatherCode: Number(json.hourly.weather_code[i] ?? 0),
    cape: Number(json.hourly.cape?.[i] ?? 0),
    cloudCover: Number(json.hourly.cloud_cover?.[i] ?? 0),
    uvIndex: Number(json.hourly.uv_index?.[i] ?? 0),
  }));
  return hourly;
}

export interface PushCheckResult {
  subscriptions: number;
  spotsChecked: number;
  sent: number;
  /** Verschickte MHD-Erinnerungen (Kühlbox) */
  foodSent: number;
  /** Verschickte Trip-Countdowns (Modul «Meine Reisen») */
  tripSent: number;
  /** Verschickte Zelt-Trocknungs-Erinnerungen (Tag nach der Heimkehr) */
  drySent: number;
  /** Verschickte Vorabend-Checks (Abend vor der Anreise) */
  evePackSent: number;
  /** Verschickte Sternschnuppen-Tipps (klare Nacht am Heim-Ort) */
  astroSent: number;
  /** Verschickte Pflege-Erinnerungen (fällige Ausrüstungs-Aufgaben) */
  gearSent: number;
  /** Verschickte Sonnencreme-/Trink-Erinnerungen (heisse, sonnige Tage) */
  heatSent: number;
  removed: number;
}

export interface FoodAlert {
  title: string;
  body: string;
  /** Dedup-Schlüssel «food:YYYY-MM-DD» – max. eine MHD-Erinnerung pro Tag und Abo */
  key: string;
}

/** Wie viele Namen in der MHD-Nachricht ausgeschrieben werden. */
const FOOD_ALERT_MAX_NAMES = 3;

/**
 * MHD-Erinnerung für die Kühlbox bauen: berücksichtigt Einträge, die HEUTE
 * oder MORGEN ablaufen. Gibt null zurück, wenn nichts ansteht.
 * Reine Funktion (für Tests exportiert); `today` als ISO-Datum YYYY-MM-DD.
 * Texte deutsch, weil der Server die Sprache der Nutzer*innen nicht kennt.
 */
export function buildFoodAlert(
  items: { name: string; expiryDate: string | null }[],
  today: string
): FoodAlert | null {
  const expiring = items
    .map(item => ({
      name: item.name,
      info: expiryInfo(item.expiryDate, today),
    }))
    .filter(
      (x): x is { name: string; info: NonNullable<typeof x.info> } =>
        x.info !== null && (x.info.daysLeft === 0 || x.info.daysLeft === 1)
    )
    .sort(
      (a, b) =>
        a.info.daysLeft - b.info.daysLeft || a.name.localeCompare(b.name, "de")
    );
  if (expiring.length === 0) return null;

  const names = expiring.slice(0, FOOD_ALERT_MAX_NAMES).map(x => x.name);
  const rest = expiring.length - names.length;
  const nameList = names.join(", ") + (rest > 0 ? ` und ${rest} weitere` : "");
  const body =
    expiring.length === 1
      ? `1 Lebensmittel läuft bald ab: ${nameList}`
      : `${expiring.length} Lebensmittel laufen bald ab: ${nameList}`;
  return {
    title: "🧊 Kühlbox: MHD-Erinnerung",
    body,
    key: `food:${today}`,
  };
}

export interface GearAlert {
  title: string;
  body: string;
  /** Dedup-Schlüssel «gear:YYYY-MM» – max. eine Pflege-Erinnerung pro Monat und Abo */
  key: string;
}

/** Wie viele Aufgaben-Titel in der Pflege-Erinnerung ausgeschrieben werden. */
const GEAR_ALERT_MAX_NAMES = 3;

/**
 * Pflege-Erinnerung bauen: berücksichtigt alle am Stichtag fälligen
 * Aufgaben (gearTaskDue aus shared/gearTasks.ts). Gibt null zurück, wenn
 * nichts fällig ist. Der Schlüssel «gear:YYYY-MM» begrenzt die Erinnerung
 * auf einmal pro Monat und Abo – der Cron läuft stündlich.
 * Reine Funktion (für Tests exportiert); `today` als ISO-Datum YYYY-MM-DD.
 * Texte deutsch, weil der Server die Sprache der Nutzer*innen nicht kennt.
 */
export function buildGearAlert(
  tasks: (GearTaskLike & { title: string })[],
  today: string
): GearAlert | null {
  const due = tasks
    .filter(task => gearTaskDue(task, today).due)
    .sort((a, b) => a.title.localeCompare(b.title, "de"));
  if (due.length === 0) return null;

  const names = due.slice(0, GEAR_ALERT_MAX_NAMES).map(t => t.title);
  const rest = due.length - names.length;
  const nameList = names.join(", ") + (rest > 0 ? ` und ${rest} weitere` : "");
  const body =
    due.length === 1
      ? `1 Pflege-Aufgabe ist fällig: ${nameList}`
      : `${due.length} Pflege-Aufgaben sind fällig: ${nameList}`;
  return {
    title: "🛠️ Ausrüstung: Pflege fällig",
    body,
    key: `gear:${today.slice(0, 7)}`,
  };
}

/**
 * Sonnencreme- und Trink-Erinnerung (#260/#261).
 *
 * BEWUSST EINE Meldung für beides: Es ist derselbe Tag und dieselbe
 * Prognose. Zwei Mitteilungen am selben Sommermorgen wären Lärm – und wer
 * nach der zweiten die Erinnerungen abschaltet, bekommt auch die erste nie
 * wieder.
 */
export interface HeatAlert {
  title: string;
  body: string;
  /** Dedup-Schlüssel «heat:YYYY-MM-DD» – höchstens eine Erinnerung pro Tag */
  key: string;
}

/** Ab dieser vollen Stunde (Europe/Zurich) wird morgens erinnert. */
export const HEAT_SEND_HOUR_FROM = 7;
/** Bis zu dieser vollen Stunde – danach ist der Tag halb vorbei. */
export const HEAT_SEND_HOUR_TO = 10;

/**
 * Meldung bauen, wenn der Tag heiss und/oder sonnig genug ist. `null`, wenn
 * weder UV noch Temperatur einen Hinweis rechtfertigen – dann bleibt es
 * still.
 */
export function buildHeatAlert(input: {
  date: string;
  uvIndexMax: number;
  maxTempC: number;
  placeName: string;
}): HeatAlert | null {
  const advice = heatAdvice(input.uvIndexMax, input.maxTempC);
  if (!advice) return null;
  const parts: string[] = [];
  if (advice.sunscreen) {
    parts.push(
      `UV ${Math.round(advice.uvIndex)}: eincremen, alle ${advice.reapplyMinutes} Minuten nachlegen (ungeschützt rot nach ~${advice.burnMinutes} Min.)`
    );
  }
  if (advice.hydration) {
    parts.push(
      `${Math.round(advice.maxTempC)} °C: rund ${advice.litersPerAdult.toFixed(1).replace(".", ",")} l Wasser pro Erwachsener einplanen`
    );
  }
  const title = advice.sunscreen
    ? advice.hydration
      ? `☀️ ${input.placeName}: Sonne und Hitze`
      : `☀️ ${input.placeName}: hoher UV-Index`
    : `💧 ${input.placeName}: Hitzetag`;
  return {
    title,
    body: parts.join(" · "),
    key: `heat:${input.date}`,
  };
}

export interface TripAlert {
  title: string;
  body: string;
  /** Dedup-Schlüssel «trip:<tripId>» – pro Trip nur eine Countdown-Nachricht */
  key: string;
}

/** Ein geplanter Aufenthalt, soweit für den Countdown-Push relevant. */
export interface TripForAlert {
  id: number;
  /** Anzeigename: Titel des Eintrags, sonst Zeltplatz-Favorit bzw. Freitext-Ort */
  name: string;
  startDate: string;
  packListId: number | null;
}

/** Pack-Fortschritt einer Liste (Logik analog packing.progress im Router). */
export interface PackProgressLike {
  total: number;
  checked: number;
}

/** So viele Tage vor der Anreise wird spätestens erinnert. */
const TRIP_ALERT_MAX_DAYS = 3;

/**
 * Trip-Countdown bauen: gemeldet wird der am nächsten bevorstehende Aufenthalt,
 * sobald die Anreise 3 Tage entfernt ist. Hat der Cron diesen Zeitpunkt verpasst
 * (Server schlief), greift die Erinnerung auch noch 2 oder 1 Tag vorher – dank
 * Dedup über den Schlüssel «trip:<id>» aber nur bei der ersten erreichten Schwelle.
 * Ist eine Packliste verknüpft, wird der Pack-Fortschritt (analog packing.progress)
 * mitgeschickt. Gibt null zurück, wenn kein Aufenthalt im Fenster liegt.
 * Reine Funktion (für Tests exportiert); `today` als ISO-Datum YYYY-MM-DD.
 * Texte deutsch, weil der Server die Sprache der Nutzer*innen nicht kennt.
 */
export function buildTripAlert(
  trips: TripForAlert[],
  progressByList: Map<number, PackProgressLike>,
  today: string
): TripAlert | null {
  const upcoming = trips
    .map(trip => ({ trip, days: daysUntilTrip(trip.startDate, today) }))
    .filter(x => x.days >= 1 && x.days <= TRIP_ALERT_MAX_DAYS)
    .sort(
      (a, b) =>
        a.days - b.days ||
        a.trip.startDate.localeCompare(b.trip.startDate) ||
        a.trip.id - b.trip.id
    );
  const next = upcoming[0];
  if (!next) return null;

  const { trip, days } = next;
  const title = `⛺ In ${days === 1 ? "1 Tag" : `${days} Tagen`}: ${trip.name}`;
  const progress =
    trip.packListId !== null ? progressByList.get(trip.packListId) : undefined;
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.checked / progress.total) * 100)
      : 0;
  const body = progress
    ? `Packliste zu ${pct} % erledigt`
    : "Dein Aufenthalt beginnt bald – denk ans Packen.";
  return { title, body, key: `trip:${trip.id}` };
}

export interface EvePackAlert {
  title: string;
  body: string;
  /** Dedup-Schlüssel «evepack:<tripId>» – pro Reise nur ein Vorabend-Check */
  key: string;
}

/** Gesendet wird nur abends (Europe/Zurich), Stunde von–bis (inklusive). */
export const EVE_PACK_SEND_HOUR_FROM = 17;
export const EVE_PACK_SEND_HOUR_TO = 21;

/**
 * Vorabend-Check bauen: am Abend VOR der Anreise (Anreise morgen) erinnert
 * die Meldung an die noch nicht fertige Packliste. Ohne verknüpfte Liste,
 * ohne Einträge oder bei vollständig abgehakter Liste gibt es bewusst keinen
 * Push – wer fertig gepackt hat, soll abends seine Ruhe haben. Bei mehreren
 * Reisen am selben Tag gewinnt die am wenigsten gepackte (Gleichstand:
 * kleinste Id). Reine Funktion (für Tests exportiert); `today` als ISO-Datum
 * YYYY-MM-DD. Texte deutsch, weil der Server die Sprache nicht kennt.
 */
export function buildEvePackAlert(
  trips: TripForAlert[],
  progressByList: Map<number, PackProgressLike>,
  today: string
): EvePackAlert | null {
  const candidates = trips
    .filter(trip => daysUntilTrip(trip.startDate, today) === 1)
    .map(trip => ({
      trip,
      progress:
        trip.packListId !== null
          ? progressByList.get(trip.packListId)
          : undefined,
    }))
    .filter(
      (x): x is { trip: TripForAlert; progress: PackProgressLike } =>
        x.progress !== undefined &&
        x.progress.total > 0 &&
        x.progress.checked < x.progress.total
    )
    .map(x => ({
      ...x,
      pct: Math.round((x.progress.checked / x.progress.total) * 100),
    }))
    .sort((a, b) => a.pct - b.pct || a.trip.id - b.trip.id);
  const first = candidates[0];
  if (!first) return null;
  return {
    title: `⛺ Morgen geht's los: ${first.trip.name}`,
    body: `Packliste zu ${first.pct} % erledigt – schnapp dir den Rest noch heute Abend.`,
    key: `evepack:${first.trip.id}`,
  };
}

export interface DryingAlert {
  title: string;
  body: string;
  /** Dedup-Schlüssel «dry:<tripId>» – pro Heimkehr nur eine Erinnerung */
  key: string;
}

/** Ein Aufenthalt, soweit für die Trocknungs-Erinnerung relevant. */
export interface TripForDrying {
  id: number;
  /** Anzeigename: Titel des Eintrags, sonst Zeltplatz-Favorit bzw. Freitext-Ort */
  name: string;
  endDate: string;
}

/** Ab dieser Regensumme (mm) während des Aufenthalts wird ans Trocknen erinnert. */
export const DRY_ALERT_RAIN_MM = 3;

const DAY_MS = 86400000;

/** ISO-Datum des Vortags (null bei ungültigem Datum). */
function isoYesterday(today: string): string | null {
  const t = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  return new Date(t - DAY_MS).toISOString().slice(0, 10);
}

/**
 * Zelt-Trocknungs-Erinnerung bauen: gemeldet wird ein Aufenthalt, der GESTERN
 * endete. `rainByTripId` enthält die Regensumme (mm) des Aufenthaltszeitraums
 * für Trips mit bekannten Koordinaten – ab 3 mm wird konkret ans Trocknen
 * erinnert. Fehlt die Regensumme (Freitext-Ort ohne Koordinaten oder
 * Wetterdienst nicht erreichbar), gibt es eine neutrale Auslüften-Erinnerung.
 * Bei mehreren Heimkehren gewinnt der Trip mit dem meisten Regen (Neutrale
 * zuletzt, Gleichstand: kleinste Id). Reine Funktion (für Tests exportiert);
 * `today` als ISO-Datum YYYY-MM-DD.
 * Texte deutsch, weil der Server die Sprache der Nutzer*innen nicht kennt.
 */
export function buildDryingAlert(
  trips: TripForDrying[],
  rainByTripId: Map<number, number>,
  today: string
): DryingAlert | null {
  const yesterday = isoYesterday(today);
  if (!yesterday) return null;
  const candidates = trips
    .filter(trip => trip.endDate === yesterday)
    .map(trip => ({ trip, rain: rainByTripId.get(trip.id) }))
    .filter(x => x.rain === undefined || x.rain >= DRY_ALERT_RAIN_MM)
    .sort((a, b) => (b.rain ?? -1) - (a.rain ?? -1) || a.trip.id - b.trip.id);
  const first = candidates[0];
  if (!first) return null;

  const { trip, rain } = first;
  if (rain !== undefined) {
    return {
      title: "⛺ Zelt trocknen nicht vergessen",
      body: `Während «${trip.name}» sind rund ${Math.round(rain)} mm Regen gefallen – häng das Zelt zum Trocknen auf, bevor es ins Lager kommt.`,
      key: `dry:${trip.id}`,
    };
  }
  return {
    title: "⛺ Zelt auslüften nicht vergessen",
    body: `Willkommen zurück von «${trip.name}» – lüfte das Zelt gut aus, bevor es ins Lager kommt.`,
    key: `dry:${trip.id}`,
  };
}

export interface AstroAlert {
  title: string;
  body: string;
  /** Dedup-Schlüssel «astro:YYYY-MM-DD» – max. ein Sternschnuppen-Tipp pro Nacht und Abo */
  key: string;
}

/** Nacht-Bewölkung (Mittel 21–24 Uhr) unter diesem Wert gilt als klarer Himmel. */
export const ASTRO_CLOUD_MAX_PERCENT = 40;
/** Ab dieser Mond-Beleuchtung (0–1) überstrahlt der Mond die Sternschnuppen. */
export const ASTRO_MOON_MAX_ILLUMINATION = 0.6;
/** So viele Tage um das Strom-Maximum gilt der Strom als «in Peak-Nähe». */
export const ASTRO_PEAK_WINDOW_DAYS = 3;
/** Gesendet wird nur abends (Europe/Zurich), Stunde von–bis (inklusive). */
export const ASTRO_SEND_HOUR_FROM = 17;
export const ASTRO_SEND_HOUR_TO = 21;

/**
 * Aktiver Sternschnuppen-Strom in Peak-Nähe (±3 Tage) am Stichtag – bei
 * mehreren Kandidaten gewinnt der nächste Peak, bei Gleichstand die höhere
 * Rate. Peaks im Vor-/Folgejahr werden mitgeprüft (Ströme über den
 * Jahreswechsel, z. B. Quadrantiden). Reine Funktion (für Tests exportiert).
 */
export function showerNearPeak(date: Date): MeteorShower | null {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
  let best: { shower: MeteorShower; diff: number } | null = null;
  for (const shower of meteorShowers) {
    if (!isShowerActive(shower, date)) continue;
    for (const year of [
      date.getFullYear() - 1,
      date.getFullYear(),
      date.getFullYear() + 1,
    ]) {
      const peak = new Date(year, shower.peakMonth - 1, shower.peakDay);
      // Runden fängt Sommerzeit-Wechsel (23/25-Stunden-Tage) ab
      const diff = Math.abs(Math.round((peak.getTime() - startOfDay) / DAY_MS));
      if (diff > ASTRO_PEAK_WINDOW_DAYS) continue;
      if (
        !best ||
        diff < best.diff ||
        (diff === best.diff && shower.zhr > best.shower.zhr)
      ) {
        best = { shower, diff };
      }
    }
  }
  return best?.shower ?? null;
}

/**
 * Mittlere Nacht-Bewölkung: liegt seit der Dunkelheitskarte (#239) in
 * shared/weather.ts, weil sie auch der Client braucht – hier nur
 * weitergereicht, damit Aufrufer und Tests unverändert bleiben.
 */
export { nightCloudCover };

/**
 * Sternschnuppen-Tipp bauen: aktiver Strom in Peak-Nähe, klare Nacht
 * (Bewölkung 21–24 Uhr unter 40 %) und wenig Mondlicht (unter 60 %
 * beleuchtet) – sonst null. Reine Funktion (für Tests exportiert);
 * `date` als ISO-Datum YYYY-MM-DD der Beobachtungsnacht.
 * Texte deutsch, weil der Server die Sprache der Nutzer*innen nicht kennt.
 */
export function buildMeteorAlert(input: {
  date: string;
  /** Mittlere Nacht-Bewölkung in % (null = unbekannt → kein Tipp) */
  cloudCoverNight: number | null;
  /** Mond-Beleuchtung 0–1 */
  moonIllumination: number;
  /** Aktiver Strom in Peak-Nähe (null = keiner) */
  activeShower: { name: string; zhr: number } | null;
  /** Anzeigename des geprüften Orts (Heim-Standort) */
  placeName: string;
}): AstroAlert | null {
  if (!input.activeShower) return null;
  if (
    input.cloudCoverNight === null ||
    input.cloudCoverNight >= ASTRO_CLOUD_MAX_PERCENT
  ) {
    return null;
  }
  if (input.moonIllumination >= ASTRO_MOON_MAX_ILLUMINATION) return null;
  return {
    title: `🌠 Heute Nacht: ${input.activeShower.name}`,
    body: `Klarer Himmel am Ort «${input.placeName}» – bis zu ${input.activeShower.zhr} Sternschnuppen pro Stunde.`,
    key: `astro:${input.date}`,
  };
}

/** Stunde (0–23) in Europe/Zurich – der Server könnte in UTC laufen. */
function zurichHour(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("de-CH", {
      timeZone: "Europe/Zurich",
      hour: "numeric",
      hour12: false,
    }).format(now)
  );
}

/** ISO-Datum (YYYY-MM-DD) in Europe/Zurich (en-CA formatiert genau so). */
function zurichIsoDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Open-Meteo erlaubt höchstens so viele vergangene Tage im Forecast-Endpoint. */
const RAIN_MAX_PAST_DAYS = 92;

/**
 * Tages-Niederschlag der letzten `pastDays` Tage (plus heute) für einen Punkt –
 * über den Forecast-Endpoint mit past_days, weil das Archiv die jüngsten Tage
 * noch nicht führt.
 */
async function dailyRainFor(
  lat: number,
  lon: number,
  pastDays: number
): Promise<{ time: string[]; precipitation: (number | null)[] }> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    timezone: "auto",
    past_days: String(pastDays),
    forecast_days: "1",
    daily: "precipitation_sum",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );
  if (!res.ok) throw new Error(`Wetterdienst antwortet nicht (${res.status})`);
  const json = (await res.json()) as {
    daily: { time: string[]; precipitation_sum: (number | null)[] };
  };
  return { time: json.daily.time, precipitation: json.daily.precipitation_sum };
}

/** Heutiges Datum als ISO-String in der lokalen Serverzeit (nicht UTC). */
function localIsoDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Alle Abos prüfen: für jeden Zeltplatz der abonnierten Nutzer*innen die
 * Warnlage berechnen und bei Sturm/Gewitter & Co. (Stufe «gefahr») einen
 * Push senden. Dieselbe Warnlage wird pro Abo nur einmal gemeldet.
 * Die Mitteilungs-Flags pro Abo (wantsWeather/wantsFood/wantsTrips/
 * wantsAstro/wantsGear) werden über subscriptionWants respektiert.
 */
export async function checkAndNotify(): Promise<PushCheckResult> {
  const result: PushCheckResult = {
    subscriptions: 0,
    spotsChecked: 0,
    sent: 0,
    foodSent: 0,
    tripSent: 0,
    drySent: 0,
    evePackSent: 0,
    astroSent: 0,
    gearSent: 0,
    heatSent: 0,
    removed: 0,
  };
  if (!pushConfigured()) return result;
  const db = await getDb();
  if (!db) return result;
  configureWebPush();

  const subs = await db.select().from(pushSubscriptions);
  result.subscriptions = subs.length;
  if (subs.length === 0) return result;

  const userIds = Array.from(new Set(subs.map(s => s.userId)));
  const spots = await db
    .select()
    .from(campSpots)
    .where(inArray(campSpots.userId, userIds));
  // Heim-Standorte der abonnierten Nutzer*innen (max. einer pro Konto)
  const homes = await db
    .select()
    .from(homeLocations)
    .where(inArray(homeLocations.userId, userIds));

  // Kühlbox: MHD-Erinnerungen pro Nutzer*in vorbereiten
  const today = localIsoDate();
  const food = await db
    .select()
    .from(foodItems)
    .where(inArray(foodItems.userId, userIds));
  const foodAlertByUser = new Map<number, FoodAlert>();
  for (const userId of userIds) {
    const alert = buildFoodAlert(
      food
        .filter(f => f.userId === userId)
        .map(f => ({ name: f.name, expiryDate: f.expiryDate })),
      today
    );
    if (alert) foodAlertByUser.set(userId, alert);
  }

  // Ausrüstung: fällige Pflege-Aufgaben pro Nutzer*in vorbereiten
  const allGearTasks = await db
    .select()
    .from(gearTasks)
    .where(inArray(gearTasks.userId, userIds));
  const gearAlertByUser = new Map<number, GearAlert>();
  for (const userId of userIds) {
    const alert = buildGearAlert(
      allGearTasks.filter(task => task.userId === userId),
      today
    );
    if (alert) gearAlertByUser.set(userId, alert);
  }

  // Meine Reisen: Trip-Countdowns pro Nutzer*in vorbereiten
  const allTrips = await db
    .select()
    .from(tripLogs)
    .where(inArray(tripLogs.userId, userIds));
  const upcomingTrips = allTrips.filter(trip => {
    const days = daysUntilTrip(trip.startDate, today);
    return days >= 1 && days <= 3;
  });
  // Pack-Fortschritt der verknüpften Listen (Logik analog packing.progress)
  const packListIds = Array.from(
    new Set(
      upcomingTrips
        .map(trip => trip.packListId)
        .filter((id): id is number => id !== null)
    )
  );
  const progressByList = new Map<number, PackProgressLike>();
  if (packListIds.length > 0) {
    const items = await db
      .select({ listId: packItems.listId, checked: packItems.checked })
      .from(packItems)
      .where(inArray(packItems.listId, packListIds));
    for (const item of items) {
      const progress = progressByList.get(item.listId) ?? {
        total: 0,
        checked: 0,
      };
      progress.total += 1;
      if (item.checked) progress.checked += 1;
      progressByList.set(item.listId, progress);
    }
  }
  const spotNameById = new Map(spots.map(s => [s.id, s.name]));
  const tripAlertByUser = new Map<number, TripAlert>();
  for (const userId of userIds) {
    const alert = buildTripAlert(
      upcomingTrips
        .filter(trip => trip.userId === userId)
        .map(trip => ({
          id: trip.id,
          name:
            trip.title ||
            (trip.spotId !== null ? spotNameById.get(trip.spotId) : null) ||
            trip.location ||
            "Camping-Aufenthalt",
          startDate: trip.startDate,
          packListId: trip.packListId,
        })),
      progressByList,
      today
    );
    if (alert) tripAlertByUser.set(userId, alert);
  }

  /** Anzeigename einer Reise (Titel, sonst Platz-Name bzw. Freitext-Ort). */
  const tripDisplayName = (trip: (typeof allTrips)[number]) =>
    trip.title ||
    (trip.spotId !== null ? spotNameById.get(trip.spotId) : null) ||
    trip.location ||
    "Camping-Aufenthalt";

  // Vorabend-Check: Abend vor der Anreise, nur mit unfertiger Packliste –
  // wie beim Sternschnuppen-Push nur zwischen 17 und 21 Uhr (Europe/Zurich),
  // damit der stündliche Cron nicht mitten in der Nacht erinnert.
  const evePackAlertByUser = new Map<number, EvePackAlert>();
  const eveningHour = zurichHour();
  if (
    eveningHour >= EVE_PACK_SEND_HOUR_FROM &&
    eveningHour <= EVE_PACK_SEND_HOUR_TO
  ) {
    for (const userId of userIds) {
      const alert = buildEvePackAlert(
        upcomingTrips
          .filter(trip => trip.userId === userId)
          .map(trip => ({
            id: trip.id,
            name: tripDisplayName(trip),
            startDate: trip.startDate,
            packListId: trip.packListId,
          })),
        progressByList,
        today
      );
      if (alert) evePackAlertByUser.set(userId, alert);
    }
  }

  // Zelt-Trocknung: gestern beendete Trips – Regensumme pro Trip mit Koordinaten
  const yesterday = isoYesterday(today);
  const endedYesterday = allTrips.filter(trip => trip.endDate === yesterday);
  const spotById = new Map(spots.map(s => [s.id, s]));
  const rainByTripId = new Map<number, number>();
  if (endedYesterday.length > 0) {
    // Regen pro gerundeter Koordinate nur einmal abrufen (Muster alertCache);
    // past_days muss den frühesten Anreisetag an dieser Koordinate abdecken.
    const pastDaysByCoord = new Map<string, number>();
    for (const trip of endedYesterday) {
      const spot = trip.spotId !== null ? spotById.get(trip.spotId) : undefined;
      if (!spot) continue;
      const key = `${spot.latitude.toFixed(2)},${spot.longitude.toFixed(2)}`;
      const needed = Math.min(
        RAIN_MAX_PAST_DAYS,
        Math.max(1, -daysUntilTrip(trip.startDate, today))
      );
      pastDaysByCoord.set(key, Math.max(pastDaysByCoord.get(key) ?? 1, needed));
    }
    const rainCache = new Map<
      string,
      Awaited<ReturnType<typeof dailyRainFor>>
    >();
    for (const trip of endedYesterday) {
      const spot = trip.spotId !== null ? spotById.get(trip.spotId) : undefined;
      if (!spot) continue; // Freitext-Ort: keine Koordinaten → neutrale Erinnerung
      const cacheKey = `${spot.latitude.toFixed(2)},${spot.longitude.toFixed(2)}`;
      let daily = rainCache.get(cacheKey);
      if (!daily) {
        try {
          daily = await dailyRainFor(
            spot.latitude,
            spot.longitude,
            pastDaysByCoord.get(cacheKey) ?? 1
          );
        } catch {
          continue; // Wetterdienst nicht erreichbar → neutrale Erinnerung
        }
        rainCache.set(cacheKey, daily);
      }
      let sum = 0;
      daily.time.forEach((day, i) => {
        if (day >= trip.startDate && day <= trip.endDate) {
          sum += Number(daily!.precipitation[i] ?? 0);
        }
      });
      rainByTripId.set(trip.id, sum);
    }
  }
  const dryAlertByUser = new Map<number, DryingAlert>();
  for (const userId of userIds) {
    const alert = buildDryingAlert(
      endedYesterday
        .filter(trip => trip.userId === userId)
        .map(trip => ({
          id: trip.id,
          name:
            trip.title ||
            (trip.spotId !== null ? spotNameById.get(trip.spotId) : null) ||
            trip.location ||
            "Camping-Aufenthalt",
          endDate: trip.endDate,
        })),
      rainByTripId,
      today
    );
    if (alert) dryAlertByUser.set(userId, alert);
  }

  // Wetter pro gerundeter Koordinate nur einmal abrufen
  const hourlyCache = new Map<string, HourlyWeather[]>();
  /** Stunden-Prognose aus dem Cache bzw. frisch laden (null bei Wetterdienst-Fehler). */
  async function cachedHourly(
    lat: number,
    lon: number
  ): Promise<HourlyWeather[] | null> {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = hourlyCache.get(cacheKey);
    if (cached) return cached;
    try {
      const hourly = await hourlyFor(lat, lon);
      hourlyCache.set(cacheKey, hourly);
      result.spotsChecked += 1;
      return hourly;
    } catch {
      return null;
    }
  }
  /**
   * Zu prüfende Orte mit ihrer Stundenprognose. Die Warnungen selbst entstehen
   * erst pro Abo (siehe Schleife unten), weil jedes Gerät eigene Warn-Schwellen
   * haben kann – der Wetter-Abruf bleibt dank Cache trotzdem einmalig pro Ort.
   * Schlüssel-Präfix: die spotId bzw. «home», damit die Dedup-Schlüssel von
   * Platz- und Heim-Warnungen nicht kollidieren.
   */
  const weatherPoints: {
    userId: number;
    name: string;
    keyPrefix: string;
    hourly: HourlyWeather[];
  }[] = [];
  for (const spot of spots) {
    const hourly = await cachedHourly(spot.latitude, spot.longitude);
    if (!hourly) continue;
    weatherPoints.push({
      userId: spot.userId,
      name: spot.name,
      keyPrefix: String(spot.id),
      hourly,
    });
  }
  for (const home of homes) {
    const hourly = await cachedHourly(home.latitude, home.longitude);
    if (!hourly) continue;
    weatherPoints.push({
      userId: home.userId,
      name: home.name,
      keyPrefix: "home",
      hourly,
    });
  }

  // Sternschnuppen: klarer Abendhimmel am Heim-Ort während eines aktiven
  // Strom-Maximums – nur abends (17–21 Uhr Europe/Zurich) geprüft, damit der
  // Tipp zur kommenden Nacht passt und der stündliche Cron nicht öfter feuert.
  const astroAlertByUser = new Map<number, AstroAlert>();
  const hour = zurichHour();
  if (hour >= ASTRO_SEND_HOUR_FROM && hour <= ASTRO_SEND_HOUR_TO) {
    const astroDate = zurichIsoDate();
    const astroNoon = new Date(`${astroDate}T12:00:00`);
    const shower = showerNearPeak(astroNoon);
    const moonIllumination = getMoonInfo(astroNoon).illumination;
    // Strom-/Mond-Vorprüfung spart die Wetter-Auswertung an ruhigen Abenden
    if (shower && moonIllumination < ASTRO_MOON_MAX_ILLUMINATION) {
      for (const home of homes) {
        const hourly = await cachedHourly(home.latitude, home.longitude);
        if (!hourly) continue;
        const alert = buildMeteorAlert({
          date: astroDate,
          cloudCoverNight: nightCloudCover(hourly, astroDate),
          moonIllumination,
          activeShower: { name: pick(shower.name, "de"), zhr: shower.zhr },
          placeName: home.name,
        });
        if (alert) astroAlertByUser.set(home.userId, alert);
      }
    }
  }

  // Sonnencreme & Trinken (#260/#261): morgens einmal, am Ort des laufenden
  // Aufenthalts bzw. am Heim-Standort. Die Werte kommen aus derselben
  // Stundenprognose wie die Unwetter-Warnung – kein zusätzlicher Abruf.
  const heatAlertByUser = new Map<number, HeatAlert>();
  if (hour >= HEAT_SEND_HOUR_FROM && hour <= HEAT_SEND_HOUR_TO) {
    const heatDate = zurichIsoDate();
    for (const point of weatherPoints) {
      // Ein Konto bekommt höchstens eine Erinnerung – der erste Ort gewinnt,
      // und das ist der Zeltplatz (die Plätze stehen vor dem Heim-Ort).
      if (heatAlertByUser.has(point.userId)) continue;
      const todayHours = point.hourly.filter(h => h.time.startsWith(heatDate));
      if (todayHours.length === 0) continue;
      const uvIndexMax = todayHours.reduce(
        (max, h) => Math.max(max, h.uvIndex ?? 0),
        0
      );
      const maxTempC = todayHours.reduce(
        (max, h) => Math.max(max, h.temperatureC),
        -Infinity
      );
      const alert = buildHeatAlert({
        date: heatDate,
        uvIndexMax,
        maxTempC,
        placeName: point.name,
      });
      if (alert) heatAlertByUser.set(point.userId, alert);
    }
  }

  /** Push an ein Abo senden; bei widerrufenem Abo (404/410) das Abo löschen. */
  async function sendTo(
    sub: (typeof subs)[number],
    payload: string
  ): Promise<"sent" | "gone" | "error"> {
    try {
      if (sub.endpoint.startsWith("ExponentPushToken[")) {
        const data = JSON.parse(payload);
        const expoPayload = {
          to: sub.endpoint,
          title: data.title,
          body: data.body,
          data: { url: data.url },
        };
        const res = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expoPayload),
        });
        const resData = await res.json();
        if (
          resData.data?.status === "error" &&
          resData.data?.details?.error === "DeviceNotRegistered"
        ) {
          await db!
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
          result.removed += 1;
          return "gone";
        }
        return "sent";
      }

      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      return "sent";
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      // 404/410: Abo existiert nicht mehr (Browser hat es widerrufen)
      // (db! – die Null-Prüfung oben erreicht die Closure-Analyse von tsc nicht)
      if (status === 404 || status === 410) {
        await db!
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
        result.removed += 1;
        return "gone";
      }
      return "error";
    }
  }

  /**
   * Verlauf-Eintrag zu einer versendeten Meldung – aber nur EINMAL pro Konto
   * und Meldung: hat dieselbe Person mehrere Geräte, sendet die Schleife den
   * Push zwar an jedes Abo, im Verlauf steht die Meldung trotzdem nur einmal.
   * Der Dedup-Schlüssel ist derselbe, über den auch die Abos entscheiden, ob
   * sie eine Meldung schon erhalten haben.
   */
  const loggedPushes = new Set<string>();
  async function logPushOnce(
    userId: number,
    kind: PushLogKind,
    dedupKey: string,
    title: string,
    body: string,
    url: string
  ): Promise<void> {
    const key = `${userId}|${kind}|${dedupKey}`;
    if (loggedPushes.has(key)) return;
    loggedPushes.add(key);
    await recordPushLog({ userId, kind, title, body, url });
  }

  for (const sub of subs) {
    // ── Unwetter an gespeicherten Plätzen ──
    // Warnungen pro Abo ableiten: die Warn-Schwellen hängen am Gerät.
    const thresholds = subscriptionThresholds(sub);
    const dangers = weatherPoints
      .filter(point => point.userId === sub.userId)
      .flatMap(point =>
        detectAlerts(point.hourly, "de", thresholds)
          .filter(a => a.severity === "gefahr")
          .map(alert => ({
            spotName: point.name,
            title: alert.title,
            description: alert.description,
            key: `${point.keyPrefix}:${alert.id}:${alert.startTime.slice(0, 13)}`,
          }))
      );
    const alertKey = dangers
      .map(d => d.key)
      .sort()
      .join("|");
    let subGone = false;
    if (dangers.length === 0) {
      // Lage entspannt: Schlüssel zurücksetzen, damit die nächste Warnung wieder meldet
      if (sub.lastAlertKey) {
        await db
          .update(pushSubscriptions)
          .set({ lastAlertKey: null })
          .where(eq(pushSubscriptions.id, sub.id));
      }
    } else if (
      subscriptionWants(sub, "weather") &&
      alertKey !== sub.lastAlertKey
    ) {
      const first = dangers[0];
      const weatherTitle = `⚠️ ${first.title} – ${first.spotName}`;
      const weatherBody =
        dangers.length > 1
          ? `${first.description} (+${dangers.length - 1} weitere Warnungen an deinen Plätzen)`
          : first.description;
      const payload = JSON.stringify({
        title: weatherTitle,
        body: weatherBody,
        url: "/wetter",
      });
      const outcome = await sendTo(sub, payload);
      if (outcome === "sent") {
        result.sent += 1;
        await logPushOnce(
          sub.userId,
          "weather",
          alertKey,
          weatherTitle,
          weatherBody,
          "/wetter"
        );
        await db
          .update(pushSubscriptions)
          .set({ lastAlertKey: alertKey, lastNotifiedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      } else if (outcome === "gone") {
        subGone = true;
      }
    }
    if (subGone) continue;

    // ── Kühlbox: MHD-Erinnerung (max. eine pro Tag und Abo) ──
    const foodAlert = subscriptionWants(sub, "food")
      ? foodAlertByUser.get(sub.userId)
      : undefined;
    if (foodAlert && foodAlert.key !== sub.lastFoodKey) {
      const foodPayload = JSON.stringify({
        title: foodAlert.title,
        body: foodAlert.body,
        url: "/kuehlbox",
        // Eigener Tag, damit die Erinnerung eine Unwetter-Meldung nicht ersetzt
        tag: "campmesser-food-expiry",
      });
      const outcome = await sendTo(sub, foodPayload);
      if (outcome === "sent") {
        result.foodSent += 1;
        await logPushOnce(
          sub.userId,
          "food",
          foodAlert.key,
          foodAlert.title,
          foodAlert.body,
          "/kuehlbox"
        );
        await db
          .update(pushSubscriptions)
          .set({ lastFoodKey: foodAlert.key, lastNotifiedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      } else if (outcome === "gone") {
        continue;
      }
    }

    // ── Meine Reisen: Trip-Countdown (max. eine Nachricht pro Trip) ──
    const tripAlert = subscriptionWants(sub, "trip")
      ? tripAlertByUser.get(sub.userId)
      : undefined;
    if (tripAlert && tripAlert.key !== sub.lastTripKey) {
      const tripPayload = JSON.stringify({
        title: tripAlert.title,
        body: tripAlert.body,
        url: "/tagebuch",
        // Eigener Tag, damit der Countdown andere Meldungen nicht ersetzt
        tag: "campmesser-trip-countdown",
      });
      const outcome = await sendTo(sub, tripPayload);
      if (outcome === "sent") {
        result.tripSent += 1;
        await logPushOnce(
          sub.userId,
          "trip",
          tripAlert.key,
          tripAlert.title,
          tripAlert.body,
          "/tagebuch"
        );
        await db
          .update(pushSubscriptions)
          .set({ lastTripKey: tripAlert.key, lastNotifiedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      } else if (outcome === "gone") {
        continue;
      }
    }

    // ── Vorabend-Check: Abend vor der Anreise (Flag wantsTrips) ──
    const evePackAlert = subscriptionWants(sub, "trip")
      ? evePackAlertByUser.get(sub.userId)
      : undefined;
    if (evePackAlert && evePackAlert.key !== sub.lastEvePackKey) {
      const evePackPayload = JSON.stringify({
        title: evePackAlert.title,
        body: evePackAlert.body,
        url: "/packlisten",
        // Eigener Tag, damit der Check den Countdown nicht ersetzt
        tag: "campmesser-eve-pack",
      });
      const outcome = await sendTo(sub, evePackPayload);
      if (outcome === "sent") {
        result.evePackSent += 1;
        await logPushOnce(
          sub.userId,
          "evepack",
          evePackAlert.key,
          evePackAlert.title,
          evePackAlert.body,
          "/packlisten"
        );
        await db
          .update(pushSubscriptions)
          .set({ lastEvePackKey: evePackAlert.key, lastNotifiedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      } else if (outcome === "gone") {
        continue;
      }
    }

    // ── Zelt-Trocknung: Erinnerung am Tag nach der Heimkehr (Flag wantsTrips) ──
    const dryAlert = subscriptionWants(sub, "trip")
      ? dryAlertByUser.get(sub.userId)
      : undefined;
    if (dryAlert && dryAlert.key !== sub.lastDryKey) {
      const dryPayload = JSON.stringify({
        title: dryAlert.title,
        body: dryAlert.body,
        url: "/trockenzeiten",
        // Eigener Tag, damit die Erinnerung andere Meldungen nicht ersetzt
        tag: "campmesser-tent-drying",
      });
      const outcome = await sendTo(sub, dryPayload);
      if (outcome === "sent") {
        result.drySent += 1;
        await logPushOnce(
          sub.userId,
          "drying",
          dryAlert.key,
          dryAlert.title,
          dryAlert.body,
          "/trockenzeiten"
        );
        await db
          .update(pushSubscriptions)
          .set({ lastDryKey: dryAlert.key, lastNotifiedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      } else if (outcome === "gone") {
        continue;
      }
    }

    // ── Sonnencreme & Trinken: heisser/sonniger Tag (max. eine pro Tag) ──
    const heatAlert = subscriptionWants(sub, "heat")
      ? heatAlertByUser.get(sub.userId)
      : undefined;
    if (heatAlert && heatAlert.key !== sub.lastHeatKey) {
      const heatPayload = JSON.stringify({
        title: heatAlert.title,
        body: heatAlert.body,
        url: "/wetter",
        // Eigener Tag, damit die Erinnerung andere Meldungen nicht ersetzt
        tag: "campmesser-heat-care",
      });
      const outcome = await sendTo(sub, heatPayload);
      if (outcome === "sent") {
        result.heatSent += 1;
        await logPushOnce(
          sub.userId,
          "heat",
          heatAlert.key,
          heatAlert.title,
          heatAlert.body,
          "/wetter"
        );
        await db
          .update(pushSubscriptions)
          .set({ lastHeatKey: heatAlert.key, lastNotifiedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      } else if (outcome === "gone") {
        continue;
      }
    }

    // ── Ausrüstung: Pflege-Erinnerung (max. eine pro Monat und Abo) ──
    const gearAlert = subscriptionWants(sub, "gear")
      ? gearAlertByUser.get(sub.userId)
      : undefined;
    if (gearAlert && gearAlert.key !== sub.lastGearKey) {
      const gearPayload = JSON.stringify({
        title: gearAlert.title,
        body: gearAlert.body,
        url: "/inventar",
        // Eigener Tag, damit die Erinnerung andere Meldungen nicht ersetzt
        tag: "campmesser-gear-care",
      });
      const outcome = await sendTo(sub, gearPayload);
      if (outcome === "sent") {
        result.gearSent += 1;
        await logPushOnce(
          sub.userId,
          "gear",
          gearAlert.key,
          gearAlert.title,
          gearAlert.body,
          "/inventar"
        );
        await db
          .update(pushSubscriptions)
          .set({ lastGearKey: gearAlert.key, lastNotifiedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      } else if (outcome === "gone") {
        continue;
      }
    }

    // ── Sternschnuppen: Tipp bei klarer Nacht am Heim-Ort (max. 1 pro Nacht) ──
    const astroAlert = subscriptionWants(sub, "astro")
      ? astroAlertByUser.get(sub.userId)
      : undefined;
    if (astroAlert && astroAlert.key !== sub.lastAstroKey) {
      const astroPayload = JSON.stringify({
        title: astroAlert.title,
        body: astroAlert.body,
        url: "/natur",
        // Eigener Tag, damit der Tipp andere Meldungen nicht ersetzt
        tag: "campmesser-astro",
      });
      const outcome = await sendTo(sub, astroPayload);
      if (outcome === "sent") {
        result.astroSent += 1;
        await logPushOnce(
          sub.userId,
          "astro",
          astroAlert.key,
          astroAlert.title,
          astroAlert.body,
          "/natur"
        );
        await db
          .update(pushSubscriptions)
          .set({ lastAstroKey: astroAlert.key, lastNotifiedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
  return result;
}
