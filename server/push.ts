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
import { LANGUAGES, type Language } from "@shared/i18n";
import {
  weatherTurn,
  type TurnDay,
  type WeatherTurn,
} from "../shared/weatherTurn";
import {
  docsAlertText,
  dryingAlertText,
  evePackAlertText,
  foodAlertText,
  gearAlertText,
  heatAlertText,
  meteorAlertText,
  nameList,
  tripAlertText,
  weatherAlertText,
} from "@shared/pushTexts";
import {
  campSpots,
  documentCards,
  foodItems,
  gearTasks,
  homeLocations,
  packItems,
  pushLog,
  pushSubscriptions,
  tripLogs,
  tripStops,
} from "../drizzle/schema";
import {
  isShowerActive,
  meteorShowers,
  type MeteorShower,
} from "../shared/astro";
import {
  expiringDocuments,
  type ExpiringDocumentLike,
} from "../shared/documentExpiry";
import { expiryInfo } from "../shared/food";
import { gearTaskDue, type GearTaskLike } from "../shared/gearTasks";
import { heatAdvice } from "../shared/heatCare";
import { pick } from "../shared/i18n";
import { getMoonInfo } from "../shared/moon";
import { daysUntilTrip, isTripActiveOn } from "../shared/trips";
import { currentTripStop } from "../shared/tripStops";
import { distanceMeters } from "../shared/geo";
import {
  ATTRIBUTION,
  eventLabel,
  isPushWorthy,
  warningKey,
  warningsForPoint,
} from "@shared/meteoAlarm";
import { getOfficialWarnings } from "./meteoAlarm";
import { guessCountryCode } from "@shared/countryGuess";
import { getHolidaysAbroad, type PublicHoliday } from "./holidaysAbroad";
import {
  detectAlerts,
  nightCloudCover,
  type AlertThresholds,
  type HourlyWeather,
} from "../shared/weather";
import { getDb } from "./db";
import { shiftIsoDay } from "@shared/localDate";

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configureWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:webmaster@meinreisekompass.ch",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

export async function saveSubscription(
  userId: number,
  endpoint: string,
  p256dh: string,
  auth: string,
  // Sprache des Geräts (#313): Sie wird bei JEDER Anmeldung mitgeschrieben,
  // auch bei einer bestehenden – so zieht ein Sprachwechsel in der App die
  // Mitteilungen mit, ohne dass man das Abo von Hand erneuern müsste.
  lang: Language = "de"
) {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db
    .insert(pushSubscriptions)
    .values({ userId, endpoint, p256dh, auth, lang })
    .onDuplicateKeyUpdate({ set: { userId, p256dh, auth, lang } });
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
export type PushLogKind =
  PushKind | "drying" | "evepack" | "board" | "join" | "docs";

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
  /** Wetterumschwung-Pushes (#427). */
  turnSent: number;
  /** Verschickte Vorabend-Checks (Abend vor der Anreise) */
  evePackSent: number;
  /** Verschickte Sternschnuppen-Tipps (klare Nacht am Heim-Ort) */
  astroSent: number;
  /** Verschickte Pflege-Erinnerungen (fällige Ausrüstungs-Aufgaben) */
  gearSent: number;
  /** Verschickte Ausweis-Erinnerungen (#476) */
  docsSent: number;
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
  today: string,
  lang: Language = "de"
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
  const text = foodAlertText(
    expiring.length,
    nameList(names, rest, lang),
    lang
  );
  return { ...text, key: `food:${today}` };
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
  today: string,
  lang: Language = "de"
): GearAlert | null {
  const due = tasks
    .filter(task => gearTaskDue(task, today).due)
    .sort((a, b) => a.title.localeCompare(b.title, "de"));
  if (due.length === 0) return null;

  const names = due.slice(0, GEAR_ALERT_MAX_NAMES).map(t => t.title);
  const rest = due.length - names.length;
  const text = gearAlertText(due.length, nameList(names, rest, lang), lang);
  return { ...text, key: `gear:${today.slice(0, 7)}` };
}

export interface DocsAlert {
  title: string;
  body: string;
  /** Dedup-Schlüssel «docs:YYYY-MM» – max. eine Ausweis-Erinnerung pro Monat und Abo */
  key: string;
}

/** Wie viele Karten-Titel in der Ausweis-Erinnerung ausgeschrieben werden. */
const DOCS_ALERT_MAX_NAMES = 3;

/**
 * Ausweis-Erinnerung (#476) bauen: Karten, die innert 30 Tagen ablaufen
 * oder schon abgelaufen sind (expiringDocuments aus
 * shared/documentExpiry.ts). Gibt null zurück, wenn nichts ansteht;
 * Schlüssel «docs:YYYY-MM» begrenzt auf einmal pro Monat und Abo.
 */
export function buildDocsAlert(
  cards: readonly ExpiringDocumentLike[],
  today: string,
  lang: Language = "de"
): DocsAlert | null {
  const due = expiringDocuments(cards, today);
  if (due.length === 0) return null;

  const names = due.slice(0, DOCS_ALERT_MAX_NAMES).map(c => c.title);
  const rest = due.length - names.length;
  const text = docsAlertText(due.length, nameList(names, rest, lang), lang);
  return { ...text, key: `docs:${today.slice(0, 7)}` };
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
export function buildHeatAlert(
  input: {
    date: string;
    uvIndexMax: number;
    maxTempC: number;
    placeName: string;
  },
  lang: Language = "de"
): HeatAlert | null {
  const advice = heatAdvice(input.uvIndexMax, input.maxTempC);
  if (!advice) return null;
  // Komma als Dezimaltrennzeichen nur dort, wo es üblich ist – im
  // Englischen wäre «1,5 l» schlicht falsch gelesen.
  const liters = advice.litersPerAdult.toFixed(1);
  const text = heatAlertText(
    {
      placeName: input.placeName,
      sunscreen: advice.sunscreen,
      hydration: advice.hydration,
      uvIndex: advice.uvIndex,
      reapplyMinutes: advice.reapplyMinutes,
      burnMinutes: advice.burnMinutes,
      maxTempC: advice.maxTempC,
      liters: lang === "en" ? liters : liters.replace(".", ","),
    },
    lang
  );
  return { ...text, key: `heat:${input.date}` };
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
  today: string,
  lang: Language = "de"
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
  const progress =
    trip.packListId !== null ? progressByList.get(trip.packListId) : undefined;
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.checked / progress.total) * 100)
      : 0;
  const text = tripAlertText(
    { days, name: trip.name, pct: progress ? pct : null },
    lang
  );
  return { ...text, key: `trip:${trip.id}` };
}

