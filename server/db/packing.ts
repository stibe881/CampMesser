/**
 * Packlisten, Einträge und Vorlagen (#336).
 *
 * Aus `server/db.ts` herausgelöst, Verhalten unverändert. Der gemeinsame
 * Unterbau steht in `_shared.ts`.
 */
import {
  InsertPackItem,
  InsertPackList,
  InsertPackTemplateCustom,
  and,
  asc,
  desc,
  eq,
  getDb,
  inArray,
  isShareExpired,
  packFeedback,
  packItems,
  packLists,
  packTemplatesCustom,
  requireDb,
  tripLogs,
  tripMembers,
} from "./_shared";

// ── Packlisten ──
export async function getPackLists(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(packLists).where(eq(packLists.userId, userId));
}
export async function createPackList(data: InsertPackList) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(packLists).values(data);
  return result.insertId;
}
export async function getPackList(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(packLists)
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)))
    .limit(1);
  return rows[0];
}
/**
 * Zugriff auf eine Packliste: die eigene Liste ODER die Liste ist mit einer
 * Reise verknüpft, bei der das Konto eingeladenes Mitglied ist (der Trip
 * gehört dabei der Listen-Besitzerin/dem Listen-Besitzer – nur eigene Listen
 * lassen sich verknüpfen). Für eigene Listen verhält sich das exakt wie
 * getPackList(id, userId).
 */
export async function canAccessList(listId: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(packLists)
    .where(eq(packLists.id, listId))
    .limit(1);
  const list = rows[0];
  if (!list) return undefined;
  if (list.userId === userId) return list;
  const linked = await db
    .select({ id: tripLogs.id })
    .from(tripLogs)
    .innerJoin(
      tripMembers,
      and(eq(tripMembers.tripId, tripLogs.id), eq(tripMembers.userId, userId))
    )
    .where(
      and(eq(tripLogs.packListId, listId), eq(tripLogs.userId, list.userId))
    )
    .limit(1);
  return linked.length > 0 ? list : undefined;
}
/** Einzelnen Eintrag laden – für die Zugriffs-Prüfung über seine Liste. */
export async function getPackItem(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(packItems)
    .where(eq(packItems.id, id))
    .limit(1);
  return rows[0];
}
/**
 * Liste archivieren (archivedAt = jetzt) oder wieder aktivieren (null) –
 * die Einträge bleiben unangetastet erhalten (#194).
 */
/** Liste umbenennen (#406, Nutzermeldung): nur die eigene. */
export async function renamePackList(id: number, userId: number, name: string) {
  const db = requireDb(await getDb());
  await db
    .update(packLists)
    .set({ name })
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
}
export async function setPackListArchived(
  id: number,
  userId: number,
  archived: boolean
) {
  const db = requireDb(await getDb());
  await db
    .update(packLists)
    .set({ archivedAt: archived ? new Date() : null })
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
}
export async function deletePackList(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db.delete(packItems).where(eq(packItems.listId, id));
  await db
    .delete(packLists)
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
}
export async function getPackItems(listId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(packItems)
    .where(eq(packItems.listId, listId))
    .orderBy(asc(packItems.sortOrder), asc(packItems.id));
}
export async function addPackItems(items: InsertPackItem[]) {
  if (items.length === 0) return;
  const db = requireDb(await getDb());
  await db.insert(packItems).values(items);
}
/**
 * Haken setzen/lösen; updatedByUserId hält fest, WER es war («Zuletzt
 * geändert von» bei gemeinsamen Reisen) – null bei anonymen Änderungen
 * über den Teil-Link (löscht eine allfällige alte Zuordnung).
 */
export async function setPackItemChecked(
  id: number,
  checked: boolean,
  updatedByUserId: number | null
) {
  const db = requireDb(await getDb());
  await db
    .update(packItems)
    .set({ checked, updatedByUserId })
    .where(eq(packItems.id, id));
}
/** Alle Einträge einer Liste auf «ungepackt» zurücksetzen. */
export async function uncheckAllPackItems(listId: number) {
  const db = requireDb(await getDb());
  await db
    .update(packItems)
    .set({ checked: false })
    .where(eq(packItems.listId, listId));
}
/**
 * Eintrag anpassen: Personen-Zuordnung («Wer packt das?», null entfernt sie)
 * und/oder Kategorie. Nicht übergebene Felder bleiben unverändert;
 * updatedByUserId hält fest, wer die Änderung gemacht hat (Anzeige bei
 * gemeinsamen Reisen).
 */
