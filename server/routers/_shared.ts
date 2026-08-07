/**
 * Der gemeinsame Unterbau aller Router-Module (#331).
 *
 * WARUM ES DIESE DATEI GIBT: `server/routers.ts` war 6959 Zeilen lang und
 * hielt 37 Router. Wer eine Prozedur suchte, scrollte; wer eine änderte,
 * las die Nachbarschaft nicht mit. Dasselbe Problem hatte `Trips.tsx`
 * (#322), und es wurde auf dieselbe Weise gelöst: aufteilen, ohne etwas
 * am Verhalten zu ändern.
 *
 * WAS HIER STEHT: alles, was MEHRERE Module brauchen – die tRPC-Bausteine,
 * der Datenbank-Zugriff, die Zod-Schemata und die Hilfsfunktionen. Die
 * Datei ist bewusst kein Sammelbecken: Was nur ein Modul braucht, gehört
 * in dieses Modul.
 *
 * Der Inhalt ist unverändert aus `routers.ts` übernommen; die relativen
 * Pfade sind eine Ebene tiefer gerückt (`./db` → `../db`).
 */
import { COOKIE_NAME } from "@shared/const";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  LOCATION_SHARE_EXPIRY_HOURS,
  locationShareExpiry,
  SHARE_EXPIRY_DAYS,
  shareExpiryFromDays,
  type ShareExpiryDays,
} from "@shared/sharing";
import { ONE_YEAR_MS } from "@shared/const";
import {
  packScenarios,
  parseCustomTemplateItems,
  type CustomTemplateItem,
} from "@shared/packTemplates";
import {
  MAX_PERSON_NAME_LENGTH,
  MAX_PERSONS,
  normalizePersons,
  parsePersons,
  serializePersons,
} from "@shared/packPersons";
import { LANGUAGES, l4, pick, type Language } from "@shared/i18n";
import {
  SETTING_VALUE_MAX_LENGTH,
  SYNCED_SETTING_KEYS,
} from "@shared/settings";
import { MAX_STATIONS, solutionWordFromStations } from "@shared/hunts";
import { selectVisiblePasses } from "@shared/iss";
import { nearestWaterStation, waterTrend } from "@shared/bathingWater";
import { isBadgeId } from "@shared/badges";
import {
  MAX_QUIZ_OPTIONS,
  MAX_QUIZ_QUESTIONS,
  MIN_QUIZ_OPTIONS,
  parseQuizQuestions,
} from "@shared/quizzes";
import {
  expiryDateFromDays,
  MAX_EXPIRY_DAYS,
  MAX_FOOD_ITEM_NAME_LENGTH,
  MAX_FOOD_ITEM_QUANTITY_LENGTH,
  MAX_FOOD_TEMPLATE_ITEMS,
  parseFoodTemplateItems,
} from "@shared/foodTemplates";
import {
  shoppingBooking,
  MAX_SHOPPING_PRICE_RAPPEN,
} from "@shared/shoppingPrices";
import {
  FOOD_CATEGORIES,
  FOOD_STORAGES,
  FOOD_UNITS,
  DEFAULT_FOOD_STORAGE,
  normalizeFoodStorage,
  type FoodStorage,
} from "@shared/food";
import {
  BUDGET_MAX_RAPPEN,
  expenseStats,
  EXPENSE_CATEGORIES,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_MAX_RAPPEN,
  EXPENSE_PAID_BY_MAX_LENGTH,
} from "@shared/expenses";
import {
  TRIP_BOARD_KINDS,
  TRIP_BOARD_TEXT_MAX_LENGTH,
  canRemoveTripBoardEntry,
  normalizeTripBoardKind,
  normalizeTripBoardText,
  sortTripBoardEntries,
} from "@shared/tripBoard";
export { buildTripSectionCounts } from "@shared/tripSectionCounts";
export { buildTripReadinessCounts } from "@shared/tripReadinessCounts";
export { boardAlertText, tripJoinAlertText } from "@shared/pushTexts";
export { cleanFeedbackName, MAX_MISSING_PER_TRIP } from "@shared/packFeedback";
export { tripDisplayName } from "@shared/tripName";
export { notifyUsers } from "../push";
export {
  parseSpotTariffs,
  serializeSpotTariffs,
  TARIFFS_JSON_MAX_LENGTH,
} from "@shared/spotTariffs";
export {
  parsePitchSketch,
  serializePitchSketch,
  PITCH_SKETCH_JSON_MAX_LENGTH,
} from "@shared/pitchSketch";
export {
  parseNextTimeNotes,
  serializeNextTimeNotes,
  NEXT_TIME_JSON_MAX_LENGTH,
} from "@shared/nextTime";
import {
  NOTE_TAG_MAX_LENGTH,
  NOTE_TEXT_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  normalizeNoteText,
  normalizeNoteTitle,
  serializeNoteTags,
  sortNotes,
} from "@shared/notes";
import { RETENTION_DAYS, visibleTrash } from "@shared/trash";
import {
  bundleChanges,
  type ChangeAction,
  type ChangeArea,
} from "@shared/tripHistory";
import { MEALS, remapMenuDays } from "@shared/menuPlan";
import {
  MAX_GEAR_INTERVAL_MONTHS,
  MAX_GEAR_TASK_TITLE_LENGTH,
  MIN_GEAR_INTERVAL_MONTHS,
} from "@shared/gearTasks";
import { FISH_MAX_LENGTH_CM, FISH_MAX_WEIGHT_KG } from "@shared/fishing";
import { MAX_WARRANTY_MONTHS, MIN_WARRANTY_MONTHS } from "@shared/warranty";
import { MAX_LENT_TO_LENGTH } from "@shared/lending";
import {
  TRIP_WEATHER_MAX_PRECIP_MM,
  TRIP_WEATHER_MAX_RAIN_DAYS,
  TRIP_WEATHER_TEMP_MAX,
  TRIP_WEATHER_TEMP_MIN,
} from "@shared/tripWeather";
import { TRIP_JOURNAL_MAX_LENGTH } from "@shared/trips";
import {
  isDuplicateOption,
  isValidOptionRange,
  MAX_DATE_OPTIONS,
  MAX_OPTION_NOTE_LENGTH,
  VOTE_VALUES,
} from "@shared/datePoll";
import {
  isValidGuestbookMessage,
  MAX_GUEST_NAME_LENGTH,
  MAX_GUESTBOOK_MESSAGE_LENGTH,
  normalizeGuestbookMessage,
  normalizeGuestName,
} from "@shared/guestbook";
import {
  MAX_TRACK_POINTS,
  parseTrackPoints,
  serializeTrackPoints,
  thinTrackPoints,
  TRACK_NAME_MAX_LENGTH,
  trackStats,
  type TrackPoint,
} from "@shared/track";
import {
  MAX_ROUTE_SAMPLES,
  MAX_ROUTE_WAYPOINTS,
  ROUTE_NAME_MAX_LENGTH,
  hikingMinutes,
  routeDistanceM,
  routeElevation,
  routeSamples,
  serializeWaypoints,
  type RouteWaypoint,
} from "@shared/routePlan";
import { MAX_ROUTE_PATH_POINTS, routeLengthM } from "@shared/routing";
import {
  templateEndDate,
  templateListName,
  templateMenuPlan,
  tripTemplateById,
} from "@shared/tripTemplates";
import {
  MAX_TICK_BODY_PART_LENGTH,
  MAX_TICK_NOTE_LENGTH,
} from "@shared/tickBites";
import {
  DEFAULT_SHOPPING_LIST_NAME,
  isShoppingCategoryValue,
  MAX_SHOPPING_CATEGORY_LENGTH,
  MAX_SHOPPING_LIST_NAME_LENGTH,
} from "@shared/shopping";
import {
  MAX_BOX_CODE_LENGTH,
  MAX_BOX_NAME_LENGTH,
  normalizeBoxCode,
} from "@shared/boxes";
import {
  MAX_HUNT_NAME_LENGTH,
  MAX_POINT_HINT_LENGTH,
  MAX_POINT_NAME_LENGTH,
  MAX_TREASURE_POINTS,
  nextSortIndex,
  normalizeHuntName,
} from "@shared/treasureHunt";
import {
  clampPoints,
  MAX_CHORES,
  MAX_CHORE_TITLE_LENGTH,
  rotateAssignments,
  scoreboard,
} from "@shared/chores";
import {
  MAX_REWARDS,
  REWARD_TITLE_MAX_LENGTH,
  availablePoints,
  clampRewardPoints,
} from "@shared/rewards";
import { MAX_PACK_SUGGESTIONS, packSuggestions } from "@shared/packHistory";
import { MAX_STARS, clampStars } from "@shared/spotRatings";
import {
  parseSpotAttributes,
  SPOT_ATTRIBUTES_JSON_MAX_LENGTH,
} from "@shared/spotAttributes";
import { SPOT_PRICE_MAX_RAPPEN } from "@shared/spotCosts";
import {
  normalizeDifficulty,
  normalizeMethod,
  parseStringList,
  RECIPE_DIFFICULTIES,
  RECIPE_METHODS,
} from "@shared/customRecipes";
import {
  RAIN_THRESHOLD_MAX_MM,
  RAIN_THRESHOLD_MIN_MM,
  WIND_THRESHOLD_MAX_KMH,
  WIND_THRESHOLD_MIN_KMH,
} from "@shared/weather";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "../_core/cookies";
import { ENV } from "../_core/env";
import { systemRouter } from "../_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

