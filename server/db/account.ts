/**
 * Konto, Einstellungen, Notizen, Papierkorb und Verlauf (#336).
 *
 * Aus `server/db.ts` herausgelöst, Verhalten unverändert. Der gemeinsame
 * Unterbau steht in `_shared.ts`.
 */
import {
  ENV,
  HISTORY_LIMIT,
  InsertUser,
  InsertUserNote,
  and,
  deletedItems,
  desc,
  eq,
  getDb,
  inArray,
  passportAbsences,
  requireDb,
  tripChanges,
  tripLogs,
  userNotes,
  userSettings,
  users,
} from "./_shared";

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}
// ── Synchronisierte Einstellungen ──
export async function getUserSettings(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(userSettings).where(eq(userSettings.userId, userId));
}
export async function upsertUserSetting(
  userId: number,
  key: string,
  value: string
) {
  const db = requireDb(await getDb());
  await db
    .insert(userSettings)
    .values({ userId, key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}
/**
 * Notizen eines Kontos, zuletzt geänderte zuoberst. Die endgültige
 * Reihenfolge macht shared/notes.ts (sortNotes), damit sie testbar bleibt –
 * die Sortierung hier spart nur den Umweg über die volle Liste.
 */
export async function getUserNotes(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(userNotes)
    .where(eq(userNotes.userId, userId))
    .orderBy(desc(userNotes.updatedAt), desc(userNotes.id));
}
/** Einzelne Notiz eines Kontos (undefined = fremd oder nicht vorhanden). */
export async function getUserNote(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(userNotes)
    .where(and(eq(userNotes.id, id), eq(userNotes.userId, userId)))
    .limit(1);
  return rows[0];
}
export async function addUserNote(data: InsertUserNote) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(userNotes).values(data);
  return result.insertId;
}
/** Notiz ändern – die userId-Bedingung hält fremde Notizen unantastbar. */
export async function updateUserNote(
  id: number,
  userId: number,
  data: Partial<InsertUserNote>
) {
  const db = requireDb(await getDb());
  await db
    .update(userNotes)
    .set(data)
    .where(and(eq(userNotes.id, id), eq(userNotes.userId, userId)));
}
/**
 * Notiz über den Dateinamen ihres Fotos finden (#433) – die Auslieferung
 * prüft damit, dass die Datei wirklich dem Konto gehört.
 */
export async function getUserNoteByFileName(fileName: string, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(userNotes)
    .where(and(eq(userNotes.fileName, fileName), eq(userNotes.userId, userId)))
    .limit(1);
  return rows[0];
}
export async function deleteUserNote(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(userNotes)
    .where(and(eq(userNotes.id, id), eq(userNotes.userId, userId)));
}
/**
 * Reise über den Dateinamen ihrer Buchungsbestätigung finden (#279) –
 * die Auslieferung prüft damit, dass die Datei wirklich dem Konto gehört.
 */
export async function getTripLogByReservationFileName(
  fileName: string,
  userId: number
) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripLogs)
    .where(
      and(
        eq(tripLogs.reservationFileName, fileName),
        eq(tripLogs.userId, userId)
      )
    )
    .limit(1);
  return rows[0];
}
/**
 * Einträge im Papierkorb eines Kontos – OHNE den Schnappschuss.
 *
 * Der Payload einer Reise mit vielen Fotos wird schnell gross; die Liste
 * braucht ihn nicht, und ihn trotzdem an den Browser zu schicken wäre
 * verschwendete Bandbreite auf dem Campingplatz.
 */
export async function getTrashEntries(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select({
      id: deletedItems.id,
      kind: deletedItems.kind,
      label: deletedItems.label,
      detail: deletedItems.detail,
      itemCount: deletedItems.itemCount,
      deletedAt: deletedItems.deletedAt,
    })
    .from(deletedItems)
    .where(eq(deletedItems.userId, userId))
    .orderBy(desc(deletedItems.deletedAt));
}
/**
 * Eine Änderung festhalten und den Verlauf der Reise kürzen.
 *
 * DARF NIE DIE ÄNDERUNG SELBST VERHINDERN: Wenn das Protokollieren
 * scheitert, ist das ärgerlich – dass deshalb die Ausgabe nicht
 * gespeichert wird, wäre schlimmer. Deshalb schluckt der Aufrufer den
 * Fehler; hier wird nur sauber gearbeitet.
 */
export async function recordTripChange(entry: {
  tripId: number;
  userId: number;
  area: string;
  action: string;
  label?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const label = entry.label?.trim().replace(/\s+/g, " ") ?? null;
  await db.insert(tripChanges).values({
    tripId: entry.tripId,
    userId: entry.userId,
    area: entry.area,
    action: entry.action,
    label: label ? label.slice(0, 160) : null,
  });
  // Älteste kappen – wie beim Benachrichtigungs-Verlauf (#201)
  const stale = await db
    .select({ id: tripChanges.id })
    .from(tripChanges)
    .where(eq(tripChanges.tripId, entry.tripId))
    .orderBy(desc(tripChanges.at), desc(tripChanges.id))
    .limit(200)
    .offset(HISTORY_LIMIT);
  if (stale.length > 0) {
    await db.delete(tripChanges).where(
      inArray(
        tripChanges.id,
        stale.map(row => row.id)
      )
    );
  }
}
/** Der Verlauf einer Reise, jüngstes zuerst. */
export async function getTripChanges(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripChanges)
    .where(eq(tripChanges.tripId, tripId))
    .orderBy(desc(tripChanges.at), desc(tripChanges.id))
    .limit(HISTORY_LIMIT);
}
/** Alle Abwesenheiten des Kontos – eine Abfrage für die ganze Seite. */
export async function getPassportAbsences(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select({
      childId: passportAbsences.childId,
      tripId: passportAbsences.tripId,
    })
    .from(passportAbsences)
    .where(eq(passportAbsences.userId, userId));
}
/**
 * «War dabei» setzen oder aufheben.
 *
 * `present = true` löscht die Abwesenheit (der Normalfall braucht keine
 * Zeile), `present = false` legt sie an. Der eindeutige Index über
 * childId+tripId sorgt dafür, dass zweimaliges Antippen keine zweite
 * Zeile erzeugt – deshalb `ignore()` statt einer Vorab-Prüfung, die sich
 * zwei Geräte gegenseitig wegschnappen könnten.
 */
export async function setPassportPresence(
  userId: number,
  childId: number,
  tripId: number,
  present: boolean
) {
  const db = requireDb(await getDb());
  if (present) {
    await db
      .delete(passportAbsences)
      .where(
        and(
          eq(passportAbsences.userId, userId),
          eq(passportAbsences.childId, childId),
          eq(passportAbsences.tripId, tripId)
        )
      );
    return;
  }
  await db
    .insert(passportAbsences)
    .ignore()
    .values({ userId, childId, tripId });
}
