/**
 * Reisen: Mitglieder, Fotos, Menüplan, Kasse, Pinnwand (#336).
 *
 * Aus `server/db.ts` herausgelöst, Verhalten unverändert. Der gemeinsame
 * Unterbau steht in `_shared.ts`.
 */
import {
  InsertMenuEntry,
  InsertTripBoardNote,
  InsertTripDateOption,
  InsertTripExpense,
  InsertTripGuestbookEntry,
  InsertTripLog,
  InsertTripPhoto,
  and,
  asc,
  campSpots,
  desc,
  eq,
  getTableColumns,
  getDb,
  inArray,
  isShareExpired,
  menuDayNotes,
  menuEntries,
  packItems,
  passportAbsences,
  requireDb,
  sql,
  tripBoardNotes,
  tripChanges,
  tripDateOptions,
  tripDateVotes,
  tripExpenses,
  tripStops,
  InsertTripStop,
  tripGuestbook,
  tripInvites,
  tripJournal,
  tripLogs,
  tripMembers,
  tripPhotos,
  tripShoppingItems,
  users,
} from "./_shared";

// ── Reise-Tagebuch ──
/**
 * Eigene Reisen, flach plus `spotName` des verknüpften Zeltplatzes. Der
 * Name muss aus der Datenbank mitkommen: Ohne ihn zeigte z. B. der
 * Kinder-Reisepass «Ohne Platzname», obwohl die Reise einen Platz hatte –
 * der Client kennt nur die spotId, nicht den Namen.
 */
export async function getTripLogs(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select({ ...getTableColumns(tripLogs), spotName: campSpots.name })
    .from(tripLogs)
    .leftJoin(campSpots, eq(campSpots.id, tripLogs.spotId))
    .where(eq(tripLogs.userId, userId))
    .orderBy(desc(tripLogs.startDate), desc(tripLogs.id));
}
export async function addTripLog(data: InsertTripLog) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(tripLogs).values(data);
  return result.insertId;
}
/**
 * Eintrag nachträglich bearbeiten (nur eigener). `weatherJson` wird vom
 * Router auf null gesetzt, wenn sich Ort oder Zeitraum ändern – das
 * Wetterarchiv holt sich die Seite dann automatisch neu.
 */
export async function updateTripLog(
  id: number,
  userId: number,
  data: Partial<
    Pick<
      InsertTripLog,
      | "spotId"
      | "packListId"
      | "reservationFileName"
      | "location"
      | "title"
      | "notes"
      | "startDate"
      | "endDate"
      | "rating"
      | "arrivalTime"
      | "departureTime"
      | "budgetRappen"
      | "pitchNumber"
      | "wifiName"
      | "wifiPassword"
      | "pitchNotes"
      | "weatherJson"
    >
  >
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set(data)
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
}
/** Einzelnen Tagebuch-/Trip-Eintrag laden (nur eigener). */
export async function getTripLog(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripLogs)
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)))
    .limit(1);
  return rows[0];
}
/**
 * Reise-Budget (#256) setzen oder mit null entfernen. Bewusst OHNE
 * Besitz-Filter: Die Reisekasse gehört allen Mitreisenden, also darf auch
 * die Grenze davon gemeinsam gepflegt werden. Die Berechtigung prüft der
 * Router mit canAccessTrip.
 */
/** Euro-Kurs der Reisekasse (#441) setzen; null entfernt ihn. */
export async function setTripEurRate(
  tripId: number,
  eurRateX10000: number | null
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set({ eurRateX10000 })
    .where(eq(tripLogs.id, tripId));
}

export async function setTripBudget(
  tripId: number,
  budgetRappen: number | null
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set({ budgetRappen })
    .where(eq(tripLogs.id, tripId));
}
/** Sterne-Bewertung (1–5) setzen oder mit null entfernen (nur eigener Eintrag). */
export async function setTripLogRating(
  id: number,
  userId: number,
  rating: number | null
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set({ rating })
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
}
/**
 * Aufenthalt archivieren bzw. hervorholen (Nutzerwunsch 09.08.2026,
 * Muster der Packlisten #194) – nur der eigene Eintrag: Mitglieder
 * räumen nicht die Liste der Besitzerin auf.
 */
export async function setTripLogArchived(
  id: number,
  userId: number,
  archived: boolean
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set({ archivedAt: archived ? new Date() : null })
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
}
/**
 * Wetterarchiv-JSON eines Tagebuch-Eintrags speichern (nur eigener Eintrag).
 * Wird vom Client einmalig nach der Heimkehr befüllt.
 */
export async function setTripLogWeather(
  id: number,
  userId: number,
  weatherJson: string
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set({ weatherJson })
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
}
/**
 * Titelbild eines Tagebuch-Eintrags setzen oder mit null entfernen (nur
 * eigener Eintrag). Ob das Foto zum Trip gehört, prüft der Router.
 */
export async function setTripLogCoverPhoto(
  id: number,
  userId: number,
  coverPhotoId: number | null
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set({ coverPhotoId })
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
}
/**
 * Titelbild-Verweis eines Trips löschen, falls er auf das gegebene Foto
 * zeigt – wird beim Löschen des Fotos aufgerufen, damit kein toter
 * coverPhotoId zurückbleibt.
 */
