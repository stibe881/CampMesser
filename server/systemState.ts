/**
 * Kleine Notizzettel-Tabelle für den Server selbst (#314).
 *
 * WARUM: Die Push-Prüfung läuft nicht im Server, sondern über einen
 * konsoleH-Cronjob, der `/api/push/check` aufruft (Passenger legt den
 * Prozess schlafen, ein interner Scheduler wäre unzuverlässig). Genau
 * deshalb kann sie LAUTLOS aufhören: Der Cronjob wird beim Umzug
 * vergessen, das CRON_SECRET stimmt nicht mehr, der Pfad ändert sich –
 * und niemand merkt es, weil ausbleibende Mitteilungen genauso aussehen
 * wie «es gab nichts zu melden». Erst wochenlang später fällt auf, dass
 * die MHD-Erinnerung nie kam.
 *
 * Ein Zeitstempel des letzten erfolgreichen Laufs behebt das: Er steht in
 * `/api/health` und im Profil bei den Benachrichtigungen. Bleibt er alt,
 * sieht man es an der Stelle, an der man Mitteilungen ohnehin verwaltet.
 *
 * WARUM EINE TABELLE UND KEINE DATEI: Der Prozess startet bei jedem
 * Deployment neu, eine Variable im Speicher wäre danach leer und würde
 * einen Ausfall vortäuschen. Eine Datei wiederum liegt im Deployment-
 * Verzeichnis, das der Deploy-Vorgang ersetzt.
 *
 * WARUM `varchar` STATT `timestamp` FÜR DEN WERT: Die Tabelle soll auch
 * die nächsten Notizen aufnehmen können, ohne dass dafür eine Migration
 * nötig ist. Zeitstempel werden als ISO-Zeichenkette abgelegt.
 */
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { systemState } from "../drizzle/schema";

/** Bekannte Schlüssel – als Aufzählung, damit Tippfehler auffallen. */
export type StateKey = "lastPushCheck";

/**
 * Notiz schreiben. Schlägt fehl, ohne den Aufrufer scheitern zu lassen:
 * Der Push-Check darf nicht daran scheitern, dass das Protokollieren
 * seines Erfolgs nicht klappt.
 */
export async function setState(key: StateKey, value: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db
      .insert(systemState)
      .values({ stateKey: key, value })
      .onDuplicateKeyUpdate({ set: { value } });
  } catch (error) {
    console.error("[SystemState] Schreiben fehlgeschlagen:", error);
  }
}

/** Notiz lesen; `null`, wenn es sie (noch) nicht gibt. */
export async function getState(key: StateKey): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(systemState)
      .where(eq(systemState.stateKey, key))
      .limit(1);
    return rows[0]?.value ?? null;
  } catch (error) {
    console.error("[SystemState] Lesen fehlgeschlagen:", error);
    return null;
  }
}
