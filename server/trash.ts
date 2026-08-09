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
import { and, eq, inArray, isNull, lte } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import type { MySql2Database } from "drizzle-orm/mysql2";
import {
  campSpots,
  customRecipes,
  deletedItems,
  hikeTracks,
  inventoryItems,
  menuDayNotes,
  menuEntries,
  packItems,
  packLists,
  passportAbsences,
  savedPlaces,
  shoppingItems,
  shoppingLists,
  shoppingShares,
  spotPhotos,
  storageBoxes,
  tripBoardNotes,
  tripChanges,
  tripDateOptions,
  tripDateVotes,
  tripExpenses,
  tripStops,
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
  tripStops,
  tripBoardNotes,
  tripChanges,
  tripJournal,
  passportAbsences,
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
  savedPlaces,
  userNotes,
  customRecipes,
  hikeTracks,
  storageBoxes,
  inventoryItems,
  shoppingLists,
  shoppingItems,
  shoppingShares,
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

  const expenses = await db
    .select()
    .from(tripExpenses)
    .where(eq(tripExpenses.tripId, id));
  // Journal separat gehalten: die Tages-Fotos (#590) müssen mit in die
  // Datei-Liste, damit sie den Papierkorb überleben und mit ihm fallen.
  const journal = await db
    .select()
    .from(tripJournal)
    .where(eq(tripJournal.tripId, id));

  const payload: TrashPayload = {
    tripLogs: trips,
    tripPhotos: photos,
    tripExpenses: expenses,
    tripBoardNotes: await db
      .select()
      .from(tripBoardNotes)
      .where(eq(tripBoardNotes.tripId, id)),
    // Etappen (#536) gehören zur Reise
    tripStops: await db
      .select()
      .from(tripStops)
      .where(eq(tripStops.tripId, id)),
    tripJournal: journal,
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
    // Wer NICHT dabei war (#292): Ohne diese Zeilen bekäme nach einer
    // Wiederherstellung jedes Kind den Stempel, auch das, das damals bei
    // den Grosseltern geblieben ist.
    passportAbsences: await db
      .select()
      .from(passportAbsences)
      .where(eq(passportAbsences.tripId, id)),
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
  // Belege der Reisekasse (#540) überleben den Papierkorb wie die Zeilen
  expenses.forEach(expense => {
    if (expense.photoFileName) {
      files.push({ storage: "expenses", fileName: expense.photoFileName });
    }
  });
  // Tages-Fotos des Journals (#590) ebenso
  journal.forEach(entry => {
    if (entry.photoFileName) {
      files.push({ storage: "journal", fileName: entry.photoFileName });
    }
  });

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

/**
 * Merkorte (#613): eine Zeile plus höchstens ein Foto (#589) – seit dem
 * Foto ist «aus Versehen gelöscht» kein Ein-Klick-Schaden mehr.
 */
async function snapshotSavedPlace(
  db: Db,
  id: number,
  userId: number
): Promise<Snapshot | null> {
  const places = await db
    .select()
    .from(savedPlaces)
    .where(and(eq(savedPlaces.id, id), eq(savedPlaces.userId, userId)));
  if (places.length === 0) return null;
  return {
    payload: { savedPlaces: places },
    files: places[0].photoFileName
      ? [{ storage: "places", fileName: places[0].photoFileName }]
      : [],
    label: trimLabel(places[0].name, String(id)),
    detail: `${places[0].latitude.toFixed(4)}, ${places[0].longitude.toFixed(4)}`,
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
    // Das Foto der Notiz (#433) überlebt den Papierkorb wie die Zeile
    files: notes[0].fileName
      ? [{ storage: "notes", fileName: notes[0].fileName }]
      : [],
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

/**
 * Kiste (#318).
 *
 * BESONDERHEIT: `deleteStorageBox` löscht die Gegenstände NICHT mit,
 * sondern setzt bei ihnen `boxId = null` – sie bleiben also bestehen und
 * liegen nur nirgends mehr. Ein Schnappschuss der Gegenstände würde beim
 * Wiederherstellen an der bereits vergebenen Id scheitern (und der
 * Fehler würde still geschluckt). Gesichert werden deshalb nur ihre Ids;
 * `reassignBoxItems` hängt sie nach dem Einfügen der Kiste wieder ein.
 * Ohne das käme die Kiste leer zurück – und «wiederhergestellt» wäre
 * eine grosszügige Beschreibung dafür.
 */
const BOX_ITEMS_KEY = "__boxItemIds";

async function snapshotBox(
  db: Db,
  id: number,
  userId: number
): Promise<Snapshot | null> {
  const boxes = await db
    .select()
    .from(storageBoxes)
    .where(and(eq(storageBoxes.id, id), eq(storageBoxes.userId, userId)));
  if (boxes.length === 0) return null;
  const box = boxes[0];
  const items = await db
    .select({ id: inventoryItems.id })
    .from(inventoryItems)
    .where(
      and(eq(inventoryItems.boxId, id), eq(inventoryItems.userId, userId))
    );
  return {
    payload: { storageBoxes: boxes, [BOX_ITEMS_KEY]: items },
    files: [],
    label: trimLabel(`${box.code} · ${box.name}`, String(id)),
    // Die Anzahl steht bereits als itemCount in der Zeile – `childCount`
    // zählt die Ids aus BOX_ITEMS_KEY mit. Ein zweites Mal wäre doppelt.
    detail: box.location,
  };
}

/** Ausrüstungs-Gegenstand mit Foto und Beleg. */
async function snapshotGear(
  db: Db,
  id: number,
  userId: number
): Promise<Snapshot | null> {
  const items = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)));
  if (items.length === 0) return null;
  const item = items[0];
  const files: TrashFile[] = [];
  if (item.imageFileName)
    files.push({ storage: "inventory", fileName: item.imageFileName });
  if (item.receiptFileName)
    files.push({ storage: "receipts", fileName: item.receiptFileName });
  return {
    payload: { inventoryItems: items },
    files,
    label: trimLabel(item.name, String(id)),
    detail: item.category || null,
  };
}

/** Einkaufsliste samt Einträgen und Teil-Links. */
async function snapshotShoppingList(
  db: Db,
  id: number,
  userId: number
): Promise<Snapshot | null> {
  const lists = await db
    .select()
    .from(shoppingLists)
    .where(and(eq(shoppingLists.id, id), eq(shoppingLists.userId, userId)));
  if (lists.length === 0) return null;
  return {
    payload: {
      shoppingLists: lists,
      shoppingItems: await db
        .select()
        .from(shoppingItems)
        .where(
          and(eq(shoppingItems.listId, id), eq(shoppingItems.userId, userId))
        ),
      // Der Teil-Link gehört dazu: Wer eine Liste zurückholt, will nicht,
      // dass der bereits verschickte Link ins Leere zeigt.
      shoppingShares: await db
        .select()
        .from(shoppingShares)
        .where(
          and(eq(shoppingShares.listId, id), eq(shoppingShares.userId, userId))
        ),
    },
    files: [],
    label: trimLabel(lists[0].name, String(id)),
    detail: null,
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
  box: "storageBoxes",
  gear: "inventoryItems",
  shoppingList: "shoppingLists",
  savedPlace: "savedPlaces",
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
  box: snapshotBox,
  gear: snapshotGear,
  shoppingList: snapshotShoppingList,
  savedPlace: snapshotSavedPlace,
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

  // Nachbehandlung je Art (#318): siehe reassignBoxItems.
  if (rows[0].kind === "box") {
    restored += await reassignBoxItems(db, payload, userId);
  }

  await db.delete(deletedItems).where(eq(deletedItems.id, trashId));
  return { restored };
}

/**
 * Nach dem Zurückholen einer Kiste die Gegenstände wieder einräumen.
 *
 * NUR WAS NOCH HERRENLOS IST: Gesetzt wird `boxId` ausschliesslich bei
 * Gegenständen, die aktuell in KEINER Kiste liegen. Wer einen Topf nach
 * dem Löschen der Kiste in eine andere gelegt hat, soll ihn dort behalten
 * – die Wiederherstellung darf nichts wegnehmen, was seither entschieden
 * wurde.
 */
async function reassignBoxItems(
  db: Db,
  payload: TrashPayload,
  userId: number
): Promise<number> {
  const boxRow = payload.storageBoxes?.[0] as { id?: number } | undefined;
  const boxId = boxRow?.id;
  const ids = (payload[BOX_ITEMS_KEY] ?? [])
    .map(row => (row as { id?: number }).id)
    .filter((id): id is number => typeof id === "number");
  if (typeof boxId !== "number" || ids.length === 0) return 0;
  const result = await db
    .update(inventoryItems)
    .set({ boxId })
    .where(
      and(
        inArray(inventoryItems.id, ids),
        eq(inventoryItems.userId, userId),
        isNull(inventoryItems.boxId)
      )
    );
  const affected = (result as unknown as { affectedRows?: number })
    .affectedRows;
  return typeof affected === "number" ? affected : 0;
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
    // Ab #318: Foto und Beleg eines Ausrüstungs-Gegenstands.
    inventory: [],
    receipts: [],
    // Ab #433: das Foto einer freien Notiz.
    notes: [],
    // Ab #540: die Belege der Reisekasse.
    expenses: [],
    // Ab #590: die Tages-Fotos des Journals.
    journal: [],
    // Ab #613: das Foto eines Merkorts.
    places: [],
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
      [byStorage.inventory, storages.inventoryPhotoStorage],
      [byStorage.receipts, storages.receiptPhotoStorage],
      [byStorage.notes, storages.notePhotoStorage],
      [byStorage.expenses, storages.expensePhotoStorage],
      [byStorage.journal, storages.journalPhotoStorage],
      [byStorage.places, storages.placePhotoStorage],
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