export async function clearTripLogCoverPhoto(
  tripId: number,
  userId: number,
  photoId: number
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set({ coverPhotoId: null })
    .where(
      and(
        eq(tripLogs.id, tripId),
        eq(tripLogs.userId, userId),
        eq(tripLogs.coverPhotoId, photoId)
      )
    );
}
export async function deleteTripLog(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripLogs)
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
  // Zugehörige Menüplan-Einträge mitlöschen (kein DB-FK, daher manuell) –
  // trip-weit, damit auch Einträge von Mitreisenden nicht verwaisen.
  // Der Router stellt vor dem Aufruf sicher, dass NUR die Besitzerin/der
  // Besitzer hier ankommt.
  await db.delete(menuEntries).where(eq(menuEntries.tripId, id));
  // Tages-Notizen des Menüplans hängen ebenfalls an der Reise
  await db.delete(menuDayNotes).where(eq(menuDayNotes.tripId, id));
  // Tages-Journal der Reise (#192) hängt wie die Notizen an der Reise
  await db.delete(tripJournal).where(eq(tripJournal.tripId, id));
  // Mitglieder und offene Einladungs-Links der Reise mit aufräumen
  await db.delete(tripMembers).where(eq(tripMembers.tripId, id));
  await db.delete(tripInvites).where(eq(tripInvites.tripId, id));
  // Gemeinsame Reise-Einkaufsliste hängt an der Reise – ebenfalls weg
  await db.delete(tripShoppingItems).where(eq(tripShoppingItems.tripId, id));
  // Termin-Finder (#253): Vorschläge samt Stimmen der Reise
  await deleteTripDateOptionsForTrip(id);
  // Gästebuch (#254) hängt ohne userId an der Reise
  await db.delete(tripGuestbook).where(eq(tripGuestbook.tripId, id));
  // Änderungsverlauf (#296) gehört zur Reise und geht mit ihr
  await db.delete(tripChanges).where(eq(tripChanges.tripId, id));
  // Reisepass: «war nicht dabei» ohne Reise ist gegenstandslos
  await db
    .delete(passportAbsences)
    .where(
      and(eq(passportAbsences.userId, userId), eq(passportAbsences.tripId, id))
    );
}
/** Trip ohne Besitz-Filter laden – nur intern für die Mitglieds-Prüfung. */
async function getTripLogById(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripLogs)
    .where(eq(tripLogs.id, id))
    .limit(1);
  return rows[0];
}
/** Mitglieds-Zeile eines Kontos für eine Reise (undefined = kein Mitglied). */
export async function getTripMembership(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)))
    .limit(1);
  return rows[0];
}
/**
 * Kern des Berechtigungs-Modells: liefert den Trip, wenn das Konto die
 * Besitzerin/der Besitzer ODER eingeladenes Mitglied ist – sonst undefined.
 * Für nicht geteilte Trips verhält sich das exakt wie getTripLog(id, userId).
 */
export async function canAccessTrip(tripId: number, userId: number) {
  const trip = await getTripLogById(tripId);
  if (!trip) return undefined;
  if (trip.userId === userId) return trip;
  const membership = await getTripMembership(tripId, userId);
  return membership ? trip : undefined;
}
/** Mitglied hinzufügen – idempotent (unique tripId+userId). */
export async function addTripMember(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .insert(tripMembers)
    .values({ tripId, userId, role: "member" })
    .onDuplicateKeyUpdate({ set: { role: "member" } });
}
export async function removeTripMember(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)));
}
/**
 * Reise-Ids mit mindestens einem eingeladenen Mitglied – für die
 * «geteilt»-Markierung in trips.list, ohne pro Reise einzeln abzufragen.
 */
export async function getSharedTripIds(tripIds: number[]) {
  if (tripIds.length === 0) return new Set<number>();
  const db = requireDb(await getDb());
  const rows = await db
    .selectDistinct({ tripId: tripMembers.tripId })
    .from(tripMembers)
    .where(inArray(tripMembers.tripId, tripIds));
  return new Set(rows.map(r => r.tripId));
}
/** Mitglieder einer Reise samt Anzeige-Daten (Name/E-Mail) der Konten. */
export async function getTripMembersWithUsers(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select({
      userId: tripMembers.userId,
      role: tripMembers.role,
      name: users.name,
      email: users.email,
    })
    .from(tripMembers)
    .leftJoin(users, eq(users.id, tripMembers.userId))
    .where(eq(tripMembers.tripId, tripId))
    .orderBy(asc(tripMembers.id));
}
/**
 * Anzeigenamen mehrerer Konten in EINER Abfrage (Name, sonst E-Mail,
 * sonst #id) – für «Zuletzt geändert von»-Anzeigen bei gemeinsamen Reisen.
 */
export async function getUserDisplayNames(ids: number[]) {
  const map = new Map<number, string>();
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) return map;
  const db = requireDb(await getDb());
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, unique));
  rows.forEach(r => map.set(r.id, r.name || r.email || `#${r.id}`));
  return map;
}
/**
 * Ist die Packliste mit einer GEMEINSAMEN Reise ihrer Besitzerin/ihres
 * Besitzers verknüpft (mind. 1 Mitglied)? Liefert die Trip-Id, sonst null –
 * eine Abfrage, damit packing.items das «Zuletzt geändert von»-Feld nur
 * für geteilte Listen auflösen muss.
 */