/** ISO-Datum (YYYY-MM-DD) als Eingabe-Muster. */
export const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Platz-Eigenschaften validieren: über den defensiven Parser laufen lassen
 * und normalisiert ablegen – ohne gültige Attribute wird null gespeichert.
 * undefined (Feld nicht angefasst) wird unverändert durchgereicht.
 */
export function normalizeSpotAttributesJson(
  raw: string | null | undefined
): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  const attrs = parseSpotAttributes(raw);
  return Object.keys(attrs).length > 0 ? JSON.stringify(attrs) : null;
}

/** Eingabe-Format eigener Quizze: 1–30 Fragen mit je 2–4 Optionen. */
/**
 * Gültigkeitsdauer eines Teil-Links: 7/30/90 Tage oder weggelassen/null für
 * «unbegrenzt». Wird von allen share-Prozeduren gleich entgegengenommen.
 */
export const shareExpiryInput = z
  .union([
    z.literal(SHARE_EXPIRY_DAYS[0]),
    z.literal(SHARE_EXPIRY_DAYS[1]),
    z.literal(SHARE_EXPIRY_DAYS[2]),
  ])
  .nullish();

/**
 * Höhe über Meer eines Zeltplatzes in Metern. Die Spanne deckt vom Toten Meer
 * bis ins Hochgebirge alles ab; weggelassen/null heisst «nicht bekannt».
 */
