/**
 * Papierkorb (#295), Serverseite: Schnappschuss nehmen, wiederherstellen,
 * endgültig aufräumen.
 *
 * ABLAUF BEIM LÖSCHEN: erst `capture()`, dann das gewohnte DELETE. Der
 * Schnappschuss liest die Zeilen, solange es sie noch gibt; das Löschen
 * selbst bleibt unverändert. Kein `deletedAt`-Feld, keine gefilterten
 * Abfragen – siehe shared/trash.ts für die Begründung.
 *
 * ABLAUF BEIM WIEDERHERSTELLEN: die Zeilen mit ihren ALTEN Ids einfügen.
 * Ein AUTO_INCREMENT vergibt eine verbrauchte Nummer nie erneut, die Id
 * ist also frei – und geteilte Links, QR-Codes und Verweise aus anderen
 * Tabellen zeigen nach der Rettung wieder auf dasselbe.
 *
 * DIE DATEIEN: Fotos werden beim Löschen NICHT entfernt. Ihre Namen
 * stehen im Eintrag; gelöscht werden sie erst beim endgültigen
 * Aufräumen.
 */
import { and, eq, inArray, lte } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import type { MySql2Database } from "drizzle-orm/mysql2";
import {
  campSpots,
  customRecipes,
  deletedItems,
  hikeTracks,
  menuDayNotes,
  menuEntries,
  packItems,
  packLists,
  spotPhotos,
  tripBoardNotes,
  tripChanges,
  tripDateOptions,
  tripDateVotes,
  tripExpenses,
  tripGuestbook,
  tripInvites,
  tripJournal,
  tripLogs,
  tripMembers,
  tripPhotos,
  tripShoppingItems,
  userNotes,
} from "../drizzle/schema";
import { trimLabel, type TrashKind } from "@shared/trash";
import { getDb } from "./db";

/** Eine Datei auf dem Webspace, die zum Eintrag gehört. */
export interface TrashFile {
  /** Schlüssel des Speichers – siehe STORAGES. */
  storage: string;
  fileName: string;
}

/** Der Schnappschuss: Zeilen nach Tabellenname gruppiert. */
export type TrashPayload = Record<string, Record<string, unknown>[]>;

type Db = MySql2Database<Record<string, never>>;

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  return db as unknown as Db;
}

/**
 * Tabellen des Schnappschusses. Der Schlüssel steht im JSON und darf sich
 * nicht mehr ändern – sonst lassen sich alte Einträge nicht mehr
 * wiederherstellen.
 */
const TABLES: Record<string, MySqlTable> = {
  tripLogs,
  tripPhotos,
  tripExpenses,
  tripBoardNotes,
  tripChanges,
  tripJournal,
  tripMembers,
  tripInvites,
  tripShoppingItems,
  tripDateOptions,
  tripDateVotes,
  tripGuestbook,
  menuEntries,
  menuDayNotes,
  packLists,
  packItems,
  campSpots,
  spotPhotos,
  userNotes,
  customRecipes,
  hikeTracks,
};

/** Vollständiger ISO-Zeitstempel, wie ihn JSON.stringify aus einem Date macht. */
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * Aus dem JSON wieder echte Werte machen.
 *
 * Zeitstempel sind im JSON Strings und müssen als Date zurück. Geprüft
 * wird BEIDES – der Spaltentyp UND die Form des Strings: Die
 * Datums-Spalten der App laufen teilweise im String-Modus («2026-07-01»),
 * die dürfen nicht zu Date-Objekten werden.
 */
export function reviveRow(
  table: MySqlTable,
  row: Record<string, unknown>
): Record<string, unknown> {
  const columns = getTableColumns(table) as Record<
    string,
    { dataType: string }
  >;
  const revived: Record<string, unknown> = {};
  Object.keys(row).forEach(key => {
    const value = row[key];
    const column = columns[key];
    if (
      column?.dataType === "date" &&
      typeof value === "string" &&
      ISO_TIMESTAMP.test(value)
    ) {
      revived[key] = new Date(value);
      return;
    }
    revived[key] = value;
  });
  return revived;
}

// ── Schnappschuss je Art ──────────────────────────────────────────────