export interface EvePackAlert {
  title: string;
  body: string;
  /** Dedup-Schlüssel «evepack:<tripId>» – pro Reise nur ein Vorabend-Check */
  key: string;
  /** Sprungziel; ohne Angabe die Packlisten (klassischer Vorabend-Check). */
  url?: string;
}

/** Texte des Etappen-Vorabend-Hinweises (#579) in vier Sprachen. */
function stageMoveAlertText(name: string, lang: Language) {
  const texts: Record<Language, { title: string; body: string }> = {
    de: {
      title: `Morgen weiter nach ${name}`,
      body: "Heute Abend zusammenpacken – morgen zieht die Rundreise weiter.",
    },
    fr: {
      title: `Demain, direction ${name}`,
      body: "Range tes affaires ce soir – le circuit repart demain.",
    },
    it: {
      title: `Domani si prosegue per ${name}`,
      body: "Prepara le cose stasera – domani il giro riparte.",
    },
    en: {
      title: `Moving on to ${name} tomorrow`,
      body: "Pack up tonight – the round trip moves on in the morning.",
    },
  };
  return texts[lang] ?? texts.de;
}

/** Wetter am nächsten Etappenort (#630) für die Zusatz-Zeile im Push. */
export interface StageMoveWeather {
  tMaxC: number;
  precipitationMm: number;
}

/** Wetter-Zeile des Etappen-Hinweises (#630) in vier Sprachen. */
export function stageMoveWeatherLine(
  weather: StageMoveWeather,
  lang: Language
): string {
  const t = Math.round(weather.tMaxC);
  const mm = Math.round(weather.precipitationMm);
  const rainy = weather.precipitationMm >= 1;
  const texts: Record<Language, string> = {
    de: `Wetter am Ziel: ${t} °C${rainy ? `, ${mm} mm Regen` : ", trocken"}.`,
    fr: `Météo à destination : ${t} °C${rainy ? `, ${mm} mm de pluie` : ", au sec"}.`,
    it: `Meteo a destinazione: ${t} °C${rainy ? `, ${mm} mm di pioggia` : ", asciutto"}.`,
    en: `Weather at the destination: ${t} °C${rainy ? `, ${mm} mm of rain` : ", dry"}.`,
  };
  return texts[lang] ?? texts.de;
}

/**
 * Die MORGEN beginnende Etappe einer laufenden Reise – bei mehreren
 * Wechseln gewinnt die kleinste Reise-Id. Herausgelöst (#630), damit der
 * Cron an die Koordinaten der Ziel-Etappe kommt, bevor er den Text baut.
 */
export function nextStageMove<
  T extends { tripId: number; name: string; startDate: string },
>(stops: readonly T[], activeTripIds: ReadonlySet<number>, today: string) {
  const tomorrow = shiftIsoDay(today, 1);
  return (
    stops
      .filter(
        stop => activeTripIds.has(stop.tripId) && stop.startDate === tomorrow
      )
      .sort((a, b) => a.tripId - b.tripId)[0] ?? null
  );
}

/**
 * Etappen-Vorabend-Hinweis (#579): Beginnt MORGEN eine Etappe einer
 * laufenden Reise, erinnert der Abend-Push ans Zusammenpacken – gleiche
 * Abend-Logik wie der Vorabend-Check, gleicher Kanal (der Pack-Check
 * hat Vorrang, wer beides hätte, bekommt den Pack-Check). Mit Wetter am
 * Ziel (#630), wenn der Aufrufer eine Prognose mitgibt. Reine Funktion
 * für Tests; bei mehreren Wechseln gewinnt die kleinste Reise-Id.
 */
export function buildStageMoveAlert(
  stops: readonly { tripId: number; name: string; startDate: string }[],
  activeTripIds: ReadonlySet<number>,
  today: string,
  lang: Language = "de",
  weather: StageMoveWeather | null = null
): EvePackAlert | null {
  const next = nextStageMove(stops, activeTripIds, today);
  if (!next) return null;
  const text = stageMoveAlertText(next.name, lang);
  return {
    ...text,
    body: weather
      ? `${text.body} ${stageMoveWeatherLine(weather, lang)}`
      : text.body,
    key: `stagemove:${next.tripId}:${next.startDate}`,
    url: "/heute",
  };
}

/** Texte der Feiertags-Vorwarnung (#606) in vier Sprachen. */
function holidayEveAlertText(holidayName: string, lang: Language) {
  const texts: Record<Language, { title: string; body: string }> = {
    de: {
      title: `Morgen ist Feiertag: ${holidayName}`,
      body: "Läden sind oft geschlossen – heute noch einkaufen.",
    },
    fr: {
      title: `Demain, c'est férié : ${holidayName}`,
      body: "Les magasins seront souvent fermés – fais les courses aujourd'hui.",
    },
    it: {
      title: `Domani è festivo: ${holidayName}`,
      body: "I negozi saranno spesso chiusi – fai la spesa oggi.",
    },
    en: {
      title: `Public holiday tomorrow: ${holidayName}`,
      body: "Shops are often closed – do your shopping today.",
    },
  };
  return texts[lang] ?? texts.de;
}

/** Eine laufende Reise mit geratenem Reiseland (ISO-2, gross). */
export interface TripForHoliday {
  id: number;
  countryCode: string | null;
}

/**
 * Feiertags-Vorwarnung (#606): Ist MORGEN ein Feiertag im Reiseland einer
 * laufenden Auslands-Reise, warnt der Abend-Push vor zu Läden und vollen
 * Strassen – Quelle wie der Hinweis in Cockpit und Heute-Ansicht (#539,
 * Nager.Date). Gleicher Kanal wie der Vorabend-Check; Pack-Check und
 * Etappen-Hinweis haben Vorrang. Die Schweiz bleibt aussen vor – daheim
 * kennt man seine Feiertage. Reine Funktion für Tests; bei mehreren
 * Reisen gewinnt die kleinste Id.
 */