export const SPOT_ELEVATION_INPUT = z
  .number()
  .int()
  .min(-500)
  .max(9000)
  .nullish();

/**
 * Platzkosten (#243): Preis pro Nacht bzw. Kurtaxe/Nebenkosten pro Nacht als
 * Ganzzahl in RAPPEN (Muster Reisekasse). null löscht den Wert, `undefined`
 * lässt ihn unverändert; die Obergrenze fängt Tippfehler ab.
 */
export const SPOT_PRICE_INPUT = z
  .number()
  .int()
  .min(0)
  .max(SPOT_PRICE_MAX_RAPPEN)
  .nullish();

/**
 * Ablauf-Zeitpunkt aus der gewünschten Dauer. Wichtig: `undefined` heisst
 * «Gültigkeit unverändert lassen» (der Aufrufer hat gar nichts gewählt, z. B.
 * weil er nur den bestehenden Link nochmals anzeigt), `null` heisst
 * ausdrücklich «unbegrenzt».
 */
export function shareExpiryFor(
  days: ShareExpiryDays | null | undefined,
  current: Date | null = null
): Date | null {
  return days === undefined ? current : shareExpiryFromDays(days);
}

export const customQuizInput = z.object({
  title: z.string().min(1).max(140),
  questions: z
    .array(
      z
        .object({
          question: z.string().min(1).max(500),
          options: z
            .array(z.string().min(1).max(200))
            .min(MIN_QUIZ_OPTIONS)
            .max(MAX_QUIZ_OPTIONS),
          correctIndex: z.number().int().min(0),
          explanation: z.string().max(1000).optional(),
        })
        .refine(q => q.correctIndex < q.options.length, {
          message: "correctIndex liegt ausserhalb der Optionen.",
        })
    )
    .min(1)
    .max(MAX_QUIZ_QUESTIONS),
});