interface Snapshot {
  payload: TrashPayload;
  files: TrashFile[];
  label: string;
  detail: string | null;
}

/** Wie viele Zeilen ohne die Hauptzeile im Schnappschuss stehen. */
function childCount(payload: TrashPayload, mainTable: string): number {
  return Object.keys(payload).reduce(
    (sum, name) => sum + (name === mainTable ? 0 : payload[name].length),
    0
  );
}

async function snapshotTrip(
  db: Db,
  id: number,
  userId: number
): Promise<Snapshot | null> {
  const trips = await db
    .select()
    .from(tripLogs)
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
  if (trips.length === 0) return null;
  const trip = trips[0];

  const photos = await db
    .select()
    .from(tripPhotos)
    .where(eq(tripPhotos.tripId, id));
  const options = await db
    .select()
    .from(tripDateOptions)
    .where(eq(tripDateOptions.tripId, id));
  const optionIds = options.map(option => option.id);

  const payload: TrashPayload = {
    tripLogs: trips,
    tripPhotos: photos,
    tripExpenses: await db
      .select()
      .from(tripExpenses)
      .where(eq(tripExpenses.tripId, id)),
    tripBoardNotes: await db
      .select()
      .from(tripBoardNotes)
      .where(eq(tripBoardNotes.tripId, id)),
    tripJournal: await db
      .select()
      .from(tripJournal)
      .where(eq(tripJournal.tripId, id)),
    tripMembers: await db
      .select()
      .from(tripMembers)
      .where(eq(tripMembers.tripId, id)),
    tripInvites: await db
      .select()
      .from(tripInvites)
      .where(eq(tripInvites.tripId, id)),
    tripShoppingItems: await db
      .select()
      .from(tripShoppingItems)
      .where(eq(tripShoppingItems.tripId, id)),
    tripDateOptions: options,
    tripDateVotes:
      optionIds.length > 0
        ? await db
            .select()
            .from(tripDateVotes)
            .where(inArray(tripDateVotes.optionId, optionIds))
        : [],
    tripGuestbook: await db
      .select()
      .from(tripGuestbook)
      .where(eq(tripGuestbook.tripId, id)),
    // Der Verlauf gehört zur Reise: Eine wiederhergestellte Reise ohne
    // ihre Vorgeschichte hätte eine Lücke genau dort, wo man nachschaut.
    tripChanges: await db
      .select()
      .from(tripChanges)
      .where(eq(tripChanges.tripId, id)),
    menuEntries: await db
      .select()
      .from(menuEntries)
      .where(eq(menuEntries.tripId, id)),
    menuDayNotes: await db
      .select()
      .from(menuDayNotes)
      .where(eq(menuDayNotes.tripId, id)),
  };

  const files: TrashFile[] = photos.map(photo => ({
    storage: "trips",
    fileName: photo.fileName,
  }));
  if (trip.reservationFileName) {
    files.push({ storage: "reservations", fileName: trip.reservationFileName });
  }

  return {
    payload,
    files,
    label: trimLabel(trip.title ?? trip.location ?? "", trip.startDate),
    detail: `${trip.startDate} – ${trip.endDate}`,
  };
}

async function snapshotPackList(
  db: Db,
  id: number,
  userId: number
): Promise<Snapshot | null> {
  const lists = await db
    .select()
    .from(packLists)
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
  if (lists.length === 0) return null;
  const items = await db
    .select()
    .from(packItems)
    .where(eq(packItems.listId, id));
  return {
    payload: { packLists: lists, packItems: items },
    files: [],
    label: trimLabel(lists[0].name, lists[0].scenario),
    detail: null,
  };
}

async function snapshotSpot(
  db: Db,
  id: number,
  userId: number
): Promise<Snapshot | null> {
  const spots = await db
    .select()
    .from(campSpots)
    .where(and(eq(campSpots.id, id), eq(campSpots.userId, userId)));
  if (spots.length === 0) return null;
  const photos = await db
    .select()
    .from(spotPhotos)
    .where(and(eq(spotPhotos.spotId, id), eq(spotPhotos.userId, userId)));
  return {
    payload: { campSpots: spots, spotPhotos: photos },
    files: photos.map(photo => ({
      storage: "spots",
      fileName: photo.fileName,
    })),
    label: trimLabel(spots[0].name, String(id)),
    detail: `${spots[0].latitude.toFixed(4)}, ${spots[0].longitude.toFixed(4)}`,
  };
}