export async function getListSharedTripId(listId: number, ownerUserId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select({ tripId: tripLogs.id })
    .from(tripLogs)
    .innerJoin(tripMembers, eq(tripMembers.tripId, tripLogs.id))
    .where(
      and(eq(tripLogs.packListId, listId), eq(tripLogs.userId, ownerUserId))
    )
    .limit(1);
  return rows[0]?.tripId ?? null;
}
/** Konto-Zeile für Anzeige-Zwecke (Owner-Name in Mitglieder-Liste/Einladung). */
export async function getUserById(id: number) {
  const db = requireDb(await getDb());
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}
/**
 * Reisen, bei denen das Konto eingeladenes Mitglied ist – mit Owner-Name
 * und dem Namen des verknüpften Zeltplatzes (der gehört der Besitzerin/dem
 * Besitzer und wäre für Mitglieder sonst nicht auflösbar).
 */
export async function getMemberTripLogs(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select({
      trip: tripLogs,
      ownerName: users.name,
      ownerEmail: users.email,
      spotName: campSpots.name,
    })
    .from(tripMembers)
    .innerJoin(tripLogs, eq(tripMembers.tripId, tripLogs.id))
    .leftJoin(users, eq(users.id, tripLogs.userId))
    .leftJoin(campSpots, eq(campSpots.id, tripLogs.spotId))
    .where(eq(tripMembers.userId, userId))
    .orderBy(desc(tripLogs.startDate), desc(tripLogs.id));
}
/**
 * Gästebuch (#254): Einträge einer Reise, neuste zuoberst. Die Reihenfolge
 * steht schon hier fest, damit die geteilte Ansicht und die App dieselbe
 * Liste sehen. Nur NACH einer Zugriffs-Prüfung im Router verwenden
 * (canAccessTrip oder gültiger Teil-Token).
 */
export async function getTripGuestbook(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripGuestbook)
    .where(eq(tripGuestbook.tripId, tripId))
    .orderBy(desc(tripGuestbook.createdAt), desc(tripGuestbook.id));
}
/** Einzelnen Eintrag laden – für die Zugriffs-Prüfung über seine Reise. */
export async function getTripGuestbookEntry(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripGuestbook)
    .where(eq(tripGuestbook.id, id))
    .limit(1);
  return rows[0];
}
/** Eintrag anlegen – userId null bedeutet «Gast über den Teil-Link». */
export async function createTripGuestbookEntry(data: InsertTripGuestbookEntry) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(tripGuestbook).values(data);
  return result.insertId;
}
/** Eintrag löschen – nur NACH einer Berechtigungs-Prüfung im Router. */
export async function deleteTripGuestbookEntry(id: number) {
  const db = requireDb(await getDb());
  await db.delete(tripGuestbook).where(eq(tripGuestbook.id, id));
}
/**
 * Verweise auf ein gelöschtes Reise-Foto lösen: Der Gruss bleibt, das Bild
 * verschwindet – ein Eintrag ist mehr als sein Foto.
 */
export async function clearGuestbookPhoto(photoId: number) {
  const db = requireDb(await getDb());
  await db
    .update(tripGuestbook)
    .set({ photoId: null })
    .where(eq(tripGuestbook.photoId, photoId));
}
/**
 * Termin-Finder (#253): Vorschläge einer Reise, früheste zuerst. Sortiert
 * wird hier nach Datum und nicht nach Zustimmung – die Rangliste rechnet
 * `rankOptions` aus den Stimmen, die Datenbank kennt sie nicht.
 * Nur NACH einer canAccessTrip-Prüfung im Router verwenden.
 */
export async function getTripDateOptions(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripDateOptions)
    .where(eq(tripDateOptions.tripId, tripId))
    .orderBy(asc(tripDateOptions.startDate), asc(tripDateOptions.id));
}
/** Einzelnen Vorschlag laden – für die Zugriffs-Prüfung über seine Reise. */
export async function getTripDateOption(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripDateOptions)
    .where(eq(tripDateOptions.id, id))
    .limit(1);
  return rows[0];
}
/** Vorschlag anlegen – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function createTripDateOption(data: InsertTripDateOption) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(tripDateOptions).values(data);
  return result.insertId;
}
/**
 * Vorschlag löschen – die Stimmen dazu gehen mit, sonst bliebe eine
 * verwaiste Zeile pro Person zurück und der nächste Vorschlag mit
 * derselben Id (nach einem Restore) erbte fremde Antworten.
 */
export async function deleteTripDateOption(id: number) {
  const db = requireDb(await getDb());
  await db.delete(tripDateVotes).where(eq(tripDateVotes.optionId, id));
  await db.delete(tripDateOptions).where(eq(tripDateOptions.id, id));
}
/** Stimmen zu den Vorschlägen einer Reise. */
export async function getTripDateVotes(optionIds: number[]) {
  if (optionIds.length === 0) return [];
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripDateVotes)
    .where(inArray(tripDateVotes.optionId, optionIds));
}
/**
 * Abstimmen oder umstimmen: eine Zeile pro Vorschlag und Konto
 * (unique optionId+userId), ein zweiter Aufruf ersetzt die Antwort.
 */