export function buildHolidayEveAlert(
  trips: readonly TripForHoliday[],
  holidayByCountry: ReadonlyMap<
    string,
    { date: string; localName: string } | null
  >,
  tomorrow: string,
  lang: Language = "de"
): EvePackAlert | null {
  const hit = trips
    .filter(
      (trip): trip is TripForHoliday & { countryCode: string } =>
        trip.countryCode !== null && trip.countryCode !== "CH"
    )
    .map(trip => ({
      trip,
      holiday: holidayByCountry.get(trip.countryCode) ?? null,
    }))
    .filter(x => x.holiday !== null && x.holiday.date === tomorrow)
    .sort((a, b) => a.trip.id - b.trip.id)[0];
  if (!hit || !hit.holiday) return null;
  const text = holidayEveAlertText(hit.holiday.localName, lang);
  return {
    ...text,
    key: `holiday:${hit.trip.id}:${hit.holiday.date}`,
    url: "/heute",
  };
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
  today: string,
  lang: Language = "de"
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
  const text = evePackAlertText(
    { name: first.trip.name, pct: first.pct },
    lang
  );
  return { ...text, key: `evepack:${first.trip.id}` };
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
  // Über die Kalenderfelder und nicht über Millisekunden: An den beiden
  // Umstellungstagen hat ein Tag 23 bzw. 25 Stunden.
  return shiftIsoDay(today, -1);
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
  today: string,
  lang: Language = "de"
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
  const text = dryingAlertText({ name: trip.name, rainMm: rain ?? null }, lang);
  return { ...text, key: `dry:${trip.id}` };
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
export function buildMeteorAlert(
  input: {
    date: string;
    /** Mittlere Nacht-Bewölkung in % (null = unbekannt → kein Tipp) */
    cloudCoverNight: number | null;
    /** Mond-Beleuchtung 0–1 */
    moonIllumination: number;
    /** Aktiver Strom in Peak-Nähe (null = keiner) */
    activeShower: { name: string; zhr: number } | null;
    /** Anzeigename des geprüften Orts (Heim-Standort) */
    placeName: string;
  },
  lang: Language = "de"
): AstroAlert | null {
  if (!input.activeShower) return null;
  if (
    input.cloudCoverNight === null ||
    input.cloudCoverNight >= ASTRO_CLOUD_MAX_PERCENT
  ) {
    return null;
  }
  if (input.moonIllumination >= ASTRO_MOON_MAX_ILLUMINATION) return null;
  const text = meteorAlertText(
    {
      shower: input.activeShower.name,
      zhr: input.activeShower.zhr,
      placeName: input.placeName,
    },
    lang
  );
  return { ...text, key: `astro:${input.date}` };
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
export interface WeatherTurnPushAlert {
  title: string;
  body: string;
  /** Dedup «turn:<tripId>:<morgen>» – pro Reise und Tag höchstens einer. */
  key: string;
}

/** Tagesprognose heute+morgen für den Umschwungs-Vergleich (#427). */
async function dailyTurnFor(lat: number, lon: number): Promise<TurnDay[]> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone: "auto",
    forecast_days: "2",
    daily: "temperature_2m_max,precipitation_sum,wind_gusts_10m_max",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );
  if (!res.ok) throw new Error(`Wetterdienst: ${res.status}`);
  const json = (await res.json()) as {
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      precipitation_sum?: number[];
      wind_gusts_10m_max?: number[];
    };
  };
  const time = json.daily?.time ?? [];
  return time.map((date, i) => ({
    date,
    tempMaxC: Number(json.daily?.temperature_2m_max?.[i] ?? NaN),
    precipitationSumMm: Number(json.daily?.precipitation_sum?.[i] ?? 0),
    windGustsMaxKmh: Number(json.daily?.wind_gusts_10m_max?.[i] ?? 0),
  }));
}

/** Titel und Text des Umschwung-Push in der Sprache des Geräts. */
function weatherTurnPushText(
  turn: WeatherTurn,
  name: string,
  lang: Language
): { title: string; body: string } {
  const titles: Record<Language, string> = {
    de: "Morgen kippt das Wetter",
    en: "The weather turns tomorrow",
    fr: "Le temps bascule demain",
    it: "Domani il tempo cambia",
  };
  const bodies: Record<Language, Record<WeatherTurn["kind"], string>> = {
    de: {
      wind: `${name}: morgen Böen bis ${turn.value} km/h – heute Abend abspannen und Heringe prüfen.`,
      rain: `${name}: morgen rund ${turn.value} mm Regen – Abspannung und Wassergräben prüfen.`,
      cold: `${name}: morgen rund ${turn.value} °C kälter – warme Schicht und Schlafsäcke bereitlegen.`,
    },
    en: {
      wind: `${name}: gusts up to ${turn.value} km/h tomorrow – tension the guy lines tonight and check the pegs.`,
      rain: `${name}: about ${turn.value} mm of rain tomorrow – check guy lines and drainage.`,
      cold: `${name}: about ${turn.value} °C colder tomorrow – lay out warm layers and sleeping bags.`,
    },
    fr: {
      wind: `${name} : demain rafales jusqu'à ${turn.value} km/h – retendre les haubans ce soir et vérifier les sardines.`,
      rain: `${name} : demain environ ${turn.value} mm de pluie – vérifier haubans et écoulement.`,
      cold: `${name} : demain environ ${turn.value} °C de moins – préparer couches chaudes et sacs de couchage.`,
    },
    it: {
      wind: `${name}: domani raffiche fino a ${turn.value} km/h – stasera tendere i tiranti e controllare i picchetti.`,
      rain: `${name}: domani circa ${turn.value} mm di pioggia – controllare tiranti e scoli.`,
      cold: `${name}: domani circa ${turn.value} °C in meno – preparare strati caldi e sacchi a pelo.`,
    },
  };
  return { title: titles[lang], body: bodies[lang][turn.kind] };
}

/**
 * Umschwung-Push bauen (#427): der erste laufende Aufenthalt mit einem
 * Umschwung gewinnt (kleinste Id – deterministisch für den Dedup).
 * Reine Funktion, für Tests exportiert.
 */
export function buildWeatherTurnAlert(
  trips: readonly { id: number; name: string; spotId: number }[],
  turnBySpotId: ReadonlyMap<number, { turn: WeatherTurn; tomorrow: string }>,
  lang: Language = "de"
): WeatherTurnPushAlert | null {
  const candidates = trips
    .map(trip => ({ trip, value: turnBySpotId.get(trip.spotId) }))
    .filter(
      (
        x
      ): x is {
        trip: (typeof trips)[number];
        value: { turn: WeatherTurn; tomorrow: string };
      } => x.value !== undefined
    )
    .sort((a, b) => a.trip.id - b.trip.id);
  const first = candidates[0];
  if (!first) return null;
  const text = weatherTurnPushText(first.value.turn, first.trip.name, lang);
  return { ...text, key: `turn:${first.trip.id}:${first.value.tomorrow}` };
}

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