async function snapshotNote(
  db: Db,
  id: number,
  userId: number
): Promise<Snapshot | null> {
  const notes = await db
    .select()
    .from(userNotes)
    .where(and(eq(userNotes.id, id), eq(userNotes.userId, userId)));
  if (notes.length === 0) return null;
  // Eine Notiz ohne Titel trägt ihren Text als Beschriftung
  return {
    payload: { userNotes: notes },
    files: [],
    label: trimLabel(notes[0].title || notes[0].text, String(id)),
    detail: null,
  };
}

async function snapshotRecipe(
  db: Db,
  id: number,
  userId: number
): Promise<Snapshot | null> {
  const recipes = await db
    .select()
    .from(customRecipes)
    .where(and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)));
  if (recipes.length === 0) return null;
  const recipe = recipes[0];
  return {
    payload: { customRecipes: recipes },
    files: recipe.imageFileName
      ? [{ storage: "recipes", fileName: recipe.imageFileName }]
      : [],
    label: trimLabel(recipe.name, String(id)),
    detail: null,
  };
}

async function snapshotTrack(
  db: Db,
  id: number,
  userId: number
): Promise<Snapshot | null> {
  const tracks = await db
    .select()
    .from(hikeTracks)
    .where(and(eq(hikeTracks.id, id), eq(hikeTracks.userId, userId)));
  if (tracks.length === 0) return null;
  const track = tracks[0];
  return {
    payload: { hikeTracks: tracks },
    files: [],
    label: trimLabel(track.name, String(id)),
    detail: `${(track.distanceM / 1000).toFixed(1)} km`,
  };
}

/** Welche Tabelle die Hauptzeile hält – für die Zählung der Kinder. */
const MAIN_TABLE: Record<TrashKind, string> = {
  trip: "tripLogs",
  packList: "packLists",
  spot: "campSpots",
  note: "userNotes",
  recipe: "customRecipes",
  track: "hikeTracks",
};

const SNAPSHOTS: Record<
  TrashKind,
  (db: Db, id: number, userId: number) => Promise<Snapshot | null>
> = {
  trip: snapshotTrip,
  packList: snapshotPackList,
  spot: snapshotSpot,
  note: snapshotNote,
  recipe: snapshotRecipe,
  track: snapshotTrack,
};

/**
 * Schnappschuss nehmen und in den Papierkorb legen. MUSS vor dem
 * eigentlichen Löschen laufen.
 *
 * Liefert die Id des Papierkorb-Eintrags, oder null, wenn es nichts zu
 * sichern gab (fremde oder bereits gelöschte Zeile). Ein Fehler beim
 * Sichern darf das Löschen nicht verhindern – der Aufrufer entscheidet.
 */
export async function capture(
  kind: TrashKind,
  id: number,
  userId: number
): Promise<number | null> {
  const db = await requireDb();
  const snapshot = await SNAPSHOTS[kind](db, id, userId);
  if (!snapshot) return null;
  const result = await db.insert(deletedItems).values({
    userId,
    kind,
    label: snapshot.label,
    detail: snapshot.detail,
    itemCount: childCount(snapshot.payload, MAIN_TABLE[kind]),
    payload: JSON.stringify(snapshot.payload),
    files: JSON.stringify(snapshot.files),
  });
  const insertId = (result as unknown as { insertId?: number }).insertId;
  return typeof insertId === "number" ? insertId : null;
}

// ── Wiederherstellen ──────────────────────────────────────────────────

function parsePayload(raw: string): TrashPayload {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const payload: TrashPayload = {};
    Object.entries(parsed as Record<string, unknown>).forEach(
      ([name, rows]) => {
        if (Array.isArray(rows)) {
          payload[name] = rows as Record<string, unknown>[];
        }
      }
    );
    return payload;
  } catch {
    return {};
  }
}

export function parseFiles(raw: string): TrashFile[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is TrashFile =>
        entry != null &&
        typeof entry === "object" &&
        typeof (entry as TrashFile).storage === "string" &&
        typeof (entry as TrashFile).fileName === "string"
    );
  } catch {
    return [];
  }
}