export async function setTripDateVote(
  optionId: number,
  userId: number,
  vote: string
) {
  const db = requireDb(await getDb());
  await db
    .insert(tripDateVotes)
    .values({ optionId, userId, vote })
    .onDuplicateKeyUpdate({ set: { vote } });
}
/** Alle Vorschläge samt Stimmen einer Reise entfernen (Reise gelöscht). */
export async function deleteTripDateOptionsForTrip(tripId: number) {
  const db = requireDb(await getDb());
  const options = await db
    .select({ id: tripDateOptions.id })
    .from(tripDateOptions)
    .where(eq(tripDateOptions.tripId, tripId));
  const ids = options.map(option => option.id);
  if (ids.length > 0) {
    await db.delete(tripDateVotes).where(inArray(tripDateVotes.optionId, ids));
  }
  await db.delete(tripDateOptions).where(eq(tripDateOptions.tripId, tripId));
}
/** Aktiver Einladungs-Link einer Reise (undefined = keiner). */
export async function getTripInvite(tripId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripInvites)
    .where(eq(tripInvites.tripId, tripId))
    .limit(1);
  return rows[0];
}
/** Einladungs-Token setzen – ersetzt einen bestehenden Link (unique tripId). */
export async function upsertTripInvite(tripId: number, inviteToken: string) {
  const db = requireDb(await getDb());
  await db
    .insert(tripInvites)
    .values({ tripId, inviteToken })
    .onDuplicateKeyUpdate({ set: { inviteToken } });
}
export async function deleteTripInvite(tripId: number) {
  const db = requireDb(await getDb());
  await db.delete(tripInvites).where(eq(tripInvites.tripId, tripId));
}
/** Teil-Token des Reise-Hubs setzen oder entfernen (nur eigene Reise). */
export async function setTripLogShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
}
/** Geteilte Reise anhand des Hub-Tokens laden (öffentlich, ohne Login). */
export async function getTripLogByShareToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripLogs)
    .where(eq(tripLogs.shareToken, token))
    .limit(1);
  const row = rows[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}
/** Einladung anhand des Tokens laden (öffentlich, ohne Login). */
export async function getTripInviteByToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripInvites)
    .where(eq(tripInvites.inviteToken, token))
    .limit(1);
  const invite = rows[0];
  if (!invite) return undefined;
  const trip = await getTripLogById(invite.tripId);
  if (!trip) return undefined;
  return { invite, trip };
}
// ── Fotos im Reise-Tagebuch ──
export async function getTripPhotos(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripPhotos)
    .where(and(eq(tripPhotos.tripId, tripId), eq(tripPhotos.userId, userId)))
    .orderBy(tripPhotos.id);
}
export async function countTripPhotos(tripId: number, userId: number) {
  return (await getTripPhotos(tripId, userId)).length;
}
/**
 * Alle Fotos einer Reise – unabhängig davon, wer sie hochgeladen hat.
 * Nur NACH einer canAccessTrip-Prüfung im Router verwenden.
 */
export async function getTripPhotosForTrip(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripPhotos)
    .where(eq(tripPhotos.tripId, tripId))
    .orderBy(tripPhotos.id);
}
export async function countTripPhotosForTrip(tripId: number) {
  return (await getTripPhotosForTrip(tripId)).length;
}
/** Foto ohne Besitz-Filter – der Router prüft danach den Trip-Zugriff. */
export async function getTripPhotoById(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripPhotos)
    .where(eq(tripPhotos.id, id))
    .limit(1);
  return rows[0];
}
/** Foto per Dateiname ohne Besitz-Filter – Router prüft den Trip-Zugriff. */
export async function getTripPhotoByFileNameAny(fileName: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripPhotos)
    .where(eq(tripPhotos.fileName, fileName))
    .limit(1);
  return rows[0];
}
/** Foto-Zeile löschen – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function deleteTripPhotoById(id: number) {
  const db = requireDb(await getDb());
  // Gästebuch-Einträge (#254) verlieren nur das Bild, nicht den Text
  await clearGuestbookPhoto(id);
  await db.delete(tripPhotos).where(eq(tripPhotos.id, id));
}
/** Alle Foto-Zeilen einer Reise löschen (auch die von Mitreisenden). */
export async function deleteAllTripPhotosForTrip(tripId: number) {
  const db = requireDb(await getDb());
  await db.delete(tripPhotos).where(eq(tripPhotos.tripId, tripId));
}
export async function addTripPhoto(data: InsertTripPhoto) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(tripPhotos).values(data);
  return result.insertId;
}
/** Einzelnes Foto laden (nur eigenes). */
export async function getTripPhoto(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripPhotos)
    .where(and(eq(tripPhotos.id, id), eq(tripPhotos.userId, userId)))
    .limit(1);
  return rows[0];
}
/** Foto anhand des Dateinamens laden – nur für die Besitzerin/den Besitzer. */
export async function getTripPhotoByFileName(fileName: string, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripPhotos)
    .where(
      and(eq(tripPhotos.fileName, fileName), eq(tripPhotos.userId, userId))
    )
    .limit(1);
  return rows[0];
}
export async function deleteTripPhoto(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripPhotos)
    .where(and(eq(tripPhotos.id, id), eq(tripPhotos.userId, userId)));
}
/** Alle Foto-Zeilen eines Trips löschen (Dateien löscht der Aufrufer). */
export async function deleteTripPhotosForTrip(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripPhotos)
    .where(and(eq(tripPhotos.tripId, tripId), eq(tripPhotos.userId, userId)));
}
/**
 * Alle Menüplan-Einträge einer Reise – unabhängig davon, wer sie angelegt
 * hat. Nur NACH einer canAccessTrip-Prüfung im Router verwenden.
 */
