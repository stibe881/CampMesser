/**
 * Der Datenbank-Zugriff – nur noch das Inhaltsverzeichnis (#336).
 *
 * VORHER STAND HIER ALLES: 3518 Zeilen mit 271 exportierten Funktionen,
 * flach hintereinander. Dasselbe Muster wie `routers.ts` (#331) und
 * `Trips.tsx` (#322), und dieselbe Lösung: aufteilen, ohne am Verhalten
 * etwas zu ändern.
 *
 * DIESE DATEI BLEIBT DIE EINE ADRESSE. Alle Aufrufer schreiben
 * `import * as db from "./db"` und rufen `db.getPackLists(...)` – das
 * gilt unverändert weiter, weil hier alles wieder herausgereicht wird.
 * Wer eine Funktion sucht, findet sie über den Namen ihres Moduls; wer
 * bloss eine aufruft, merkt von der Aufteilung nichts.
 *
 * Der gemeinsame Unterbau (Verbindung, Drizzle-Operatoren, Schema,
 * Typen) steht in `db/_shared.ts`.
 */
export { getDb } from "./db/_shared";

export * from "./db/account";
export * from "./db/packing";
export * from "./db/gear";
export * from "./db/food";
export * from "./db/spots";
export * from "./db/trips";
export * from "./db/outdoor";
export * from "./db/content";
export * from "./db/family";
