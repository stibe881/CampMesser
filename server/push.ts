/**
 * Web-Push für Unwetter-Warnungen an gespeicherten Zeltplätzen sowie
 * MHD-Erinnerungen für die Kühlbox (Lebensmittel, die heute oder morgen ablaufen).
 * Der Check läuft über /api/push/check (konsoleH-Cronjob), weil Passenger
 * den Node-Prozess bei Inaktivität schlafen legt und ein interner Scheduler
 * deshalb unzuverlässig wäre.
 */
import { and, eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { campSpots, foodItems, pushSubscriptions } from "../drizzle/schema";
import { expiryInfo } from "../shared/food";
import { detectAlerts, type HourlyWeather } from "../shared/weather";
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

/** Wetter für einen Punkt laden und Camping-Warnungen berechnen. */
async function alertsFor(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    timezone: "auto",
    forecast_days: "2",
    hourly:
      "temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,weather_code,cape,cloud_cover",
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
  }));
  return detectAlerts(hourly);
}

export interface PushCheckResult {
  subscriptions: number;
  spotsChecked: number;
  sent: number;
  /** Verschickte MHD-Erinnerungen (Kühlbox) */
  foodSent: number;
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
 */
export async function checkAndNotify(): Promise<PushCheckResult> {
  const result: PushCheckResult = {
    subscriptions: 0,
    spotsChecked: 0,
    sent: 0,
    foodSent: 0,
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

  // Wetter pro gerundeter Koordinate nur einmal abrufen
  const alertCache = new Map<string, Awaited<ReturnType<typeof alertsFor>>>();
  const dangersByUser = new Map<
    number,
    { spotName: string; title: string; description: string; key: string }[]
  >();
  for (const spot of spots) {
    const cacheKey = `${spot.latitude.toFixed(2)},${spot.longitude.toFixed(2)}`;
    let alerts = alertCache.get(cacheKey);
    if (!alerts) {
      try {
        alerts = await alertsFor(spot.latitude, spot.longitude);
      } catch {
        continue;
      }
      alertCache.set(cacheKey, alerts);
      result.spotsChecked += 1;
    }
    for (const alert of alerts.filter(a => a.severity === "gefahr")) {
      const list = dangersByUser.get(spot.userId) ?? [];
      list.push({
        spotName: spot.name,
        title: alert.title,
        description: alert.description,
        key: `${spot.id}:${alert.id}:${alert.startTime.slice(0, 13)}`,
      });
      dangersByUser.set(spot.userId, list);
    }
  }

  /** Push an ein Abo senden; bei widerrufenem Abo (404/410) das Abo löschen. */
  async function sendTo(
    sub: (typeof subs)[number],
    payload: string
  ): Promise<"sent" | "gone" | "error"> {
    try {
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

  for (const sub of subs) {
    // ── Unwetter an gespeicherten Plätzen ──
    const dangers = dangersByUser.get(sub.userId) ?? [];
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
    } else if (alertKey !== sub.lastAlertKey) {
      const first = dangers[0];
      const payload = JSON.stringify({
        title: `⚠️ ${first.title} – ${first.spotName}`,
        body:
          dangers.length > 1
            ? `${first.description} (+${dangers.length - 1} weitere Warnungen an deinen Plätzen)`
            : first.description,
        url: "/wetter",
      });
      const outcome = await sendTo(sub, payload);
      if (outcome === "sent") {
        result.sent += 1;
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
    const foodAlert = foodAlertByUser.get(sub.userId);
    if (!foodAlert || foodAlert.key === sub.lastFoodKey) continue;
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
      await db
        .update(pushSubscriptions)
        .set({ lastFoodKey: foodAlert.key, lastNotifiedAt: new Date() })
        .where(eq(pushSubscriptions.id, sub.id));
    }
  }
  return result;
}