export async function getMenuEntriesForTrip(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(menuEntries)
    .where(eq(menuEntries.tripId, tripId))
    .orderBy(menuEntries.day, menuEntries.id);
}
/** Slot einer Reise leeren – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function deleteMenuEntrySlot(
  tripId: number,
  day: string,
  meal: "breakfast" | "lunch" | "dinner" | "snack"
) {
  const db = requireDb(await getDb());
  await db
    .delete(menuEntries)
    .where(
      and(
        eq(menuEntries.tripId, tripId),
        eq(menuEntries.day, day),
        eq(menuEntries.meal, meal)
      )
    );
}
export async function getMenuEntries(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(menuEntries)
    .where(and(eq(menuEntries.tripId, tripId), eq(menuEntries.userId, userId)))
    .orderBy(menuEntries.day, menuEntries.id);
}
/** Eintrag pro Tag+Mahlzeit setzen oder ersetzen (Upsert über Unique-Index). */
export async function upsertMenuEntry(data: InsertMenuEntry) {
  const db = requireDb(await getDb());
  await db
    .insert(menuEntries)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        recipeId: data.recipeId ?? null,
        customRecipeId: data.customRecipeId ?? null,
        freeText: data.freeText ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
}
export async function deleteMenuEntry(
  tripId: number,
  userId: number,
  day: string,
  meal: "breakfast" | "lunch" | "dinner" | "snack"
) {
  const db = requireDb(await getDb());
  await db
    .delete(menuEntries)
    .where(
      and(
        eq(menuEntries.tripId, tripId),
        eq(menuEntries.userId, userId),
        eq(menuEntries.day, day),
        eq(menuEntries.meal, meal)
      )
    );
}
/**
 * Tages-Notizen einer Reise (aufsteigend nach Tag) – nur NACH einer
 * canAccessTrip-Prüfung im Router verwenden.
 */
export async function getMenuDayNotesForTrip(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(menuDayNotes)
    .where(eq(menuDayNotes.tripId, tripId))
    .orderBy(menuDayNotes.day);
}
/**
 * Tages-Notiz setzen oder ersetzen (Upsert über unique tripId+day) –
 * nur NACH einer canAccessTrip-Prüfung im Router verwenden.
 */
export async function upsertMenuDayNote(
  tripId: number,
  day: string,
  note: string
) {
  const db = requireDb(await getDb());
  await db
    .insert(menuDayNotes)
    .values({ tripId, day, note })
    .onDuplicateKeyUpdate({ set: { note } });
}
/** Tages-Notiz löschen – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function deleteMenuDayNote(tripId: number, day: string) {
  const db = requireDb(await getDb());
  await db
    .delete(menuDayNotes)
    .where(and(eq(menuDayNotes.tripId, tripId), eq(menuDayNotes.day, day)));
}
/**
 * Journal-Einträge einer Reise (aufsteigend nach Tag) – nur NACH einer
 * canAccessTrip-Prüfung im Router verwenden.
 */
export async function getTripJournal(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripJournal)
    .where(eq(tripJournal.tripId, tripId))
    .orderBy(tripJournal.day);
}
/**
 * Journal-Eintrag setzen oder ersetzen (Upsert über unique tripId+day) –
 * nur NACH einer canAccessTrip-Prüfung im Router verwenden. createdByUserId
 * hält fest, wer zuletzt geschrieben hat.
 */
export async function upsertTripJournalEntry(
  tripId: number,
  day: string,
  text: string,
  createdByUserId: number | null
) {
  const db = requireDb(await getDb());
  await db
    .insert(tripJournal)
    .values({ tripId, day, text, createdByUserId })
    .onDuplicateKeyUpdate({ set: { text, createdByUserId } });
}
/** Journal-Eintrag löschen – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function deleteTripJournalEntry(tripId: number, day: string) {
  const db = requireDb(await getDb());
  await db
    .delete(tripJournal)
    .where(and(eq(tripJournal.tripId, tripId), eq(tripJournal.day, day)));
}
/**
 * Einzelnen Journal-Eintrag laden (#590) – OHNE Berechtigungs-Prüfung;
 * der Aufrufer prüft canAccessTrip über die tripId des Ergebnisses.
 */
export async function getTripJournalEntryById(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripJournal)
    .where(eq(tripJournal.id, id))
    .limit(1);
  return rows[0];
}
/** Journal-Eintrag eines Tags laden – für das Foto-Aufräumen beim Löschen. */
export async function getTripJournalEntryByDay(tripId: number, day: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripJournal)
    .where(and(eq(tripJournal.tripId, tripId), eq(tripJournal.day, day)))
    .limit(1);
  return rows[0];
}
/** Journal-Eintrag über den Foto-Dateinamen finden (Auslieferung #590). */
export async function getTripJournalEntryByPhotoFileName(fileName: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripJournal)
    .where(eq(tripJournal.photoFileName, fileName))
    .limit(1);
  return rows[0];
}
/** Foto-Dateinamen am Journal-Eintrag setzen oder lösen (#590). */
export async function setTripJournalPhoto(id: number, fileName: string | null) {
  const db = requireDb(await getDb());
  await db
    .update(tripJournal)
    .set({ photoFileName: fileName })
    .where(eq(tripJournal.id, id));
}
/**
 * Ausgaben einer Reise, neuste zuoberst (Tag absteigend, bei gleichem Tag
 * die zuletzt erfasste zuerst) – nur NACH einer canAccessTrip-Prüfung im
 * Router verwenden.
 */
