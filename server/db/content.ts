/**
 * Eigene Rezepte, Schatzsuchen und Quizze (#336).
 *
 * Aus `server/db.ts` herausgelöst, Verhalten unverändert. Der gemeinsame
 * Unterbau steht in `_shared.ts`.
 */
import {
  InsertCustomHunt,
  InsertCustomQuiz,
  InsertCustomRecipe,
  and,
  customHunts,
  customQuizzes,
  customRecipes,
  desc,
  eq,
  getDb,
  isShareExpired,
  requireDb,
} from "./_shared";

// ── Eigene Rezepte ──
export async function getCustomRecipes(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(customRecipes)
    .where(eq(customRecipes.userId, userId))
    .orderBy(desc(customRecipes.id));
}
/** Einzelnes eigenes Rezept (nur, wenn es der Person gehört). */
export async function getCustomRecipe(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(customRecipes)
    .where(and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)))
    .limit(1);
  return rows[0];
}
/** Teil-Token eines Rezepts setzen oder entfernen (nur fürs eigene Rezept). */
export async function setCustomRecipeShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(customRecipes)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)));
}
/** Geteiltes Rezept anhand des Tokens laden (öffentlich, ohne Login). */
export async function getCustomRecipeByToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(customRecipes)
    .where(eq(customRecipes.shareToken, token))
    .limit(1);
  const row = rows[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}
/** Eigenes Rezept über den Foto-Dateinamen (für die private Auslieferung). */
export async function getCustomRecipeByImageFileName(
  fileName: string,
  userId: number
) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(customRecipes)
    .where(
      and(
        eq(customRecipes.imageFileName, fileName),
        eq(customRecipes.userId, userId)
      )
    )
    .limit(1);
  return rows[0];
}
export async function addCustomRecipe(data: InsertCustomRecipe) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(customRecipes).values(data);
  return result.insertId;
}
export async function updateCustomRecipe(
  id: number,
  userId: number,
  data: Partial<Omit<InsertCustomRecipe, "id" | "userId">>
) {
  const db = requireDb(await getDb());
  await db
    .update(customRecipes)
    .set(data)
    .where(and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)));
}
export async function deleteCustomRecipe(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(customRecipes)
    .where(and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)));
}
// ── Eigene Schnitzeljagden ──
export async function getCustomHunts(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(customHunts)
    .where(eq(customHunts.userId, userId))
    .orderBy(desc(customHunts.id));
}
export async function addCustomHunt(data: InsertCustomHunt) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(customHunts).values(data);
  return result.insertId;
}
export async function updateCustomHunt(
  id: number,
  userId: number,
  data: Partial<Omit<InsertCustomHunt, "id" | "userId">>
) {
  const db = requireDb(await getDb());
  await db
    .update(customHunts)
    .set(data)
    .where(and(eq(customHunts.id, id), eq(customHunts.userId, userId)));
}
export async function deleteCustomHunt(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(customHunts)
    .where(and(eq(customHunts.id, id), eq(customHunts.userId, userId)));
}
// ── Eigene Quizze ──
export async function getCustomQuizzes(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(customQuizzes)
    .where(eq(customQuizzes.userId, userId))
    .orderBy(desc(customQuizzes.id));
}
export async function getCustomQuiz(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(customQuizzes)
    .where(and(eq(customQuizzes.id, id), eq(customQuizzes.userId, userId)))
    .limit(1);
  return rows[0];
}
export async function addCustomQuiz(data: InsertCustomQuiz) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(customQuizzes).values(data);
  return result.insertId;
}
/** Teil-Token eines Quiz setzen oder entfernen (nur fürs eigene Quiz). */
export async function setCustomQuizShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(customQuizzes)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(and(eq(customQuizzes.id, id), eq(customQuizzes.userId, userId)));
}
/** Geteiltes Quiz anhand des Tokens laden (öffentlich, ohne Login). */
export async function getCustomQuizByToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(customQuizzes)
    .where(eq(customQuizzes.shareToken, token))
    .limit(1);
  const row = rows[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}
export async function updateCustomQuiz(
  id: number,
  userId: number,
  data: Partial<Omit<InsertCustomQuiz, "id" | "userId">>
) {
  const db = requireDb(await getDb());
  await db
    .update(customQuizzes)
    .set(data)
    .where(and(eq(customQuizzes.id, id), eq(customQuizzes.userId, userId)));
}
export async function deleteCustomQuiz(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(customQuizzes)
    .where(and(eq(customQuizzes.id, id), eq(customQuizzes.userId, userId)));
}