/** Fragen normalisiert (getrimmt, leere Erklärung entfernt) als JSON ablegen. */
export function serializeQuizQuestions(
  questions: z.infer<typeof customQuizInput>["questions"]
): string {
  return JSON.stringify(
    questions.map(q => ({
      question: q.question.trim(),
      options: q.options.map(o => o.trim()),
      correctIndex: q.correctIndex,
      explanation: q.explanation?.trim() || undefined,
    }))
  );
}

/**
 * Ein Fang im Fangbuch (#236). Die Grenzen sind absichtlich weit: der
 * Datensatz in shared/fishing.ts prüft Mindestmass und Schonzeit fachlich,
 * die Eingabe hier nur formal (kein negatives Mass, kein Roman als Notiz).
 */
export const fishCatchInput = z.object({
  /** Id einer Art aus FISH_SPECIES; null = frei erfasst */
  speciesId: z.string().max(60).nullish(),
  speciesName: z.string().trim().min(1).max(120),
  lengthCm: z.number().min(0).max(FISH_MAX_LENGTH_CM).nullish(),
  weightKg: z.number().min(0).max(FISH_MAX_WEIGHT_KG).nullish(),
  water: z.string().trim().min(1).max(120),
  caughtAt: z.string().regex(ISO_DAY),
  /** Uhrzeit «HH:MM» in 24-Stunden-Schreibweise */
  caughtTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullish(),
  method: z.string().max(120).nullish(),
  released: z.boolean(),
  note: z.string().max(500).nullish(),
});

/** Eingabe auf Spaltenwerte abbilden (leere Freitexte werden zu null). */
export function fishCatchValues(input: z.infer<typeof fishCatchInput>) {
  return {
    speciesId: input.speciesId?.trim() || null,
    speciesName: input.speciesName.trim(),
    lengthCm: input.lengthCm ?? null,
    weightKg: input.weightKg ?? null,
    water: input.water.trim(),
    caughtAt: input.caughtAt,
    caughtTime: input.caughtTime || null,
    method: input.method?.trim() || null,
    released: input.released,
    note: input.note?.trim() || null,
  };
}

/**
 * Absolute Basis-URL für Links in E-Mails: bevorzugt APP_URL, sonst
 * Request-Host, sonst Produktions-Domain (Muster Passwort-Reset).
 */
export function mailBaseUrl(req: {
  get(name: string): string | undefined;
  protocol: string;
}): string {
  const host = req.get("host");
  return (
    process.env.APP_URL?.replace(/\/+$/, "") ??
    (host ? `${req.protocol}://${host}` : "https://campmesser.ch")
  );
}

/**
 * Bestätigungs-Mail für ein Konto verschicken (Token anlegen, Link bauen).
 * Fehler beim Versand werden geloggt, aber nie an die Aufrufer durchgereicht –
 * Registrierung und Adress-Änderung dürfen daran nicht scheitern.
 */
export async function sendVerifyMailFor(
  userId: number,
  email: string,
  lang: "de" | "fr" | "it" | "en",
  req: { get(name: string): string | undefined; protocol: string }
): Promise<void> {
  try {
    const { sendVerificationMail } = await import("../mailer");
    const { createVerifyToken } = await import("../emailVerify");
    const token = await createVerifyToken(userId);
    const verifyUrl = `${mailBaseUrl(req)}/anmelden?verify=${token}`;
    await sendVerificationMail(email, verifyUrl, lang);
  } catch (err) {
    console.error("[Mailer] Bestätigungs-Mail fehlgeschlagen:", err);
  }
}

/**
 * Zugriff auf eine Reise erzwingen (Owner ODER eingeladenes Mitglied) –
 * wirft NOT_FOUND, wenn die Reise fehlt oder das Konto keinen Zugriff hat.
 */
export async function requireTripAccess(tripId: number, userId: number) {
  const trip = await db.canAccessTrip(tripId, userId);
  if (!trip) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Aufenthalt nicht gefunden.",
    });
  }
  return trip;
}

/** App-Sprache als Eingabe (für serverseitig erzeugte Texte). */
export const shoppingLangInput = z.enum(["de", "fr", "it", "en"]).default("de");