export async function getTripExpenses(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripExpenses)
    .where(eq(tripExpenses.tripId, tripId))
    .orderBy(desc(tripExpenses.day), desc(tripExpenses.id));
}
/**
 * Ausgaben mehrerer Reisen in EINER Abfrage (#257) – für die Statistik
 * über alle Reisen. Ohne Ids gibt es nichts zu holen; der Router
 * übergibt ausschliesslich Ids EIGENER Reisen.
 */
export async function getExpensesForTrips(tripIds: number[]) {
  if (tripIds.length === 0) return [];
  const db = requireDb(await getDb());
  return db
    .select({
      tripId: tripExpenses.tripId,
      amountRappen: tripExpenses.amountRappen,
      category: tripExpenses.category,
    })
    .from(tripExpenses)
    .where(inArray(tripExpenses.tripId, tripIds));
}
/**
 * Nur die SUMME je Reise (#345) – für das Zeichen am zugeklappten
 * Reisekassen-Abschnitt.
 *
 * WARUM NICHT `getExpensesForTrips` UND IM CLIENT ADDIEREN: Der Betrag
 * steht an jeder Reise der Liste, auch an zwanzig vergangenen. Dafür alle
 * Einzelposten über die Leitung zu schicken, um sie wegzuwerfen, wäre
 * Verschwendung – die Datenbank kann summieren.
 *
 * `sum()` liefert in MySQL DECIMAL, das der Treiber als Zeichenkette
 * zurückgibt; deshalb der Umweg über `Number`. Reisen ohne Ausgaben
 * kommen gar nicht vor – der Aufrufer liest fehlende Ids als 0.
 */
export async function getExpenseTotalsForTrips(tripIds: number[]) {
  if (tripIds.length === 0) return [];
  const db = requireDb(await getDb());
  // Nach Währung getrennt (#441) – der Aufrufer rechnet Euro zum Kurs
  // der Reise um; eine SQL-Summe über beide Währungen wäre Unsinn.
  const rows = await db
    .select({
      tripId: tripExpenses.tripId,
      currency: tripExpenses.currency,
      totalRappen: sql<string>`sum(${tripExpenses.amountRappen})`,
    })
    .from(tripExpenses)
    .where(inArray(tripExpenses.tripId, tripIds))
    .groupBy(tripExpenses.tripId, tripExpenses.currency);
  return rows.map(row => ({
    tripId: row.tripId,
    currency: row.currency,
    totalRappen: Number(row.totalRappen ?? 0),
  }));
}
/**
 * Zähler für die ZUGEKLAPPTEN Abschnitte einer Reise (#346).
 *
 * Eine Reise stapelt ein Dutzend zugeklappter Balken, und keiner verriet,
 * ob etwas drin ist – man klappte der Reihe nach auf. Die Zahlen dafür
 * gibt es nur, wenn sie jemand liefert, ohne dass der Abschnitt offen
 * ist.
 *
 * VIER ABFRAGEN, NICHT VIER PRO REISE: alles über `inArray` + `groupBy`.
 *
 * Die Pinnwand ist der Sonderfall: «offen» heisst «Aufgabe UND nicht
 * abgehakt», und was als Aufgabe gilt, entscheidet `normalizeTripBoardKind`
 * in shared/tripBoard.ts. Diese Regel in SQL nachzubauen hiesse, sie an
 * zwei Orten zu pflegen – deshalb kommen hier die rohen Zeilen (nur Art
 * und Haken, kein Text) und der Router zählt mit derselben Funktion wie
 * die Oberfläche.
 */
export async function getTripSectionCounts(tripIds: number[]) {
  if (tripIds.length === 0) {
    return { boardNotes: [], journal: [], guestbook: [], changes: [] };
  }
  const db = requireDb(await getDb());
  const countBy = async (table: typeof tripJournal | typeof tripGuestbook) => {
    const rows = await db
      .select({
        tripId: table.tripId,
        count: sql<string>`count(*)`,
      })
      .from(table)
      .where(inArray(table.tripId, tripIds))
      .groupBy(table.tripId);
    return rows.map(row => ({
      tripId: row.tripId,
      count: Number(row.count ?? 0),
    }));
  };
  const [boardNotes, journal, guestbook, changes] = await Promise.all([
    db
      .select({
        tripId: tripBoardNotes.tripId,
        kind: tripBoardNotes.kind,
        done: tripBoardNotes.done,
      })
      .from(tripBoardNotes)
      .where(inArray(tripBoardNotes.tripId, tripIds)),
    countBy(tripJournal),
    countBy(tripGuestbook),
    db
      .select({
        tripId: tripChanges.tripId,
        count: sql<string>`count(*)`,
      })
      .from(tripChanges)
      .where(inArray(tripChanges.tripId, tripIds))
      .groupBy(tripChanges.tripId)
      .then(rows =>
        rows.map(row => ({ tripId: row.tripId, count: Number(row.count ?? 0) }))
      ),
  ]);
  return { boardNotes, journal, guestbook, changes };
}
/**
 * Die Rohzahlen für die Bereitschafts-Karten (#362).
 *
 * Drei Abfragen für ALLE noch nicht abgeschlossenen Reisen statt drei je
 * Reise. Gezählt wird in SQL, bewertet wird im Browser
 * (`buildTripReadinessCounts` + `tripReadiness`) – dieselben Funktionen
 * wie beim aufgeklappten Abschnitt, damit zugeklappt und aufgeklappt
 * nicht auseinanderlaufen können.
 *
 * Die Packlisten werden über ihre LISTEN-Id gezählt, nicht über die
 * Reise: Zwei Reisen dürfen dieselbe Liste verwenden, und die Zeile in
 * `packItems` weiss nichts von einer Reise.
 */