/**
 * ENTFALLEN (#338): `localIsoDate()` gab den Tag in der Zeitzone des
 * SERVERS. Läuft der in UTC – und das tut ein Webhosting im Zweifel –,
 * war das zwischen Mitternacht und zwei Uhr ein anderer Tag als der bei
 * den Nutzenden. Aufgefallen wäre es nicht, weil die Jobs tagsüber
 * laufen; eine zweite Definition von «heute», die nur unter bestimmten
 * Umständen falsch ist, ist aber genau die Art Fehler, die man nicht
 * findet. Es gilt jetzt überall `zurichIsoDate()`.
 */

/**
 * EINEN Push an EIN Abo ausliefern – ohne Cron-Lauf drumherum (#367).
 *
 * WARUM ALS EIGENE FUNKTION: Bis jetzt gab es Mitteilungen nur aus
 * `checkAndNotify`, also aus dem stündlichen Lauf. Ein Zettel an der
 * Pinnwand ist aber ein EREIGNIS: Wer ihn eine Stunde später bekommt,
 * hätte ihn genauso gut selbst nachschauen können. Die Zustellung –
 * Expo-Token für die native App, sonst Web-Push, und bei widerrufenem Abo
 * (404/410) das Abo löschen – ist dieselbe; sie steht darum hier und wird
 * von beiden Wegen benutzt.
 *
 * Rückgabe «gone» heisst: Das Abo war weg und ist jetzt auch aus der
 * Tabelle raus.
 */
async function deliverPush(
  sub: { id: number; endpoint: string; p256dh: string; auth: string },
  payload: string
): Promise<"sent" | "gone" | "error"> {
  const db = await getDb();
  if (!db) return "error";
  const drop = async () => {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
  };
  try {
    if (sub.endpoint.startsWith("ExponentPushToken[")) {
      const data = JSON.parse(payload);
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: sub.endpoint,
          title: data.title,
          body: data.body,
          data: { url: data.url },
        }),
      });
      const resData = await res.json();
      if (
        resData.data?.status === "error" &&
        resData.data?.details?.error === "DeviceNotRegistered"
      ) {
        await drop();
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
    if (status === 404 || status === 410) {
      await drop();
      return "gone";
    }
    return "error";
  }
}

/**
 * Eine Meldung sofort an mehrere Konten schicken (#367).
 *
 * Die Sprache hängt am GERÄT (#313), darum bekommt `build` sie übergeben
 * und wird je Abo aufgerufen. Wer die Art abbestellt hat, bekommt nichts –
 * dieselbe Prüfung wie im Cron-Lauf.
 *
 * FEHLER WERDEN GESCHLUCKT: Aufgerufen wird das aus einer Mutation
 * heraus. Ein Zettel, der gespeichert ist, darf nicht daran scheitern,
 * dass ein Push-Dienst gerade nicht antwortet.
 */
export async function notifyUsers(
  userIds: number[],
  kind: PushKind,
  logKind: PushLogKind,
  url: string,
  build: (lang: Language) => { title: string; body: string }
): Promise<number> {
  if (userIds.length === 0 || !pushConfigured()) return 0;
  const db = await getDb();
  if (!db) return 0;
  configureWebPush();
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));
  const logged = new Set<number>();
  let sent = 0;
  for (const sub of subs) {
    if (!subscriptionWants(sub, kind)) continue;
    const lang = (LANGUAGES as readonly string[]).includes(sub.lang)
      ? (sub.lang as Language)
      : "de";
    const text = build(lang);
    const payload = JSON.stringify({ ...text, url });
    const status = await deliverPush(sub, payload);
    if (status !== "sent") continue;
    sent += 1;
    // Der Verlauf hängt am KONTO, nicht am Gerät – bei zwei Handys steht
    // die Meldung trotzdem nur einmal drin.
    if (logged.has(sub.userId)) continue;
    logged.add(sub.userId);
    await recordPushLog({
      userId: sub.userId,
      kind: logKind,
      title: text.title,
      body: text.body,
      url,
    });
  }
  return sent;
}

/**
 * Alle Abos prüfen: für jeden Zeltplatz der abonnierten Nutzer*innen die
 * Warnlage berechnen und bei Sturm/Gewitter & Co. (Stufe «gefahr») einen
 * Push senden. Dieselbe Warnlage wird pro Abo nur einmal gemeldet.
 * Die Mitteilungs-Flags pro Abo (wantsWeather/wantsFood/wantsTrips/
 * wantsAstro/wantsGear) werden über subscriptionWants respektiert.
 */
/**
 * So nah (Luftlinie) muss eine laufende Reise beim Heim-Standort liegen,
 * damit auch der Heim-Ort Unwetter-Push bekommt. Grosszügig gewählt:
 * Beim Tagesausflug in die Nachbargemeinde ist das Daheim mitbetroffen.
 */
const HOME_TRIP_RADIUS_M = 25_000;