/**
 * Laden-Kategorie eines Einkaufs-Eintrags (#272): entweder ein Schlüssel des
 * festen Katalogs oder eine eigene Kategorie im Format «custom:<Name>».
 * Die Längenprüfung deckt sich mit der DB-Spalte (varchar(80)).
 */
export const shoppingCategoryInput = z
  .string()
  .max(MAX_SHOPPING_CATEGORY_LENGTH)
  .refine(isShoppingCategoryValue, {
    message: "Unbekannte Kategorie.",
  });

/**
 * Ziel-Liste einer Einkaufs-Aktion bestimmen (#215): mit `listId` wird der
 * Besitz geprüft, ohne `listId` greift die erste Liste des Kontos – dabei
 * legt ensureDefaultShoppingList() bei Bedarf die Standard-Liste an und holt
 * Bestände ohne listId nach. So funktionieren auch alte Clients weiter.
 */
export async function requireShoppingList(
  userId: number,
  listId: number | undefined,
  lang: Language = "de"
) {
  if (listId === undefined) {
    return db.ensureDefaultShoppingList(
      userId,
      pick(DEFAULT_SHOPPING_LIST_NAME, lang)
    );
  }
  const list = await db.getShoppingList(listId, userId);
  if (!list) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Einkaufsliste nicht gefunden.",
    });
  }
  return list;
}

/**
 * Eine Änderung an einer Reise im Verlauf festhalten (#296).
 *
 * DARF DIE ÄNDERUNG SELBST NIE VERHINDERN: Wenn das Protokollieren
 * scheitert, ist das ärgerlich – dass deshalb die Ausgabe nicht
 * gespeichert wird, wäre schlimmer. Deshalb wird der Fehler hier
 * geschluckt und nur notiert.
 */
export async function noteTripChange(
  tripId: number,
  userId: number,
  area: ChangeArea,
  action: ChangeAction,
  label?: string | null
): Promise<void> {
  try {
    await db.recordTripChange({ tripId, userId, area, action, label });
  } catch (error) {
    console.error("[Reise-Verlauf] Eintrag fehlgeschlagen:", error);
  }
}