export async function getTripReadinessRaw(
  trips: { id: number; packListId: number | null }[]
) {
  const tripIds = trips.map(trip => trip.id);
  const listIds = Array.from(
    new Set(
      trips
        .map(trip => trip.packListId)
        .filter((id): id is number => id !== null)
    )
  );
  if (tripIds.length === 0) {
    return { packLists: [], menuSlots: [], shopping: [] };
  }
  const db = requireDb(await getDb());
  const [packRows, menuSlots, shoppingRows] = await Promise.all([
    listIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            listId: packItems.listId,
            total: sql<string>`count(*)`,
            checked: sql<string>`sum(case when ${packItems.checked} then 1 else 0 end)`,
          })
          .from(packItems)
          .where(inArray(packItems.listId, listIds))
          .groupBy(packItems.listId),
    db
      .select({
        tripId: menuEntries.tripId,
        day: menuEntries.day,
        meal: menuEntries.meal,
      })
      .from(menuEntries)
      .where(inArray(menuEntries.tripId, tripIds)),
    db
      .select({
        tripId: tripShoppingItems.tripId,
        total: sql<string>`count(*)`,
        open: sql<string>`sum(case when ${tripShoppingItems.checked} then 0 else 1 end)`,
      })
      .from(tripShoppingItems)
      .where(inArray(tripShoppingItems.tripId, tripIds))
      .groupBy(tripShoppingItems.tripId),
  ]);
  return {
    packLists: packRows.map(row => ({
      listId: row.listId,
      checked: Number(row.checked ?? 0),
      total: Number(row.total ?? 0),
    })),
    menuSlots,
    shopping: shoppingRows.map(row => ({
      tripId: row.tripId,
      open: Number(row.open ?? 0),
      total: Number(row.total ?? 0),
    })),
  };
}
/**
 * Der geschriebene Inhalt einer Reise – für die globale Suche (#349).
 *
 * Die Suche kannte Packlisten, Plätze, Inventar, Kisten, Kühlbox, Reisen
 * und freie Notizen, aber nicht den Text IN einer Reise: Tages-Journal,
 * Pinnwand, Gästebuch. «Wo habe ich notiert, dass der Platz keinen Strom
 * hat?» blieb unbeantwortet, obwohl es dasteht.
 *
 * Drei Abfragen für alle Reisen zusammen. Geholt wird nur, was gesucht
 * und angezeigt wird – kein `select *`.
 */
export async function getTripTexts(tripIds: number[]) {
  if (tripIds.length === 0) return { journal: [], board: [], guestbook: [] };
  const db = requireDb(await getDb());
  const [journal, board, guestbook] = await Promise.all([
    db
      .select({
        id: tripJournal.id,
        tripId: tripJournal.tripId,
        day: tripJournal.day,
        text: tripJournal.text,
      })
      .from(tripJournal)
      .where(inArray(tripJournal.tripId, tripIds)),
    db
      .select({
        id: tripBoardNotes.id,
        tripId: tripBoardNotes.tripId,
        text: tripBoardNotes.text,
        done: tripBoardNotes.done,
      })
      .from(tripBoardNotes)
      .where(inArray(tripBoardNotes.tripId, tripIds)),
    db
      .select({
        id: tripGuestbook.id,
        tripId: tripGuestbook.tripId,
        authorName: tripGuestbook.authorName,
        text: tripGuestbook.message,
      })
      .from(tripGuestbook)
      .where(inArray(tripGuestbook.tripId, tripIds)),
  ]);
  return { journal, board, guestbook };
}
/** Einzelne Ausgabe laden (für die Zugriffsprüfung über ihre tripId). */
export async function getTripExpenseById(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripExpenses)
    .where(eq(tripExpenses.id, id))
    .limit(1);
  return rows[0];
}
/**
 * Ausgabe über ihren Beleg-Dateinamen finden (#540) – die Auslieferung
 * des Fotos prüft den Zugriff danach über canAccessTrip.
 */