/**
 * Einen Eintrag wiederherstellen.
 *
 * Die Reihenfolge im Schnappschuss ist die Einfüge-Reihenfolge: Die
 * Hauptzeile steht zuerst, damit Kinder nie vor ihren Eltern entstehen.
 *
 * PRO TABELLE EINZELN eingefügt und Fehler geschluckt: Steht eine Zeile
 * schon wieder da – etwa weil jemand zwischenzeitlich denselben Eintrag
 * neu angelegt hat –, soll der Rest trotzdem zurückkommen. Eine halbe
 * Rettung ist besser als keine.
 */
export async function restore(
  trashId: number,
  userId: number
): Promise<{ restored: number } | null> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(deletedItems)
    .where(and(eq(deletedItems.id, trashId), eq(deletedItems.userId, userId)));
  if (rows.length === 0) return null;

  const payload = parsePayload(rows[0].payload);
  let restored = 0;
  for (const name of Object.keys(payload)) {
    const table = TABLES[name];
    if (!table) continue;
    for (const row of payload[name]) {
      try {
        await db.insert(table).values(reviveRow(table, row) as never);
        restored += 1;
      } catch {
        // Zeile schon vorhanden: der Rest kommt trotzdem zurück
      }
    }
  }

  await db.delete(deletedItems).where(eq(deletedItems.id, trashId));
  return { restored };
}

// ── Endgültig löschen ─────────────────────────────────────────────────

/** Dateien eines Eintrags vom Webspace entfernen. */
async function removeFiles(files: readonly TrashFile[]): Promise<void> {
  if (files.length === 0) return;
  const storages = await import("./photoStorage");
  const byStorage: Record<string, string[]> = {
    trips: [],
    spots: [],
    recipes: [],
    reservations: [],
  };
  files.forEach(file => {
    if (byStorage[file.storage]) byStorage[file.storage].push(file.fileName);
  });
  const targets: [string[], { deleteFiles(names: string[]): Promise<void> }][] =
    [
      [byStorage.trips, storages.tripPhotoStorage],
      [byStorage.spots, storages.spotPhotoStorage],
      [byStorage.recipes, storages.recipePhotoStorage],
      [byStorage.reservations, storages.reservationStorage],
    ];
  for (const [names, storage] of targets) {
    if (names.length > 0) await storage.deleteFiles(names);
  }
}

/** Einen Eintrag endgültig entfernen (samt Dateien). */
export async function purgeOne(
  trashId: number,
  userId: number
): Promise<boolean> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(deletedItems)
    .where(and(eq(deletedItems.id, trashId), eq(deletedItems.userId, userId)));
  if (rows.length === 0) return false;
  await removeFiles(parseFiles(rows[0].files));
  await db.delete(deletedItems).where(eq(deletedItems.id, trashId));
  return true;
}

/** Den ganzen Papierkorb eines Kontos leeren. */
export async function purgeAll(userId: number): Promise<number> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(deletedItems)
    .where(eq(deletedItems.userId, userId));
  for (const row of rows) await removeFiles(parseFiles(row.files));
  await db.delete(deletedItems).where(eq(deletedItems.userId, userId));
  return rows.length;
}

/**
 * Abgelaufene Einträge endgültig löschen – aufgerufen vom Cronjob und
 * zusätzlich bei jedem Öffnen des Papierkorbs.
 *
 * ZWEI AUSLÖSER MIT ABSICHT: Der Cronjob räumt den Speicher auf, auch
 * wenn niemand hinschaut. Der Aufruf beim Öffnen sorgt dafür, dass die
 * Liste stimmt, selbst wenn der Cronjob ausfällt – und ein Cronjob auf
 * einem Webhosting fällt aus.
 */
export async function purgeExpired(cutoff: Date): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const typed = db as unknown as Db;
  const rows = await typed
    .select()
    .from(deletedItems)
    .where(lte(deletedItems.deletedAt, cutoff));
  if (rows.length === 0) return 0;
  for (const row of rows) await removeFiles(parseFiles(row.files));
  await typed.delete(deletedItems).where(lte(deletedItems.deletedAt, cutoff));
  return rows.length;
}
