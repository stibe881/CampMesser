/**
 * Familien-Modus: Kinder, Abzeichen, Schatzsuche, Ämtli, Reisepass (#336).
 *
 * Aus `server/db.ts` herausgelöst, Verhalten unverändert. Der gemeinsame
 * Unterbau steht in `_shared.ts`.
 */
import {
  InsertCampChore,
  InsertChoreAssignment,
  InsertFamilyChild,
  InsertFamilyRedemption,
  InsertFamilyReward,
  InsertTreasureHunt,
  InsertTreasurePoint,
  and,
  asc,
  campChores,
  childBadges,
  childStats,
  choreAssignments,
  desc,
  eq,
  familyChildren,
  familyRedemptions,
  familyRewards,
  getDb,
  passportAbsences,
  requireDb,
  sql,
  treasureHunts,
  treasurePoints,
} from "./_shared";

// ── Familien-Modus: Kinder-Profile, Abzeichen & Zähler ──
export async function getFamilyChildren(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(familyChildren)
    .where(eq(familyChildren.userId, userId))
    .orderBy(asc(familyChildren.id));
}
/** Einzelnes Kind laden (nur eigenes). */
export async function getFamilyChild(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(familyChildren)
    .where(and(eq(familyChildren.id, id), eq(familyChildren.userId, userId)))
    .limit(1);
  return rows[0];
}
export async function addFamilyChild(data: InsertFamilyChild) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(familyChildren).values(data);
  return result.insertId;
}
/**
 * Punkte-Schalter einer Person setzen (#370): Wer mitverteilt wird, aber
 * nicht in der Rangliste stehen soll, steht auf `false`.
 */
export async function setFamilyChildEarnsPoints(
  id: number,
  userId: number,
  earnsPoints: boolean
) {
  const db = requireDb(await getDb());
  await db
    .update(familyChildren)
    .set({ earnsPoints })
    .where(and(eq(familyChildren.id, id), eq(familyChildren.userId, userId)));
}
/**
 * Familien-Schalter einer Person setzen: Wer nicht zur Familie zählt,
 * verhindert den Familien-Stempel nicht, wenn er fehlt.
 */
export async function setFamilyChildFamilyMember(
  id: number,
  userId: number,
  familyMember: boolean
) {
  const db = requireDb(await getDb());
  await db
    .update(familyChildren)
    .set({ familyMember })
    .where(and(eq(familyChildren.id, id), eq(familyChildren.userId, userId)));
}
export async function renameFamilyChild(
  id: number,
  userId: number,
  name: string
) {
  const db = requireDb(await getDb());
  await db
    .update(familyChildren)
    .set({ name })
    .where(and(eq(familyChildren.id, id), eq(familyChildren.userId, userId)));
}
/**
 * Kind löschen – Abzeichen, Zähler und Reisepass-Abwesenheiten gehen mit
 * (kein DB-FK, daher manuell).
 */
export async function deleteFamilyChild(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(childBadges)
    .where(and(eq(childBadges.childId, id), eq(childBadges.userId, userId)));
  await db
    .delete(childStats)
    .where(and(eq(childStats.childId, id), eq(childStats.userId, userId)));
  await db
    .delete(passportAbsences)
    .where(
      and(eq(passportAbsences.childId, id), eq(passportAbsences.userId, userId))
    );
  await db
    .delete(familyChildren)
    .where(and(eq(familyChildren.id, id), eq(familyChildren.userId, userId)));
}
export async function getChildBadges(userId: number, childId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(childBadges)
    .where(
      and(eq(childBadges.userId, userId), eq(childBadges.childId, childId))
    )
    .orderBy(asc(childBadges.id));
}
/**
 * Abzeichen vergeben – idempotent: der unique Index childId+badgeId macht
 * die zweite Vergabe zum No-op (earnedAt bleibt das Erst-Datum).
 */
export async function awardChildBadge(
  userId: number,
  childId: number,
  badgeId: string
) {
  const db = requireDb(await getDb());
  await db
    .insert(childBadges)
    .values({ userId, childId, badgeId })
    .onDuplicateKeyUpdate({ set: { badgeId } });
}
/**
 * Ereignis-Zähler eines Kindes atomar fortschreiben (eine Upsert-Anweisung:
 * Zähler inkrementieren, beste Serie per GREATEST) und den neuen Stand laden.
 */
