/**
 * Web-Push für Unwetter-Warnungen an gespeicherten Zeltplätzen.
 * Der Check läuft über /api/push/check (konsoleH-Cronjob), weil Passenger
 * den Node-Prozess bei Inaktivität schlafen legt und ein interner Scheduler
 * deshalb unzuverlässig wäre.
 */
import { and, eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { campSpots, pushSubscriptions } from "../drizzle/schema";
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
  removed: number;
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

  for (const sub of subs) {
    const dangers = dangersByUser.get(sub.userId) ?? [];
    const alertKey = dangers
      .map(d => d.key)
      .sort()
      .join("|");
    if (dangers.length === 0) {
      // Lage entspannt: Schlüssel zurücksetzen, damit die nächste Warnung wieder meldet
      if (sub.lastAlertKey) {
        await db
          .update(pushSubscriptions)
          .set({ lastAlertKey: null })
          .where(eq(pushSubscriptions.id, sub.id));
      }
      continue;
    }
    if (alertKey === sub.lastAlertKey) continue;

    const first = dangers[0];
    const payload = JSON.stringify({
      title: `⚠️ ${first.title} – ${first.spotName}`,
      body:
        dangers.length > 1
          ? `${first.description} (+${dangers.length - 1} weitere Warnungen an deinen Plätzen)`
          : first.description,
      url: "/wetter",
    });
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      result.sent += 1;
      await db
        .update(pushSubscriptions)
        .set({ lastAlertKey: alertKey, lastNotifiedAt: new Date() })
        .where(eq(pushSubscriptions.id, sub.id));
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      // 404/410: Abo existiert nicht mehr (Browser hat es widerrufen)
      if (status === 404 || status === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
        result.removed += 1;
      }
    }
  }
  return result;
}