export async function getTripExpenseByPhotoFileName(fileName: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripExpenses)
    .where(eq(tripExpenses.photoFileName, fileName))
    .limit(1);
  return rows[0];
}
/** Ausgabe erfassen – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function addTripExpense(data: InsertTripExpense) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(tripExpenses).values(data);
  return result.insertId;
}
/** Ausgabe ändern – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function updateTripExpense(
  id: number,
  data: Partial<InsertTripExpense>
) {
  const db = requireDb(await getDb());
  await db.update(tripExpenses).set(data).where(eq(tripExpenses.id, id));
}
/** Ausgabe löschen – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function deleteTripExpense(id: number) {
  const db = requireDb(await getDb());
  await db.delete(tripExpenses).where(eq(tripExpenses.id, id));
}
/** Alle Ausgaben einer Reise entfernen (beim Löschen der Reise). */
export async function deleteAllTripExpensesForTrip(tripId: number) {
  const db = requireDb(await getDb());
  await db.delete(tripExpenses).where(eq(tripExpenses.tripId, tripId));
}
/**
 * Zettel einer Reise, neuste zuoberst – nur NACH einer canAccessTrip-Prüfung
 * im Router verwenden. Die endgültige Reihenfolge (erledigte Aufgaben ans
 * Ende) macht shared/tripBoard.ts, damit sie testbar bleibt.
 */
export async function getTripBoardNotes(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripBoardNotes)
    .where(eq(tripBoardNotes.tripId, tripId))
    .orderBy(desc(tripBoardNotes.createdAt), desc(tripBoardNotes.id));
}
/** Einzelnen Zettel laden (für die Zugriffsprüfung über seine tripId). */
export async function getTripBoardNoteById(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripBoardNotes)
    .where(eq(tripBoardNotes.id, id))
    .limit(1);
  return rows[0];
}
/** Zettel anpinnen – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function addTripBoardNote(data: InsertTripBoardNote) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(tripBoardNotes).values(data);
  return result.insertId;
}
/** Zettel ändern (Text oder Abhak-Zustand) – nur nach canAccessTrip. */
export async function updateTripBoardNote(
  id: number,
  data: Partial<InsertTripBoardNote>
) {
  const db = requireDb(await getDb());
  await db.update(tripBoardNotes).set(data).where(eq(tripBoardNotes.id, id));
}
/** Zettel löschen – nur NACH der Rechteprüfung im Router. */
export async function deleteTripBoardNote(id: number) {
  const db = requireDb(await getDb());
  await db.delete(tripBoardNotes).where(eq(tripBoardNotes.id, id));
}
/** Ganze Pinnwand einer Reise entfernen (beim Löschen der Reise). */
export async function deleteAllTripBoardNotesForTrip(tripId: number) {
  const db = requireDb(await getDb());
  await db.delete(tripBoardNotes).where(eq(tripBoardNotes.tripId, tripId));
}

/**
 * Kalender-Abo (#377): Schlüssel des Kontos holen bzw. erzeugen.
 *
 * ER ENTSTEHT ERST BEI BEDARF – wer das Abo nie benutzt, hat auch keinen
 * Schlüssel, den jemand erraten könnte.
 */
export async function getOrCreateCalendarToken(
  userId: number,
  makeToken: () => string
): Promise<string> {
  const db = requireDb(await getDb());
  const rows = await db
    .select({ token: users.calendarToken })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const existing = rows[0]?.token;
  if (existing) return existing;
  const token = makeToken();
  await db
    .update(users)
    .set({ calendarToken: token })
    .where(eq(users.id, userId));
  return token;
}

/**
 * Neuen Schlüssel setzen – macht jeden weitergegebenen Link sofort
 * wertlos. Das ist der einzige Weg zurück, wenn eine Adresse in falsche
 * Hände geraten ist.
 */
export async function resetCalendarToken(
  userId: number,
  makeToken: () => string
): Promise<string> {
  const db = requireDb(await getDb());
  const token = makeToken();
  await db
    .update(users)
    .set({ calendarToken: token })
    .where(eq(users.id, userId));
  return token;
}

/** Konto zu einem Kalender-Schlüssel (null = kein solches Abo). */
export async function getUserByCalendarToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.calendarToken, token))
    .limit(1);
  return rows[0] ?? null;
}

// ── Etappen (#536) ──
/** Etappen einer Reise, Anreise zuerst – nur NACH canAccessTrip im Router. */
export async function getTripStops(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripStops)
    .where(eq(tripStops.tripId, tripId))
    .orderBy(asc(tripStops.startDate), asc(tripStops.id));
}
/**
 * Etappen MEHRERER Reisen auf einmal (#556, Kalender-Abo): eine Abfrage
 * statt einer je Reise – der Feed baut alle Reisen eines Kontos zusammen.
 */
export async function getTripStopsForTrips(tripIds: number[]) {
  if (tripIds.length === 0) return [];
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripStops)
    .where(inArray(tripStops.tripId, tripIds))
    .orderBy(asc(tripStops.startDate), asc(tripStops.id));
}
/** Einzelne Etappe laden (für die Zugriffsprüfung über ihre tripId). */
export async function getTripStopById(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripStops)
    .where(eq(tripStops.id, id))
    .limit(1);
  return rows[0];
}
export async function addTripStop(data: InsertTripStop) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(tripStops).values(data);
  return result.insertId;
}
export async function updateTripStop(
  id: number,
  data: Partial<InsertTripStop>
) {
  const db = requireDb(await getDb());
  await db.update(tripStops).set(data).where(eq(tripStops.id, id));
}
export async function deleteTripStop(id: number) {
  const db = requireDb(await getDb());
  await db.delete(tripStops).where(eq(tripStops.id, id));
}
/** Alle Etappen einer Reise entfernen (beim Löschen der Reise). */
export async function deleteAllTripStopsForTrip(tripId: number) {
  const db = requireDb(await getDb());
  await db.delete(tripStops).where(eq(tripStops.tripId, tripId));
}
