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
  campSpots,
  customQuizzes,
  customRecipes,
  deletedItems,
  desc,
  eq,
  getDb,
  hikeTracks,
  inArray,
  locationShares,
  packLists,
  packTemplatesCustom,
  passportAbsences,
  requireDb,
  shoppingLists,
  shoppingShares,
  tripChanges,
  tripLogs,
  userNotes,
  userSessions,
  userSettings,
  users,
} from "./_shared";
import type { ShareLinkEntry, ShareLinkKind } from "@shared/shareLinks";

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
// ── Angemeldete Geräte (#423) ──

/** Neue Anmeldung festhalten – die tokenId wandert als `sid` ins JWT. */
export async function createUserSession(data: {
  userId: number;
  tokenId: string;
  userAgent: string | null;
}) {
  const db = requireDb(await getDb());
  await db.insert(userSessions).values(data);
}

/** Anmeldung zur sid der Anfrage (undefined = beendet oder nie erfasst). */
export async function getUserSessionByTokenId(tokenId: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.tokenId, tokenId))
    .limit(1);
  return rows[0];
}

/** «Zuletzt aktiv» nachführen – der Aufrufer drosselt die Frequenz. */
export async function touchUserSession(tokenId: string) {
  const db = requireDb(await getDb());
  await db
    .update(userSessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(userSessions.tokenId, tokenId));
}

/** Alle Anmeldungen eines Kontos, jüngste Aktivität zuoberst. */
export async function listUserSessions(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(userSessions)
    .where(eq(userSessions.userId, userId))
    .orderBy(desc(userSessions.lastSeenAt), desc(userSessions.id));
}

/** Eine Anmeldung beenden – das zugehörige Cookie ist danach wertlos. */
export async function deleteUserSession(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(userSessions)
    .where(and(eq(userSessions.id, id), eq(userSessions.userId, userId)));
}

/** Beim Logout die eigene Zeile aufräumen. */
export async function deleteUserSessionByTokenId(tokenId: string) {
  const db = requireDb(await getDb());
  await db.delete(userSessions).where(eq(userSessions.tokenId, tokenId));
}

/**
 * Alle Anmeldungen eines Kontos beenden (Konto-Löschung, Passwort-Wechsel).
 * `exceptTokenId` lässt die aktuelle bestehen («überall sonst abmelden»).
 */
export async function deleteUserSessions(
  userId: number,
  exceptTokenId?: string | null
) {
  const db = requireDb(await getDb());
  const rows = await db
    .select({ id: userSessions.id, tokenId: userSessions.tokenId })
    .from(userSessions)
    .where(eq(userSessions.userId, userId));
  const ids = rows
    .filter(row => !exceptTokenId || row.tokenId !== exceptTokenId)
    .map(row => row.id);
  if (ids.length > 0) {
    await db.delete(userSessions).where(inArray(userSessions.id, ids));
  }
  return ids.length;
}

/**
 * Alle aktiven Teil-Links eines Kontos (#422): neun Tabellen, ein Bild.
 * Abgelaufene filtert der Aufrufer über shared/shareLinks.ts – die
 * Abfragen hier liefern schlicht alles mit gesetztem Token.
 */