/** Weitergereicht, damit die Module nur EINE Quelle brauchen. */
export {
  BUDGET_MAX_RAPPEN,
  COOKIE_NAME,
  DEFAULT_FOOD_STORAGE,
  DEFAULT_SHOPPING_LIST_NAME,
  ENV,
  EXPENSE_CATEGORIES,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_MAX_RAPPEN,
  EXPENSE_PAID_BY_MAX_LENGTH,
  FISH_MAX_LENGTH_CM,
  FISH_MAX_WEIGHT_KG,
  FOOD_CATEGORIES,
  FOOD_STORAGES,
  FOOD_UNITS,
  LANGUAGES,
  LOCATION_SHARE_EXPIRY_HOURS,
  MAX_BOX_CODE_LENGTH,
  MAX_BOX_NAME_LENGTH,
  MAX_CHORES,
  MAX_CHORE_TITLE_LENGTH,
  MAX_DATE_OPTIONS,
  MAX_REWARDS,
  REWARD_TITLE_MAX_LENGTH,
  MAX_EXPIRY_DAYS,
  MAX_FOOD_ITEM_NAME_LENGTH,
  MAX_FOOD_ITEM_QUANTITY_LENGTH,
  MAX_FOOD_TEMPLATE_ITEMS,
  MAX_GEAR_INTERVAL_MONTHS,
  MAX_GEAR_TASK_TITLE_LENGTH,
  MAX_GUESTBOOK_MESSAGE_LENGTH,
  MAX_GUEST_NAME_LENGTH,
  MAX_HUNT_NAME_LENGTH,
  MAX_LENT_TO_LENGTH,
  MAX_OPTION_NOTE_LENGTH,
  MAX_PACK_SUGGESTIONS,
  MAX_PERSONS,
  MAX_PERSON_NAME_LENGTH,
  MAX_POINT_HINT_LENGTH,
  MAX_POINT_NAME_LENGTH,
  MAX_QUIZ_OPTIONS,
  MAX_QUIZ_QUESTIONS,
  MAX_ROUTE_PATH_POINTS,
  MAX_ROUTE_SAMPLES,
  MAX_ROUTE_WAYPOINTS,
  MAX_SHOPPING_CATEGORY_LENGTH,
  MAX_SHOPPING_LIST_NAME_LENGTH,
  MAX_SHOPPING_PRICE_RAPPEN,
  MAX_STARS,
  MAX_STATIONS,
  MAX_TICK_BODY_PART_LENGTH,
  MAX_TICK_NOTE_LENGTH,
  MAX_TRACK_POINTS,
  MAX_TREASURE_POINTS,
  MAX_WARRANTY_MONTHS,
  MEALS,
  MIN_GEAR_INTERVAL_MONTHS,
  MIN_QUIZ_OPTIONS,
  MIN_WARRANTY_MONTHS,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TEXT_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  ONE_YEAR_MS,
  RAIN_THRESHOLD_MAX_MM,
  RAIN_THRESHOLD_MIN_MM,
  RECIPE_DIFFICULTIES,
  RECIPE_METHODS,
  RETENTION_DAYS,
  ROUTE_NAME_MAX_LENGTH,
  SETTING_VALUE_MAX_LENGTH,
  SHARE_EXPIRY_DAYS,
  SPOT_ATTRIBUTES_JSON_MAX_LENGTH,
  SPOT_PRICE_MAX_RAPPEN,
  SYNCED_SETTING_KEYS,
  TRACK_NAME_MAX_LENGTH,
  TRIP_BOARD_KINDS,
  TRIP_BOARD_TEXT_MAX_LENGTH,
  TRIP_JOURNAL_MAX_LENGTH,
  TRIP_WEATHER_MAX_PRECIP_MM,
  TRIP_WEATHER_MAX_RAIN_DAYS,
  TRIP_WEATHER_TEMP_MAX,
  TRIP_WEATHER_TEMP_MIN,
  TRPCError,
  VOTE_VALUES,
  WIND_THRESHOLD_MAX_KMH,
  WIND_THRESHOLD_MIN_KMH,
  bundleChanges,
  canRemoveTripBoardEntry,
  clampPoints,
  clampStars,
  db,
  expenseStats,
  expiryDateFromDays,
  getSessionCookieOptions,
  hikingMinutes,
  isBadgeId,
  isDuplicateOption,
  isShoppingCategoryValue,
  isValidGuestbookMessage,
  isValidOptionRange,
  l4,
  locationShareExpiry,
  nanoid,
  nearestWaterStation,
  nextSortIndex,
  normalizeBoxCode,
  normalizeDifficulty,
  normalizeFoodStorage,
  normalizeGuestName,
  normalizeGuestbookMessage,
  normalizeHuntName,
  normalizeMethod,
  normalizeNoteText,
  normalizeNoteTitle,
  normalizePersons,
  normalizeTripBoardKind,
  normalizeTripBoardText,
  packScenarios,
  packSuggestions,
  parseCustomTemplateItems,
  parseFoodTemplateItems,
  parsePersons,
  parseQuizQuestions,
  parseSpotAttributes,
  parseStringList,
  parseTrackPoints,
  pick,
  protectedProcedure,
  publicProcedure,
  remapMenuDays,
  rotateAssignments,
  scoreboard,
  availablePoints,
  clampRewardPoints,
  routeDistanceM,
  routeElevation,
  routeLengthM,
  routeSamples,
  router,
  selectVisiblePasses,
  serializeNoteTags,
  serializePersons,
  serializeTrackPoints,
  serializeWaypoints,
  shareExpiryFromDays,
  shoppingBooking,
  solutionWordFromStations,
  sortNotes,
  sortTripBoardEntries,
  systemRouter,
  templateEndDate,
  templateListName,
  templateMenuPlan,
  thinTrackPoints,
  trackStats,
  tripTemplateById,
  visibleTrash,
  waterTrend,
  z,
};

/**
 * Typen getrennt: `export type` verhindert, dass der Bundler eine
 * Laufzeit-Weitergabe für etwas erzeugt, das es zur Laufzeit nicht gibt.
 */
export type {
  ChangeAction,
  ChangeArea,
  CustomTemplateItem,
  FoodStorage,
  Language,
  RouteWaypoint,
  ShareExpiryDays,
  TrackPoint,
};