export async function recordChildEvent(
  userId: number,
  childId: number,
  event: { hunt?: boolean; quiz?: boolean; streak?: number }
) {
  const db = requireDb(await getDb());
  const huntInc = event.hunt ? 1 : 0;
  const quizInc = event.quiz ? 1 : 0;
  const streak = Math.max(0, event.streak ?? 0);
  await db
    .insert(childStats)
    .values({
      userId,
      childId,
      huntsCompleted: huntInc,
      quizzesCompleted: quizInc,
      bestStreak: streak,
    })
    .onDuplicateKeyUpdate({
      set: {
        huntsCompleted: sql`${childStats.huntsCompleted} + ${huntInc}`,
        quizzesCompleted: sql`${childStats.quizzesCompleted} + ${quizInc}`,
        bestStreak: sql`GREATEST(${childStats.bestStreak}, ${streak})`,
      },
    });
  const rows = await db
    .select()
    .from(childStats)
    .where(and(eq(childStats.userId, userId), eq(childStats.childId, childId)))
    .limit(1);
  return rows[0];
}
export async function getTreasureHunts(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(treasureHunts)
    .where(eq(treasureHunts.userId, userId))
    .orderBy(desc(treasureHunts.id));
}
/** Eine Schatzsuche nur zurückgeben, wenn sie dem Konto gehört. */
export async function getTreasureHunt(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(treasureHunts)
    .where(and(eq(treasureHunts.id, id), eq(treasureHunts.userId, userId)))
    .limit(1);
  return rows[0];
}
export async function getTreasurePoints(huntId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(treasurePoints)
    .where(eq(treasurePoints.huntId, huntId))
    .orderBy(treasurePoints.sortIndex, treasurePoints.id);
}
export async function createTreasureHunt(data: InsertTreasureHunt) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(treasureHunts).values(data);
  return result.insertId;
}
export async function createTreasurePoint(data: InsertTreasurePoint) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(treasurePoints).values(data);
  return result.insertId;
}
/** Punkt als gefunden markieren oder wieder verstecken. */
export async function setTreasurePointFound(
  id: number,
  huntId: number,
  foundAt: Date | null
) {
  const db = requireDb(await getDb());
  await db
    .update(treasurePoints)
    .set({ foundAt })
    .where(and(eq(treasurePoints.id, id), eq(treasurePoints.huntId, huntId)));
}
/** Ganze Suche zurücksetzen – die Verstecke bleiben, der Spielstand geht. */
export async function resetTreasureHunt(huntId: number) {
  const db = requireDb(await getDb());
  await db
    .update(treasurePoints)
    .set({ foundAt: null })
    .where(eq(treasurePoints.huntId, huntId));
}
export async function deleteTreasurePoint(id: number, huntId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(treasurePoints)
    .where(and(eq(treasurePoints.id, id), eq(treasurePoints.huntId, huntId)));
}
export async function deleteTreasureHunt(id: number, userId: number) {
  const db = requireDb(await getDb());
  const hunt = await getTreasureHunt(id, userId);
  if (!hunt) return;
  await db.delete(treasurePoints).where(eq(treasurePoints.huntId, id));
  await db
    .delete(treasureHunts)
    .where(and(eq(treasureHunts.id, id), eq(treasureHunts.userId, userId)));
}
export async function getCampChores(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(campChores)
    .where(eq(campChores.userId, userId))
    .orderBy(asc(campChores.id));
}
export async function createCampChore(data: InsertCampChore) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(campChores).values(data);
  return result.insertId;
}
/** Wochentage eines Ämtli setzen (#447); null = jeden Tag. */
export async function setCampChoreWeekdays(
  id: number,
  userId: number,
  weekdaysJson: string | null
) {
  const db = requireDb(await getDb());
  await db
    .update(campChores)
    .set({ weekdaysJson })
    .where(and(eq(campChores.id, id), eq(campChores.userId, userId)));
}
/**
 * Ämtli löschen – samt seiner Zuteilungen. Ein Punktestand, der auf ein
 * nicht mehr existierendes Ämtli zeigt, wäre nicht nachvollziehbar.
 */
export async function deleteCampChore(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(choreAssignments)
    .where(
      and(eq(choreAssignments.choreId, id), eq(choreAssignments.userId, userId))
    );
  await db
    .delete(campChores)
    .where(and(eq(campChores.id, id), eq(campChores.userId, userId)));
}
export async function getChoreAssignments(userId: number, day?: string) {
  const db = requireDb(await getDb());
  const where = day
    ? and(eq(choreAssignments.userId, userId), eq(choreAssignments.day, day))
    : eq(choreAssignments.userId, userId);
  return db
    .select()
    .from(choreAssignments)
    .where(where)
    .orderBy(asc(choreAssignments.id));
}
export async function createChoreAssignment(data: InsertChoreAssignment) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(choreAssignments).values(data);
  return result.insertId;
}
export async function updateChoreAssignment(
  id: number,
  userId: number,
  data: Partial<Pick<InsertChoreAssignment, "childId" | "doneAt">>
) {
  const db = requireDb(await getDb());
  await db
    .update(choreAssignments)
    .set(data)
    .where(
      and(eq(choreAssignments.id, id), eq(choreAssignments.userId, userId))
    );
}
/** Alle Zuteilungen eines Tages löschen – Grundlage fürs Neuverteilen. */
export async function deleteChoreAssignmentsForDay(
  userId: number,
  day: string
) {
  const db = requireDb(await getDb());
  await db
    .delete(choreAssignments)
    .where(
      and(eq(choreAssignments.userId, userId), eq(choreAssignments.day, day))
    );
}

// ── Belohnungs-Ziele (#399) ──
export async function getFamilyRewards(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(familyRewards)
    .where(eq(familyRewards.userId, userId))
    .orderBy(asc(familyRewards.points), asc(familyRewards.id));
}
export async function addFamilyReward(data: InsertFamilyReward) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(familyRewards).values(data);
  return result.insertId;
}
export async function deleteFamilyReward(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(familyRewards)
    .where(and(eq(familyRewards.id, id), eq(familyRewards.userId, userId)));
}
/** Einlösungen, die Jüngste zuoberst – die Geschichte liest sich rückwärts. */
export async function getFamilyRedemptions(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(familyRedemptions)
    .where(eq(familyRedemptions.userId, userId))
    .orderBy(desc(familyRedemptions.id));
}
export async function addFamilyRedemption(data: InsertFamilyRedemption) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(familyRedemptions).values(data);
  return result.insertId;
}