export async function checkAndNotify(): Promise<PushCheckResult> {
  const result: PushCheckResult = {
    subscriptions: 0,
    spotsChecked: 0,
    sent: 0,
    foodSent: 0,
    tripSent: 0,
    drySent: 0,
    turnSent: 0,
    evePackSent: 0,
    astroSent: 0,
    gearSent: 0,
    docsSent: 0,
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

  /**
   * Meldungen werden je Konto UND Sprache gebaut (#313).
   *
   * Warum nicht einmal pro Konto: Die Sprache hängt am Gerät, nicht am
   * Konto – Handy auf Französisch, Tablet auf Deutsch ist ein normaler
   * Fall. Gebaut wird nur, was tatsächlich gebraucht wird: Bei einer
   * einzigen Sprache im Konto ist es genau ein Durchgang wie bisher.
   */
  const subLang = (value: string): Language =>
    (LANGUAGES as readonly string[]).includes(value)
      ? (value as Language)
      : "de";
  const langsByUser = new Map<number, Language[]>();
  for (const sub of subs) {
    const lang = subLang(sub.lang);
    const list = langsByUser.get(sub.userId) ?? [];
    if (!list.includes(lang)) list.push(lang);
    langsByUser.set(sub.userId, list);
  }
  const langsOf = (userId: number): Language[] =>
    langsByUser.get(userId) ?? ["de"];
  /** Schlüssel der Meldungs-Landkarten: Konto plus Sprache. */
  const alertFor = (userId: number, lang: string) => `${userId}:${lang}`;
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
  const today = zurichIsoDate();
  const food = await db
    .select()
    .from(foodItems)
    .where(inArray(foodItems.userId, userIds));
  const foodAlertByUser = new Map<string, FoodAlert>();
  for (const userId of userIds) {
    const items = food
      .filter(f => f.userId === userId)
      .map(f => ({ name: f.name, expiryDate: f.expiryDate }));
    for (const lang of langsOf(userId)) {
      const alert = buildFoodAlert(items, today, lang);
      if (alert) foodAlertByUser.set(alertFor(userId, lang), alert);
    }
  }

  // Ausrüstung: fällige Pflege-Aufgaben pro Nutzer*in vorbereiten
  const allGearTasks = await db
    .select()
    .from(gearTasks)
    .where(inArray(gearTasks.userId, userIds));
  const gearAlertByUser = new Map<string, GearAlert>();
  for (const userId of userIds) {
    const tasks = allGearTasks.filter(task => task.userId === userId);
    for (const lang of langsOf(userId)) {
      const alert = buildGearAlert(tasks, today, lang);
      if (alert) gearAlertByUser.set(alertFor(userId, lang), alert);
    }
  }

  // Karten & Ausweise (#476): ablaufende Dokumente pro Nutzer*in vorbereiten
  const allDocCards = await db
    .select()
    .from(documentCards)
    .where(inArray(documentCards.userId, userIds));
  const docsAlertByUser = new Map<string, DocsAlert>();
  for (const userId of userIds) {
    const cards = allDocCards.filter(card => card.userId === userId);
    for (const lang of langsOf(userId)) {
      const alert = buildDocsAlert(cards, today, lang);
      if (alert) docsAlertByUser.set(alertFor(userId, lang), alert);
    }
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
  const tripAlertByUser = new Map<string, TripAlert>();
  for (const userId of userIds) {
    const own = upcomingTrips
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
      }));
    for (const lang of langsOf(userId)) {
      const alert = buildTripAlert(own, progressByList, today, lang);
      if (alert) tripAlertByUser.set(alertFor(userId, lang), alert);
    }
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
  const evePackAlertByUser = new Map<string, EvePackAlert>();
  const eveningHour = zurichHour();
  if (
    eveningHour >= EVE_PACK_SEND_HOUR_FROM &&
    eveningHour <= EVE_PACK_SEND_HOUR_TO
  ) {
    for (const userId of userIds) {
      const own = upcomingTrips
        .filter(trip => trip.userId === userId)
        .map(trip => ({
          id: trip.id,
          name: tripDisplayName(trip),
          startDate: trip.startDate,
          packListId: trip.packListId,
        }));
      for (const lang of langsOf(userId)) {
        const alert = buildEvePackAlert(own, progressByList, today, lang);
        if (alert) evePackAlertByUser.set(alertFor(userId, lang), alert);
      }
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
  const dryAlertByUser = new Map<string, DryingAlert>();
  for (const userId of userIds) {
    const own = endedYesterday
      .filter(trip => trip.userId === userId)
      .map(trip => ({
        id: trip.id,
        name:
          trip.title ||
          (trip.spotId !== null ? spotNameById.get(trip.spotId) : null) ||
          trip.location ||
          "Camping-Aufenthalt",
        endDate: trip.endDate,
      }));
    for (const lang of langsOf(userId)) {
      const alert = buildDryingAlert(own, rainByTripId, today, lang);
      if (alert) dryAlertByUser.set(alertFor(userId, lang), alert);
    }
  }

  // ── Wetterumschwung (#427): abends beim LAUFENDEN Aufenthalt ──
  // Der Hinweis aus der App (#417) als Push: Wer abends nicht in die App
  // schaut, verpasst «morgen kippt das Wetter – heute Abend abspannen».
  // Gleiches Abendfenster wie der Vorabend-Check, Regeln in
  // shared/weatherTurn.ts, Dedup pro Reise und Morgen-Datum.
  const turnAlertByUser = new Map<string, WeatherTurnPushAlert>();
  if (
    eveningHour >= EVE_PACK_SEND_HOUR_FROM &&
    eveningHour <= EVE_PACK_SEND_HOUR_TO
  ) {
    const running = allTrips.filter(
      trip => trip.spotId !== null && isTripActiveOn(trip, today)
    );
    const turnBySpotId = new Map<
      number,
      { turn: WeatherTurn; tomorrow: string }
    >();
    const turnCache = new Map<
      string,
      { turn: WeatherTurn; tomorrow: string } | null
    >();
    for (const trip of running) {
      const spot = trip.spotId !== null ? spotById.get(trip.spotId) : undefined;
      if (!spot) continue;
      const cacheKey = `${spot.latitude.toFixed(2)},${spot.longitude.toFixed(2)}`;
      if (!turnCache.has(cacheKey)) {
        try {
          const days = await dailyTurnFor(spot.latitude, spot.longitude);
          const turn = weatherTurn(days[0], days[1]);
          turnCache.set(
            cacheKey,
            turn && days[1] ? { turn, tomorrow: days[1].date } : null
          );
        } catch {
          turnCache.set(cacheKey, null); // Wetterdienst weg → kein Push
        }
      }
      const value = turnCache.get(cacheKey);
      if (value) turnBySpotId.set(spot.id, value);
    }
    if (turnBySpotId.size > 0) {
      for (const userId of userIds) {
        const own = running
          .filter(trip => trip.userId === userId)
          .map(trip => ({
            id: trip.id,
            name: tripDisplayName(trip),
            spotId: trip.spotId as number,
          }));
        for (const lang of langsOf(userId)) {
          const alert = buildWeatherTurnAlert(own, turnBySpotId, lang);
          if (alert) turnAlertByUser.set(alertFor(userId, lang), alert);
        }
      }
    }
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
    /** Für die amtlichen Warnungen: Liegt der Ort im Warngebiet? */
    latitude: number;
    longitude: number;
  }[] = [];
  /**
   * GEWARNT WIRD NUR, WO GERADE EINE REISE IST (Nutzer-Entscheid
   * 09.08.2026): Vorher bekam man Unwetter-Push für jeden gespeicherten
   * Platz und den Heim-Standort, das ganze Jahr – Lärm statt Warnung.
   * Jetzt zählen die Orte der HEUTE laufenden Reisen (verknüpfter Platz
   * oder Freitext-Ort mit Koordinaten aus der Ortssuche). Der Heim-Ort
   * wird nur geprüft, wenn eine laufende Reise in seiner Nähe liegt –
   * Ferien auf Balkonien sind auch Ferien.
   */
  const activeTrips = allTrips.filter(trip => isTripActiveOn(trip, today));
  /**
   * Aktuelle Etappe je laufender Reise (#557): Bei einer Rundreise steht
   * man heute nicht am Startort, sondern an der Etappe, deren Zeitraum
   * den Tag abdeckt – gewarnt wird DORT. Nur Etappen mit Koordinaten
   * zählen; ohne bleibt es ehrlich beim Platz bzw. Reise-Ort.
   */
  const stageByTrip = new Map<
    number,
    { name: string; latitude: number; longitude: number }
  >();
  if (activeTrips.length > 0) {
    const stops = await db
      .select()
      .from(tripStops)
      .where(
        inArray(
          tripStops.tripId,
          activeTrips.map(trip => trip.id)
        )
      );
    const stopsByTrip = new Map<number, typeof stops>();
    for (const stop of stops) {
      const list = stopsByTrip.get(stop.tripId) ?? [];
      list.push(stop);
      stopsByTrip.set(stop.tripId, list);
    }
    stopsByTrip.forEach((tripStopRows, tripId) => {
      const current = currentTripStop(tripStopRows, today);
      if (current && current.latitude != null && current.longitude != null) {
        stageByTrip.set(tripId, {
          name: current.name,
          latitude: current.latitude,
          longitude: current.longitude,
        });
      }
    });
    // Etappen-Vorabend-Hinweis (#579): «Morgen weiter nach …» am Abend
    // vor dem Wechsel – gleicher Kanal wie der Vorabend-Check, der
    // Pack-Check hat Vorrang (er steht schon in der Map).
    if (
      eveningHour >= EVE_PACK_SEND_HOUR_FROM &&
      eveningHour <= EVE_PACK_SEND_HOUR_TO
    ) {
      const activeByUser = new Map<number, Set<number>>();
      for (const trip of activeTrips) {
        const set = activeByUser.get(trip.userId) ?? new Set<number>();
        set.add(trip.id);
        activeByUser.set(trip.userId, set);
      }
      // Wetter am Ziel (#630): eine Prognose je Ziel-Etappe, gecacht über
      // die Koordinaten – ohne Netz bleibt der Hinweis schlicht ohne
      // Wetter-Zeile.
      const stageWeatherCache = new Map<string, StageMoveWeather | null>();
      const stageWeatherFor = async (
        stop: (typeof stops)[number]
      ): Promise<StageMoveWeather | null> => {
        if (stop.latitude == null || stop.longitude == null) return null;
        const cacheKey = `${stop.latitude.toFixed(3)},${stop.longitude.toFixed(3)}`;
        if (stageWeatherCache.has(cacheKey)) {
          return stageWeatherCache.get(cacheKey) ?? null;
        }
        let weather: StageMoveWeather | null = null;
        try {
          const days = await dailyTurnFor(stop.latitude, stop.longitude);
          const day = days.find(entry => entry.date === stop.startDate);
          if (day && Number.isFinite(day.tempMaxC)) {
            weather = {
              tMaxC: day.tempMaxC,
              precipitationMm: day.precipitationSumMm,
            };
          }
        } catch {
          weather = null;
        }
        stageWeatherCache.set(cacheKey, weather);
        return weather;
      };
      for (const [userId, tripIds] of Array.from(activeByUser)) {
        const nextStop = nextStageMove(stops, tripIds, today);
        const weather = nextStop ? await stageWeatherFor(nextStop) : null;
        for (const lang of langsOf(userId)) {
          const mapKey = alertFor(userId, lang);
          if (evePackAlertByUser.has(mapKey)) continue;
          const alert = buildStageMoveAlert(
            stops,
            tripIds,
            today,
            lang,
            weather
          );
          if (alert) evePackAlertByUser.set(mapKey, alert);
        }
      }

      // Feiertags-Vorwarnung (#606): Morgen Feiertag im Reiseland? Land
      // aus Titel/Ort/Platz/Etappen geraten (shared/countryGuess), Feier-
      // tage aus derselben Quelle wie Cockpit und Heute-Ansicht (#539).
      const tomorrowIso = shiftIsoDay(today, 1);
      const countryByTrip = new Map<number, string | null>();
      for (const trip of activeTrips) {
        const stopNames = (stopsByTrip.get(trip.id) ?? [])
          .map(stop => stop.name)
          .join(" ");
        countryByTrip.set(
          trip.id,
          guessCountryCode(
            `${trip.title ?? ""} ${tripDisplayName(trip)} ${trip.location ?? ""} ${stopNames}`
          )
        );
      }
      const wantedCountries = new Set(
        Array.from(countryByTrip.values()).filter(
          (code): code is string => code !== null && code !== "CH"
        )
      );
      const holidayByCountry = new Map<string, PublicHoliday | null>();
      for (const code of Array.from(wantedCountries)) {
        try {
          const list = await getHolidaysAbroad(code, tomorrowIso, tomorrowIso);
          holidayByCountry.set(code, list?.[0] ?? null);
        } catch {
          holidayByCountry.set(code, null); // Feiertagsdienst weg → kein Push
        }
      }
      if (holidayByCountry.size > 0) {
        activeByUser.forEach((tripIds, userId) => {
          const own = Array.from(tripIds, id => ({
            id,
            countryCode: countryByTrip.get(id) ?? null,
          }));
          for (const lang of langsOf(userId)) {
            const mapKey = alertFor(userId, lang);
            if (evePackAlertByUser.has(mapKey)) continue;
            const alert = buildHolidayEveAlert(
              own,
              holidayByCountry,
              tomorrowIso,
              lang
            );
            if (alert) evePackAlertByUser.set(mapKey, alert);
          }
        });
      }
    }
  }
  /** Koordinaten einer Reise: aktuelle Etappe vor Platz vor Freitext-Ort. */
  const tripCoords = (trip: (typeof allTrips)[number]) => {
    const stage = stageByTrip.get(trip.id);
    if (stage) return { latitude: stage.latitude, longitude: stage.longitude };
    const spot = trip.spotId !== null ? spotById.get(trip.spotId) : undefined;
    if (spot) return { latitude: spot.latitude, longitude: spot.longitude };
    if (trip.latitude != null && trip.longitude != null) {
      return { latitude: trip.latitude, longitude: trip.longitude };
    }
    return null;
  };
  // Reisen, die heute an einer Etappe MIT Koordinaten stehen, werden dort
  // gewarnt – ihr Platz/Startort fällt für diesen Lauf weg.
  const activeSpotIds = new Set(
    activeTrips
      .filter(trip => !stageByTrip.has(trip.id))
      .map(trip => trip.spotId)
      .filter((id): id is number => id !== null)
  );
  for (const spot of spots) {
    if (!activeSpotIds.has(spot.id)) continue;
    const hourly = await cachedHourly(spot.latitude, spot.longitude);
    if (!hourly) continue;
    weatherPoints.push({
      userId: spot.userId,
      name: spot.name,
      keyPrefix: String(spot.id),
      hourly,
      latitude: spot.latitude,
      longitude: spot.longitude,
    });
  }
  // Aktuelle Etappen (#557): ein Warn-Punkt an der Etappe, benannt nach
  // ihr («Bologna»), Dedup-Schlüssel bleibt an der Reise.
  for (const trip of activeTrips) {
    const stage = stageByTrip.get(trip.id);
    if (!stage) continue;
    const hourly = await cachedHourly(stage.latitude, stage.longitude);
    if (!hourly) continue;
    weatherPoints.push({
      userId: trip.userId,
      name: stage.name,
      keyPrefix: `trip:${trip.id}`,
      hourly,
      latitude: stage.latitude,
      longitude: stage.longitude,
    });
  }
  // Laufende Reisen ohne Platz, aber mit Koordinaten (#465): Hotel-,
  // Strand- und Städtereisen sollen dieselbe Warnung bekommen wie ein
  // verknüpfter Zeltplatz.
  for (const trip of activeTrips) {
    if (stageByTrip.has(trip.id)) continue;
    if (trip.spotId !== null || trip.latitude == null || trip.longitude == null)
      continue;
    const hourly = await cachedHourly(trip.latitude, trip.longitude);
    if (!hourly) continue;
    weatherPoints.push({
      userId: trip.userId,
      name: tripDisplayName(trip),
      keyPrefix: `trip:${trip.id}`,
      hourly,
      latitude: trip.latitude,
      longitude: trip.longitude,
    });
  }
  for (const home of homes) {
    const tripAtHome = activeTrips.some(trip => {
      if (trip.userId !== home.userId) return false;
      const coords = tripCoords(trip);
      return (
        coords !== null &&
        distanceMeters(
          coords.latitude,
          coords.longitude,
          home.latitude,
          home.longitude
        ) <= HOME_TRIP_RADIUS_M
      );
    });
    if (!tripAtHome) continue;
    const hourly = await cachedHourly(home.latitude, home.longitude);
    if (!hourly) continue;
    weatherPoints.push({
      userId: home.userId,
      name: home.name,
      keyPrefix: "home",
      hourly,
      latitude: home.latitude,
      longitude: home.longitude,
    });
  }

  /**
   * Amtliche Unwetterwarnungen von MeteoSchweiz (über MeteoAlarm).
   *
   * EINMAL JE LAUF GEHOLT, nicht je Ort: Der Feed ist derselbe für die
   * ganze Schweiz und rund ein Megabyte gross. Ist er nicht erreichbar,
   * kommt eine leere Liste zurück und die eigenen Warnungen gehen
   * trotzdem raus – lieber eine Quelle weniger als gar kein Push.
   */
  const officialWarnings = await getOfficialWarnings();
  const warningNow = Date.now();

  // Sternschnuppen: klarer Abendhimmel am Heim-Ort während eines aktiven
  // Strom-Maximums – nur abends (17–21 Uhr Europe/Zurich) geprüft, damit der
  // Tipp zur kommenden Nacht passt und der stündliche Cron nicht öfter feuert.
  const astroAlertByUser = new Map<string, AstroAlert>();
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
        // Auch der Name des Stroms ist übersetzt – «Perséides» statt
        // «Perseiden», wenn das Gerät auf Französisch läuft.
        for (const lang of langsOf(home.userId)) {
          const alert = buildMeteorAlert(
            {
              date: astroDate,
              cloudCoverNight: nightCloudCover(hourly, astroDate),
              moonIllumination,
              activeShower: {
                name: pick(shower.name, lang),
                zhr: shower.zhr,
              },
              placeName: home.name,
            },
            lang
          );
          if (alert) astroAlertByUser.set(alertFor(home.userId, lang), alert);
        }
      }
    }
  }

  // Sonnencreme & Trinken (#260/#261): morgens einmal, am Ort des laufenden
  // Aufenthalts bzw. am Heim-Standort. Die Werte kommen aus derselben
  // Stundenprognose wie die Unwetter-Warnung – kein zusätzlicher Abruf.
  const heatAlertByUser = new Map<string, HeatAlert>();
  if (hour >= HEAT_SEND_HOUR_FROM && hour <= HEAT_SEND_HOUR_TO) {
    const heatDate = zurichIsoDate();
    for (const point of weatherPoints) {
      // Ein Konto bekommt höchstens eine Erinnerung – der erste Ort gewinnt,
      // und das ist der Zeltplatz (die Plätze stehen vor dem Heim-Ort).
      // Ein Konto bekommt höchstens eine Erinnerung – geprüft wird über
      // die erste Sprache, denn die Meldungen entstehen immer im Satz.
      if (heatAlertByUser.has(alertFor(point.userId, langsOf(point.userId)[0])))
        continue;
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
      for (const lang of langsOf(point.userId)) {
        const alert = buildHeatAlert(
          {
            date: heatDate,
            uvIndexMax,
            maxTempC,
            placeName: point.name,
          },
          lang
        );
        if (alert) heatAlertByUser.set(alertFor(point.userId, lang), alert);
      }
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
    const ownPoints = weatherPoints.filter(
      point => point.userId === sub.userId
    );
    const lang = subLang(sub.lang);
    const dangers = ownPoints.flatMap(point =>
      detectAlerts(point.hourly, lang, thresholds)
        .filter(a => a.severity === "gefahr")
        .map(alert => ({
          spotName: point.name,
          title: alert.title,
          description: alert.description,
          key: `${point.keyPrefix}:${alert.id}:${alert.startTime.slice(0, 13)}`,
          official: false,
        }))
    );
    /**
     * Amtliche Warnungen für dieselben Orte.
     *
     * ZUSÄTZLICH UND NICHT STATT: Die eigenen Schwellen decken ab, wofür
     * es keine amtliche Warnung gibt – MeteoSchweiz warnt nicht, weil das
     * Vorzelt bei 60 km/h Mühe hat. Umgekehrt sieht die Prognose ein
     * Gewitter nicht so scharf wie ein Meteorologe mit dem Radar.
     *
     * SIE STEHEN ZUOBERST, weil sie im Push den Ton angeben sollen: Wenn
     * MeteoSchweiz eine orange Warnung ausgibt, ist das die Nachricht und
     * nicht der selbst gerechnete Windwert daneben.
     */
    const official = ownPoints.flatMap(point =>
      warningsForPoint(
        officialWarnings,
        point.latitude,
        point.longitude,
        warningNow
      )
        .filter(isPushWorthy)
        .map(warning => ({
          spotName: point.name,
          title: eventLabel(warning.event, lang),
          description: `${ATTRIBUTION.issuer} · ${warning.areaDesc}`,
          key: `${point.keyPrefix}:${warningKey(warning)}`,
          official: true,
        }))
    );
    dangers.unshift(...official);
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
      // Amtliche Warnungen bekommen eine eigene, deutlichere Stufe: Wer
      // nachts aufwacht, soll am ersten Zeichen sehen, ob das der eigene
      // Schwellwert war oder MeteoSchweiz.
      const weather = weatherAlertText(
        {
          official: first.official,
          title: first.title,
          spotName: first.spotName,
          description: first.description,
          more: dangers.length - 1,
        },
        lang
      );
      const payload = JSON.stringify({
        title: weather.title,
        body: weather.body,
        url: "/wetter",
      });
      const outcome = await sendTo(sub, payload);
      if (outcome === "sent") {
        result.sent += 1;
        await logPushOnce(
          sub.userId,
          "weather",
          alertKey,
          weather.title,
          weather.body,
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
      ? foodAlertByUser.get(alertFor(sub.userId, subLang(sub.lang)))
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
      ? tripAlertByUser.get(alertFor(sub.userId, subLang(sub.lang)))
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
      ? evePackAlertByUser.get(alertFor(sub.userId, subLang(sub.lang)))
      : undefined;
    if (evePackAlert && evePackAlert.key !== sub.lastEvePackKey) {
      const evePackPayload = JSON.stringify({
        title: evePackAlert.title,
        body: evePackAlert.body,
        // Der Etappen-Hinweis (#579) springt in die Heute-Ansicht,
        // der klassische Pack-Check weiterhin zu den Packlisten.
        url: evePackAlert.url ?? "/packlisten",
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
          evePackAlert.url ?? "/packlisten"
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
      ? dryAlertByUser.get(alertFor(sub.userId, subLang(sub.lang)))
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

    // ── Wetterumschwung (#427): abends beim laufenden Aufenthalt (Flag wantsWeather) ──
    const turnAlert = subscriptionWants(sub, "weather")
      ? turnAlertByUser.get(alertFor(sub.userId, subLang(sub.lang)))
      : undefined;
    if (turnAlert && turnAlert.key !== sub.lastTurnKey) {
      const turnPayload = JSON.stringify({
        title: turnAlert.title,
        body: turnAlert.body,
        url: "/wetter",
        tag: "campmesser-weather-turn",
      });
      const outcome = await sendTo(sub, turnPayload);
      if (outcome === "sent") {
        result.turnSent += 1;
        await logPushOnce(
          sub.userId,
          "weather",
          turnAlert.key,
          turnAlert.title,
          turnAlert.body,
          "/wetter"
        );
        await db
          .update(pushSubscriptions)
          .set({ lastTurnKey: turnAlert.key, lastNotifiedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      } else if (outcome === "gone") {
        continue;
      }
    }

    // ── Sonnencreme & Trinken: heisser/sonniger Tag (max. eine pro Tag) ──
    const heatAlert = subscriptionWants(sub, "heat")
      ? heatAlertByUser.get(alertFor(sub.userId, subLang(sub.lang)))
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
      ? gearAlertByUser.get(alertFor(sub.userId, subLang(sub.lang)))
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

    // ── Ausweise: Ablauf-Erinnerung (#476, max. eine pro Monat und Abo) ──
    // Läuft über dieselbe Einstellung wie die Pflege-Erinnerung («gear»):
    // beides sind seltene Unterhalts-Hinweise, ein eigener Schalter im
    // Profil wäre mehr Verwaltung als Nutzen.
    const docsAlert = subscriptionWants(sub, "gear")
      ? docsAlertByUser.get(alertFor(sub.userId, subLang(sub.lang)))
      : undefined;
    if (docsAlert && docsAlert.key !== sub.lastDocsKey) {
      const docsPayload = JSON.stringify({
        title: docsAlert.title,
        body: docsAlert.body,
        url: "/ausweise",
        // Eigener Tag, damit die Erinnerung andere Meldungen nicht ersetzt
        tag: "campmesser-docs",
      });
      const outcome = await sendTo(sub, docsPayload);
      if (outcome === "sent") {
        result.docsSent += 1;
        await logPushOnce(
          sub.userId,
          "docs",
          docsAlert.key,
          docsAlert.title,
          docsAlert.body,
          "/ausweise"
        );
        await db
          .update(pushSubscriptions)
          .set({ lastDocsKey: docsAlert.key, lastNotifiedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      } else if (outcome === "gone") {
        continue;
      }
    }

    // ── Sternschnuppen: Tipp bei klarer Nacht am Heim-Ort (max. 1 pro Nacht) ──
    const astroAlert = subscriptionWants(sub, "astro")
      ? astroAlertByUser.get(alertFor(sub.userId, subLang(sub.lang)))
      : undefined;
    if (astroAlert && astroAlert.key !== sub.lastAstroKey) {
      const astroPayload = JSON.stringify({
        title: astroAlert.title,
        body: astroAlert.body,
        // Seit #308 liegt der Sternschnuppen-Kalender auf «Himmel», nicht
        // mehr im Natur-Lexikon – die Mitteilung führte sonst ins Leere.
        url: "/himmel",
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