export async function updatePackItem(
  id: number,
  data: {
    name?: string;
    quantity?: number;
    assignee?: string | null;
    category?: string;
    updatedByUserId?: number;
  }
) {
  if (
    data.name === undefined &&
    data.quantity === undefined &&
    data.assignee === undefined &&
    data.category === undefined
  )
    return;
  const db = requireDb(await getDb());
  await db.update(packItems).set(data).where(eq(packItems.id, id));
}
export async function deletePackItem(id: number) {
  const db = requireDb(await getDb());
  await db.delete(packItems).where(eq(packItems.id, id));
}
/** Neue Reihenfolge einer Liste speichern: sortOrder = Position 0..n. */
export async function reorderPackItems(listId: number, itemIds: number[]) {
  const db = requireDb(await getDb());
  await Promise.all(
    itemIds.map((id, idx) =>
      db
        .update(packItems)
        .set({ sortOrder: idx })
        .where(and(eq(packItems.id, id), eq(packItems.listId, listId)))
    )
  );
}
// ── Eigene Packlisten-Vorlagen ──
export async function getPackTemplates(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(packTemplatesCustom)
    .where(eq(packTemplatesCustom.userId, userId))
    .orderBy(desc(packTemplatesCustom.id));
}
export async function getPackTemplate(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(packTemplatesCustom)
    .where(
      and(
        eq(packTemplatesCustom.id, id),
        eq(packTemplatesCustom.userId, userId)
      )
    )
    .limit(1);
  return rows[0];
}
export async function createPackTemplate(data: InsertPackTemplateCustom) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(packTemplatesCustom).values(data);
  return result.insertId;
}
export async function deletePackTemplate(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(packTemplatesCustom)
    .where(
      and(
        eq(packTemplatesCustom.id, id),
        eq(packTemplatesCustom.userId, userId)
      )
    );
}
/** Teil-Token einer Vorlage setzen oder entfernen (nur für die eigene Vorlage). */
export async function setPackTemplateShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(packTemplatesCustom)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(
      and(
        eq(packTemplatesCustom.id, id),
        eq(packTemplatesCustom.userId, userId)
      )
    );
}
/** Geteilte Vorlage anhand des Tokens laden (öffentlich, ohne Login). */
export async function getPackTemplateByToken(token: string) {
  const db = requireDb(await getDb());
  const result = await db
    .select()
    .from(packTemplatesCustom)
    .where(eq(packTemplatesCustom.shareToken, token))
    .limit(1);
  const row = result[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}
/** Gewichts-Budget in Gramm setzen oder mit null entfernen (nur eigene Liste). */
export async function setPackListWeightBudget(
  id: number,
  userId: number,
  grams: number | null
) {
  const db = requireDb(await getDb());
  await db
    .update(packLists)
    .set({ weightBudgetGrams: grams })
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
}
/** Personen-Bereiche (JSON-Array von Namen) setzen; null entfernt sie. */
export async function setPackListPersons(
  id: number,
  userId: number,
  personsJson: string | null
) {
  const db = requireDb(await getDb());
  await db
    .update(packLists)
    .set({ personsJson })
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
}
/**
 * Zuordnungen entfernter Personen lösen: ihre Einträge wandern zurück in den
 * Bereich «Allgemein» (assignee null).
 */
export async function clearPackItemAssignees(
  listId: number,
  assignees: string[]
) {
  if (assignees.length === 0) return;
  const db = requireDb(await getDb());
  await db
    .update(packItems)
    .set({ assignee: null })
    .where(
      and(eq(packItems.listId, listId), inArray(packItems.assignee, assignees))
    );
}
/** Teil-Token setzen oder entfernen (nur für die eigene Liste). */
export async function setPackListShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(packLists)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
}
/** Geteilte Liste anhand des Tokens laden (öffentlich, ohne Login). */
export async function getPackListByToken(token: string) {
  const db = requireDb(await getDb());
  const result = await db
    .select()
    .from(packLists)
    .where(eq(packLists.shareToken, token))
    .limit(1);
  const row = result[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}

/**
 * Rückblick nach der Reise (#381): alle Rückmeldungen eines Kontos.
 *
 * Alle auf einmal, nicht je Reise: Die Auswertung braucht die GESCHICHTE
 * – «zweimal nicht gebraucht» lässt sich aus einer einzelnen Reise nicht
 * ablesen. Die Zeilen sind klein und je Reise eine Handvoll.
 */
export async function getPackFeedback(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select({
      tripId: packFeedback.tripId,
      kind: packFeedback.kind,
      name: packFeedback.name,
    })
    .from(packFeedback)
    .where(eq(packFeedback.userId, userId))
    .orderBy(asc(packFeedback.createdAt), asc(packFeedback.id));
}

/**
 * Den Rückblick EINER Reise ersetzen.
 *
 * Ersetzen und nicht ergänzen: Der Rückblick ist ein Formular, das man
 * auch korrigiert – wer ein Häkchen wieder wegnimmt, meint das auch so.
 * Andere Reisen bleiben unberührt.
 */
export async function savePackFeedback(
  userId: number,
  tripId: number,
  entries: { kind: "unused" | "missing"; name: string }[]
) {
  const db = requireDb(await getDb());
  await db
    .delete(packFeedback)
    .where(
      and(eq(packFeedback.userId, userId), eq(packFeedback.tripId, tripId))
    );
  if (entries.length === 0) return;
  await db
    .insert(packFeedback)
    .values(entries.map(entry => ({ userId, tripId, ...entry })));
}