export async function getShareLinkOverview(
  userId: number
): Promise<ShareLinkEntry[]> {
  const db = requireDb(await getDb());
  const iso = (value: Date | string | null) =>
    value === null ? null : new Date(value).toISOString();

  const [
    spots,
    lists,
    templates,
    trips,
    recipes,
    quizzes,
    shoppings,
    tracks,
    locations,
  ] = await Promise.all([
    db
      .select({
        id: campSpots.id,
        label: campSpots.name,
        token: campSpots.shareToken,
        expiresAt: campSpots.shareExpiresAt,
      })
      .from(campSpots)
      .where(eq(campSpots.userId, userId)),
    db
      .select({
        id: packLists.id,
        label: packLists.name,
        token: packLists.shareToken,
        expiresAt: packLists.shareExpiresAt,
      })
      .from(packLists)
      .where(eq(packLists.userId, userId)),
    db
      .select({
        id: packTemplatesCustom.id,
        label: packTemplatesCustom.name,
        token: packTemplatesCustom.shareToken,
        expiresAt: packTemplatesCustom.shareExpiresAt,
      })
      .from(packTemplatesCustom)
      .where(eq(packTemplatesCustom.userId, userId)),
    db
      .select({
        id: tripLogs.id,
        label: tripLogs.title,
        token: tripLogs.shareToken,
        expiresAt: tripLogs.shareExpiresAt,
      })
      .from(tripLogs)
      .where(eq(tripLogs.userId, userId)),
    db
      .select({
        id: customRecipes.id,
        label: customRecipes.name,
        token: customRecipes.shareToken,
        expiresAt: customRecipes.shareExpiresAt,
      })
      .from(customRecipes)
      .where(eq(customRecipes.userId, userId)),
    db
      .select({
        id: customQuizzes.id,
        label: customQuizzes.title,
        token: customQuizzes.shareToken,
        expiresAt: customQuizzes.shareExpiresAt,
      })
      .from(customQuizzes)
      .where(eq(customQuizzes.userId, userId)),
    db
      .select({
        id: shoppingShares.id,
        label: shoppingLists.name,
        token: shoppingShares.shareToken,
        expiresAt: shoppingShares.shareExpiresAt,
      })
      .from(shoppingShares)
      .leftJoin(shoppingLists, eq(shoppingShares.listId, shoppingLists.id))
      .where(eq(shoppingShares.userId, userId)),
    db
      .select({
        id: hikeTracks.id,
        label: hikeTracks.name,
        token: hikeTracks.shareToken,
        expiresAt: hikeTracks.shareExpiresAt,
      })
      .from(hikeTracks)
      .where(eq(hikeTracks.userId, userId)),
    db
      .select({
        id: locationShares.id,
        token: locationShares.shareToken,
        expiresAt: locationShares.shareExpiresAt,
      })
      .from(locationShares)
      .where(eq(locationShares.userId, userId)),
  ]);

  const collect = (
    kind: ShareLinkKind,
    rows: {
      id: number;
      label?: string | null;
      token: string | null;
      expiresAt: Date | string | null;
    }[]
  ): ShareLinkEntry[] =>
    rows
      .filter((row): row is typeof row & { token: string } =>
        Boolean(row.token)
      )
      .map(row => ({
        kind,
        id: row.id,
        label: row.label ?? null,
        token: row.token,
        expiresAt: iso(row.expiresAt),
      }));

  return [
    ...collect("spot", spots),
    ...collect("packList", lists),
    ...collect("packTemplate", templates),
    ...collect("trip", trips),
    ...collect("recipe", recipes),
    ...collect("quiz", quizzes),
    ...collect("shopping", shoppings),
    ...collect("track", tracks),
    ...collect("location", locations),
  ];
}

/**
 * Einen Teil-Link beenden (#422): Token (und Ablauf) löschen bzw. die
 * Teil-Zeile entfernen – dieselbe Wirkung wie der «Link deaktivieren»-
 * Knopf am jeweiligen Ort. Die userId-Bedingung hält Fremdes unantastbar.
 */
export async function revokeShareLink(
  kind: ShareLinkKind,
  id: number,
  userId: number
): Promise<void> {
  const db = requireDb(await getDb());
  const cleared = { shareToken: null, shareExpiresAt: null };
  switch (kind) {
    case "spot":
      await db
        .update(campSpots)
        .set(cleared)
        .where(and(eq(campSpots.id, id), eq(campSpots.userId, userId)));
      return;
    case "packList":
      await db
        .update(packLists)
        .set(cleared)
        .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
      return;
    case "packTemplate":
      await db
        .update(packTemplatesCustom)
        .set(cleared)
        .where(
          and(
            eq(packTemplatesCustom.id, id),
            eq(packTemplatesCustom.userId, userId)
          )
        );
      return;
    case "trip":
      await db
        .update(tripLogs)
        .set(cleared)
        .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
      return;
    case "recipe":
      await db
        .update(customRecipes)
        .set(cleared)
        .where(and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)));
      return;
    case "quiz":
      await db
        .update(customQuizzes)
        .set(cleared)
        .where(and(eq(customQuizzes.id, id), eq(customQuizzes.userId, userId)));
      return;
    case "shopping":
      await db
        .delete(shoppingShares)
        .where(
          and(eq(shoppingShares.id, id), eq(shoppingShares.userId, userId))
        );
      return;
    case "track":
      await db
        .update(hikeTracks)
        .set(cleared)
        .where(and(eq(hikeTracks.id, id), eq(hikeTracks.userId, userId)));
      return;
    case "location":
      await db
        .delete(locationShares)
        .where(
          and(eq(locationShares.id, id), eq(locationShares.userId, userId))
        );
      return;
  }
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
