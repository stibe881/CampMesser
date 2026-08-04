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
} from "@shared/chores";
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
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

/** ISO-Datum (YYYY-MM-DD) als Eingabe-Muster. */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Platz-Eigenschaften validieren: über den defensiven Parser laufen lassen
 * und normalisiert ablegen – ohne gültige Attribute wird null gespeichert.
 * undefined (Feld nicht angefasst) wird unverändert durchgereicht.
 */
function normalizeSpotAttributesJson(
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
const shareExpiryInput = z
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
const SPOT_ELEVATION_INPUT = z.number().int().min(-500).max(9000).nullish();

/**
 * Platzkosten (#243): Preis pro Nacht bzw. Kurtaxe/Nebenkosten pro Nacht als
 * Ganzzahl in RAPPEN (Muster Reisekasse). null löscht den Wert, `undefined`
 * lässt ihn unverändert; die Obergrenze fängt Tippfehler ab.
 */
const SPOT_PRICE_INPUT = z
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
function shareExpiryFor(
  days: ShareExpiryDays | null | undefined,
  current: Date | null = null
): Date | null {
  return days === undefined ? current : shareExpiryFromDays(days);
}

const customQuizInput = z.object({
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
function serializeQuizQuestions(
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
const fishCatchInput = z.object({
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
function fishCatchValues(input: z.infer<typeof fishCatchInput>) {
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
function mailBaseUrl(req: {
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
async function sendVerifyMailFor(
  userId: number,
  email: string,
  lang: "de" | "fr" | "it" | "en",
  req: { get(name: string): string | undefined; protocol: string }
): Promise<void> {
  try {
    const { sendVerificationMail } = await import("./mailer");
    const { createVerifyToken } = await import("./emailVerify");
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
async function requireTripAccess(tripId: number, userId: number) {
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
const shoppingLangInput = z.enum(["de", "fr", "it", "en"]).default("de");

/**
 * Laden-Kategorie eines Einkaufs-Eintrags (#272): entweder ein Schlüssel des
 * festen Katalogs oder eine eigene Kategorie im Format «custom:<Name>».
 * Die Längenprüfung deckt sich mit der DB-Spalte (varchar(80)).
 */
const shoppingCategoryInput = z
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
async function requireShoppingList(
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
async function noteTripChange(
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

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async opts => {
      if (!opts.ctx.user) return null;
      // passwordHash niemals an den Client schicken
      const { passwordHash: _ph, ...safeUser } = opts.ctx.user;
      const { mailConfigured } = await import("./mailer");
      return {
        ...safeUser,
        /** Ist die E-Mail-Adresse des Kontos bestätigt? */
        emailVerified: Boolean(safeUser.emailVerifiedAt),
        /** Nur mit SMTP zeigt der Client Bestätigungs-Hinweis und Neu-Versand. */
        verifyMailEnabled: mailConfigured(),
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Bitte gib einen Namen ein.").max(100),
          email: z.string().min(3).max(320),
          password: z.string().min(1).max(200),
          lang: z.enum(["de", "fr", "it", "en"]).default("de"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const {
          validateEmail,
          validatePassword,
          normalizeEmail,
          findUserByEmail,
          registerUser,
          createLocalSessionToken,
        } = await import("./localAuth");
        if (!validateEmail(normalizeEmail(input.email))) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Bitte gib eine gültige E-Mail-Adresse ein.",
          });
        }
        const pwError = validatePassword(input.password);
        if (pwError)
          throw new TRPCError({ code: "BAD_REQUEST", message: pwError });
        const existing = await findUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Für diese E-Mail-Adresse existiert bereits ein Konto. Melde dich stattdessen an.",
          });
        }
        const user = await registerUser(
          input.name,
          input.email,
          input.password
        );
        const token = await createLocalSessionToken(user);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        // Mit SMTP eine Bestätigungs-Mail schicken – ohne SMTP läuft die
        // Registrierung unverändert, das Konto gilt einfach als unbestätigt.
        const { mailConfigured } = await import("./mailer");
        if (mailConfigured() && user.email) {
          await sendVerifyMailFor(user.id, user.email, input.lang, ctx.req);
        }
        return { success: true, name: user.name } as const;
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().min(3).max(320),
          password: z.string().min(1).max(200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const {
          findUserByEmail,
          verifyPassword,
          createLocalSessionToken,
          normalizeEmail,
        } = await import("./localAuth");
        const {
          isRateLimited,
          registerFailure,
          clearFailures,
          lockoutMinutes,
        } = await import("./rateLimit");
        // Brute-Force-Schutz: pro E-Mail+IP begrenzte Fehlversuche
        const limitKey = `${normalizeEmail(input.email)}|${ctx.req.ip ?? "?"}`;
        if (isRateLimited(limitKey)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Zu viele fehlgeschlagene Anmeldeversuche. Bitte warte ${lockoutMinutes(limitKey)} Minuten und versuche es erneut.`,
          });
        }
        const user = await findUserByEmail(input.email);
        const invalid = () => {
          registerFailure(limitKey);
          return new TRPCError({
            code: "UNAUTHORIZED",
            message: "E-Mail oder Passwort ist falsch.",
          });
        };
        if (!user || !user.passwordHash) throw invalid();
        const ok = await verifyPassword(input.password, user.passwordHash);
        if (!ok) throw invalid();
        clearFailures(limitKey);
        const token = await createLocalSessionToken(user);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true, name: user.name } as const;
      }),
    updateName: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1, "Bitte gib einen Namen ein.").max(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateUserName } = await import("./localAuth");
        await updateUserName(ctx.user.id, input.name);
        return { success: true } as const;
      }),
    updateEmail: protectedProcedure
      .input(
        z.object({
          newEmail: z.string().min(3).max(320),
          currentPassword: z.string().min(1).max(200),
          lang: z.enum(["de", "fr", "it", "en"]).default("de"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const {
          validateEmail,
          normalizeEmail,
          verifyPassword,
          findUserByEmail,
        } = await import("./localAuth");
        if (!ctx.user.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Für dieses Konto ist kein Passwort hinterlegt.",
          });
        }
        const ok = await verifyPassword(
          input.currentPassword,
          ctx.user.passwordHash
        );
        if (!ok) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Das Passwort ist falsch.",
          });
        }
        const email = normalizeEmail(input.newEmail);
        if (!validateEmail(email)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Bitte gib eine gültige E-Mail-Adresse ein.",
          });
        }
        const existing = await findUserByEmail(email);
        if (existing && existing.id !== ctx.user.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Diese E-Mail-Adresse wird bereits von einem anderen Konto verwendet.",
          });
        }
        const { updateUserEmail } = await import("./localAuth");
        // Setzt emailVerifiedAt zurück – die neue Adresse ist unbestätigt
        await updateUserEmail(ctx.user.id, email);
        const { mailConfigured } = await import("./mailer");
        if (mailConfigured()) {
          await sendVerifyMailFor(ctx.user.id, email, input.lang, ctx.req);
        }
        return { success: true, email } as const;
      }),
    updatePassword: protectedProcedure
      .input(
        z.object({
          currentPassword: z.string().min(1).max(200),
          newPassword: z.string().min(1).max(200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { validatePassword, verifyPassword, updateUserPassword } =
          await import("./localAuth");
        if (!ctx.user.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Für dieses Konto ist kein Passwort hinterlegt.",
          });
        }
        const ok = await verifyPassword(
          input.currentPassword,
          ctx.user.passwordHash
        );
        if (!ok) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Das aktuelle Passwort ist falsch.",
          });
        }
        const pwError = validatePassword(input.newPassword);
        if (pwError)
          throw new TRPCError({ code: "BAD_REQUEST", message: pwError });
        await updateUserPassword(ctx.user.id, input.newPassword);
        return { success: true } as const;
      }),
    deleteAccount: protectedProcedure
      .input(z.object({ password: z.string().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        const { verifyPassword, deleteUserAccount } =
          await import("./localAuth");
        if (ctx.user.passwordHash) {
          const ok = await verifyPassword(
            input.password,
            ctx.user.passwordHash
          );
          if (!ok) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Das Passwort ist falsch.",
            });
          }
        }
        await deleteUserAccount(ctx.user.id);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        return { success: true } as const;
      }),
    requestReset: publicProcedure
      .input(
        z.object({
          email: z.string().min(3).max(320),
          lang: z.enum(["de", "fr", "it", "en"]).default("de"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { mailConfigured, sendPasswordResetMail } =
          await import("./mailer");
        if (!mailConfigured()) {
          // Der Client übersetzt diesen Fall anhand des Fehler-Codes.
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Der Passwort-Reset per E-Mail ist derzeit nicht verfügbar.",
          });
        }
        const { normalizeEmail, findUserByEmail } = await import("./localAuth");
        const { allowAction } = await import("./rateLimit");
        // Missbrauchsschutz: max. 3 Anfragen pro Stunde pro E-Mail+IP
        const limitKey = `pwreset|${normalizeEmail(input.email)}|${ctx.req.ip ?? "?"}`;
        if (!allowAction(limitKey, 3, 60 * 60 * 1000)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Zu viele Anfragen. Bitte versuche es in einer Stunde erneut.",
          });
        }
        const user = await findUserByEmail(input.email);
        // Aus Datenschutzgründen immer Erfolg melden, auch wenn das Konto nicht existiert
        if (user && user.email && user.passwordHash) {
          const { createResetToken } = await import("./passwordReset");
          const token = await createResetToken(user.id);
          // Absolute Basis-URL: bevorzugt APP_URL, sonst Request-Host, sonst Produktions-Domain
          const host = ctx.req.get("host");
          const base =
            process.env.APP_URL?.replace(/\/+$/, "") ??
            (host ? `${ctx.req.protocol}://${host}` : "https://campmesser.ch");
          const resetUrl = `${base}/anmelden?reset=${token}`;
          await sendPasswordResetMail(user.email, resetUrl, input.lang).catch(
            err => console.error("[Mailer] Reset-Mail fehlgeschlagen:", err)
          );
        }
        return { success: true } as const;
      }),
    performReset: publicProcedure
      .input(
        z.object({
          token: z.string().length(64),
          newPassword: z.string().min(1).max(200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { findResetToken, resetTokenState, consumeResetTokens } =
          await import("./passwordReset");
        const entry = await findResetToken(input.token);
        if (!entry || resetTokenState(entry) !== "valid") {
          // Der Client übersetzt diesen Fall anhand des Fehler-Codes.
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Der Link ist ungültig oder abgelaufen. Fordere einen neuen an.",
          });
        }
        const {
          findUserById,
          validatePassword,
          updateUserPassword,
          createLocalSessionToken,
        } = await import("./localAuth");
        const pwError = validatePassword(input.newPassword);
        if (pwError)
          throw new TRPCError({ code: "BAD_REQUEST", message: pwError });
        const user = await findUserById(entry.userId);
        if (!user)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Konto nicht gefunden.",
          });
        await updateUserPassword(user.id, input.newPassword);
        // Verwendetes und alle weiteren offenen Tokens des Kontos entwerten
        await consumeResetTokens(user.id);
        // Direkt anmelden
        const token = await createLocalSessionToken(user);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true } as const;
      }),
    /**
     * E-Mail-Bestätigung über den Link aus der Mail: Token nachschlagen,
     * Ablauf prüfen, Konto als bestätigt markieren, Tokens löschen.
     */
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string().length(64) }))
      .mutation(async ({ input }) => {
        const { findVerifyToken, verifyTokenState, deleteVerifyTokens } =
          await import("./emailVerify");
        const entry = await findVerifyToken(input.token);
        if (!entry || verifyTokenState(entry) !== "valid") {
          // Der Client übersetzt diesen Fall anhand des Fehler-Codes.
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Der Bestätigungs-Link ist ungültig oder abgelaufen. Fordere einen neuen an.",
          });
        }
        const { markEmailVerified } = await import("./localAuth");
        await markEmailVerified(entry.userId);
        await deleteVerifyTokens(entry.userId);
        return { success: true } as const;
      }),
    /**
     * Bestätigungs-Mail erneut anfordern (eingeloggt): neutrale Antwort,
     * max. 3 Anfragen pro Stunde und Konto.
     */
    resendVerification: protectedProcedure
      .input(z.object({ lang: z.enum(["de", "fr", "it", "en"]).default("de") }))
      .mutation(async ({ ctx, input }) => {
        const { mailConfigured } = await import("./mailer");
        if (!mailConfigured()) {
          // Der Client übersetzt diesen Fall anhand des Fehler-Codes.
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Der E-Mail-Versand ist derzeit nicht verfügbar.",
          });
        }
        const { allowAction } = await import("./rateLimit");
        if (!allowAction(`verifymail|${ctx.user.id}`, 3, 60 * 60 * 1000)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Zu viele Anfragen. Bitte versuche es in einer Stunde erneut.",
          });
        }
        // Bereits bestätigt oder ohne E-Mail: neutral Erfolg melden
        if (ctx.user.email && !ctx.user.emailVerifiedAt) {
          await sendVerifyMailFor(
            ctx.user.id,
            ctx.user.email,
            input.lang,
            ctx.req
          );
        }
        return { success: true } as const;
      }),
    /**
     * Passkey-Registrierung, Schritt 1: WebAuthn-Optionen fürs eingeloggte
     * Konto (excludeCredentials verhindert Duplikate, Challenge 5 Min gültig).
     */
    passkeyRegisterOptions: protectedProcedure.mutation(async ({ ctx }) => {
      const { createRegistrationOptions, rpIdFrom } =
        await import("./passkeys");
      const rpID = rpIdFrom(process.env.APP_URL, ctx.req.get("host"));
      return createRegistrationOptions(ctx.user, rpID);
    }),
    /** Passkey-Registrierung, Schritt 2: Browser-Antwort prüfen und speichern. */
    passkeyRegisterVerify: protectedProcedure
      .input(
        z.object({
          /** RegistrationResponseJSON aus startRegistration() – Struktur prüft der Verifier */
          response: z.custom<object>(v => typeof v === "object" && v !== null),
          name: z.string().trim().min(1).max(80),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { verifyAndSavePasskey, rpIdFrom, originFrom } =
          await import("./passkeys");
        const host = ctx.req.get("host");
        const rpID = rpIdFrom(process.env.APP_URL, host);
        const origin = originFrom(process.env.APP_URL, ctx.req.protocol, host);
        try {
          const saved = await verifyAndSavePasskey(
            ctx.user.id,
            input.response as unknown as import("@simplewebauthn/server").RegistrationResponseJSON,
            rpID,
            origin,
            input.name
          );
          return { success: true, ...saved } as const;
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Error
                ? error.message
                : "Der Passkey konnte nicht gespeichert werden.",
          });
        }
      }),
    /** Passkeys des Kontos (nur Anzeige-Daten, nie Schlüsselmaterial). */
    passkeyList: protectedProcedure.query(async ({ ctx }) => {
      const { listPasskeys } = await import("./passkeys");
      const rows = await listPasskeys(ctx.user.id);
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        createdAt: row.createdAt,
      }));
    }),
    /** Passkey wieder entfernen (fremde Ids sind ein No-op). */
    passkeyRemove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const { deletePasskey } = await import("./passkeys");
        await deletePasskey(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /**
     * Passkey-Login, Schritt 1 (öffentlich): mit E-Mail werden die
     * Credentials des Kontos angeboten, ohne entscheidet das Gerät
     * (discoverable). Unbekannte E-Mails verraten nichts.
     */
    passkeyLoginOptions: publicProcedure
      .input(z.object({ email: z.string().max(320).optional() }))
      .mutation(async ({ ctx, input }) => {
        const { createLoginOptions, rpIdFrom } = await import("./passkeys");
        const { normalizeEmail } = await import("./localAuth");
        const email = input.email?.trim()
          ? normalizeEmail(input.email)
          : undefined;
        // rpID auf demselben Weg abgeleitet wie in Schritt 2
        return createLoginOptions(
          email,
          rpIdFrom(process.env.APP_URL, ctx.req.get("host"))
        );
      }),
    /**
     * Passkey-Login, Schritt 2 (öffentlich): Antwort verifizieren, Zähler
     * fortschreiben und dieselbe Session setzen wie beim Passwort-Login.
     */
    passkeyLoginVerify: publicProcedure
      .input(
        z.object({
          /** AuthenticationResponseJSON aus startAuthentication() */
          response: z.custom<object>(v => typeof v === "object" && v !== null),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { verifyPasskeyLogin, rpIdFrom, originFrom } =
          await import("./passkeys");
        const host = ctx.req.get("host");
        const rpID = rpIdFrom(process.env.APP_URL, host);
        const origin = originFrom(process.env.APP_URL, ctx.req.protocol, host);
        let user;
        try {
          user = await verifyPasskeyLogin(
            input.response as unknown as import("@simplewebauthn/server").AuthenticationResponseJSON,
            rpID,
            origin
          );
        } catch (error) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              error instanceof Error
                ? error.message
                : "Die Passkey-Anmeldung ist fehlgeschlagen.",
          });
        }
        const { createLocalSessionToken } = await import("./localAuth");
        const token = await createLocalSessionToken(user);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true, name: user.name } as const;
      }),
  }),

  /**
   * Packvorschlag aus vergangenen Reisen (#277): «Das hattest du letztes
   * Mal am selben Platz dabei.» Ausgewertet werden nur EIGENE frühere
   * Reisen an DEMSELBEN Zeltplatz, deren Packliste noch existiert.
   */
  packHistory: router({
    forList: protectedProcedure
      .input(z.object({ listId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const list = await db.getPackList(input.listId, ctx.user.id);
        if (!list) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Packliste nicht gefunden.",
          });
        }
        const trips = await db.getTripLogs(ctx.user.id);
        // Die Reise, an der diese Liste hängt – sie liefert den Platz
        const current = trips.find(trip => trip.packListId === input.listId);
        const spotId = current?.spotId ?? null;
        if (!current || spotId === null) {
          return { spotId: null, tripCount: 0, suggestions: [] } as const;
        }

        // Frühere Reisen am selben Platz, mit Packliste, ohne die aktuelle
        const past = trips.filter(
          trip =>
            trip.spotId === spotId &&
            trip.id !== current.id &&
            trip.packListId !== null &&
            trip.packListId !== input.listId &&
            trip.startDate < current.startDate
        );
        if (past.length === 0) {
          return { spotId, tripCount: 0, suggestions: [] } as const;
        }

        const history = past.map(trip => ({
          tripId: trip.id,
          packListId: trip.packListId as number,
          startDate: trip.startDate,
        }));
        const itemLists = await Promise.all(
          history.map(async entry => {
            const items = await db.getPackItems(entry.packListId);
            return items.map(item => ({
              listId: entry.packListId,
              name: item.name,
              category: item.category,
            }));
          })
        );
        const currentItems = await db.getPackItems(input.listId);
        return {
          spotId,
          tripCount: history.length,
          suggestions: packSuggestions(
            history,
            itemLists.flat(),
            currentItems,
            MAX_PACK_SUGGESTIONS
          ),
        } as const;
      }),
  }),
  packing: router({
    lists: protectedProcedure.query(({ ctx }) => db.getPackLists(ctx.user.id)),
    createList: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(120),
          scenario: z.string().max(60),
          // Vorlagen-Einträge werden in der aktuellen UI-Sprache gespeichert –
          // Listen-Inhalte in der DB bleiben bewusst einsprachig.
          lang: z.enum(["de", "fr", "it", "en"]).default("de"),
          /** Optionale Personen-Bereiche («Allgemein» gibt es immer). */
          persons: z
            .array(z.string().max(MAX_PERSON_NAME_LENGTH))
            .max(MAX_PERSONS)
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const listId = await db.createPackList({
          userId: ctx.user.id,
          name: input.name,
          scenario: input.scenario,
          personsJson: serializePersons(input.persons ?? []),
        });
        const scenario = packScenarios.find(s => s.id === input.scenario);
        if (scenario && scenario.items.length > 0) {
          await db.addPackItems(
            scenario.items.map((item, idx) => ({
              listId,
              name: pick(item.name, input.lang),
              category: pick(item.category, input.lang),
              quantity: item.quantity ?? 1,
              sortOrder: idx,
            }))
          );
        }
        return { listId };
      }),
    deleteList: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Papierkorb (#295): Schnappschuss der Liste samt ihrer Einträge,
        // bevor gelöscht wird.
        const { capture } = await import("./trash");
        await capture("packList", input.id, ctx.user.id);
        await db.deletePackList(input.id, ctx.user.id);
      }),
    /**
     * Liste archivieren oder wieder hervorholen (#194): archivierte Listen
     * bleiben samt Einträgen erhalten, verschwinden in der Übersicht aber
     * ins eingeklappte Archiv und aus allen Auswahl-Listen.
     */
    setArchived: protectedProcedure
      .input(
        z.object({
          listId: z.number().int().positive(),
          archived: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await db.getPackList(input.listId, ctx.user.id);
        if (!list)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Liste nicht gefunden",
          });
        await db.setPackListArchived(input.listId, ctx.user.id, input.archived);
        return { success: true } as const;
      }),
    /**
     * Leichter Pack-Fortschritt einer Liste (für den Trip-Planer) – auch für
     * Mitreisende einer Reise mit verknüpfter Liste.
     */
    progress: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .query(async ({ ctx, input }) => {
        const list = await db.canAccessList(input.listId, ctx.user.id);
        if (!list) return null;
        const items = await db.getPackItems(input.listId);
        return {
          name: list.name,
          total: items.length,
          checked: items.filter(i => i.checked).length,
        };
      }),
    /** Liste samt Einträgen kopieren – alles unabgehakt, ohne Teil-Link. */
    duplicateList: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          lang: z.enum(["de", "fr", "it", "en"]).default("de"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await db.getPackList(input.id, ctx.user.id);
        if (!list)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Liste nicht gefunden",
          });
        const items = await db.getPackItems(input.id);
        const copySuffix = pick(
          l4("Kopie", "copie", "copia", "copy"),
          input.lang
        );
        const newListId = await db.createPackList({
          userId: ctx.user.id,
          name: `${list.name} (${copySuffix})`.slice(0, 120),
          scenario: list.scenario,
          // Personen-Bereiche und Zuordnungen mitkopieren – nur Haken/Teil-Link nicht
          personsJson: list.personsJson,
        });
        await db.addPackItems(
          items.map(item => ({
            listId: newListId,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            assignee: item.assignee,
            sortOrder: item.sortOrder,
          }))
        );
        return { listId: newListId };
      }),
    /** Eigene Liste als wiederverwendbare Vorlage einfrieren (Namen/Kategorien/Mengen). */
    saveAsTemplate: protectedProcedure
      .input(
        z.object({
          listId: z.number(),
          name: z.string().trim().min(1).max(120),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await db.getPackList(input.listId, ctx.user.id);
        if (!list)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Liste nicht gefunden",
          });
        const items = await db.getPackItems(input.listId);
        if (items.length === 0)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Die Liste hat keine Einträge",
          });
        const templateItems: CustomTemplateItem[] = [...items]
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
          .map(item => ({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
          }));
        const templateId = await db.createPackTemplate({
          userId: ctx.user.id,
          name: input.name,
          itemsJson: JSON.stringify(templateItems),
        });
        return { templateId };
      }),
    /** Eigene Vorlagen samt geparsten Einträgen (neuste zuerst). */
    listTemplates: protectedProcedure.query(async ({ ctx }) => {
      const rows = await db.getPackTemplates(ctx.user.id);
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        items: parseCustomTemplateItems(row.itemsJson),
        shareToken: row.shareToken,
        shareExpiresAt: row.shareExpiresAt,
        createdAt: row.createdAt,
      }));
    }),
    /** Teil-Link für eine eigene Vorlage erzeugen: gibt den Token zurück. */
    shareTemplate: protectedProcedure
      .input(z.object({ id: z.number(), expiresInDays: shareExpiryInput }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.getPackTemplate(input.id, ctx.user.id);
        if (!template)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vorlage nicht gefunden",
          });
        // Bestehenden Token behalten, aber die gewünschte Gültigkeit neu setzen
        const expiresAt = shareExpiryFor(
          input.expiresInDays,
          template.shareExpiresAt
        );
        const token = template.shareToken ?? nanoid(16);
        await db.setPackTemplateShareToken(
          input.id,
          ctx.user.id,
          token,
          expiresAt
        );
        return { token, expiresAt };
      }),
    /** Teilen der Vorlage beenden: Token entfernen, Link wird ungültig. */
    unshareTemplate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setPackTemplateShareToken(input.id, ctx.user.id, null);
        return { success: true } as const;
      }),
    /** Geteilte Vorlage öffentlich abrufen (kein Login nötig). */
    sharedTemplateGet: publicProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .query(async ({ input }) => {
        const template = await db.getPackTemplateByToken(input.token);
        if (!template) return { template: null };
        return {
          template: {
            name: template.name,
            items: parseCustomTemplateItems(template.itemsJson),
          },
        };
      }),
    /** Geteilte Vorlage als eigene Vorlage übernehmen (Kopie). */
    importSharedTemplate: protectedProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.getPackTemplateByToken(input.token);
        if (!template)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Geteilte Vorlage nicht gefunden",
          });
        // Über den defensiven Parser re-serialisieren – kaputte Daten bleiben draussen
        const items = parseCustomTemplateItems(template.itemsJson);
        const templateId = await db.createPackTemplate({
          userId: ctx.user.id,
          name: template.name,
          itemsJson: JSON.stringify(items),
        });
        return { templateId };
      }),
    /** Neue eigene Liste direkt aus einer geteilten Vorlage anlegen. */
    createListFromSharedTemplate: protectedProcedure
      .input(
        z.object({
          token: z.string().min(8).max(64),
          listName: z.string().trim().min(1).max(120),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const template = await db.getPackTemplateByToken(input.token);
        if (!template)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Geteilte Vorlage nicht gefunden",
          });
        const items = parseCustomTemplateItems(template.itemsJson);
        const listId = await db.createPackList({
          userId: ctx.user.id,
          name: input.listName,
          scenario: "custom",
        });
        await db.addPackItems(
          items.map((item, idx) => ({
            listId,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            sortOrder: idx,
          }))
        );
        return { listId };
      }),
    deleteTemplate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deletePackTemplate(input.id, ctx.user.id)
      ),
    /** Neue Liste aus einer eigenen Vorlage anlegen (alles unabgehakt). */
    createListFromTemplate: protectedProcedure
      .input(
        z.object({
          templateId: z.number(),
          listName: z.string().trim().min(1).max(120),
          /** Optionale Personen-Bereiche («Allgemein» gibt es immer). */
          persons: z
            .array(z.string().max(MAX_PERSON_NAME_LENGTH))
            .max(MAX_PERSONS)
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const template = await db.getPackTemplate(
          input.templateId,
          ctx.user.id
        );
        if (!template)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vorlage nicht gefunden",
          });
        const items = parseCustomTemplateItems(template.itemsJson);
        const listId = await db.createPackList({
          userId: ctx.user.id,
          name: input.listName,
          scenario: "custom",
          personsJson: serializePersons(input.persons ?? []),
        });
        await db.addPackItems(
          items.map((item, idx) => ({
            listId,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            sortOrder: idx,
          }))
        );
        return { listId };
      }),
    /**
     * Liste samt Einträgen – auch für Mitreisende einer verknüpften Reise.
     * Bei Listen an GEMEINSAMEN Reisen (sharedTrip) wird pro Eintrag der
     * Anzeigename von updatedByUserId mitgeliefert («Zuletzt geändert von»);
     * private Listen sparen sich die Auflösung. Zusätzlich liefern geteilte
     * Listen die Anzeigenamen aller Mitreisenden (Besitzer:in zuerst) –
     * daraus baut der Client die Vorschläge «Mitreisende hinzufügen».
     */
    items: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .query(async ({ ctx, input }) => {
        type ItemWithEditor = Awaited<
          ReturnType<typeof db.getPackItems>
        >[number] & { updatedByName: string | null };
        const list = await db.canAccessList(input.listId, ctx.user.id);
        if (!list) {
          return {
            list: null,
            sharedTrip: false,
            tripMemberNames: [] as string[],
            items: [] as ItemWithEditor[],
          };
        }
        const items = await db.getPackItems(input.listId);
        const sharedTripId = await db.getListSharedTripId(
          input.listId,
          list.userId
        );
        const sharedTrip = sharedTripId != null;
        // Bei geteilten Reisen brauchen wir die Konten der Mitreisenden
        // ohnehin – Besitzer:in zuerst, danach in Einladungs-Reihenfolge.
        const memberIds =
          sharedTripId != null
            ? [
                list.userId,
                ...(await db.getTripMembersWithUsers(sharedTripId)).map(
                  m => m.userId
                ),
              ]
            : [];
        const names = sharedTrip
          ? await db.getUserDisplayNames([
              ...items
                .map(i => i.updatedByUserId)
                .filter((id): id is number => id != null),
              ...memberIds,
            ])
          : new Map<number, string>();
        return {
          list,
          sharedTrip,
          // normalizePersons trimmt, kürzt auf 80 Zeichen und entfernt
          // Duplikate – die Vorschläge passen damit 1:1 zu setPersons.
          tripMemberNames: normalizePersons(
            memberIds.map(id => names.get(id) ?? "")
          ),
          items: items.map<ItemWithEditor>(item => ({
            ...item,
            updatedByName:
              item.updatedByUserId != null
                ? (names.get(item.updatedByUserId) ?? null)
                : null,
          })),
        };
      }),
    addItems: protectedProcedure
      .input(
        z.object({
          listId: z.number(),
          items: z.array(
            z.object({
              name: z.string().min(1).max(160),
              category: z.string().max(80).default("Allgemein"),
              quantity: z.number().int().min(1).max(99).default(1),
              /** Bereich der Person – null/weggelassen = «Allgemein». */
              assignee: z
                .string()
                .trim()
                .min(1)
                .max(MAX_PERSON_NAME_LENGTH)
                .nullable()
                .optional(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await db.canAccessList(input.listId, ctx.user.id);
        if (!list) throw new Error("Liste nicht gefunden");
        await db.addPackItems(
          input.items.map((item, idx) => ({
            listId: input.listId,
            sortOrder: 1000 + idx,
            updatedByUserId: ctx.user.id,
            ...item,
          }))
        );
      }),
    toggleItem: protectedProcedure
      .input(z.object({ id: z.number(), checked: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const item = await db.getPackItem(input.id);
        if (!item || !(await db.canAccessList(item.listId, ctx.user.id))) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Eintrag nicht gefunden",
          });
        }
        await db.setPackItemChecked(input.id, input.checked, ctx.user.id);
      }),
    /**
     * Personen-Bereiche der Liste setzen. Einträge entfernter Personen
     * wandern zurück in den Bereich «Allgemein» (assignee null).
     */
    setPersons: protectedProcedure
      .input(
        z.object({
          listId: z.number(),
          persons: z
            .array(z.string().max(MAX_PERSON_NAME_LENGTH))
            .max(MAX_PERSONS),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await db.canAccessList(input.listId, ctx.user.id);
        if (!list)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Liste nicht gefunden",
          });
        const next = normalizePersons(input.persons);
        const removed = parsePersons(list.personsJson).filter(
          person => !next.includes(person)
        );
        if (removed.length > 0)
          await db.clearPackItemAssignees(input.listId, removed);
        await db.setPackListPersons(
          input.listId,
          list.userId,
          serializePersons(next)
        );
        return { persons: next };
      }),
    /** Alle Haken einer Liste lösen – z. B. vor dem nächsten Trip. */
    uncheckAll: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const list = await db.canAccessList(input.listId, ctx.user.id);
        if (!list)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Liste nicht gefunden",
          });
        await db.uncheckAllPackItems(input.listId);
        return { success: true } as const;
      }),
    /** Neue Reihenfolge (Drag-and-drop) speichern: Positionen 0..n in Übergabe-Reihenfolge. */
    reorderItems: protectedProcedure
      .input(
        z.object({
          listId: z.number(),
          itemIds: z.array(z.number().int()).min(1).max(500),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await db.canAccessList(input.listId, ctx.user.id);
        if (!list)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Liste nicht gefunden",
          });
        const items = await db.getPackItems(input.listId);
        const valid = new Set(items.map(i => i.id));
        // Nur Einträge dieser Liste umsortieren – fremde IDs werden ignoriert
        const ids = input.itemIds.filter(id => valid.has(id));
        if (ids.length > 0) await db.reorderPackItems(input.listId, ids);
        return { success: true } as const;
      }),
    /**
     * Eintrag anpassen: Name, Menge, Personen-Zuordnung («Wer packt das?»,
     * null entfernt sie) und/oder Kategorie – Kategorien sind frei, neue
     * entstehen implizit.
     */
    updateItem: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().trim().min(1).max(160).optional(),
          quantity: z.number().int().min(1).max(999).optional(),
          assignee: z.string().trim().min(1).max(80).nullable().optional(),
          category: z.string().trim().min(1).max(80).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const item = await db.getPackItem(input.id);
        if (!item || !(await db.canAccessList(item.listId, ctx.user.id))) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Eintrag nicht gefunden",
          });
        }
        await db.updatePackItem(input.id, {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
          ...(input.assignee !== undefined ? { assignee: input.assignee } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          updatedByUserId: ctx.user.id,
        });
      }),
    deleteItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const item = await db.getPackItem(input.id);
        if (!item || !(await db.canAccessList(item.listId, ctx.user.id))) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Eintrag nicht gefunden",
          });
        }
        await db.deletePackItem(input.id);
      }),
    /** Gewichts-Budget in Gramm setzen; null entfernt es wieder. */
    setWeightBudget: protectedProcedure
      .input(
        z.object({
          listId: z.number(),
          grams: z.number().int().min(1).max(500000).nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await db.getPackList(input.listId, ctx.user.id);
        if (!list)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Liste nicht gefunden",
          });
        await db.setPackListWeightBudget(
          input.listId,
          ctx.user.id,
          input.grams
        );
        return { success: true } as const;
      }),
    /** Teil-Link erzeugen: gibt den Token zurück. */
    share: protectedProcedure
      .input(z.object({ listId: z.number(), expiresInDays: shareExpiryInput }))
      .mutation(async ({ ctx, input }) => {
        const list = await db.getPackList(input.listId, ctx.user.id);
        if (!list) throw new Error("Liste nicht gefunden");
        const expiresAt = shareExpiryFor(
          input.expiresInDays,
          list.shareExpiresAt
        );
        const token = list.shareToken ?? nanoid(16);
        await db.setPackListShareToken(
          input.listId,
          ctx.user.id,
          token,
          expiresAt
        );
        return { token, expiresAt };
      }),
    /** Teilen beenden: Token entfernen, Link wird ungültig. */
    unshare: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setPackListShareToken(input.listId, ctx.user.id, null);
        return { success: true } as const;
      }),
    /** Geteilte Liste öffentlich abrufen (kein Login nötig). */
    sharedGet: publicProcedure
      .input(z.object({ token: z.string().min(8).max(32) }))
      .query(async ({ input }) => {
        const list = await db.getPackListByToken(input.token);
        if (!list) {
          return {
            list: null,
            items: [] as Awaited<ReturnType<typeof db.getPackItems>>,
          };
        }
        const items = await db.getPackItems(list.id);
        return {
          list: {
            id: list.id,
            name: list.name,
            scenario: list.scenario,
            persons: parsePersons(list.personsJson),
          },
          items,
        };
      }),
    /** Abhaken über den Teil-Link (kein Login nötig, Token dient als Berechtigung). */
    sharedToggle: publicProcedure
      .input(
        z.object({
          token: z.string().min(8).max(32),
          itemId: z.number(),
          checked: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        const list = await db.getPackListByToken(input.token);
        if (!list) throw new Error("Geteilte Liste nicht gefunden");
        const items = await db.getPackItems(list.id);
        if (!items.some(i => i.id === input.itemId))
          throw new Error("Eintrag gehört nicht zu dieser Liste");
        // Anonym über den Teil-Link → keine «Zuletzt geändert von»-Zuordnung
        await db.setPackItemChecked(input.itemId, input.checked, null);
        return { success: true } as const;
      }),
  }),

  inventory: router({
    list: protectedProcedure.query(({ ctx }) => db.getInventory(ctx.user.id)),
    add: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(160),
          category: z.string().max(80).default("Allgemein"),
          weightGrams: z.number().int().min(0).max(500000).default(0),
          volumeLiters: z.number().min(0).max(5000).default(0),
          quantity: z.number().int().min(1).max(99).default(1),
          notes: z.string().max(1000).optional(),
          // Kaufpreis in Rappen (Ganzzahl, max. 1 Mio. CHF), null = nicht erfasst
          priceRappen: z.number().int().min(0).max(100000000).nullish(),
          purchaseDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .nullish(),
          // Garantiedauer in Monaten ab Kaufdatum, null = nicht erfasst
          warrantyMonths: z
            .number()
            .int()
            .min(MIN_WARRANTY_MONTHS)
            .max(MAX_WARRANTY_MONTHS)
            .nullish(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.addInventoryItem({ userId: ctx.user.id, ...input })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(160).optional(),
          category: z.string().max(80).optional(),
          weightGrams: z.number().int().min(0).max(500000).optional(),
          volumeLiters: z.number().min(0).max(5000).optional(),
          quantity: z.number().int().min(1).max(99).optional(),
          notes: z.string().max(1000).optional(),
          priceRappen: z.number().int().min(0).max(100000000).nullish(),
          purchaseDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .nullish(),
          warrantyMonths: z
            .number()
            .int()
            .min(MIN_WARRANTY_MONTHS)
            .max(MAX_WARRANTY_MONTHS)
            .nullish(),
        })
      )
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateInventoryItem(id, ctx.user.id, data);
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Foto- und Beleg-Datei mitputzen: erst Dateinamen sichern, dann
        // DB-Zeile löschen und zuletzt die Dateien auf dem Webspace entfernen.
        const item = await db.getInventoryItem(input.id, ctx.user.id);
        await db.deleteInventoryItem(input.id, ctx.user.id);
        if (item?.imageFileName || item?.receiptFileName) {
          const { inventoryPhotoStorage, receiptPhotoStorage } =
            await import("./photoStorage");
          if (item.imageFileName) {
            await inventoryPhotoStorage.deleteFiles([item.imageFileName]);
          }
          if (item.receiptFileName) {
            await receiptPhotoStorage.deleteFiles([item.receiptFileName]);
          }
        }
      }),
    /**
     * Gegenstand als verliehen vermerken (`data` mit Name und Datum) oder
     * zurückbuchen (`data: null`). Bewusst eine eigene Prozedur, damit
     * add/update schlank bleiben.
     */
    setLent: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              lentTo: z.string().trim().min(1).max(MAX_LENT_TO_LENGTH),
              lentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            })
            .nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const item = await db.getInventoryItem(input.id, ctx.user.id);
        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Gegenstand nicht gefunden.",
          });
        }
        await db.updateInventoryItem(input.id, ctx.user.id, {
          lentTo: input.data?.lentTo ?? null,
          lentAt: input.data?.lentAt ?? null,
        });
        return { success: true } as const;
      }),
    /** Foto eines Gegenstands entfernen (Feld + Datei auf dem Webspace). */
    removePhoto: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const item = await db.getInventoryItem(input.id, ctx.user.id);
        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Gegenstand nicht gefunden.",
          });
        }
        if (item.imageFileName) {
          await db.updateInventoryItem(input.id, ctx.user.id, {
            imageFileName: null,
          });
          const { inventoryPhotoStorage } = await import("./photoStorage");
          await inventoryPhotoStorage.deleteFiles([item.imageFileName]);
        }
        return { success: true } as const;
      }),
    /** Beleg eines Gegenstands entfernen (Feld + Datei auf dem Webspace). */
    removeReceipt: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const item = await db.getInventoryItem(input.id, ctx.user.id);
        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Gegenstand nicht gefunden.",
          });
        }
        if (item.receiptFileName) {
          await db.updateInventoryItem(input.id, ctx.user.id, {
            receiptFileName: null,
          });
          const { receiptPhotoStorage } = await import("./photoStorage");
          await receiptPhotoStorage.deleteFiles([item.receiptFileName]);
        }
        return { success: true } as const;
      }),
  }),

  /**
   * Transportkisten (#276): Wo liegt was, wenn die Ausrüstung im Keller
   * steht? Jede Kiste hat eine kurze Kennung, die auf dem Etikett steht und
   * im QR-Code steckt.
   */
  /** GPS-Schatzsuche (#267): Verstecke anlegen und den Spielstand führen. */
  treasure: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const hunts = await db.getTreasureHunts(ctx.user.id);
      // Die Punkte gehören zum Spielstand und werden mitgeliefert – eine
      // Schatzsuche ohne ihre Stationen ist keine Information wert
      return Promise.all(
        hunts.map(async hunt => ({
          ...hunt,
          points: await db.getTreasurePoints(hunt.id),
        }))
      );
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().trim().max(MAX_HUNT_NAME_LENGTH) }))
      .mutation(async ({ ctx, input }) => {
        const name = normalizeHuntName(input.name);
        const id = await db.createTreasureHunt({
          userId: ctx.user.id,
          name: name || "Schatzsuche",
        });
        return { id } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTreasureHunt(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /** Versteck am aktuellen Standort anlegen. */
    addPoint: protectedProcedure
      .input(
        z.object({
          huntId: z.number().int().positive(),
          name: z.string().trim().min(1).max(MAX_POINT_NAME_LENGTH),
          hint: z.string().trim().max(MAX_POINT_HINT_LENGTH).nullish(),
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hunt = await db.getTreasureHunt(input.huntId, ctx.user.id);
        if (!hunt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schatzsuche nicht gefunden.",
          });
        }
        const points = await db.getTreasurePoints(input.huntId);
        if (points.length >= MAX_TREASURE_POINTS) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Mehr als ${MAX_TREASURE_POINTS} Verstecke pro Suche sind nicht vorgesehen.`,
          });
        }
        const id = await db.createTreasurePoint({
          huntId: input.huntId,
          name: input.name.trim(),
          hint: input.hint?.trim() || null,
          latitude: input.latitude,
          longitude: input.longitude,
          sortIndex: nextSortIndex(points),
        });
        return { id } as const;
      }),
    removePoint: protectedProcedure
      .input(
        z.object({
          huntId: z.number().int().positive(),
          pointId: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hunt = await db.getTreasureHunt(input.huntId, ctx.user.id);
        if (!hunt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schatzsuche nicht gefunden.",
          });
        }
        await db.deleteTreasurePoint(input.pointId, input.huntId);
        return { success: true } as const;
      }),
    /** Punkt als gefunden melden oder wieder verstecken. */
    setFound: protectedProcedure
      .input(
        z.object({
          huntId: z.number().int().positive(),
          pointId: z.number().int().positive(),
          found: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hunt = await db.getTreasureHunt(input.huntId, ctx.user.id);
        if (!hunt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schatzsuche nicht gefunden.",
          });
        }
        await db.setTreasurePointFound(
          input.pointId,
          input.huntId,
          input.found ? new Date() : null
        );
        return { success: true } as const;
      }),
    /** Spielstand zurücksetzen – die Verstecke bleiben, wo sie sind. */
    reset: protectedProcedure
      .input(z.object({ huntId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const hunt = await db.getTreasureHunt(input.huntId, ctx.user.id);
        if (!hunt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schatzsuche nicht gefunden.",
          });
        }
        await db.resetTreasureHunt(input.huntId);
        return { success: true } as const;
      }),
  }),
  /** Ämtli-Plan im Camp (#270): Aufgaben, Zuteilung pro Tag, Punkte. */
  chores: router({
    list: protectedProcedure.query(({ ctx }) => db.getCampChores(ctx.user.id)),
    /** Zuteilungen eines Tages; ohne Tag alle (für den Punktestand). */
    assignments: protectedProcedure
      .input(
        z.object({
          day: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
        })
      )
      .query(({ ctx, input }) =>
        db.getChoreAssignments(ctx.user.id, input.day)
      ),
    add: protectedProcedure
      .input(
        z.object({
          title: z.string().trim().min(1).max(MAX_CHORE_TITLE_LENGTH),
          points: z.number().int(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getCampChores(ctx.user.id);
        if (existing.length >= MAX_CHORES) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Mehr als ${MAX_CHORES} Ämtli sind nicht vorgesehen.`,
          });
        }
        const id = await db.createCampChore({
          userId: ctx.user.id,
          title: input.title.trim(),
          points: clampPoints(input.points),
        });
        return { id } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCampChore(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /**
     * Ämtli des Tages reihum verteilen. Bestehende Zuteilungen des Tages
     * werden ersetzt – «neu verteilen» heisst neu verteilen, nicht
     * dazulegen.
     */
    autoAssign: protectedProcedure
      .input(z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .mutation(async ({ ctx, input }) => {
        const [chores, children] = await Promise.all([
          db.getCampChores(ctx.user.id),
          db.getFamilyChildren(ctx.user.id),
        ]);
        if (children.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Lege zuerst im Familien-Modus Kinder an.",
          });
        }
        await db.deleteChoreAssignmentsForDay(ctx.user.id, input.day);
        const planned = rotateAssignments(chores, children, input.day);
        for (const entry of planned) {
          await db.createChoreAssignment({
            userId: ctx.user.id,
            choreId: entry.choreId,
            childId: entry.childId,
            day: input.day,
          });
        }
        return { assigned: planned.length } as const;
      }),
    /** Ein einzelnes Ämtli einem Kind zuteilen (null = wieder offen). */
    assign: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          childId: z.number().int().positive().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateChoreAssignment(input.id, ctx.user.id, {
          childId: input.childId,
        });
        return { success: true } as const;
      }),
    /** Abhaken – erst jetzt gibt es Punkte. */
    setDone: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), done: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateChoreAssignment(input.id, ctx.user.id, {
          doneAt: input.done ? new Date() : null,
        });
        return { success: true } as const;
      }),
  }),
  boxes: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getStorageBoxes(ctx.user.id)
    ),
    /** Kiste über die Kennung – der Weg, den ein QR-Scan nimmt. */
    byCode: protectedProcedure
      .input(z.object({ code: z.string().min(1).max(MAX_BOX_CODE_LENGTH) }))
      .query(async ({ ctx, input }) => {
        const box = await db.getStorageBoxByCode(
          ctx.user.id,
          normalizeBoxCode(input.code)
        );
        return box ?? null;
      }),
    add: protectedProcedure
      .input(
        z.object({
          code: z.string().min(1).max(MAX_BOX_CODE_LENGTH),
          name: z.string().trim().min(1).max(MAX_BOX_NAME_LENGTH),
          location: z.string().trim().max(80).nullish(),
          notes: z.string().trim().max(2000).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const code = normalizeBoxCode(input.code);
        if (!code) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Bitte eine Kennung angeben.",
          });
        }
        // Kennungen sind je Konto eindeutig – zwei «K1» wären beim Scannen
        // nicht auseinanderzuhalten
        const existing = await db.getStorageBoxByCode(ctx.user.id, code);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Diese Kennung gibt es schon.",
          });
        }
        const id = await db.createStorageBox({
          userId: ctx.user.id,
          code,
          name: input.name.trim(),
          location: input.location?.trim() || null,
          notes: input.notes?.trim() || null,
        });
        return { id } as const;
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          code: z.string().min(1).max(MAX_BOX_CODE_LENGTH),
          name: z.string().trim().min(1).max(MAX_BOX_NAME_LENGTH),
          location: z.string().trim().max(80).nullish(),
          notes: z.string().trim().max(2000).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const code = normalizeBoxCode(input.code);
        if (!code) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Bitte eine Kennung angeben.",
          });
        }
        const clash = await db.getStorageBoxByCode(ctx.user.id, code);
        if (clash && clash.id !== input.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Diese Kennung gibt es schon.",
          });
        }
        await db.updateStorageBox(input.id, ctx.user.id, {
          code,
          name: input.name.trim(),
          location: input.location?.trim() || null,
          notes: input.notes?.trim() || null,
        });
        return { success: true } as const;
      }),
    /** Kiste löschen – die Ausrüstung bleibt und wird nur ausgeräumt. */
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteStorageBox(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /** Gegenstand einer Kiste zuordnen (null = ausräumen). */
    assign: protectedProcedure
      .input(
        z.object({
          itemId: z.number().int().positive(),
          boxId: z.number().int().positive().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const item = await db.getInventoryItem(input.itemId, ctx.user.id);
        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Gegenstand nicht gefunden.",
          });
        }
        if (input.boxId !== null) {
          const boxes = await db.getStorageBoxes(ctx.user.id);
          if (!boxes.some(box => box.id === input.boxId)) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Kiste nicht gefunden.",
            });
          }
        }
        await db.updateInventoryItem(input.itemId, ctx.user.id, {
          boxId: input.boxId,
        });
        return { success: true } as const;
      }),
  }),

  /** Natur-Beobachtungen: persönliches Sichtungs-Tagebuch im Natur-Modul. */
  sightings: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getNatureSightings(ctx.user.id)
    ),
    add: protectedProcedure
      .input(
        z.object({
          title: z.string().trim().min(1).max(120),
          entryId: z.string().max(60).nullish(),
          sightedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          lat: z.number().min(-90).max(90).nullish(),
          lon: z.number().min(-180).max(180).nullish(),
          note: z.string().max(500).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.addNatureSighting({
          userId: ctx.user.id,
          title: input.title,
          entryId: input.entryId ?? null,
          sightedAt: input.sightedAt,
          lat: input.lat ?? null,
          lon: input.lon ?? null,
          note: input.note?.trim() || null,
        });
        return { id };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          title: z.string().trim().min(1).max(120),
          entryId: z.string().max(60).nullish(),
          sightedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          lat: z.number().min(-90).max(90).nullish(),
          lon: z.number().min(-180).max(180).nullish(),
          note: z.string().max(500).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const sighting = await db.getNatureSighting(input.id, ctx.user.id);
        if (!sighting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Beobachtung nicht gefunden.",
          });
        }
        await db.updateNatureSighting(input.id, ctx.user.id, {
          title: input.title,
          entryId: input.entryId ?? null,
          sightedAt: input.sightedAt,
          lat: input.lat ?? null,
          lon: input.lon ?? null,
          note: input.note?.trim() || null,
        });
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        // Foto-Datei mitputzen: erst Dateinamen sichern, dann DB-Zeile
        // löschen und zuletzt die Datei auf dem Webspace entfernen.
        const sighting = await db.getNatureSighting(input.id, ctx.user.id);
        await db.deleteNatureSighting(input.id, ctx.user.id);
        if (sighting?.fileName) {
          const { sightingPhotoStorage } = await import("./photoStorage");
          await sightingPhotoStorage.deleteFiles([sighting.fileName]);
        }
        return { success: true } as const;
      }),
    /** Foto einer Beobachtung entfernen (Feld + Datei auf dem Webspace). */
    removePhoto: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const sighting = await db.getNatureSighting(input.id, ctx.user.id);
        if (!sighting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Beobachtung nicht gefunden.",
          });
        }
        if (sighting.fileName) {
          await db.updateNatureSighting(input.id, ctx.user.id, {
            fileName: null,
          });
          const { sightingPhotoStorage } = await import("./photoStorage");
          await sightingPhotoStorage.deleteFiles([sighting.fileName]);
        }
        return { success: true } as const;
      }),
  }),

  /** Fangbuch (#236): eigene Angel-Fänge mit Art, Mass, Gewässer und Foto. */
  fishing: router({
    list: protectedProcedure.query(({ ctx }) => db.getFishCatches(ctx.user.id)),
    add: protectedProcedure
      .input(fishCatchInput)
      .mutation(async ({ ctx, input }) => {
        const id = await db.addFishCatch({
          userId: ctx.user.id,
          ...fishCatchValues(input),
        });
        return { id };
      }),
    update: protectedProcedure
      .input(fishCatchInput.extend({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const entry = await db.getFishCatch(input.id, ctx.user.id);
        if (!entry) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fang nicht gefunden.",
          });
        }
        await db.updateFishCatch(input.id, ctx.user.id, fishCatchValues(input));
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        // Foto-Datei mitputzen: erst Dateinamen sichern, dann DB-Zeile
        // löschen und zuletzt die Datei auf dem Webspace entfernen.
        const entry = await db.getFishCatch(input.id, ctx.user.id);
        await db.deleteFishCatch(input.id, ctx.user.id);
        if (entry?.fileName) {
          const { catchPhotoStorage } = await import("./photoStorage");
          await catchPhotoStorage.deleteFiles([entry.fileName]);
        }
        return { success: true } as const;
      }),
    /** Foto eines Fangs entfernen (Feld + Datei auf dem Webspace). */
    removePhoto: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const entry = await db.getFishCatch(input.id, ctx.user.id);
        if (!entry) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fang nicht gefunden.",
          });
        }
        if (entry.fileName) {
          await db.updateFishCatch(input.id, ctx.user.id, { fileName: null });
          const { catchPhotoStorage } = await import("./photoStorage");
          await catchPhotoStorage.deleteFiles([entry.fileName]);
        }
        return { success: true } as const;
      }),
  }),

  /** Ausrüstungs-Pflege: wiederkehrende Wartungsaufgaben (Fälligkeit in shared/gearTasks.ts). */
  gear: router({
    list: protectedProcedure.query(({ ctx }) => db.getGearTasks(ctx.user.id)),
    add: protectedProcedure
      .input(
        z.object({
          title: z.string().trim().min(1).max(MAX_GEAR_TASK_TITLE_LENGTH),
          intervalMonths: z
            .number()
            .int()
            .min(MIN_GEAR_INTERVAL_MONTHS)
            .max(MAX_GEAR_INTERVAL_MONTHS),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.addGearTask({ userId: ctx.user.id, ...input });
        return { id };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          title: z
            .string()
            .trim()
            .min(1)
            .max(MAX_GEAR_TASK_TITLE_LENGTH)
            .optional(),
          intervalMonths: z
            .number()
            .int()
            .min(MIN_GEAR_INTERVAL_MONTHS)
            .max(MAX_GEAR_INTERVAL_MONTHS)
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateGearTask(id, ctx.user.id, data);
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteGearTask(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /**
     * Aufgabe als erledigt markieren: lastDoneAt = heute. «Heute» kommt vom
     * Gerät (Muster foodTemplates.applyTemplate) gegen Zeitzonen-Sprünge.
     */
    markDone: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateGearTask(input.id, ctx.user.id, {
          lastDoneAt: input.today,
        });
        return { success: true } as const;
      }),
  }),

  /**
   * Zeckenstich-Merker (#179): erfasste Stiche pro Konto samt
   * Beobachtungsfenster. Die Fristen-Logik liegt in shared/tickBites.ts –
   * der Server speichert nur, er bewertet nichts medizinisch.
   */
  tickBites: router({
    list: protectedProcedure.query(({ ctx }) => db.getTickBites(ctx.user.id)),
    add: protectedProcedure
      .input(
        z.object({
          bitAt: z.string().regex(ISO_DAY),
          bodyPart: z.string().trim().max(MAX_TICK_BODY_PART_LENGTH).nullish(),
          note: z.string().trim().max(MAX_TICK_NOTE_LENGTH).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.addTickBite({
          userId: ctx.user.id,
          bitAt: input.bitAt,
          bodyPart: input.bodyPart?.trim() || null,
          note: input.note?.trim() || null,
        });
        return { id };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          bitAt: z.string().regex(ISO_DAY).optional(),
          bodyPart: z.string().trim().max(MAX_TICK_BODY_PART_LENGTH).nullish(),
          note: z.string().trim().max(MAX_TICK_NOTE_LENGTH).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateTickBite(input.id, ctx.user.id, {
          ...(input.bitAt !== undefined ? { bitAt: input.bitAt } : {}),
          ...(input.bodyPart !== undefined
            ? { bodyPart: input.bodyPart?.trim() || null }
            : {}),
          ...(input.note !== undefined
            ? { note: input.note?.trim() || null }
            : {}),
        });
        return { success: true } as const;
      }),
    /**
     * Beobachtung abschliessen (resolvedAt = mitgeschicktes «heute» vom
     * Gerät, Muster gear.markDone) oder mit null wieder öffnen.
     */
    resolve: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          today: z.string().regex(ISO_DAY).nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateTickBite(input.id, ctx.user.id, {
          resolvedAt: input.today,
        });
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTickBite(input.id, ctx.user.id);
        return { success: true } as const;
      }),
  }),

  shopping: router({
    /**
     * Alle persönlichen Listen mit Zählern (#215). Ruft die Übergangs-Hilfe
     * auf, damit Konten aus der Zeit der EINEN Liste automatisch eine
     * Standard-Liste bekommen und keine Einträge verlieren.
     */
    lists: protectedProcedure
      .input(z.object({ lang: shoppingLangInput }).optional())
      .query(async ({ ctx, input }) => {
        await db.ensureDefaultShoppingList(
          ctx.user.id,
          pick(DEFAULT_SHOPPING_LIST_NAME, input?.lang ?? "de")
        );
        const [lists, items] = await Promise.all([
          db.getShoppingLists(ctx.user.id),
          db.getShoppingItems(ctx.user.id),
        ]);
        return lists.map(list => {
          const own = items.filter(i => i.listId === list.id);
          return {
            id: list.id,
            name: list.name,
            position: list.position,
            openCount: own.filter(i => !i.checked).length,
            doneCount: own.filter(i => i.checked).length,
          };
        });
      }),
    /** Neue Liste anlegen (Name getrimmt); gibt die Id zurück. */
    createList: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(MAX_SHOPPING_LIST_NAME_LENGTH),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const name = input.name.trim().slice(0, MAX_SHOPPING_LIST_NAME_LENGTH);
        if (!name) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Name darf nicht leer sein.",
          });
        }
        const id = await db.createShoppingList(ctx.user.id, name);
        return { id, name };
      }),
    /** Liste umbenennen (nur eigene). */
    renameList: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(1).max(MAX_SHOPPING_LIST_NAME_LENGTH),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireShoppingList(ctx.user.id, input.id);
        const name = input.name.trim().slice(0, MAX_SHOPPING_LIST_NAME_LENGTH);
        if (!name) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Name darf nicht leer sein.",
          });
        }
        await db.renameShoppingList(input.id, ctx.user.id, name);
        return { success: true } as const;
      }),
    /** Liste samt Einträgen löschen – die letzte Liste bleibt bestehen. */
    deleteList: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await requireShoppingList(ctx.user.id, input.id);
        const lists = await db.getShoppingLists(ctx.user.id);
        if (lists.length <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Die letzte Einkaufsliste lässt sich nicht löschen.",
          });
        }
        await db.deleteShoppingList(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /** Neue Reihenfolge der Listen speichern (fremde Ids werden ignoriert). */
    reorderLists: protectedProcedure
      .input(z.object({ listIds: z.array(z.number().int()).min(1).max(100) }))
      .mutation(async ({ ctx, input }) => {
        const lists = await db.getShoppingLists(ctx.user.id);
        const valid = new Set(lists.map(l => l.id));
        const ids = input.listIds.filter(id => valid.has(id));
        if (ids.length > 0) await db.reorderShoppingLists(ctx.user.id, ids);
        return { success: true } as const;
      }),
    /** Einträge einer Liste (ohne listId: erste bzw. Standard-Liste). */
    list: protectedProcedure
      .input(
        z
          .object({
            listId: z.number().int().positive().optional(),
            lang: shoppingLangInput,
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const list = await requireShoppingList(
          ctx.user.id,
          input?.listId,
          input?.lang ?? "de"
        );
        return db.getShoppingItems(ctx.user.id, list.id);
      }),
    add: protectedProcedure
      .input(
        z.object({
          listId: z.number().int().positive().optional(),
          name: z.string().min(1).max(160),
          category: shoppingCategoryInput.nullish(),
          quantity: z.string().max(40).nullish(),
          note: z.string().max(160).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await requireShoppingList(ctx.user.id, input.listId);
        const items = await db.getShoppingItems(ctx.user.id, list.id);
        const name = input.name.trim();
        // Duplikat-Schutz: steht der Name bereits unabgehakt auf der Liste
        // (case-insensitiv), wird kein zweiter Eintrag angelegt. Eine
        // mitgeschickte Menge/Notiz wird dann NICHT übernommen – der Client
        // zeigt einen Info-Toast, damit nichts stillschweigend verloren geht.
        const alreadyOpen = items.some(
          i => !i.checked && i.name.trim().toLowerCase() === name.toLowerCase()
        );
        if (alreadyOpen)
          return { success: true, added: false, listId: list.id } as const;
        const nextPosition =
          items.reduce((max, i) => Math.max(max, i.position), 0) + 1;
        await db.addShoppingItems([
          {
            userId: ctx.user.id,
            listId: list.id,
            name,
            position: nextPosition,
            category: input.category ?? null,
            quantity: input.quantity?.trim() || null,
            note: input.note?.trim() || null,
          },
        ]);
        return { success: true, added: true, listId: list.id } as const;
      }),
    /** Mehrere Einträge auf einmal (z. B. Zutaten eines Rezepts) – wahlweise
     * als blosser Name oder als Objekt mit optionaler Menge/Notiz. */
    addMany: protectedProcedure
      .input(
        z.object({
          listId: z.number().int().positive().optional(),
          names: z
            .array(
              z.union([
                z.string().min(1).max(160),
                z.object({
                  name: z.string().min(1).max(160),
                  quantity: z.string().max(40).nullish(),
                  note: z.string().max(160).nullish(),
                }),
              ])
            )
            .min(1)
            .max(100),
          category: shoppingCategoryInput.nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await requireShoppingList(ctx.user.id, input.listId);
        const items = await db.getShoppingItems(ctx.user.id, list.id);
        const nextPosition =
          items.reduce((max, i) => Math.max(max, i.position), 0) + 1;
        await db.addShoppingItems(
          input.names.map((entry, idx) => {
            const obj = typeof entry === "string" ? { name: entry } : entry;
            return {
              userId: ctx.user.id,
              listId: list.id,
              name: obj.name.trim(),
              position: nextPosition + idx,
              category: input.category ?? null,
              quantity: ("quantity" in obj && obj.quantity?.trim()) || null,
              note: ("note" in obj && obj.note?.trim()) || null,
            };
          })
        );
        return { added: input.names.length, listId: list.id };
      }),
    /**
     * Menge, Notiz und/oder Preis eines eigenen Eintrags setzen
     * (null/"" entfernt den Wert). Der Preis kommt als Rappen-Ganzzahl.
     */
    updateItem: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          quantity: z.string().max(40).nullish(),
          note: z.string().max(160).nullish(),
          priceRappen: z
            .number()
            .int()
            .min(0)
            .max(MAX_SHOPPING_PRICE_RAPPEN)
            .nullish(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.updateShoppingItemDetails(input.id, ctx.user.id, {
          ...(input.quantity !== undefined
            ? { quantity: input.quantity?.trim() || null }
            : {}),
          ...(input.note !== undefined
            ? { note: input.note?.trim() || null }
            : {}),
          ...(input.priceRappen !== undefined
            ? { priceRappen: input.priceRappen || null }
            : {}),
        })
      ),
    /**
     * Einkauf abschliessen (#234): die abgehakten, noch nicht verbuchten
     * Einträge mit Preis werden als EINE Ausgabe in die Reisekasse einer
     * Reise übernommen und danach als verbucht markiert. Ohne `itemIds`
     * zählen alle übernehmbaren Einträge der Liste.
     */
    bookToTrip: protectedProcedure
      .input(
        z.object({
          listId: z.number().int().positive().optional(),
          tripId: z.number().int().positive(),
          itemIds: z.array(z.number().int()).max(500).optional(),
          category: z.enum(EXPENSE_CATEGORIES).default("essen"),
          description: z.string().max(EXPENSE_DESCRIPTION_MAX_LENGTH).nullish(),
          day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          paidBy: z.string().min(1).max(EXPENSE_PAID_BY_MAX_LENGTH),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await requireShoppingList(ctx.user.id, input.listId);
        const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        const items = await db.getShoppingItems(ctx.user.id, list.id);
        const booking = shoppingBooking(items, input.itemIds);
        if (booking.count === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nichts zu übernehmen – keine abgehakten Preise offen.",
          });
        }
        const amountRappen = Math.min(booking.rappen, EXPENSE_MAX_RAPPEN);
        const expenseId = await db.addTripExpense({
          tripId: input.tripId,
          userId: ctx.user.id,
          amountRappen,
          category: input.category,
          description: input.description?.trim() || null,
          day: input.day,
          paidBy: input.paidBy.trim(),
        });
        await db.markShoppingItemsBooked(
          ctx.user.id,
          booking.itemIds,
          Number(expenseId)
        );
        return {
          expenseId: Number(expenseId),
          amountRappen,
          count: booking.count,
        };
      }),
    /** Laden-Kategorie eines Eintrags setzen; null entfernt sie wieder. */
    setCategory: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          category: shoppingCategoryInput.nullable(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.setShoppingItemCategory(input.id, ctx.user.id, input.category)
      ),
    /** Neue Reihenfolge (Drag-and-drop) innerhalb einer Liste speichern. */
    reorder: protectedProcedure
      .input(
        z.object({
          listId: z.number().int().positive().optional(),
          itemIds: z.array(z.number().int()).min(1).max(500),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await requireShoppingList(ctx.user.id, input.listId);
        const items = await db.getShoppingItems(ctx.user.id, list.id);
        const valid = new Set(items.map(i => i.id));
        // Nur eigene Einträge DIESER Liste umsortieren – fremde Ids ignorieren
        const ids = input.itemIds.filter(id => valid.has(id));
        if (ids.length > 0) await db.reorderShoppingItems(ctx.user.id, ids);
        return { success: true } as const;
      }),
    toggle: protectedProcedure
      .input(z.object({ id: z.number(), checked: z.boolean() }))
      .mutation(({ ctx, input }) =>
        db.setShoppingItemChecked(input.id, ctx.user.id, input.checked)
      ),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteShoppingItem(input.id, ctx.user.id)
      ),
    removeChecked: protectedProcedure
      .input(
        z.object({ listId: z.number().int().positive().optional() }).optional()
      )
      .mutation(async ({ ctx, input }) => {
        const list = await requireShoppingList(ctx.user.id, input?.listId);
        await db.deleteCheckedShoppingItems(ctx.user.id, list.id);
        return { success: true } as const;
      }),
    clear: protectedProcedure
      .input(
        z.object({ listId: z.number().int().positive().optional() }).optional()
      )
      .mutation(async ({ ctx, input }) => {
        const list = await requireShoppingList(ctx.user.id, input?.listId);
        await db.clearShoppingItems(ctx.user.id, list.id);
        return { success: true } as const;
      }),
    /** Teil-Link einer Liste erzeugen (idempotent): gibt den Token zurück. */
    share: protectedProcedure
      .input(
        z
          .object({
            listId: z.number().int().positive().optional(),
            expiresInDays: shareExpiryInput,
          })
          .optional()
      )
      .mutation(async ({ ctx, input }) => {
        const list = await requireShoppingList(ctx.user.id, input?.listId);
        const existing = await db.getShoppingShare(ctx.user.id, list.id);
        const expiresAt = shareExpiryFor(
          input?.expiresInDays,
          existing?.shareExpiresAt ?? null
        );
        if (existing) {
          await db.setShoppingShareExpiry(ctx.user.id, list.id, expiresAt);
          return { token: existing.shareToken, expiresAt };
        }
        const token = nanoid(16);
        await db.createShoppingShare(ctx.user.id, list.id, token, expiresAt);
        return { token, expiresAt };
      }),
    /** Teilen beenden: Token der Liste entfernen, Link wird ungültig. */
    unshare: protectedProcedure
      .input(
        z.object({ listId: z.number().int().positive().optional() }).optional()
      )
      .mutation(async ({ ctx, input }) => {
        const list = await requireShoppingList(ctx.user.id, input?.listId);
        await db.deleteShoppingShare(ctx.user.id, list.id);
        return { success: true } as const;
      }),
    /** Geteilte Einkaufsliste öffentlich abrufen (kein Login nötig). */
    sharedGet: publicProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .query(async ({ input }) => {
        const share = await db.getShoppingShareByToken(input.token);
        if (!share) {
          return {
            active: false as const,
            name: null as string | null,
            items: [] as {
              id: number;
              name: string;
              checked: boolean;
              category: string | null;
              quantity: string | null;
              note: string | null;
            }[],
          };
        }
        // Alt-Zeilen ohne listId zeigen weiterhin die Einträge ohne Liste –
        // sobald die Besitzerin die App öffnet, zieht ensureDefaultShoppingList
        // beides auf die Standard-Liste um, ohne dass der Link bricht.
        const list =
          share.listId === null
            ? undefined
            : await db.getShoppingList(share.listId, share.userId);
        const items =
          share.listId === null
            ? await db.getUnassignedShoppingItems(share.userId)
            : await db.getShoppingItems(share.userId, share.listId);
        return {
          active: true as const,
          name: list?.name ?? null,
          items: items.map(i => ({
            id: i.id,
            name: i.name,
            checked: i.checked,
            category: i.category,
            quantity: i.quantity,
            note: i.note,
          })),
        };
      }),
    /** Abhaken über den Teil-Link (kein Login nötig, Token dient als Berechtigung). */
    sharedToggle: publicProcedure
      .input(
        z.object({
          token: z.string().min(8).max(64),
          itemId: z.number(),
          checked: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        const share = await db.getShoppingShareByToken(input.token);
        if (!share) throw new Error("Geteilte Einkaufsliste nicht gefunden");
        const items =
          share.listId === null
            ? await db.getUnassignedShoppingItems(share.userId)
            : await db.getShoppingItems(share.userId, share.listId);
        if (!items.some(i => i.id === input.itemId))
          throw new Error("Eintrag gehört nicht zu dieser Liste");
        await db.setShoppingItemChecked(
          input.itemId,
          share.userId,
          input.checked
        );
        return { success: true } as const;
      }),
  }),

  /**
   * Gemeinsame Einkaufsliste pro Reise: Spiegel des shopping-Routers, aber
   * die Berechtigung läuft über canAccessTrip (Owner ODER Mitreisende*r)
   * statt über die userId der Einträge. Alle Schreibzugriffe sind zusätzlich
   * über tripId gescoped, damit keine fremden Zeilen erwischt werden.
   */
  tripShopping: router({
    /** Trip samt Reise-Einkaufsliste (trip null, wenn kein Zugriff besteht). */
    listByTrip: protectedProcedure
      .input(z.object({ tripId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
        if (!trip) {
          return {
            trip: null,
            items: [] as Awaited<ReturnType<typeof db.getTripShoppingItems>>,
          };
        }
        const items = await db.getTripShoppingItems(input.tripId);
        return { trip, items };
      }),
    add: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          name: z.string().min(1).max(160),
          category: shoppingCategoryInput.nullish(),
          quantity: z.string().max(40).nullish(),
          note: z.string().max(160).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireTripAccess(input.tripId, ctx.user.id);
        const items = await db.getTripShoppingItems(input.tripId);
        const name = input.name.trim();
        // Duplikat-Schutz wie auf der persönlichen Liste: steht der Name
        // bereits unabgehakt auf der Liste, wird kein zweiter Eintrag angelegt.
        const alreadyOpen = items.some(
          i => !i.checked && i.name.trim().toLowerCase() === name.toLowerCase()
        );
        if (alreadyOpen) return { success: true, added: false } as const;
        const nextPosition =
          items.reduce((max, i) => Math.max(max, i.position), 0) + 1;
        await db.addTripShoppingItems([
          {
            tripId: input.tripId,
            createdByUserId: ctx.user.id,
            name,
            position: nextPosition,
            category: input.category ?? null,
            quantity: input.quantity?.trim() || null,
            note: input.note?.trim() || null,
          },
        ]);
        await noteTripChange(
          input.tripId,
          ctx.user.id,
          "shopping",
          "add",
          name
        );
        return { success: true, added: true } as const;
      }),
    /** Mehrere Einträge auf einmal (z. B. Zutaten des Menüplans). */
    addMany: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          names: z
            .array(
              z.union([
                z.string().min(1).max(160),
                z.object({
                  name: z.string().min(1).max(160),
                  quantity: z.string().max(40).nullish(),
                  note: z.string().max(160).nullish(),
                }),
              ])
            )
            .min(1)
            .max(100),
          category: shoppingCategoryInput.nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireTripAccess(input.tripId, ctx.user.id);
        const items = await db.getTripShoppingItems(input.tripId);
        const nextPosition =
          items.reduce((max, i) => Math.max(max, i.position), 0) + 1;
        await db.addTripShoppingItems(
          input.names.map((entry, idx) => {
            const obj = typeof entry === "string" ? { name: entry } : entry;
            return {
              tripId: input.tripId,
              createdByUserId: ctx.user.id,
              name: obj.name.trim(),
              position: nextPosition + idx,
              category: input.category ?? null,
              quantity: ("quantity" in obj && obj.quantity?.trim()) || null,
              note: ("note" in obj && obj.note?.trim()) || null,
            };
          })
        );
        // Ein Eintrag pro Posten: Der Verlauf bündelt sie beim Anzeigen zu
        // einer Zeile mit Anzahl (shared/tripHistory.ts) – hier einzeln
        // festhalten, damit die Namen erhalten bleiben.
        for (const entry of input.names) {
          const name = typeof entry === "string" ? entry : entry.name;
          await noteTripChange(
            input.tripId,
            ctx.user.id,
            "shopping",
            "add",
            name.trim()
          );
        }
        return { added: input.names.length };
      }),
    /** Menge, Notiz und/oder Preis eines Eintrags setzen (null/"" entfernt). */
    updateItem: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          id: z.number(),
          quantity: z.string().max(40).nullish(),
          note: z.string().max(160).nullish(),
          priceRappen: z
            .number()
            .int()
            .min(0)
            .max(MAX_SHOPPING_PRICE_RAPPEN)
            .nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireTripAccess(input.tripId, ctx.user.id);
        await db.updateTripShoppingItemDetails(input.id, input.tripId, {
          ...(input.quantity !== undefined
            ? { quantity: input.quantity?.trim() || null }
            : {}),
          ...(input.note !== undefined
            ? { note: input.note?.trim() || null }
            : {}),
          ...(input.priceRappen !== undefined
            ? { priceRappen: input.priceRappen || null }
            : {}),
        });
        return { success: true } as const;
      }),
    /**
     * Einkauf abschliessen (#234): abgehakte, unverbuchte Einträge mit Preis
     * als eine Ausgabe in die Reisekasse DIESER Reise übernehmen. Die Reise
     * steht damit fest – auf der Reise-Liste gibt es nichts zu wählen.
     */
    bookToTrip: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          itemIds: z.array(z.number().int()).max(500).optional(),
          category: z.enum(EXPENSE_CATEGORIES).default("essen"),
          description: z.string().max(EXPENSE_DESCRIPTION_MAX_LENGTH).nullish(),
          day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          paidBy: z.string().min(1).max(EXPENSE_PAID_BY_MAX_LENGTH),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireTripAccess(input.tripId, ctx.user.id);
        const items = await db.getTripShoppingItems(input.tripId);
        const booking = shoppingBooking(items, input.itemIds);
        if (booking.count === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nichts zu übernehmen – keine abgehakten Preise offen.",
          });
        }
        const amountRappen = Math.min(booking.rappen, EXPENSE_MAX_RAPPEN);
        const expenseId = await db.addTripExpense({
          tripId: input.tripId,
          userId: ctx.user.id,
          amountRappen,
          category: input.category,
          description: input.description?.trim() || null,
          day: input.day,
          paidBy: input.paidBy.trim(),
        });
        await db.markTripShoppingItemsBooked(
          input.tripId,
          booking.itemIds,
          Number(expenseId)
        );
        return {
          expenseId: Number(expenseId),
          amountRappen,
          count: booking.count,
        };
      }),
    /** Laden-Kategorie eines Eintrags setzen; null entfernt sie wieder. */
    setCategory: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          id: z.number(),
          category: shoppingCategoryInput.nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireTripAccess(input.tripId, ctx.user.id);
        await db.setTripShoppingItemCategory(
          input.id,
          input.tripId,
          input.category
        );
        return { success: true } as const;
      }),
    /** Neue Reihenfolge (Drag-and-drop) speichern: Positionen 0..n. */
    reorder: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          itemIds: z.array(z.number().int()).min(1).max(500),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireTripAccess(input.tripId, ctx.user.id);
        const items = await db.getTripShoppingItems(input.tripId);
        const valid = new Set(items.map(i => i.id));
        // Nur Einträge dieser Reise umsortieren – fremde IDs werden ignoriert
        const ids = input.itemIds.filter(id => valid.has(id));
        if (ids.length > 0)
          await db.reorderTripShoppingItems(input.tripId, ids);
        return { success: true } as const;
      }),
    toggle: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          id: z.number(),
          checked: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireTripAccess(input.tripId, ctx.user.id);
        await db.setTripShoppingItemChecked(
          input.id,
          input.tripId,
          input.checked
        );
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ tripId: z.number().int().positive(), id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await requireTripAccess(input.tripId, ctx.user.id);
        await db.deleteTripShoppingItem(input.id, input.tripId);
        await noteTripChange(input.tripId, ctx.user.id, "shopping", "remove");
        return { success: true } as const;
      }),
    /** Alle abgehakten Einträge der Reise-Liste entfernen. */
    removeChecked: protectedProcedure
      .input(z.object({ tripId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await requireTripAccess(input.tripId, ctx.user.id);
        await db.deleteCheckedTripShoppingItems(input.tripId);
        return { success: true } as const;
      }),
  }),

  energy: router({
    consumers: protectedProcedure.query(({ ctx }) =>
      db.getPowerConsumers(ctx.user.id)
    ),
    add: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(160),
          watts: z.number().min(0).max(10000),
          hoursPerDay: z.number().min(0).max(24),
        })
      )
      .mutation(({ ctx, input }) =>
        db.addPowerConsumer({ userId: ctx.user.id, ...input })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          watts: z.number().min(0).max(10000).optional(),
          hoursPerDay: z.number().min(0).max(24).optional(),
          enabled: z.boolean().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updatePowerConsumer(id, ctx.user.id, data);
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deletePowerConsumer(input.id, ctx.user.id)
      ),
  }),

  food: router({
    list: protectedProcedure.query(({ ctx }) => db.getFoodItems(ctx.user.id)),
    add: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(160),
          quantity: z.string().max(80).optional(),
          /** Lagerort (#233): ohne Angabe landet der Eintrag in der Kühlbox. */
          storage: z.enum(FOOD_STORAGES).optional(),
          unit: z.enum(FOOD_UNITS).nullish(),
          category: z.enum(FOOD_CATEGORIES).nullish(),
          expiryDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .nullish(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.addFoodItem({
          userId: ctx.user.id,
          name: input.name,
          quantity: input.quantity,
          storage: input.storage ?? DEFAULT_FOOD_STORAGE,
          unit: input.unit ?? null,
          category: input.category ?? null,
          expiryDate: input.expiryDate ?? null,
        })
      ),
    /**
     * Menge, Einheit, Kategorie, Lagerort und/oder MHD eines Eintrags
     * anpassen (null = Feld leeren). Über `storage` wandert ein Vorrat
     * zwischen Kühlbox und Trockenvorrat-Schrank.
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          quantity: z
            .string()
            .trim()
            .max(MAX_FOOD_ITEM_QUANTITY_LENGTH)
            .nullish(),
          storage: z.enum(FOOD_STORAGES).optional(),
          unit: z.enum(FOOD_UNITS).nullish(),
          category: z.enum(FOOD_CATEGORIES).nullish(),
          expiryDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const data: {
          quantity?: string | null;
          storage?: FoodStorage;
          unit?: string | null;
          category?: string | null;
          expiryDate?: string | null;
        } = {};
        if (input.quantity !== undefined)
          data.quantity = input.quantity || null;
        if (input.storage !== undefined) data.storage = input.storage;
        if (input.unit !== undefined) data.unit = input.unit ?? null;
        if (input.category !== undefined)
          data.category = input.category ?? null;
        if (input.expiryDate !== undefined)
          data.expiryDate = input.expiryDate ?? null;
        await db.updateFoodItem(input.id, ctx.user.id, data);
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteFoodItem(input.id, ctx.user.id)),
  }),
  foodTemplates: router({
    /** Eigene Kühlbox-Vorlagen samt geparsten Einträgen (neuste zuerst). */
    list: protectedProcedure.query(async ({ ctx }) => {
      const rows = await db.getFoodTemplates(ctx.user.id);
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        items: parseFoodTemplateItems(row.itemsJson),
        createdAt: row.createdAt,
      }));
    }),
    /** Aktuelle Kühlbox-Füllung als Vorlage einfrieren (Name + Restlaufzeit in Tagen). */
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(120),
          items: z
            .array(
              z.object({
                name: z.string().trim().min(1).max(MAX_FOOD_ITEM_NAME_LENGTH),
                quantity: z
                  .string()
                  .trim()
                  .min(1)
                  .max(MAX_FOOD_ITEM_QUANTITY_LENGTH)
                  .optional(),
                expiryDays: z
                  .number()
                  .int()
                  .min(0)
                  .max(MAX_EXPIRY_DAYS)
                  .optional(),
                storage: z.enum(FOOD_STORAGES).optional(),
                unit: z.enum(FOOD_UNITS).optional(),
                category: z.enum(FOOD_CATEGORIES).optional(),
              })
            )
            .min(1)
            .max(MAX_FOOD_TEMPLATE_ITEMS),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const templateId = await db.createFoodTemplate({
          userId: ctx.user.id,
          name: input.name,
          itemsJson: JSON.stringify(input.items),
        });
        return { templateId };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteFoodTemplate(input.id, ctx.user.id)
      ),
    /**
     * Vorlage in die Kühlbox laden: expiryDays wird beim Einfügen in ein
     * konkretes MHD (heute + X Tage) umgerechnet; gleichnamige vorhandene
     * Einträge (case-insensitiv, getrimmt) werden übersprungen.
     */
    applyTemplate: protectedProcedure
      .input(
        z.object({
          templateId: z.number(),
          /** «Heute» aus Sicht des Geräts – vermeidet Zeitzonen-Sprünge. */
          today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const template = await db.getFoodTemplate(
          input.templateId,
          ctx.user.id
        );
        if (!template)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vorlage nicht gefunden",
          });
        const items = parseFoodTemplateItems(template.itemsJson);
        const existing = await db.getFoodItems(ctx.user.id);
        // Doppelt-Schutz pro LAGER (#233): dieselbe Konserve darf in der
        // Kühlbox und im Trockenvorrat stehen, im selben Lager aber nur einmal.
        const keyOf = (name: string, storage: string | null | undefined) =>
          `${normalizeFoodStorage(storage)}:${name.trim().toLowerCase()}`;
        const existingKeys = new Set(
          existing.map(i => keyOf(i.name, i.storage))
        );
        const toInsert: typeof items = [];
        let skipped = 0;
        for (const item of items) {
          const key = keyOf(item.name, item.storage);
          if (existingKeys.has(key)) {
            skipped += 1;
            continue;
          }
          existingKeys.add(key);
          toInsert.push(item);
        }
        await db.addFoodItems(
          toInsert.map(item => ({
            userId: ctx.user.id,
            name: item.name,
            quantity: item.quantity,
            storage: normalizeFoodStorage(item.storage),
            unit: item.unit ?? null,
            category: item.category ?? null,
            expiryDate: expiryDateFromDays(input.today, item.expiryDays),
          }))
        );
        return { added: toInsert.length, skipped };
      }),
  }),
  home: router({
    /** Heim-Standort der Nutzer*in (null = keiner gesetzt). */
    get: protectedProcedure.query(async ({ ctx }) => {
      const home = await db.getHomeLocation(ctx.user.id);
      return home ?? null;
    }),
    /** Heim-Standort setzen bzw. ersetzen (Name + Koordinaten). */
    set: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(80),
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertHomeLocation({ userId: ctx.user.id, ...input });
        return { success: true } as const;
      }),
    /** Heim-Standort wieder entfernen. */
    remove: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteHomeLocation(ctx.user.id);
      return { success: true } as const;
    }),
  }),
  push: router({
    /** Öffentlicher VAPID-Schlüssel (null = Push serverseitig nicht konfiguriert). */
    vapidKey: publicProcedure.query(async () => {
      const { pushConfigured } = await import("./push");
      return pushConfigured()
        ? { publicKey: process.env.VAPID_PUBLIC_KEY! }
        : { publicKey: null };
    }),
    subscribe: protectedProcedure
      .input(
        z.object({
          endpoint: z.string().min(10).max(500),
          p256dh: z.string().min(10).max(255),
          auth: z.string().min(5).max(255),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { saveSubscription } = await import("./push");
        await saveSubscription(
          ctx.user.id,
          input.endpoint,
          input.p256dh,
          input.auth
        );
        return { success: true } as const;
      }),
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string().min(10).max(500) }))
      .mutation(async ({ ctx, input }) => {
        const { deleteSubscription } = await import("./push");
        await deleteSubscription(ctx.user.id, input.endpoint);
        return { success: true } as const;
      }),
    status: protectedProcedure
      .input(z.object({ endpoint: z.string().min(10).max(500) }))
      .query(async ({ ctx, input }) => {
        const { hasSubscription } = await import("./push");
        return {
          subscribed: await hasSubscription(ctx.user.id, input.endpoint),
        };
      }),
    /** Mitteilungs-Flags des Abos dieses Geräts (null = kein Abo gespeichert). */
    getPrefs: protectedProcedure
      .input(z.object({ endpoint: z.string().min(10).max(500) }))
      .query(async ({ ctx, input }) => {
        const { getSubscriptionPrefs } = await import("./push");
        return {
          prefs: await getSubscriptionPrefs(ctx.user.id, input.endpoint),
        };
      }),
    /**
     * Mitteilungs-Flags des Abos dieses Geräts setzen (teilweise erlaubt).
     * Die beiden Warn-Schwellen akzeptieren zusätzlich null = Standardwert.
     */
    setPrefs: protectedProcedure
      .input(
        z.object({
          endpoint: z.string().min(10).max(500),
          wantsWeather: z.boolean().optional(),
          wantsFood: z.boolean().optional(),
          wantsTrips: z.boolean().optional(),
          wantsAstro: z.boolean().optional(),
          wantsGear: z.boolean().optional(),
          wantsHeat: z.boolean().optional(),
          windThresholdKmh: z
            .number()
            .int()
            .min(WIND_THRESHOLD_MIN_KMH)
            .max(WIND_THRESHOLD_MAX_KMH)
            .nullable()
            .optional(),
          rainThresholdMm: z
            .number()
            .int()
            .min(RAIN_THRESHOLD_MIN_MM)
            .max(RAIN_THRESHOLD_MAX_MM)
            .nullable()
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { setSubscriptionPrefs } = await import("./push");
        const { endpoint, ...prefs } = input;
        await setSubscriptionPrefs(ctx.user.id, endpoint, prefs);
        return { success: true } as const;
      }),
    /**
     * Benachrichtigungs-Verlauf (#201): die eigenen Meldungen, neueste zuerst.
     * Mehr als PUSH_LOG_LIMIT Einträge gibt es nie – server/push.ts räumt
     * ältere beim Schreiben weg.
     */
    log: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).optional() }))
      .query(async ({ ctx, input }) => {
        const { getPushLog, PUSH_LOG_LIMIT } = await import("./push");
        return getPushLog(ctx.user.id, input.limit ?? PUSH_LOG_LIMIT);
      }),
  }),

  recipes: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getCustomRecipes(ctx.user.id)
    ),
    save: protectedProcedure
      .input(
        z.object({
          /** Ohne id wird neu angelegt, mit id das eigene Rezept aktualisiert */
          id: z.number().int().positive().optional(),
          name: z.string().min(1).max(120),
          method: z.enum(RECIPE_METHODS),
          timeMinutes: z.number().int().min(5).max(600),
          servings: z.number().int().min(1).max(20),
          difficulty: z.enum(RECIPE_DIFFICULTIES),
          onePot: z.boolean().default(false),
          kidFriendly: z.boolean().default(false),
          ingredients: z.array(z.string().min(1).max(120)).min(1).max(30),
          steps: z.array(z.string().min(1).max(600)).min(1).max(20),
          tip: z.string().max(600).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const data = {
          name: input.name.trim(),
          method: input.method,
          timeMinutes: input.timeMinutes,
          servings: input.servings,
          difficulty: input.difficulty,
          onePot: input.onePot,
          kidFriendly: input.kidFriendly,
          ingredientsJson: JSON.stringify(input.ingredients.map(s => s.trim())),
          stepsJson: JSON.stringify(input.steps.map(s => s.trim())),
          tip: input.tip?.trim() || null,
        };
        if (input.id) {
          const own = await db.getCustomRecipes(ctx.user.id);
          if (!own.some(r => r.id === input.id)) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Rezept nicht gefunden.",
            });
          }
          await db.updateCustomRecipe(input.id, ctx.user.id, data);
          return { id: input.id };
        }
        const id = await db.addCustomRecipe({ userId: ctx.user.id, ...data });
        return { id };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Papierkorb (#295): erst der Schnappschuss, dann das Löschen.
        // Das Foto BLEIBT auf dem Webspace liegen – ein Rezept ohne sein
        // Bild wiederherzustellen wäre keine Wiederherstellung. Entfernt
        // wird die Datei, wenn der Papierkorb-Eintrag abläuft.
        const { capture } = await import("./trash");
        await capture("recipe", input.id, ctx.user.id);
        await db.deleteCustomRecipe(input.id, ctx.user.id);
      }),
    /** Foto eines eigenen Rezepts entfernen (Feld + Datei auf dem Webspace). */
    removePhoto: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getCustomRecipe(input.id, ctx.user.id);
        if (!recipe) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Rezept nicht gefunden.",
          });
        }
        if (recipe.imageFileName) {
          await db.updateCustomRecipe(input.id, ctx.user.id, {
            imageFileName: null,
          });
          const { recipePhotoStorage } = await import("./photoStorage");
          await recipePhotoStorage.deleteFiles([recipe.imageFileName]);
        }
        return { success: true } as const;
      }),
    /** Teil-Link für ein eigenes Rezept erzeugen: gibt den Token zurück. */
    share: protectedProcedure
      .input(z.object({ id: z.number(), expiresInDays: shareExpiryInput }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getCustomRecipe(input.id, ctx.user.id);
        if (!recipe)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Rezept nicht gefunden.",
          });
        const expiresAt = shareExpiryFor(
          input.expiresInDays,
          recipe.shareExpiresAt
        );
        const token = recipe.shareToken ?? nanoid(16);
        await db.setCustomRecipeShareToken(
          input.id,
          ctx.user.id,
          token,
          expiresAt
        );
        return { token, expiresAt };
      }),
    /** Teilen des Rezepts beenden: Token entfernen, Link wird ungültig. */
    unshare: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setCustomRecipeShareToken(input.id, ctx.user.id, null);
        return { success: true } as const;
      }),
    /**
     * Geteiltes Rezept öffentlich abrufen (kein Login nötig): Titel,
     * Eckdaten, Zutaten und Schritte. Das Rezept-FOTO bleibt bewusst privat
     * (es liegt hinter der Session-geschützten Auslieferung) und wird hier
     * nicht mitgeliefert.
     */
    sharedGet: publicProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .query(async ({ input }) => {
        const recipe = await db.getCustomRecipeByToken(input.token);
        if (!recipe) return { recipe: null };
        return {
          recipe: {
            name: recipe.name,
            method: normalizeMethod(recipe.method),
            difficulty: normalizeDifficulty(recipe.difficulty),
            timeMinutes: recipe.timeMinutes,
            servings: recipe.servings,
            onePot: recipe.onePot,
            kidFriendly: recipe.kidFriendly,
            ingredients: parseStringList(recipe.ingredientsJson),
            steps: parseStringList(recipe.stepsJson, 20),
            tip: recipe.tip,
          },
        };
      }),
    /** Geteiltes Rezept als eigenes Rezept übernehmen (Kopie ohne Foto). */
    importShared: protectedProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getCustomRecipeByToken(input.token);
        if (!recipe)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Geteiltes Rezept nicht gefunden.",
          });
        // Über die defensiven Parser re-serialisieren – kaputte Daten bleiben draussen
        const ingredients = parseStringList(recipe.ingredientsJson);
        const steps = parseStringList(recipe.stepsJson, 20);
        if (ingredients.length === 0 || steps.length === 0)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Das geteilte Rezept ist unvollständig.",
          });
        const id = await db.addCustomRecipe({
          userId: ctx.user.id,
          name: recipe.name,
          method: normalizeMethod(recipe.method),
          timeMinutes: recipe.timeMinutes,
          servings: recipe.servings,
          difficulty: normalizeDifficulty(recipe.difficulty),
          onePot: recipe.onePot,
          kidFriendly: recipe.kidFriendly,
          ingredientsJson: JSON.stringify(ingredients),
          stepsJson: JSON.stringify(steps),
          tip: recipe.tip,
        });
        return { id };
      }),
  }),

  hunts: router({
    list: protectedProcedure.query(({ ctx }) => db.getCustomHunts(ctx.user.id)),
    save: protectedProcedure
      .input(
        z.object({
          /** Ohne id wird neu angelegt, mit id die eigene Jagd aktualisiert */
          id: z.number().int().positive().optional(),
          title: z.string().min(1).max(140),
          ageHint: z.string().max(80).nullish(),
          durationMinutes: z.number().int().min(5).max(240).default(30),
          intro: z.string().min(1).max(2000),
          preparation: z.string().max(2000).nullish(),
          finale: z.string().min(1).max(2000),
          stations: z
            .array(
              z.object({
                title: z.string().min(1).max(140),
                story: z.string().max(1000).default(""),
                task: z.string().min(1).max(1000),
                hint: z.string().max(500).optional(),
                letter: z.string().max(2).optional(),
              })
            )
            .min(1)
            .max(MAX_STATIONS),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const stations = input.stations.map(s => ({
          title: s.title.trim(),
          story: s.story.trim(),
          task: s.task.trim(),
          hint: s.hint?.trim() || undefined,
          letter: s.letter?.trim().slice(0, 1).toUpperCase() || undefined,
        }));
        const data = {
          title: input.title.trim(),
          ageHint: input.ageHint?.trim() || null,
          durationMinutes: input.durationMinutes,
          intro: input.intro.trim(),
          preparation: input.preparation?.trim() || null,
          finale: input.finale.trim(),
          stationsJson: JSON.stringify(stations),
          solutionWord: solutionWordFromStations(stations),
        };
        if (input.id) {
          const own = await db.getCustomHunts(ctx.user.id);
          if (!own.some(h => h.id === input.id)) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Schnitzeljagd nicht gefunden.",
            });
          }
          await db.updateCustomHunt(input.id, ctx.user.id, data);
          return { id: input.id };
        }
        const id = await db.addCustomHunt({ userId: ctx.user.id, ...data });
        return { id };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteCustomHunt(input.id, ctx.user.id)),
  }),

  quizzes: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getCustomQuizzes(ctx.user.id)
    ),
    create: protectedProcedure
      .input(customQuizInput)
      .mutation(async ({ ctx, input }) => {
        const id = await db.addCustomQuiz({
          userId: ctx.user.id,
          title: input.title.trim(),
          questionsJson: serializeQuizQuestions(input.questions),
        });
        return { id };
      }),
    update: protectedProcedure
      .input(customQuizInput.extend({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const own = await db.getCustomQuizzes(ctx.user.id);
        if (!own.some(q => q.id === input.id)) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Quiz nicht gefunden.",
          });
        }
        await db.updateCustomQuiz(input.id, ctx.user.id, {
          title: input.title.trim(),
          questionsJson: serializeQuizQuestions(input.questions),
        });
        return { id: input.id };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteCustomQuiz(input.id, ctx.user.id)),
    /** Teil-Link für ein eigenes Quiz erzeugen: gibt den Token zurück. */
    share: protectedProcedure
      .input(z.object({ id: z.number(), expiresInDays: shareExpiryInput }))
      .mutation(async ({ ctx, input }) => {
        const quiz = await db.getCustomQuiz(input.id, ctx.user.id);
        if (!quiz)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Quiz nicht gefunden.",
          });
        const expiresAt = shareExpiryFor(
          input.expiresInDays,
          quiz.shareExpiresAt
        );
        const token = quiz.shareToken ?? nanoid(16);
        await db.setCustomQuizShareToken(
          input.id,
          ctx.user.id,
          token,
          expiresAt
        );
        return { token, expiresAt };
      }),
    /** Teilen des Quiz beenden: Token entfernen, Link wird ungültig. */
    unshare: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setCustomQuizShareToken(input.id, ctx.user.id, null);
        return { success: true } as const;
      }),
    /** Geteiltes Quiz öffentlich abrufen (kein Login nötig) – ohne Lösungen. */
    sharedGet: publicProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .query(async ({ input }) => {
        const quiz = await db.getCustomQuizByToken(input.token);
        if (!quiz) return { quiz: null };
        const questions = parseQuizQuestions(quiz.questionsJson);
        return {
          quiz: {
            title: quiz.title,
            questionCount: questions.length,
            // Nur die erste Frage als Vorgeschmack – Antworten bleiben geheim
            sampleQuestion: questions[0]?.question ?? null,
          },
        };
      }),
    /** Geteiltes Quiz als eigenes Quiz übernehmen (Kopie). */
    importShared: protectedProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const quiz = await db.getCustomQuizByToken(input.token);
        if (!quiz)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Geteiltes Quiz nicht gefunden.",
          });
        // Über den defensiven Parser re-serialisieren – kaputte Daten bleiben draussen
        const questions = parseQuizQuestions(quiz.questionsJson);
        if (questions.length === 0)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Das geteilte Quiz hat keine gültigen Fragen.",
          });
        const id = await db.addCustomQuiz({
          userId: ctx.user.id,
          title: quiz.title,
          questionsJson: JSON.stringify(questions),
        });
        return { id };
      }),
  }),

  /** Familien-Modus: Kinder-Profile, Abzeichen und Ereignis-Zähler. */
  family: router({
    children: router({
      list: protectedProcedure.query(({ ctx }) =>
        db.getFamilyChildren(ctx.user.id)
      ),
      add: protectedProcedure
        .input(z.object({ name: z.string().trim().min(1).max(60) }))
        .mutation(async ({ ctx, input }) => {
          const id = await db.addFamilyChild({
            userId: ctx.user.id,
            name: input.name.trim(),
          });
          return { id };
        }),
      rename: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            name: z.string().trim().min(1).max(60),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const child = await db.getFamilyChild(input.id, ctx.user.id);
          if (!child) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Kind nicht gefunden.",
            });
          }
          await db.renameFamilyChild(input.id, ctx.user.id, input.name.trim());
          return { success: true } as const;
        }),
      /**
       * Kind entfernen – Abzeichen, Zähler und Reisepass-Einträge gehen
       * mit.
       */
      remove: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(({ ctx, input }) =>
          db.deleteFamilyChild(input.id, ctx.user.id)
        ),
    }),
    /**
     * Reisepass (#292): wer war auf welcher Reise dabei.
     *
     * Gespeichert wird die ABWESENHEIT – ohne Eintrag war die Person
     * dabei. Begründung in shared/passport.ts.
     */
    passport: router({
      absences: protectedProcedure.query(({ ctx }) =>
        db.getPassportAbsences(ctx.user.id)
      ),
      setPresence: protectedProcedure
        .input(
          z.object({
            childId: z.number().int().positive(),
            tripId: z.number().int().positive(),
            present: z.boolean(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          // Beide Seiten prüfen: Ohne das könnte man über eine fremde
          // childId oder tripId Zeilen im eigenen Konto anlegen, die auf
          // fremde Daten zeigen.
          const child = await db.getFamilyChild(input.childId, ctx.user.id);
          if (!child) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Person nicht gefunden.",
            });
          }
          const trip = await db.getTripLog(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Reise nicht gefunden.",
            });
          }
          await db.setPassportPresence(
            ctx.user.id,
            input.childId,
            input.tripId,
            input.present
          );
          return { success: true } as const;
        }),
    }),
    badges: router({
      /** Abzeichen eines eigenen Kindes (leere Liste bei fremder childId). */
      listByChild: protectedProcedure
        .input(z.object({ childId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          const child = await db.getFamilyChild(input.childId, ctx.user.id);
          if (!child) {
            return [] as Awaited<ReturnType<typeof db.getChildBadges>>;
          }
          return db.getChildBadges(ctx.user.id, input.childId);
        }),
      /** Abzeichen vergeben – idempotent (zweite Vergabe ist ein No-op). */
      award: protectedProcedure
        .input(
          z.object({
            childId: z.number().int().positive(),
            badgeId: z.string().min(1).max(40),
          })
        )
        .mutation(async ({ ctx, input }) => {
          if (!isBadgeId(input.badgeId)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Unbekanntes Abzeichen.",
            });
          }
          const child = await db.getFamilyChild(input.childId, ctx.user.id);
          if (!child) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Kind nicht gefunden.",
            });
          }
          await db.awardChildBadge(ctx.user.id, input.childId, input.badgeId);
          return { success: true } as const;
        }),
    }),
    stats: router({
      /**
       * Abgeschlossene Jagd/Quiz atomar in den Zählern des Kindes
       * fortschreiben; liefert den neuen Stand für die Abzeichen-Prüfung.
       */
      record: protectedProcedure
        .input(
          z.object({
            childId: z.number().int().positive(),
            type: z.enum(["huntCompleted", "quizCompleted"]),
            correctStreak: z.number().int().min(0).max(1000).optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const child = await db.getFamilyChild(input.childId, ctx.user.id);
          if (!child) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Kind nicht gefunden.",
            });
          }
          const stats = await db.recordChildEvent(
            ctx.user.id,
            input.childId,
            input.type === "huntCompleted"
              ? { hunt: true }
              : { quiz: true, streak: input.correctStreak }
          );
          return {
            huntsCompleted: stats?.huntsCompleted ?? 0,
            quizzesCompleted: stats?.quizzesCompleted ?? 0,
            bestStreak: stats?.bestStreak ?? 0,
          };
        }),
    }),
  }),

  settings: router({
    /** Alle synchronisierten Einstellungen als key → JSON-String. */
    all: protectedProcedure.query(async ({ ctx }) => {
      const rows = await db.getUserSettings(ctx.user.id);
      return Object.fromEntries(rows.map(r => [r.key, r.value])) as Record<
        string,
        string
      >;
    }),
    set: protectedProcedure
      .input(
        z.object({
          key: z.enum(SYNCED_SETTING_KEYS),
          value: z.string().max(SETTING_VALUE_MAX_LENGTH),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserSetting(ctx.user.id, input.key, input.value);
        return { success: true } as const;
      }),
  }),

  trips: router({
    /** Buchungsbestätigung entfernen (#279) – Datei und Verweis. */
    removeReservation: protectedProcedure
      .input(z.object({ tripId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const trip = await db.getTripLog(input.tripId, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Reise nicht gefunden.",
          });
        }
        if (trip.reservationFileName) {
          await db.updateTripLog(input.tripId, ctx.user.id, {
            reservationFileName: null,
          });
          const { reservationStorage } = await import("./photoStorage");
          await reservationStorage.deleteFiles([trip.reservationFileName]);
        }
        return { success: true } as const;
      }),
    /**
     * Eigene Reisen plus Reisen, bei denen man eingeladenes Mitglied ist –
     * Mitglieds-Trips tragen role "member" und den Namen der Besitzerin/des
     * Besitzers als Zusatzinfo.
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      const [own, member] = await Promise.all([
        db.getTripLogs(ctx.user.id),
        db.getMemberTripLogs(ctx.user.id),
      ]);
      // «geteilt»-Markierung eigener Reisen (mind. 1 Mitglied) in EINER
      // Abfrage – der Client zeigt dafür z. B. die Reise-Einkaufsliste an
      const sharedOwnIds = await db.getSharedTripIds(own.map(t => t.id));
      const merged = [
        ...own.map(trip => ({
          ...trip,
          role: "owner" as const,
          ownerName: null as string | null,
          spotName: null as string | null,
          shared: sharedOwnIds.has(trip.id),
        })),
        ...member.map(({ trip, ownerName, ownerEmail, spotName }) => ({
          ...trip,
          role: "member" as const,
          ownerName: ownerName ?? ownerEmail ?? null,
          spotName,
          shared: true,
        })),
      ];
      merged.sort(
        (a, b) => b.startDate.localeCompare(a.startDate) || b.id - a.id
      );
      return merged;
    }),
    add: protectedProcedure
      .input(
        z
          .object({
            spotId: z.number().int().positive().nullish(),
            packListId: z.number().int().positive().nullish(),
            location: z.string().max(140).nullish(),
            title: z.string().max(140).nullish(),
            notes: z.string().max(2000).nullish(),
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            rating: z.number().int().min(1).max(5).nullable().optional(),
            arrivalTime: z
              .string()
              .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
              .nullish(),
            departureTime: z
              .string()
              .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
              .nullish(),
          })
          .refine(v => v.endDate >= v.startDate, {
            message: "Die Abreise darf nicht vor der Anreise liegen.",
          })
          .refine(
            v => v.spotId != null || (v.location ?? "").trim().length > 0,
            {
              message: "Bitte einen Zeltplatz wählen oder einen Ort eintragen.",
            }
          )
      )
      .mutation(async ({ ctx, input }) => {
        // Nur eigene Zeltplatz-Favoriten dürfen verknüpft werden
        if (input.spotId != null) {
          const spots = await db.getCampSpots(ctx.user.id);
          if (!spots.some(s => s.id === input.spotId)) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Zeltplatz nicht gefunden.",
            });
          }
        }
        // Nur eigene Packlisten dürfen verknüpft werden
        if (input.packListId != null) {
          const list = await db.getPackList(input.packListId, ctx.user.id);
          if (!list) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Packliste nicht gefunden.",
            });
          }
        }
        const id = await db.addTripLog({
          userId: ctx.user.id,
          spotId: input.spotId ?? null,
          packListId: input.packListId ?? null,
          location: input.location?.trim() || null,
          title: input.title?.trim() || null,
          notes: input.notes?.trim() || null,
          startDate: input.startDate,
          endDate: input.endDate,
          rating: input.rating ?? null,
          arrivalTime: input.arrivalTime ?? null,
          departureTime: input.departureTime ?? null,
        });
        return { id };
      }),
    /**
     * Reise aus einer Vorlage anlegen (#284): Zeitraum, Packliste und
     * Menüplan in EINEM Schritt.
     *
     * Gerechnet wird alles serverseitig aus der Vorlage – der Client
     * schickt nur, WELCHE Vorlage, ab WANN und WOHIN. So kann kein Gerät
     * einen Menüplan schreiben, der nicht zum Zeitraum passt.
     *
     * Packliste und Menüplan sind einzeln abwählbar: Wer schon eine Liste
     * hat, will keine zweite, und wer unterwegs entscheidet, was es gibt,
     * will keinen vorgefüllten Plan.
     */
    createFromTemplate: protectedProcedure
      .input(
        z
          .object({
            templateId: z.string().min(1).max(40),
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            spotId: z.number().int().positive().nullish(),
            location: z.string().max(140).nullish(),
            title: z.string().max(140).nullish(),
            withPackList: z.boolean().default(true),
            withMenu: z.boolean().default(true),
            // Vorlagen-Inhalte werden in der UI-Sprache gespeichert
            lang: z.enum(["de", "fr", "it", "en"]).default("de"),
          })
          .refine(
            v => v.spotId != null || (v.location ?? "").trim().length > 0,
            {
              message: "Bitte einen Zeltplatz wählen oder einen Ort eintragen.",
            }
          )
      )
      .mutation(async ({ ctx, input }) => {
        const template = tripTemplateById(input.templateId);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vorlage nicht gefunden.",
          });
        }
        if (input.spotId != null) {
          const spots = await db.getCampSpots(ctx.user.id);
          if (!spots.some(s => s.id === input.spotId)) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Zeltplatz nicht gefunden.",
            });
          }
        }
        const endDate = templateEndDate(input.startDate, template.nights);
        const title = pick(template.title, input.lang);

        // 1. Packliste aus dem Szenario der Vorlage
        let packListId: number | null = null;
        if (input.withPackList) {
          const scenario = packScenarios.find(
            s => s.id === template.packScenario
          );
          packListId = await db.createPackList({
            userId: ctx.user.id,
            name: templateListName(title, input.startDate),
            scenario: template.packScenario,
            personsJson: serializePersons([]),
          });
          if (scenario && scenario.items.length > 0) {
            await db.addPackItems(
              scenario.items.map((item, idx) => ({
                listId: packListId as number,
                name: pick(item.name, input.lang),
                category: pick(item.category, input.lang),
                quantity: item.quantity ?? 1,
                sortOrder: idx,
              }))
            );
          }
        }

        // 2. Die Reise selbst
        const tripId = await db.addTripLog({
          userId: ctx.user.id,
          spotId: input.spotId ?? null,
          packListId,
          location: input.location?.trim() || null,
          title: input.title?.trim() || title,
          startDate: input.startDate,
          endDate,
        });

        // 3. Menüplan – Abendessen je Nacht, Frühstück ab dem zweiten Tag
        let menuEntries = 0;
        if (input.withMenu) {
          const plan = templateMenuPlan(template, input.startDate);
          for (const entry of plan) {
            await db.upsertMenuEntry({
              userId: ctx.user.id,
              tripId,
              day: entry.day,
              meal: entry.meal,
              recipeId: entry.recipeId,
              updatedByUserId: ctx.user.id,
            });
          }
          menuEntries = plan.length;
        }
        return { id: tripId, endDate, packListId, menuEntries };
      }),
    /**
     * Eintrag nachträglich bearbeiten (Validierung wie add). Ändern sich
     * Zeitraum, Ort oder verknüpfter Zeltplatz, wird das gespeicherte
     * Wetterarchiv (weatherJson) verworfen – der Client holt es dann beim
     * nächsten Besuch automatisch neu (TripWeatherArchive in Trips.tsx).
     */
    update: protectedProcedure
      .input(
        z
          .object({
            id: z.number().int().positive(),
            spotId: z.number().int().positive().nullish(),
            packListId: z.number().int().positive().nullish(),
            location: z.string().max(140).nullish(),
            title: z.string().max(140).nullish(),
            notes: z.string().max(2000).nullish(),
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            rating: z.number().int().min(1).max(5).nullable().optional(),
            arrivalTime: z
              .string()
              .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
              .nullish(),
            departureTime: z
              .string()
              .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
              .nullish(),
            // Stellplatz-Details (#252) – gelten für DIESEN Aufenthalt
            pitchNumber: z.string().max(40).nullish(),
            wifiName: z.string().max(80).nullish(),
            wifiPassword: z.string().max(80).nullish(),
            pitchNotes: z.string().max(2000).nullish(),
          })
          .refine(v => v.endDate >= v.startDate, {
            message: "Die Abreise darf nicht vor der Anreise liegen.",
          })
          .refine(
            v => v.spotId != null || (v.location ?? "").trim().length > 0,
            {
              message: "Bitte einen Zeltplatz wählen oder einen Ort eintragen.",
            }
          )
      )
      .mutation(async ({ ctx, input }) => {
        // Besitzerin/Besitzer oder eingeladenes Mitglied dürfen bearbeiten
        const trip = await db.canAccessTrip(input.id, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        const isOwner = trip.userId === ctx.user.id;
        if (isOwner) {
          // Nur eigene Zeltplatz-Favoriten dürfen verknüpft werden
          if (input.spotId != null) {
            const spots = await db.getCampSpots(ctx.user.id);
            if (!spots.some(s => s.id === input.spotId)) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Zeltplatz nicht gefunden.",
              });
            }
          }
          // Nur eigene Packlisten dürfen verknüpft werden
          if (input.packListId != null) {
            const list = await db.getPackList(input.packListId, ctx.user.id);
            if (!list) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Packliste nicht gefunden.",
              });
            }
          }
        } else if (
          (input.spotId ?? null) !== trip.spotId ||
          (input.packListId ?? null) !== trip.packListId
        ) {
          // Zeltplatz-/Packlisten-Verknüpfungen gehören der Besitzerin/dem
          // Besitzer – Mitreisende dürfen sie nicht umhängen.
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Zeltplatz und Packliste kann nur die Besitzerin/der Besitzer der Reise ändern.",
          });
        }
        const spotId = input.spotId ?? null;
        const location = input.location?.trim() || null;
        // Wetterarchiv verwerfen, wenn sich Zeitraum oder Ort geändert haben
        const weatherStale =
          trip.startDate !== input.startDate ||
          trip.endDate !== input.endDate ||
          trip.spotId !== spotId ||
          trip.location !== location;
        await db.updateTripLog(input.id, trip.userId, {
          spotId,
          packListId: input.packListId ?? null,
          location,
          title: input.title?.trim() || null,
          notes: input.notes?.trim() || null,
          startDate: input.startDate,
          endDate: input.endDate,
          rating: input.rating ?? null,
          arrivalTime: input.arrivalTime ?? null,
          departureTime: input.departureTime ?? null,
          pitchNumber: input.pitchNumber?.trim() || null,
          wifiName: input.wifiName?.trim() || null,
          wifiPassword: input.wifiPassword?.trim() || null,
          pitchNotes: input.pitchNotes?.trim() || null,
          ...(weatherStale ? { weatherJson: null } : {}),
        });
        await noteTripChange(input.id, ctx.user.id, "trip", "edit");
        return { success: true } as const;
      }),
    /** Sterne-Bewertung nachträglich setzen oder mit null wieder entfernen. */
    setRating: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          rating: z.number().int().min(1).max(5).nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trip = await db.canAccessTrip(input.id, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        await db.setTripLogRating(input.id, trip.userId, input.rating);
        return { success: true } as const;
      }),
    /**
     * Reise duplizieren: legt eine neue geplante Reise mit neuem Zeitraum an –
     * die Kopie gehört IMMER dem aufrufenden Konto (auch Mitreisende dürfen
     * duplizieren). Übernommen werden Titel, Ort sowie Zeltplatz- und
     * Packlisten-Verknüpfung (Verknüpfungen nur, wenn die Reise dem Aufrufer
     * gehört – bei Mitglieds-Trips wird stattdessen der Platzname als
     * Freitext-Ort gesetzt); der Menüplan wird auf die neuen Daten gemappt
     * (Tag 1 → Tag 1, überzählige Tage verworfen). Notizen, Bewertung,
     * Wetterarchiv, Fotos, Mitglieder und Teil-Token werden bewusst NICHT
     * kopiert.
     */
    duplicate: protectedProcedure
      .input(
        z
          .object({
            tripId: z.number().int().positive(),
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          })
          .refine(v => v.endDate >= v.startDate, {
            message: "Die Abreise darf nicht vor der Anreise liegen.",
          })
      )
      .mutation(async ({ ctx, input }) => {
        const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        const isOwner = trip.userId === ctx.user.id;
        // Zeltplatz/Packliste gehören der Besitzerin/dem Besitzer – für die
        // Kopie eines Mitglieds-Trips wird der Platzname zum Freitext-Ort.
        let location = trip.location;
        if (!isOwner && trip.spotId != null && !location) {
          const spot = await db.getCampSpot(trip.spotId, trip.userId);
          location = spot?.name ?? null;
        }
        const id = await db.addTripLog({
          userId: ctx.user.id,
          spotId: isOwner ? trip.spotId : null,
          packListId: isOwner ? trip.packListId : null,
          location,
          title: trip.title,
          notes: null,
          startDate: input.startDate,
          endDate: input.endDate,
          rating: null,
          arrivalTime: trip.arrivalTime,
          departureTime: trip.departureTime,
        });
        // Menüplan-Einträge auf die neuen Daten mappen (Tag 1 → Tag 1)
        const entries = await db.getMenuEntriesForTrip(input.tripId);
        const mapped = remapMenuDays(
          entries,
          trip.startDate,
          input.startDate,
          input.endDate
        );
        // Eigene Rezepte anderer Konten dürfen nicht verknüpft werden –
        // solche Slots werden als Freitext mit dem Rezeptnamen übernommen.
        const needCustom = mapped.some(e => e.customRecipeId != null);
        const ownRecipeIds = new Set<number>(
          needCustom
            ? (await db.getCustomRecipes(ctx.user.id)).map(r => r.id)
            : []
        );
        const foreignNames = new Map<number, string>();
        if (needCustom && !isOwner) {
          (await db.getCustomRecipes(trip.userId)).forEach(r =>
            foreignNames.set(r.id, r.name)
          );
        }
        for (const entry of mapped) {
          let customRecipeId = entry.customRecipeId;
          let freeText = entry.freeText;
          if (customRecipeId != null && !ownRecipeIds.has(customRecipeId)) {
            freeText =
              foreignNames.get(customRecipeId)?.slice(0, 200) ?? freeText;
            customRecipeId = null;
          }
          // Slot ohne verbliebene Quelle überspringen (statt leer anzulegen)
          if (entry.recipeId == null && customRecipeId == null && !freeText) {
            continue;
          }
          await db.upsertMenuEntry({
            userId: ctx.user.id,
            tripId: id,
            day: entry.day,
            meal: entry.meal,
            recipeId: entry.recipeId,
            customRecipeId,
            freeText,
            updatedByUserId: ctx.user.id,
          });
        }
        return { id };
      }),
    /**
     * Wetterarchiv eines vergangenen Aufenthalts speichern: der Client holt
     * die historischen Tageswerte (Open-Meteo) einmalig und legt die kompakte
     * Zusammenfassung ab – der Server validiert nur die Wertebereiche.
     */
    setWeather: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          summary: z
            .object({
              tMax: z
                .number()
                .min(TRIP_WEATHER_TEMP_MIN)
                .max(TRIP_WEATHER_TEMP_MAX),
              tMin: z
                .number()
                .min(TRIP_WEATHER_TEMP_MIN)
                .max(TRIP_WEATHER_TEMP_MAX),
              rainDays: z.number().int().min(0).max(TRIP_WEATHER_MAX_RAIN_DAYS),
              totalPrecip: z.number().min(0).max(TRIP_WEATHER_MAX_PRECIP_MM),
            })
            .refine(v => v.tMin <= v.tMax, {
              message: "Minimum darf nicht über dem Maximum liegen.",
            }),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trip = await db.canAccessTrip(input.id, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        await db.setTripLogWeather(
          input.id,
          trip.userId,
          JSON.stringify(input.summary)
        );
        return { success: true } as const;
      }),
    /**
     * Titelbild eines Eintrags setzen (photoId) oder mit null entfernen.
     * Das Foto muss zu GENAU DIESEM Trip gehören – sonst NOT_FOUND.
     */
    setCoverPhoto: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          photoId: z.number().int().positive().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        if (input.photoId != null) {
          const photo = await db.getTripPhotoById(input.photoId);
          if (!photo || photo.tripId !== input.tripId) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Foto nicht gefunden.",
            });
          }
        }
        await db.setTripLogCoverPhoto(input.tripId, trip.userId, input.photoId);
        return { success: true } as const;
      }),
    /** Reise löschen – bewusst NUR für die Besitzerin/den Besitzer. */
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const trip = await db.getTripLog(input.id, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        // Papierkorb (#295): Der Schnappschuss nimmt die Reise mit allem,
        // was an ihr hängt – Fotos, Reisekasse, Pinnwand, Journal,
        // Menüplan, Mitglieder, Termine, Gästebuch. Die Bilddateien
        // bleiben liegen, bis der Eintrag abläuft.
        const { capture } = await import("./trash");
        await capture("trip", input.id, ctx.user.id);
        await db.deleteTripLog(input.id, ctx.user.id);
        await db.deleteAllTripPhotosForTrip(input.id);
        // Reisekasse gehört zur Reise und wird mitgelöscht (#219)
        await db.deleteAllTripExpensesForTrip(input.id);
        // Pinnwand (#245) gehört ebenfalls zur Reise
        await db.deleteAllTripBoardNotesForTrip(input.id);
        // Aufgezeichnete Wanderungen (#220) bleiben bestehen und verlieren
        // nur ihre Reise-Zuordnung – sie gehören der Person, nicht der Reise.
        await db.detachHikeTracksFromTrip(input.id);
        // Gezeichnete Routen (#281) ebenso – die Planung überlebt die Reise
        await db.detachPlannedRoutesFromTrip(input.id);
      }),
    photos: router({
      /** Fotos eines zugänglichen Trips (leer, wenn kein Zugriff besteht). */
      list: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            return [] as Awaited<ReturnType<typeof db.getTripPhotosForTrip>>;
          }
          return db.getTripPhotosForTrip(input.tripId);
        }),
      /** Einzelnes Foto löschen (DB-Zeile + Datei auf dem Webspace). */
      remove: protectedProcedure
        .input(z.object({ photoId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const photo = await db.getTripPhotoById(input.photoId);
          const trip = photo
            ? await db.canAccessTrip(photo.tripId, ctx.user.id)
            : undefined;
          if (!photo || !trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Foto nicht gefunden.",
            });
          }
          await db.deleteTripPhotoById(input.photoId);
          // War das Foto das Titelbild seines Trips, den Verweis mitlöschen
          await db.clearTripLogCoverPhoto(photo.tripId, trip.userId, photo.id);
          const { tripPhotoStorage } = await import("./photoStorage");
          await tripPhotoStorage.deleteFiles([photo.fileName]);
          return { success: true } as const;
        }),
    }),
    /**
     * Tages-Journal einer Reise (#192): ein Freitext-Eintrag pro Reisetag.
     * Wie beim Menüplan gehört das Journal zur REISE – Mitreisende dürfen
     * mitschreiben (canAccessTrip). Pro Eintrag wird der Anzeigename von
     * createdByUserId aufgelöst («von <Name>» bei gemeinsamen Reisen).
     */
    journal: router({
      list: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          type JournalEntry = Awaited<
            ReturnType<typeof db.getTripJournal>
          >[number] & { createdByName: string | null };
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) return [] as JournalEntry[];
          const entries = await db.getTripJournal(input.tripId);
          const names = await db.getUserDisplayNames(
            entries
              .map(e => e.createdByUserId)
              .filter((id): id is number => id != null)
          );
          return entries.map<JournalEntry>(entry => ({
            ...entry,
            createdByName:
              entry.createdByUserId != null
                ? (names.get(entry.createdByUserId) ?? null)
                : null,
          }));
        }),
      /** Eintrag setzen oder löschen – leerer/fehlender Text löscht den Tag. */
      set: protectedProcedure
        .input(
          z.object({
            tripId: z.number().int().positive(),
            day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            text: z.string().max(TRIP_JOURNAL_MAX_LENGTH).nullish(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          if (input.day < trip.startDate || input.day > trip.endDate) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Der Tag liegt ausserhalb des Aufenthalts.",
            });
          }
          const text = input.text?.trim() || null;
          if (text) {
            await db.upsertTripJournalEntry(
              input.tripId,
              input.day,
              text,
              ctx.user.id
            );
          } else {
            await db.deleteTripJournalEntry(input.tripId, input.day);
          }
          await noteTripChange(
            input.tripId,
            ctx.user.id,
            "journal",
            text ? "edit" : "remove",
            input.day
          );
          return { success: true } as const;
        }),
    }),
    /**
     * Reisekasse (#219): Ausgaben gehören wie das Journal zur REISE –
     * Mitreisende dürfen erfassen, ändern und löschen (canAccessTrip).
     * Beträge kommen und gehen ausschliesslich als Rappen-Ganzzahlen.
     */
    expenses: router({
      /**
       * Ausgaben über ALLE eigenen Reisen (#257): Kosten pro Jahr,
       * Ø pro Nacht und teuerste Kategorie. Bewusst nur eigene Reisen –
       * in fremden Reisekassen hat die eigene Statistik nichts verloren,
       * und die Zahl wäre auch nicht vergleichbar.
       */
      stats: protectedProcedure.query(async ({ ctx }) => {
        const trips = await db.getTripLogs(ctx.user.id);
        const expenses = await db.getExpensesForTrips(trips.map(t => t.id));
        return expenseStats(
          trips.map(trip => ({
            id: trip.id,
            startDate: trip.startDate,
            endDate: trip.endDate,
          })),
          expenses
        );
      }),
      /**
       * Reise-Budget (#256) setzen oder mit null wieder entfernen.
       * Erlaubt für alle Mitreisenden – die Reisekasse gehört allen, also
       * auch ihre Grenze.
       */
      setBudget: protectedProcedure
        .input(
          z.object({
            tripId: z.number().int().positive(),
            budgetRappen: z
              .number()
              .int()
              .min(1)
              .max(BUDGET_MAX_RAPPEN)
              .nullable(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          await db.setTripBudget(input.tripId, input.budgetRappen);
          return { success: true } as const;
        }),
      list: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          type Expense = Awaited<
            ReturnType<typeof db.getTripExpenses>
          >[number] & { createdByName: string | null };
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) return [] as Expense[];
          const rows = await db.getTripExpenses(input.tripId);
          const names = await db.getUserDisplayNames(rows.map(r => r.userId));
          return rows.map<Expense>(row => ({
            ...row,
            createdByName: names.get(row.userId) ?? null,
          }));
        }),
      add: protectedProcedure
        .input(
          z.object({
            tripId: z.number().int().positive(),
            amountRappen: z.number().int().min(1).max(EXPENSE_MAX_RAPPEN),
            category: z.enum(EXPENSE_CATEGORIES),
            description: z
              .string()
              .max(EXPENSE_DESCRIPTION_MAX_LENGTH)
              .nullish(),
            day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            paidBy: z.string().min(1).max(EXPENSE_PAID_BY_MAX_LENGTH),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          const id = await db.addTripExpense({
            tripId: input.tripId,
            userId: ctx.user.id,
            amountRappen: input.amountRappen,
            category: input.category,
            description: input.description?.trim() || null,
            day: input.day,
            paidBy: input.paidBy.trim(),
          });
          await noteTripChange(
            input.tripId,
            ctx.user.id,
            "expense",
            "add",
            input.description?.trim() || input.category
          );
          return { id };
        }),
      update: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            amountRappen: z
              .number()
              .int()
              .min(1)
              .max(EXPENSE_MAX_RAPPEN)
              .optional(),
            category: z.enum(EXPENSE_CATEGORIES).optional(),
            description: z
              .string()
              .max(EXPENSE_DESCRIPTION_MAX_LENGTH)
              .nullish(),
            day: z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}$/)
              .optional(),
            paidBy: z
              .string()
              .min(1)
              .max(EXPENSE_PAID_BY_MAX_LENGTH)
              .optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const expense = await db.getTripExpenseById(input.id);
          const trip = expense
            ? await db.canAccessTrip(expense.tripId, ctx.user.id)
            : undefined;
          if (!expense || !trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Ausgabe nicht gefunden.",
            });
          }
          await db.updateTripExpense(input.id, {
            ...(input.amountRappen !== undefined
              ? { amountRappen: input.amountRappen }
              : {}),
            ...(input.category !== undefined
              ? { category: input.category }
              : {}),
            ...(input.description !== undefined
              ? { description: input.description?.trim() || null }
              : {}),
            ...(input.day !== undefined ? { day: input.day } : {}),
            ...(input.paidBy !== undefined
              ? { paidBy: input.paidBy.trim() }
              : {}),
          });
          return { success: true } as const;
        }),
      remove: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const expense = await db.getTripExpenseById(input.id);
          const trip = expense
            ? await db.canAccessTrip(expense.tripId, ctx.user.id)
            : undefined;
          if (!expense || !trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Ausgabe nicht gefunden.",
            });
          }
          await db.deleteTripExpense(input.id);
          await noteTripChange(
            expense.tripId,
            ctx.user.id,
            "expense",
            "remove",
            expense.description || expense.category
          );
          return { success: true } as const;
        }),
    }),
    /**
     * Pinnwand einer Reise (#245): Zettel gehören wie Journal und Reisekasse
     * zur REISE – jedes Mitglied darf anpinnen und abhaken (canAccessTrip).
     * Löschen darf nur, wer den Zettel angepinnt hat, plus die Besitzerin/der
     * Besitzer der Reise (shared/tripBoard.ts: canRemoveTripBoardEntry).
     */
    board: router({
      list: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          type BoardNote = Awaited<
            ReturnType<typeof db.getTripBoardNotes>
          >[number] & {
            createdByName: string | null;
            doneByName: string | null;
            /** Darf das anfragende Konto diesen Zettel löschen? */
            canRemove: boolean;
          };
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) return [] as BoardNote[];
          const rows = await db.getTripBoardNotes(input.tripId);
          const names = await db.getUserDisplayNames([
            ...rows.map(r => r.userId),
            ...rows
              .map(r => r.doneByUserId)
              .filter((id): id is number => id !== null),
          ]);
          const mapped = rows.map<BoardNote>(row => ({
            ...row,
            createdByName: names.get(row.userId) ?? null,
            doneByName:
              row.doneByUserId !== null
                ? (names.get(row.doneByUserId) ?? null)
                : null,
            canRemove: canRemoveTripBoardEntry(
              row.userId,
              trip.userId,
              ctx.user.id
            ),
          }));
          // Reihenfolge kommt aus shared/, damit sie testbar bleibt
          return sortTripBoardEntries(mapped);
        }),
      add: protectedProcedure
        .input(
          z.object({
            tripId: z.number().int().positive(),
            kind: z.enum(TRIP_BOARD_KINDS),
            text: z
              .string()
              .min(1)
              .max(TRIP_BOARD_TEXT_MAX_LENGTH * 2),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          // Serverseitig mit derselben Regel kürzen wie im Eingabefeld
          const text = normalizeTripBoardText(input.text);
          if (!text) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Der Zettel braucht einen Text.",
            });
          }
          const id = await db.addTripBoardNote({
            tripId: input.tripId,
            userId: ctx.user.id,
            kind: input.kind,
            text,
          });
          await noteTripChange(input.tripId, ctx.user.id, "board", "add", text);
          return { id };
        }),
      /** Aufgabe abhaken oder wieder öffnen – Nachrichten haben keinen Haken. */
      setDone: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            done: z.boolean(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const note = await db.getTripBoardNoteById(input.id);
          const trip = note
            ? await db.canAccessTrip(note.tripId, ctx.user.id)
            : undefined;
          if (!note || !trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Zettel nicht gefunden.",
            });
          }
          if (normalizeTripBoardKind(note.kind) !== "task") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Nur Aufgaben lassen sich abhaken.",
            });
          }
          await db.updateTripBoardNote(input.id, {
            done: input.done,
            doneByUserId: input.done ? ctx.user.id : null,
            doneAt: input.done ? new Date() : null,
          });
          return { success: true } as const;
        }),
      remove: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const note = await db.getTripBoardNoteById(input.id);
          const trip = note
            ? await db.canAccessTrip(note.tripId, ctx.user.id)
            : undefined;
          if (!note || !trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Zettel nicht gefunden.",
            });
          }
          if (!canRemoveTripBoardEntry(note.userId, trip.userId, ctx.user.id)) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Diesen Zettel darf nur der Urheber entfernen.",
            });
          }
          await db.deleteTripBoardNote(input.id);
          await noteTripChange(
            note.tripId,
            ctx.user.id,
            "board",
            "remove",
            note.text
          );
          return { success: true } as const;
        }),
    }),
    invite: router({
      /**
       * Einladungs-Link erzeugen (nur Besitzerin/Besitzer): ein bestehender
       * Link wird wiederverwendet – widerrufen + neu erzeugen erneuert ihn.
       */
      create: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const trip = await db.getTripLog(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          const existing = await db.getTripInvite(input.tripId);
          if (existing) return { token: existing.inviteToken };
          const token = nanoid(24);
          await db.upsertTripInvite(input.tripId, token);
          return { token };
        }),
      /** Einladungs-Link widerrufen (nur Besitzerin/Besitzer). */
      revoke: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const trip = await db.getTripLog(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          await db.deleteTripInvite(input.tripId);
          return { success: true } as const;
        }),
      /**
       * Öffentliche Vorschau einer Einladung: bewusst nur Ort, Zeitraum und
       * Owner-Name – keine Notizen, Fotos oder weiteren Details.
       */
      get: publicProcedure
        .input(z.object({ token: z.string().min(8).max(64) }))
        .query(async ({ input }) => {
          const found = await db.getTripInviteByToken(input.token);
          if (!found) return { trip: null };
          const { trip } = found;
          let place = trip.location;
          if (!place && trip.spotId != null) {
            const spot = await db.getCampSpot(trip.spotId, trip.userId);
            place = spot?.name ?? null;
          }
          const owner = await db.getUserById(trip.userId);
          return {
            trip: {
              place,
              startDate: trip.startDate,
              endDate: trip.endDate,
              ownerName: owner?.name ?? owner?.email ?? null,
            },
          };
        }),
      /**
       * Einladung annehmen (eingeloggt): fügt als Mitglied hinzu – idempotent,
       * die eigene Reise ist ein No-op.
       */
      accept: protectedProcedure
        .input(z.object({ token: z.string().min(8).max(64) }))
        .mutation(async ({ ctx, input }) => {
          const found = await db.getTripInviteByToken(input.token);
          if (!found) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Die Einladung ist ungültig oder wurde widerrufen.",
            });
          }
          const { trip } = found;
          if (trip.userId === ctx.user.id) {
            return { tripId: trip.id, alreadyOwner: true } as const;
          }
          await db.addTripMember(trip.id, ctx.user.id);
          await noteTripChange(trip.id, ctx.user.id, "member", "add");
          return { tripId: trip.id, alreadyOwner: false } as const;
        }),
    }),
    members: router({
      /**
       * Mitglieder einer Reise (Besitzerin/Besitzer zuerst) – sichtbar für
       * alle Mitreisenden; der Einladungs-Token nur für die Besitzerin/den
       * Besitzer (für den «Mitreisende»-Dialog).
       */
      list: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          const [owner, members, invite] = await Promise.all([
            db.getUserById(trip.userId),
            db.getTripMembersWithUsers(input.tripId),
            trip.userId === ctx.user.id
              ? db.getTripInvite(input.tripId)
              : Promise.resolve(undefined),
          ]);
          return {
            members: [
              {
                userId: trip.userId,
                role: "owner" as const,
                name: owner?.name ?? null,
                email: owner?.email ?? null,
              },
              ...members.map(m => ({
                userId: m.userId,
                role: "member" as const,
                name: m.name,
                email: m.email,
              })),
            ],
            inviteToken: invite?.inviteToken ?? null,
          };
        }),
      /**
       * Mitglied entfernen: die Besitzerin/der Besitzer darf jedes Mitglied
       * entfernen; ein Mitglied nur sich selbst (= Reise verlassen).
       * Ohne userId entfernt man sich selbst.
       */
      remove: protectedProcedure
        .input(
          z.object({
            tripId: z.number().int().positive(),
            userId: z.number().int().positive().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          const targetUserId = input.userId ?? ctx.user.id;
          const isOwner = trip.userId === ctx.user.id;
          if (targetUserId === trip.userId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Die Besitzerin/der Besitzer kann die eigene Reise nicht verlassen.",
            });
          }
          if (!isOwner && targetUserId !== ctx.user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Nur die Besitzerin/der Besitzer darf andere Mitreisende entfernen.",
            });
          }
          await db.removeTripMember(input.tripId, targetUserId);
          await noteTripChange(input.tripId, ctx.user.id, "member", "remove");
          return { success: true } as const;
        }),
    }),
    /**
     * Termin-Finder (#253): Datums-Vorschläge und Stimmen einer Reise.
     * Vorschlagen und abstimmen darf jede/r Mitreisende – die Frage «wann
     * können alle?» beantwortet man gemeinsam. Löschen eines fremden
     * Vorschlags und das Übernehmen des Termins bleiben bei der
     * Besitzerin/dem Besitzer, denn beides ändert die Reise für alle.
     */
    dates: router({
      list: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          const [options, members, owner] = await Promise.all([
            db.getTripDateOptions(input.tripId),
            db.getTripMembersWithUsers(input.tripId),
            db.getUserById(trip.userId),
          ]);
          const votes = await db.getTripDateVotes(options.map(o => o.id));
          // Stimmberechtigt sind Besitzer:in plus Mitreisende – dieselbe
          // Liste, die auch die «fehlt noch»-Anzeige speist. Der Name kommt
          // gleich mit, damit die Ansicht nicht pro Person nachfragen muss.
          const participants = [
            {
              userId: trip.userId,
              name: owner?.name || owner?.email || `#${trip.userId}`,
            },
            ...members.map(member => ({
              userId: member.userId,
              name: member.name || member.email || `#${member.userId}`,
            })),
          ];
          return {
            options: options.map(option => ({
              id: option.id,
              startDate: option.startDate,
              endDate: option.endDate,
              note: option.note,
              createdByUserId: option.createdByUserId,
            })),
            votes: votes.map(vote => ({
              optionId: vote.optionId,
              userId: vote.userId,
              vote: vote.vote,
            })),
            participants,
            isOwner: trip.userId === ctx.user.id,
            tripStartDate: trip.startDate,
            tripEndDate: trip.endDate,
          };
        }),
      add: protectedProcedure
        .input(
          z.object({
            tripId: z.number().int().positive(),
            startDate: z.string().min(1),
            endDate: z.string().min(1),
            note: z.string().max(MAX_OPTION_NOTE_LENGTH).optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          if (!isValidOptionRange(input.startDate, input.endDate)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Die Abreise muss nach der Anreise liegen.",
            });
          }
          const existing = await db.getTripDateOptions(input.tripId);
          if (existing.length >= MAX_DATE_OPTIONS) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Mehr als ${MAX_DATE_OPTIONS} Vorschläge beantwortet niemand mehr.`,
            });
          }
          if (isDuplicateOption(existing, input.startDate, input.endDate)) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Dieser Zeitraum steht bereits zur Wahl.",
            });
          }
          const id = await db.createTripDateOption({
            tripId: input.tripId,
            startDate: input.startDate,
            endDate: input.endDate,
            note: input.note?.trim() || null,
            createdByUserId: ctx.user.id,
          });
          return { id };
        }),
      remove: protectedProcedure
        .input(z.object({ optionId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const option = await db.getTripDateOption(input.optionId);
          if (!option) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Vorschlag nicht gefunden.",
            });
          }
          const trip = await db.canAccessTrip(option.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Vorschlag nicht gefunden.",
            });
          }
          const mayRemove =
            trip.userId === ctx.user.id ||
            option.createdByUserId === ctx.user.id;
          if (!mayRemove) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Nur wer den Vorschlag eingebracht hat, darf ihn löschen.",
            });
          }
          await db.deleteTripDateOption(input.optionId);
          return { success: true } as const;
        }),
      vote: protectedProcedure
        .input(
          z.object({
            optionId: z.number().int().positive(),
            vote: z.enum(VOTE_VALUES),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const option = await db.getTripDateOption(input.optionId);
          if (!option) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Vorschlag nicht gefunden.",
            });
          }
          const trip = await db.canAccessTrip(option.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Vorschlag nicht gefunden.",
            });
          }
          await db.setTripDateVote(input.optionId, ctx.user.id, input.vote);
          return { success: true } as const;
        }),
      /**
       * Gewählten Termin in die Reise übernehmen (nur Besitzerin/Besitzer):
       * setzt startDate/endDate. Die Vorschläge bleiben stehen – wer sich
       * umentscheidet, sieht die Alternativen noch, und die Abstimmung ist
       * die Begründung für das Datum.
       */
      adopt: protectedProcedure
        .input(z.object({ optionId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const option = await db.getTripDateOption(input.optionId);
          if (!option) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Vorschlag nicht gefunden.",
            });
          }
          const trip = await db.getTripLog(option.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Nur die Besitzerin/der Besitzer darf den Termin übernehmen.",
            });
          }
          await db.updateTripLog(option.tripId, ctx.user.id, {
            startDate: option.startDate,
            endDate: option.endDate,
          });
          return {
            startDate: option.startDate,
            endDate: option.endDate,
          };
        }),
    }),
    /**
     * Änderungsverlauf einer Reise (#296): wer hat wann was geändert.
     *
     * Sichtbar für alle Mitreisenden – es geht ja gerade um das, was
     * gemeinsam bearbeitet wird. Gebündelt und nach Tagen gruppiert wird
     * erst in der Ansicht; hier kommen die Rohdaten samt Namen.
     */
    history: protectedProcedure
      .input(z.object({ tripId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        const rows = await db.getTripChanges(input.tripId);
        // Der Name steht nicht in der Zeile, sondern wird hier geholt:
        // Wer sich umbenennt, stünde sonst mit zwei Namen in der Liste.
        const names = await db.getUserDisplayNames(rows.map(row => row.userId));
        return {
          groups: bundleChanges(rows),
          names: Object.fromEntries(names),
        };
      }),
    /**
     * Gästebuch (#254): Grüsse zur Reise. Lesen und Schreiben dürfen alle
     * Mitreisenden; über den Teil-Link kommen Gäste dazu (siehe
     * `trips.sharedGuestbookAdd`). Löschen darf die Besitzerin/der Besitzer
     * jeden Eintrag – bei einem offenen Gästebuch braucht es jemanden, der
     * aufräumen kann –, alle anderen nur ihre eigenen.
     */
    guestbook: router({
      list: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          const entries = await db.getTripGuestbook(input.tripId);
          return {
            entries,
            isOwner: trip.userId === ctx.user.id,
            myUserId: ctx.user.id,
          };
        }),
      add: protectedProcedure
        .input(
          z.object({
            tripId: z.number().int().positive(),
            message: z.string().min(1).max(MAX_GUESTBOOK_MESSAGE_LENGTH),
            photoId: z.number().int().positive().nullable().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          const message = normalizeGuestbookMessage(input.message);
          if (!isValidGuestbookMessage(message)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Ohne Text kein Eintrag.",
            });
          }
          // Das Foto muss zu DIESER Reise gehören – sonst liesse sich ein
          // fremdes Bild in ein geteiltes Gästebuch holen.
          if (input.photoId != null) {
            const photos = await db.getTripPhotosForTrip(input.tripId);
            if (!photos.some(photo => photo.id === input.photoId)) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Das Foto gehört nicht zu dieser Reise.",
              });
            }
          }
          const id = await db.createTripGuestbookEntry({
            tripId: input.tripId,
            userId: ctx.user.id,
            authorName: normalizeGuestName(
              ctx.user.name || ctx.user.email || ""
            ),
            message,
            photoId: input.photoId ?? null,
          });
          await noteTripChange(
            input.tripId,
            ctx.user.id,
            "guestbook",
            "add",
            message
          );
          return { id };
        }),
      remove: protectedProcedure
        .input(z.object({ entryId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const entry = await db.getTripGuestbookEntry(input.entryId);
          if (!entry) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Eintrag nicht gefunden.",
            });
          }
          const trip = await db.canAccessTrip(entry.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Eintrag nicht gefunden.",
            });
          }
          const mayRemove =
            trip.userId === ctx.user.id || entry.userId === ctx.user.id;
          if (!mayRemove) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Nur eigene Einträge lassen sich löschen.",
            });
          }
          await db.deleteTripGuestbookEntry(input.entryId);
          await noteTripChange(
            entry.tripId,
            ctx.user.id,
            "guestbook",
            "remove",
            entry.message
          );
          return { success: true } as const;
        }),
    }),
    /**
     * Gästebuch-Eintrag über den TEIL-LINK (#254) – der einzige Weg, auf dem
     * jemand ohne Konto in CampMesser schreibt. Deshalb drei Bremsen: Der
     * Token muss gültig und unverfallen sein, pro IP sind es höchstens fünf
     * Einträge pro Stunde, und ein Foto kann ein Gast nicht anhängen (ein
     * anonymer Upload-Pfad wäre eine offene Tür).
     */
    sharedGuestbookAdd: publicProcedure
      .input(
        z.object({
          token: z.string().min(8).max(64),
          authorName: z.string().max(MAX_GUEST_NAME_LENGTH).optional(),
          message: z.string().min(1).max(MAX_GUESTBOOK_MESSAGE_LENGTH),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trip = await db.getTripLogByShareToken(input.token);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Geteilte Reise nicht gefunden.",
          });
        }
        const { allowAction } = await import("./rateLimit");
        const limitKey = `guestbook|${trip.id}|${ctx.req.ip ?? "?"}`;
        if (!allowAction(limitKey, 5, 60 * 60 * 1000)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Zu viele Einträge – versuch es später nochmals.",
          });
        }
        const message = normalizeGuestbookMessage(input.message);
        if (!isValidGuestbookMessage(message)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ohne Text kein Eintrag.",
          });
        }
        await db.createTripGuestbookEntry({
          tripId: trip.id,
          userId: null,
          authorName: normalizeGuestName(input.authorName ?? ""),
          message,
          photoId: null,
        });
        return { success: true } as const;
      }),
    /**
     * Teil-Link für den Reise-Hub erzeugen (nur Besitzerin/Besitzer):
     * ein öffentlicher Read-only-Link, unabhängig von den Reise-Mitgliedern.
     * Hat die verknüpfte Packliste noch keinen Teil-Token, bekommt sie hier
     * einen – so funktioniert das Abhaken im Hub über die BESTEHENDE
     * geteilte-Listen-Mechanik (packing.sharedToggle) unverändert.
     */
    share: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          expiresInDays: shareExpiryInput,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trip = await db.getTripLog(input.tripId, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        const expiresAt = shareExpiryFor(
          input.expiresInDays,
          trip.shareExpiresAt
        );
        if (trip.packListId != null) {
          const list = await db.getPackList(trip.packListId, ctx.user.id);
          // Neu erzeugter Listen-Token läuft mit dem Hub ab; ein bereits
          // bestehender bleibt unangetastet (die Liste kann eigenständig
          // geteilt sein).
          if (list && !list.shareToken) {
            await db.setPackListShareToken(
              list.id,
              ctx.user.id,
              nanoid(16),
              expiresAt
            );
          }
        }
        const token = trip.shareToken ?? nanoid(16);
        await db.setTripLogShareToken(
          input.tripId,
          ctx.user.id,
          token,
          expiresAt
        );
        return { token, expiresAt };
      }),
    /**
     * Teilen des Reise-Hubs beenden: Token entfernen, Link wird ungültig.
     * Der Teil-Token einer verknüpften Packliste bleibt bewusst bestehen –
     * die Liste kann unabhängig geteilt worden sein (packing.unshare räumt ihn).
     */
    unshare: protectedProcedure
      .input(z.object({ tripId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.setTripLogShareToken(input.tripId, ctx.user.id, null);
        return { success: true } as const;
      }),
    /**
     * Geteilten Reise-Hub öffentlich abrufen (kein Login nötig): Reise-Infos,
     * Platz-Basisdaten (Muster spots.sharedGet), Menüplan (eigene Rezepte
     * serverseitig als Name aufgelöst – öffentlich nicht abrufbar; statische
     * Rezept-Ids löst der Client in der aktiven Sprache auf) und die
     * verknüpfte Packliste samt Teil-Token fürs Abhaken. BEWUSST ohne Fotos.
     */
    sharedGet: publicProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .query(async ({ input }) => {
        const trip = await db.getTripLogByShareToken(input.token);
        if (!trip) return null;
        const spot =
          trip.spotId != null
            ? await db.getCampSpot(trip.spotId, trip.userId)
            : undefined;
        const entries = await db.getMenuEntriesForTrip(trip.id);
        const dayNotes = await db.getMenuDayNotesForTrip(trip.id);
        const guestbook = await db.getTripGuestbook(trip.id);
        const customNameById = new Map<number, string>();
        if (entries.some(e => e.customRecipeId != null)) {
          const own = await db.getCustomRecipes(trip.userId);
          own.forEach(r => customNameById.set(r.id, r.name));
        }
        let packList: {
          name: string;
          shareToken: string | null;
          persons: string[];
          items: Awaited<ReturnType<typeof db.getPackItems>>;
        } | null = null;
        if (trip.packListId != null) {
          const list = await db.getPackList(trip.packListId, trip.userId);
          if (list) {
            packList = {
              name: list.name,
              shareToken: list.shareToken,
              persons: parsePersons(list.personsJson),
              items: await db.getPackItems(list.id),
            };
          }
        }
        return {
          trip: {
            title: trip.title,
            location: trip.location,
            startDate: trip.startDate,
            endDate: trip.endDate,
            notes: trip.notes,
            rating: trip.rating,
            weatherJson: trip.weatherJson,
          },
          spot: spot
            ? {
                name: spot.name,
                latitude: spot.latitude,
                longitude: spot.longitude,
                note: spot.note,
                attributesJson: spot.attributesJson,
                // Kontakt & Check-in – unkritisch und für Mitreisende hilfreich
                receptionPhone: spot.receptionPhone,
                checkinInfo: spot.checkinInfo,
                parcelNumber: spot.parcelNumber,
              }
            : null,
          menu: entries.map(e => ({
            day: e.day,
            meal: e.meal,
            recipeId: e.recipeId,
            customRecipeName:
              e.customRecipeId != null
                ? (customNameById.get(e.customRecipeId) ?? null)
                : null,
            freeText: e.freeText,
          })),
          menuDayNotes: dayNotes.map(n => ({ day: n.day, note: n.note })),
          packList,
          // Gästebuch (#254): Ohne Konto-Bezug – ein Gast soll nicht sehen,
          // welche Zeile zu welchem CampMesser-Konto gehört; ob der Eintrag
          // von jemandem mit Konto stammt, reicht als Unterscheidung.
          guestbook: guestbook.map(entry => ({
            id: entry.id,
            authorName: entry.authorName,
            message: entry.message,
            fromMember: entry.userId != null,
            createdAt: entry.createdAt,
          })),
        };
      }),
  }),
  menu: router({
    /**
     * Trip samt Menüplan-Einträgen (null, wenn kein Zugriff besteht).
     * Pro Eintrag wird der Anzeigename von updatedByUserId aufgelöst
     * («von <Name>» bei gemeinsamen Reisen) – EINE Zusatzabfrage über
     * die vorkommenden Konten.
     */
    listByTrip: protectedProcedure
      .input(z.object({ tripId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        type EntryWithEditor = Awaited<
          ReturnType<typeof db.getMenuEntriesForTrip>
        >[number] & { updatedByName: string | null };
        type DayNote = Awaited<
          ReturnType<typeof db.getMenuDayNotesForTrip>
        >[number];
        const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
        if (!trip) {
          return {
            trip: null,
            entries: [] as EntryWithEditor[],
            dayNotes: [] as DayNote[],
          };
        }
        const entries = await db.getMenuEntriesForTrip(input.tripId);
        const dayNotes = await db.getMenuDayNotesForTrip(input.tripId);
        const names = await db.getUserDisplayNames(
          entries
            .map(e => e.updatedByUserId)
            .filter((id): id is number => id != null)
        );
        return {
          trip,
          entries: entries.map<EntryWithEditor>(entry => ({
            ...entry,
            updatedByName:
              entry.updatedByUserId != null
                ? (names.get(entry.updatedByUserId) ?? null)
                : null,
          })),
          dayNotes,
        };
      }),
    /** Slot setzen: genau eine Quelle (Rezept, eigenes Rezept oder Freitext). */
    set: protectedProcedure
      .input(
        z
          .object({
            tripId: z.number().int().positive(),
            day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            meal: z.enum(MEALS),
            recipeId: z.string().min(1).max(80).nullish(),
            customRecipeId: z.number().int().positive().nullish(),
            freeText: z.string().min(1).max(200).nullish(),
          })
          .refine(
            v =>
              [v.recipeId, v.customRecipeId, v.freeText?.trim()].filter(Boolean)
                .length === 1,
            {
              message:
                "Bitte genau ein Rezept, ein eigenes Rezept oder einen Freitext angeben.",
            }
          )
      )
      .mutation(async ({ ctx, input }) => {
        const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        if (input.day < trip.startDate || input.day > trip.endDate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Der Tag liegt ausserhalb des Aufenthalts.",
          });
        }
        // Nur eigene Rezepte dürfen verknüpft werden
        if (input.customRecipeId != null) {
          const own = await db.getCustomRecipes(ctx.user.id);
          if (!own.some(r => r.id === input.customRecipeId)) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Rezept nicht gefunden.",
            });
          }
        }
        await db.upsertMenuEntry({
          userId: ctx.user.id,
          tripId: input.tripId,
          day: input.day,
          meal: input.meal,
          recipeId: input.recipeId ?? null,
          customRecipeId: input.customRecipeId ?? null,
          freeText: input.freeText?.trim() || null,
          updatedByUserId: ctx.user.id,
        });
        await noteTripChange(
          input.tripId,
          ctx.user.id,
          "menu",
          "edit",
          input.day
        );
        return { success: true } as const;
      }),
    /** Slot leeren. */
    remove: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          meal: z.enum(MEALS),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        await db.deleteMenuEntrySlot(input.tripId, input.day, input.meal);
        await noteTripChange(
          input.tripId,
          ctx.user.id,
          "menu",
          "remove",
          input.day
        );
        return { success: true } as const;
      }),
    /**
     * Tages-Notiz setzen oder löschen (#153): eine kurze Notiz pro Tag
     * («Pizzeria-Abend»); leerer/fehlender Text löscht die Notiz.
     * Mitreisende dürfen wie beim Menüplan mitschreiben (canAccessTrip).
     */
    setDayNote: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          note: z.string().max(200).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        if (input.day < trip.startDate || input.day > trip.endDate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Der Tag liegt ausserhalb des Aufenthalts.",
          });
        }
        const note = input.note?.trim() || null;
        if (note) {
          await db.upsertMenuDayNote(input.tripId, input.day, note);
        } else {
          await db.deleteMenuDayNote(input.tripId, input.day);
        }
        await noteTripChange(
          input.tripId,
          ctx.user.id,
          "menu",
          note ? "edit" : "remove",
          input.day
        );
        return { success: true } as const;
      }),
  }),
  /**
   * «Hier bin ich»-Standort-Link (#221): teilt die eigene Position über einen
   * öffentlichen Link. Anders als die übrigen Teil-Links läuft dieser IMMER
   * ab (1/4/24 Stunden, shared/sharing.ts) – ein Standort soll nicht
   * unbegrenzt offen im Netz liegen. Pro Konto gibt es höchstens einen Link,
   * damit «Standort aktualisieren» denselben Link nachführt, statt einen
   * neuen zu erzeugen.
   */
  location: router({
    /** Eigener aktiver Link (null = keiner oder abgelaufen). */
    current: protectedProcedure.query(async ({ ctx }) => {
      const share = await db.getLocationShare(ctx.user.id);
      if (!share) return null;
      return {
        token: share.shareToken,
        latitude: share.latitude,
        longitude: share.longitude,
        accuracyM: share.accuracyM,
        capturedAt: share.capturedAt,
        expiresAt: share.shareExpiresAt,
      };
    }),
    /**
     * Standort teilen bzw. nachführen. Ein bestehender Link behält seinen
     * Token – wer ihn schon verschickt hat, muss nichts Neues schicken.
     */
    share: protectedProcedure
      .input(
        z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          accuracyM: z.number().min(0).max(100000).nullish(),
          /** Zeitpunkt der Messung in ms seit Epoch; fehlt = jetzt */
          capturedAt: z.number().int().positive().nullish(),
          expiresInHours: z
            .union([
              z.literal(LOCATION_SHARE_EXPIRY_HOURS[0]),
              z.literal(LOCATION_SHARE_EXPIRY_HOURS[1]),
              z.literal(LOCATION_SHARE_EXPIRY_HOURS[2]),
            ])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const now = new Date();
        // Ein Messzeitpunkt aus der Zukunft (schief gehende Geräte-Uhr)
        // würde zu «vor -3 Minuten» führen – deshalb auf jetzt deckeln.
        const captured =
          input.capturedAt != null && input.capturedAt <= now.getTime()
            ? new Date(input.capturedAt)
            : now;
        const expiresAt = locationShareExpiry(input.expiresInHours, now);
        const token = await db.upsertLocationShare({
          userId: ctx.user.id,
          token: nanoid(16),
          latitude: input.latitude,
          longitude: input.longitude,
          accuracyM:
            input.accuracyM == null ? null : Math.round(input.accuracyM),
          capturedAt: captured,
          expiresAt,
        });
        return { token, expiresAt };
      }),
    /** Link vorzeitig beenden – er verhält sich danach wie ein unbekannter. */
    stop: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteLocationShare(ctx.user.id);
      return { success: true } as const;
    }),
    /**
     * Geteilten Standort öffentlich abrufen (kein Login nötig). Herausgegeben
     * werden bewusst nur Position, Genauigkeit, Zeitpunkt und der Anzeigename
     * – nichts aus dem Konto darüber hinaus.
     */
    sharedGet: publicProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .query(async ({ input }) => {
        const share = await db.getLocationShareByToken(input.token);
        if (!share) return null;
        const names = await db.getUserDisplayNames([share.userId]);
        return {
          name: names.get(share.userId) ?? null,
          latitude: share.latitude,
          longitude: share.longitude,
          accuracyM: share.accuracyM,
          capturedAt: share.capturedAt,
          expiresAt: share.shareExpiresAt,
        };
      }),
  }),

  /**
   * ISS-Überflüge (#222). Die geometrisch möglichen Überflüge kommen von
   * einer freien Schnittstelle (server/iss.ts, mit Zwischenspeicher), welche
   * davon SICHTBAR ist, entscheidet `selectVisiblePasses` aus shared/iss.ts:
   * dunkel am Boden, Station noch in der Sonne. Kein Login nötig – die Daten
   * hängen nur am Ort, nicht am Konto.
   */
  iss: router({
    passes: publicProcedure
      .input(
        z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
      )
      .query(async ({ input }) => {
        const { fetchIssPasses } = await import("./iss");
        const raw = await fetchIssPasses(input.latitude, input.longitude);
        return {
          passes: selectVisiblePasses(raw, input.latitude, input.longitude),
          /** Wurden überhaupt Überflüge geliefert? Trennt «keine sichtbaren» von «Quelle stumm». */
          sourceReachable: raw.length > 0,
        };
      }),
  }),

  /**
   * Badestellen-Info (#223): Wassertemperatur, Abfluss und Pegel am Platz.
   * In der Schweiz aus den offenen Hydrodaten der nächstgelegenen Messstelle
   * (Auswahl in shared/bathingWater.ts), sonst die Meerwasser-Temperatur der
   * Marine-API. Kein Login nötig – die Daten hängen nur am Ort.
   */
  water: router({
    nearby: publicProcedure
      .input(
        z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
      )
      .query(async ({ input }) => {
        const { fetchMarineWater, fetchStationReading } =
          await import("./bathingWater");
        const nearest = nearestWaterStation(input.latitude, input.longitude);
        if (nearest) {
          const reading = await fetchStationReading(nearest.station.id);
          // Eine stumme Messstelle ist wertlos – dann lieber am Meer nachsehen.
          if (
            reading.temperatureC !== null ||
            reading.flowM3s !== null ||
            reading.levelMasl !== null
          ) {
            return {
              source: "station" as const,
              station: {
                id: nearest.station.id,
                name: nearest.station.name,
                waterBody: nearest.station.waterBody,
                type: nearest.station.type,
                distanceM: Math.round(nearest.distanceM),
              },
              reading,
              marine: null,
            };
          }
        }
        const marine = await fetchMarineWater(input.latitude, input.longitude);
        if (!marine) {
          return {
            source: "none" as const,
            station: null,
            reading: null,
            marine: null,
          };
        }
        return {
          source: "marine" as const,
          station: null,
          reading: null,
          marine: {
            temperatureC: marine.temperatureC,
            measuredAtMs: marine.measuredAtMs,
            trend: waterTrend(marine.temperatureC, marine.previousC),
          },
        };
      }),
  }),

  /**
   * Ausflugfinder-Anbindung (#271): die Ausflugsziele aus der Supabase-
   * Datenbank der eigenen Ausflugfinder-App. Der Abruf läuft ausschliesslich
   * serverseitig (server/excursions.ts, mit Zwischenspeicher) – der
   * Zugriffsschlüssel steht in der `.env` und nie im Browser-Bundle.
   *
   * Bewusst angemeldet-only: Es sind die eigenen Daten aus der zweiten App;
   * CampMesser soll dafür kein offener Weiterleiter werden. Ist die
   * Anbindung nicht eingerichtet, kommt `configured: false` und die
   * Oberfläche blendet den Bereich aus – kein Fehlerzustand.
   */
  excursions: router({
    /**
     * Nur die Frage «gibt es das Feature hier überhaupt?» – ohne die Quelle
     * anzufassen. Damit können Karte und Dossier den Bereich ausblenden,
     * ohne auf Supabase zu warten.
     */
    status: protectedProcedure.query(async () => {
      const { isExcursionsConfigured } = await import("./excursions");
      return { configured: isExcursionsConfigured() };
    }),
    /** Alle Ausflugsziele – ohne Filter auf `status`, ausdrücklich alle. */
    list: protectedProcedure.query(async () => {
      const { fetchExcursions, isExcursionsConfigured } =
        await import("./excursions");
      if (!isExcursionsConfigured()) {
        return { configured: false as const, excursions: [] };
      }
      return { configured: true as const, excursions: await fetchExcursions() };
    }),
  }),

  /**
   * Amtliche Unwetterwarnungen (MeteoSchweiz über MeteoAlarm).
   *
   * ÖFFENTLICH: Eine amtliche Unwetterwarnung ist keine persönliche
   * Angabe, und wer über einen geteilten Link eine Karte anschaut, soll
   * sie ebenso sehen. Die Anfrage kostet nichts – der Feed liegt
   * serverseitig im Zwischenspeicher und wird für alle einmal geholt.
   */
  warnings: router({
    official: publicProcedure
      .input(
        z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
      )
      .query(async ({ input }) => {
        const { getOfficialWarnings } = await import("./meteoAlarm");
        const { warningsForPoint } = await import("@shared/meteoAlarm");
        const now = Date.now();
        const all = await getOfficialWarnings(now);
        // Die Polygone bleiben auf dem Server: Der Feed ist rund ein
        // Megabyte gross, und der Browser braucht nur die Treffer.
        return warningsForPoint(all, input.latitude, input.longitude, now).map(
          warning => ({
            id: warning.id,
            event: warning.event,
            areaDesc: warning.areaDesc,
            severity: warning.severity,
            onset: warning.onset,
            expires: warning.expires,
          })
        );
      }),
  }),

  /**
   * Orte von Google (Nutzerwunsch 04.08.2026): «Einkaufen in der Nähe»
   * und «Rast unterwegs».
   *
   * WARUM ÜBERHAUPT: OSM kennt die Läden, aber meistens nicht ihre
   * Öffnungszeiten – und «hat der Coop jetzt noch offen» ist genau die
   * Frage am Zeltplatz. Die Begründung samt Grenzen steht ausführlich in
   * `shared/googlePlaces.ts`.
   *
   * Der Abruf läuft nur hier, damit der Schlüssel nie im Browser-Bundle
   * landet. Ohne Schlüssel kommt `configured: false`, und die Ansichten
   * holen ihre Treffer weiter aus OpenStreetMap.
   */
  places: router({
    nearby: protectedProcedure
      .input(
        z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          radiusM: z.number().int().min(100).max(50000),
          /** Was gesucht wird – die Typenliste steht im Server, nicht im Client. */
          kind: z.enum(["shops", "picnic"]),
          language: z.enum(LANGUAGES).default("de"),
        })
      )
      .query(async ({ input }) => {
        const { fetchNearbyPlaces, isPlacesConfigured } =
          await import("./googlePlaces");
        if (!isPlacesConfigured()) {
          return { configured: false as const, places: [] };
        }
        const { GOOGLE_PICNIC_TYPES, GOOGLE_SHOP_TYPES } =
          await import("@shared/googlePlaces");
        const types =
          input.kind === "shops" ? GOOGLE_SHOP_TYPES : GOOGLE_PICNIC_TYPES;
        const places = await fetchNearbyPlaces(
          input.latitude,
          input.longitude,
          input.radiusM,
          types,
          input.language
        );
        // null = Google hat nicht geantwortet. Für die Ansicht ist das
        // dasselbe wie «nicht eingerichtet»: Sie fragt dann OSM.
        if (!places) return { configured: false as const, places: [] };
        return { configured: true as const, places };
      }),
  }),

  /**
   * Fahrzeiten mit Verkehrslage (Nutzerwunsch 04.08.2026). Die AUFTEILUNG
   * zwischen den beiden Routendiensten steht in `shared/googleRoutes.ts`
   * ausführlich: Von Google kommt genau eine Zahl – die Fahrzeit mit
   * Verkehr –, alle Wege, Strecken und Karten-Linien bleiben bei OSM/OSRM.
   *
   * Der Abruf läuft nur hier, damit der Schlüssel nie im Browser-Bundle
   * landet. Ohne Schlüssel meldet `configured: false`, und die Ansichten
   * rechnen mit der OSRM-Fahrzeit weiter.
   */
  routing: router({
    /**
     * Karten-Konfiguration für den Browser (Nutzerwunsch 04.08.2026).
     *
     * ÖFFENTLICH, weil geteilte Links (Standort, Wanderung) ohne Anmeldung
     * eine Karte zeigen. Der Browser-Schlüssel ist kein Geheimnis – er muss
     * ins HTML, sonst lädt keine Google-Karte. Geschützt wird er über die
     * Herkunfts-Sperre in der Cloud Console, nicht über Verstecken.
     *
     * Fehlt eines der beiden Felder, bleibt die App bei OpenStreetMap.
     */
    mapConfig: publicProcedure.query(() => {
      const key = ENV.googleMapsBrowserKey.trim();
      const mapId = ENV.googleMapsMapId.trim();
      return key.length > 0 && mapId.length > 0
        ? { key, mapId }
        : { key: null, mapId: null };
    }),
    /** Gibt es Verkehrs-Fahrzeiten auf diesem Server? */
    status: protectedProcedure.query(async () => {
      const { isDriveTimeConfigured } = await import("./driveTime");
      return { configured: isDriveTimeConfigured() };
    }),
    /**
     * Fahrzeit für eine Autofahrt. `departureAtMs` ist freiwillig: mit
     * Zeitpunkt kommt die Verkehrs-Prognose für diese Tageszeit, ohne den
     * Verkehr von jetzt. Ist nichts zu holen, kommt `driveTime: null` –
     * ausdrücklich kein Fehler, denn die Ansicht hat bereits eine Zahl.
     */
    driveTime: protectedProcedure
      .input(
        z.object({
          from: z.object({
            lat: z.number().min(-90).max(90),
            lon: z.number().min(-180).max(180),
          }),
          to: z.object({
            lat: z.number().min(-90).max(90),
            lon: z.number().min(-180).max(180),
          }),
          departureAtMs: z.number().int().positive().nullish(),
        })
      )
      .query(async ({ input }) => {
        const { fetchDriveTime, isDriveTimeConfigured } =
          await import("./driveTime");
        if (!isDriveTimeConfigured()) {
          return { configured: false as const, driveTime: null };
        }
        return {
          configured: true as const,
          driveTime: await fetchDriveTime(
            input.from,
            input.to,
            input.departureAtMs ?? null
          ),
        };
      }),
  }),

  /**
   * Aufgezeichnete Wanderungen (#220). Die Punktreihe kommt vom Client (dort
   * wird sie beim Aufzeichnen bereits gefiltert), die STATISTIK rechnet immer
   * der Server mit `trackStats()` – so steht in der Datenbank nie eine Zahl,
   * die nicht zur gespeicherten Punktreihe passt.
   */
  tracks: router({
    /** Eigene Tracks, neuste zuoberst – ohne Punktreihe (siehe db.getHikeTracks). */
    list: protectedProcedure.query(({ ctx }) => db.getHikeTracks(ctx.user.id)),
    /** Einzelnen Track samt Punkten laden (für Karte und GPX-Export). */
    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const track = await db.getHikeTrack(input.id, ctx.user.id);
        if (!track) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Wanderung nicht gefunden.",
          });
        }
        return track;
      }),
    add: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(TRACK_NAME_MAX_LENGTH),
          tripId: z.number().int().positive().nullish(),
          points: z
            .array(
              z.object({
                lat: z.number().min(-90).max(90),
                lon: z.number().min(-180).max(180),
                ele: z.number().min(-500).max(9000).nullish(),
                t: z.number().int().positive(),
              })
            )
            .min(2)
            .max(MAX_TRACK_POINTS),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Reise-Zuordnung nur mit Zugriff – Mitreisende dürfen ihre
        // Wanderung ebenfalls an die gemeinsame Reise hängen.
        if (input.tripId != null) {
          await requireTripAccess(input.tripId, ctx.user.id);
        }
        const points: TrackPoint[] = input.points
          .map(p => ({ lat: p.lat, lon: p.lon, ele: p.ele ?? null, t: p.t }))
          .sort((a, b) => a.t - b.t);
        const stats = trackStats(points);
        const id = await db.addHikeTrack({
          userId: ctx.user.id,
          tripId: input.tripId ?? null,
          name: input.name.trim(),
          startedAt: new Date(points[0].t),
          endedAt: new Date(points[points.length - 1].t),
          distanceM: stats.distanceM,
          durationS: stats.durationS,
          ascentM: stats.ascentM,
          descentM: stats.descentM,
          pointsJson: serializeTrackPoints(points),
        });
        return { id, ...stats };
      }),
    /** Umbenennen und/oder Reise-Zuordnung ändern (Punkte bleiben unberührt). */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().trim().min(1).max(TRACK_NAME_MAX_LENGTH).optional(),
          tripId: z.number().int().positive().nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const track = await db.getHikeTrack(input.id, ctx.user.id);
        if (!track) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Wanderung nicht gefunden.",
          });
        }
        if (input.tripId != null) {
          await requireTripAccess(input.tripId, ctx.user.id);
        }
        await db.updateHikeTrack(input.id, ctx.user.id, {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.tripId !== undefined
            ? { tripId: input.tripId ?? null }
            : {}),
        });
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const { capture } = await import("./trash");
        await capture("track", input.id, ctx.user.id);
        await db.deleteHikeTrack(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /** Wanderung per Link teilen (#282) – gleiches Muster wie Rezepte/Plätze. */
    share: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          expiresInDays: shareExpiryInput,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const track = await db.getHikeTrack(input.id, ctx.user.id);
        if (!track) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Wanderung nicht gefunden.",
          });
        }
        const expiresAt = shareExpiryFor(
          input.expiresInDays,
          track.shareExpiresAt
        );
        const token = track.shareToken ?? nanoid(16);
        await db.setHikeTrackShareToken(
          input.id,
          ctx.user.id,
          token,
          expiresAt
        );
        return { token, expiresAt };
      }),
    unshare: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.setHikeTrackShareToken(input.id, ctx.user.id, null);
        return { success: true } as const;
      }),
    /**
     * Geteilte Wanderung öffentlich abrufen (kein Login nötig): Name,
     * Eckdaten und Punktreihe für Karte und Höhenprofil.
     *
     * Die Punkte werden auf SHARED_TRACK_MAX_POINTS ausgedünnt – eine
     * Tageswanderung hat schnell zehntausend Punkte, und niemand lädt
     * dafür ein Megabyte über das Mobilnetz. Für Karte und Profil ist der
     * Unterschied nicht sichtbar.
     *
     * Bewusst NICHT dabei: der Name der wandernden Person und die
     * Reise-Zuordnung – geteilt wird die Wanderung, nicht das Konto.
     */
    sharedGet: publicProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .query(async ({ input }) => {
        const track = await db.getHikeTrackByToken(input.token);
        if (!track) return { track: null };
        const points = thinTrackPoints(parseTrackPoints(track.pointsJson));
        return {
          track: {
            name: track.name,
            startedAt: track.startedAt,
            endedAt: track.endedAt,
            distanceM: track.distanceM,
            durationS: track.durationS,
            ascentM: track.ascentM,
            descentM: track.descentM,
            points,
          },
        };
      }),
  }),

  /**
   * Vorher gezeichnete Routen (#281). Länge, Höhenmeter und Gehzeit
   * werden IMMER hier gerechnet und nie vom Client übernommen: Die Zahl
   * ist der ganze Zweck der Route, und sie soll auf jedem Gerät dieselbe
   * sein. Die Höhen der Wegpunkte kommen dagegen vom Client – sie stammen
   * aus dem Höhenmodell und lassen sich serverseitig nicht besser wissen.
   */
  routes: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getPlannedRoutes(ctx.user.id)
    ),
    save: protectedProcedure
      .input(
        z.object({
          /** Vorhandene Route ändern; fehlt sie, entsteht eine neue. */
          id: z.number().int().positive().optional(),
          name: z.string().trim().min(1).max(ROUTE_NAME_MAX_LENGTH),
          tripId: z.number().int().positive().nullish(),
          pace: z.enum(["slow", "normal", "fast"]).default("normal"),
          waypoints: z
            .array(
              z.object({
                lat: z.number().min(-90).max(90),
                lon: z.number().min(-180).max(180),
                ele: z.number().min(-500).max(9000).nullish(),
              })
            )
            .min(2)
            .max(MAX_ROUTE_WAYPOINTS),
          /**
           * Höhen der Stützstellen zwischen den Wegpunkten. Ohne sie käme
           * die Bilanz nur aus den geklickten Punkten – ein Sattel
           * dazwischen fiele unter den Tisch.
           */
          sampleElevations: z
            .array(z.number().min(-500).max(9000).nullable())
            .max(MAX_ROUTE_SAMPLES)
            .optional(),
          /**
           * Verlauf entlang der echten Wege (aus der Routenberechnung).
           * Liegt er vor, wird die Länge DARAUS gerechnet: Zwei Punkte im
           * Gebirge sind Luftlinie zwei Kilometer und über den Wanderweg
           * fünf. Fehlt er (kein Netz), bleibt es bei den geraden
           * Verbindungen zwischen den Wegpunkten.
           */
          pathPoints: z
            .array(
              z.object({
                lat: z.number().min(-90).max(90),
                lon: z.number().min(-180).max(180),
              })
            )
            .max(MAX_ROUTE_PATH_POINTS)
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (input.tripId != null) {
          await requireTripAccess(input.tripId, ctx.user.id);
        }
        const waypoints: RouteWaypoint[] = input.waypoints.map(w => ({
          lat: w.lat,
          lon: w.lon,
          ele: w.ele ?? null,
        }));
        // Gemessen wird auf dem Weg, wenn er vorliegt – sonst auf den
        // geraden Verbindungen zwischen den Wegpunkten
        const path: RouteWaypoint[] =
          input.pathPoints && input.pathPoints.length >= 2
            ? input.pathPoints.map(p => ({ lat: p.lat, lon: p.lon, ele: null }))
            : waypoints;
        const distanceM = Math.round(routeLengthM(path));
        const samples = routeSamples(path);
        const heights =
          input.sampleElevations && input.sampleElevations.length > 0
            ? samples.map((s, i) => ({
                ...s,
                ele: input.sampleElevations?.[i] ?? null,
              }))
            : waypoints;
        const elevation = routeElevation(heights);
        const ascentM = elevation?.ascentM ?? 0;
        const descentM = elevation?.descentM ?? 0;
        const minutes = hikingMinutes({
          distanceM,
          ascentM,
          descentM,
          pace: input.pace,
        });
        const values = {
          name: input.name.trim(),
          tripId: input.tripId ?? null,
          pace: input.pace,
          waypointsJson: serializeWaypoints(waypoints),
          distanceM,
          ascentM,
          descentM,
          minutes,
        };
        if (input.id != null) {
          const existing = await db.getPlannedRoute(input.id, ctx.user.id);
          if (!existing) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Route nicht gefunden.",
            });
          }
          await db.updatePlannedRoute(input.id, ctx.user.id, values);
          return { id: input.id, distanceM, ascentM, descentM, minutes };
        }
        const id = await db.addPlannedRoute({
          userId: ctx.user.id,
          ...values,
        });
        return { id, distanceM, ascentM, descentM, minutes };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePlannedRoute(input.id, ctx.user.id);
        return { success: true } as const;
      }),
  }),

  /**
   * Freie Notizen (#246): schlichtes CRUD auf eigenen Notizen. Titel, Text
   * und Stichwörter laufen durch shared/notes.ts, damit der Server exakt so
   * säubert wie die Eingabemaske – die Stichwörter landen kommagetrennt und
   * entdoppelt in EINER Spalte.
   */
  notes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const rows = await db.getUserNotes(ctx.user.id);
      // Reihenfolge kommt aus shared/, damit sie testbar bleibt
      return sortNotes(rows);
    }),
    add: protectedProcedure
      .input(
        z.object({
          title: z
            .string()
            .max(NOTE_TITLE_MAX_LENGTH * 2)
            .nullish(),
          text: z
            .string()
            .min(1)
            .max(NOTE_TEXT_MAX_LENGTH * 2),
          tags: z.array(z.string().max(NOTE_TAG_MAX_LENGTH * 2)).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const text = normalizeNoteText(input.text);
        if (!text) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Die Notiz braucht einen Text.",
          });
        }
        const id = await db.addUserNote({
          userId: ctx.user.id,
          title: normalizeNoteTitle(input.title),
          text,
          tags: serializeNoteTags(input.tags ?? []),
        });
        return { id };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          title: z
            .string()
            .max(NOTE_TITLE_MAX_LENGTH * 2)
            .nullish(),
          text: z
            .string()
            .min(1)
            .max(NOTE_TEXT_MAX_LENGTH * 2)
            .optional(),
          tags: z.array(z.string().max(NOTE_TAG_MAX_LENGTH * 2)).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const note = await db.getUserNote(input.id, ctx.user.id);
        if (!note) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notiz nicht gefunden.",
          });
        }
        const text =
          input.text !== undefined ? normalizeNoteText(input.text) : undefined;
        if (text !== undefined && !text) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Die Notiz braucht einen Text.",
          });
        }
        await db.updateUserNote(input.id, ctx.user.id, {
          ...(input.title !== undefined
            ? { title: normalizeNoteTitle(input.title) }
            : {}),
          ...(text !== undefined ? { text } : {}),
          ...(input.tags !== undefined
            ? { tags: serializeNoteTags(input.tags) }
            : {}),
        });
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const { capture } = await import("./trash");
        await capture("note", input.id, ctx.user.id);
        await db.deleteUserNote(input.id, ctx.user.id);
        return { success: true } as const;
      }),
  }),

  spots: router({
    list: protectedProcedure.query(({ ctx }) => db.getCampSpots(ctx.user.id)),
    /**
     * Eigene Bewertung nach Kriterien (#278). Jedes Kriterium darf null
     * sein – «nicht bewertet» ist ein gültiger Zustand und keine Null.
     */
    rate: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          sanitary: z.number().int().min(0).max(MAX_STARS).nullish(),
          quiet: z.number().int().min(0).max(MAX_STARS).nullish(),
          shade: z.number().int().min(0).max(MAX_STARS).nullish(),
          kids: z.number().int().min(0).max(MAX_STARS).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const spot = await db.getCampSpot(input.id, ctx.user.id);
        if (!spot) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Zeltplatz nicht gefunden.",
          });
        }
        await db.updateCampSpot(input.id, ctx.user.id, {
          ratingSanitary: clampStars(input.sanitary ?? null),
          ratingQuiet: clampStars(input.quiet ?? null),
          ratingShade: clampStars(input.shade ?? null),
          ratingKids: clampStars(input.kids ?? null),
        });
        return { success: true } as const;
      }),
    add: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(120),
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          note: z.string().max(500).optional(),
          attributesJson: z
            .string()
            .max(SPOT_ATTRIBUTES_JSON_MAX_LENGTH)
            .optional(),
          receptionPhone: z.string().max(40).nullish(),
          checkinInfo: z.string().max(120).nullish(),
          parcelNumber: z.string().max(40).nullish(),
          // Platzkosten (#243) in Rappen
          pricePerNightRappen: SPOT_PRICE_INPUT,
          extraPerNightRappen: SPOT_PRICE_INPUT,
          // Höhe über Meer: der Client ermittelt sie bei Open-Meteo
          elevationM: SPOT_ELEVATION_INPUT,
        })
      )
      .mutation(({ ctx, input }) =>
        db.addCampSpot({
          userId: ctx.user.id,
          ...input,
          attributesJson: normalizeSpotAttributesJson(input.attributesJson),
          // Kontaktdaten trimmen; leere Eingaben landen als null in der DB
          receptionPhone: input.receptionPhone?.trim() || null,
          checkinInfo: input.checkinInfo?.trim() || null,
          parcelNumber: input.parcelNumber?.trim() || null,
          // 0 heisst «nicht erfasst» und landet als null in der DB
          pricePerNightRappen: input.pricePerNightRappen || null,
          extraPerNightRappen: input.extraPerNightRappen || null,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(120).optional(),
          note: z.string().max(500).optional(),
          attributesJson: z
            .string()
            .max(SPOT_ATTRIBUTES_JSON_MAX_LENGTH)
            .nullable()
            .optional(),
          receptionPhone: z.string().max(40).nullish(),
          checkinInfo: z.string().max(120).nullish(),
          parcelNumber: z.string().max(40).nullish(),
          pricePerNightRappen: SPOT_PRICE_INPUT,
          extraPerNightRappen: SPOT_PRICE_INPUT,
          elevationM: SPOT_ELEVATION_INPUT,
        })
      )
      .mutation(({ ctx, input }) => {
        const {
          id,
          receptionPhone,
          checkinInfo,
          parcelNumber,
          pricePerNightRappen,
          extraPerNightRappen,
          ...data
        } = input;
        return db.updateCampSpot(id, ctx.user.id, {
          ...data,
          attributesJson: normalizeSpotAttributesJson(data.attributesJson),
          // Kontaktdaten nur anfassen, wenn sie mitgeschickt wurden;
          // getrimmt, leere Eingaben löschen den Wert (null)
          ...(receptionPhone !== undefined
            ? { receptionPhone: receptionPhone?.trim() || null }
            : {}),
          ...(checkinInfo !== undefined
            ? { checkinInfo: checkinInfo?.trim() || null }
            : {}),
          ...(parcelNumber !== undefined
            ? { parcelNumber: parcelNumber?.trim() || null }
            : {}),
          // Platzkosten ebenso: nur anfassen, wenn mitgeschickt; 0 löscht den Wert
          ...(pricePerNightRappen !== undefined
            ? { pricePerNightRappen: pricePerNightRappen || null }
            : {}),
          ...(extraPerNightRappen !== undefined
            ? { extraPerNightRappen: extraPerNightRappen || null }
            : {}),
        });
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Papierkorb (#295): Schnappschuss samt Foto-Zeilen; die Dateien
        // auf dem Webspace bleiben liegen, bis der Eintrag abläuft.
        const { capture } = await import("./trash");
        await capture("spot", input.id, ctx.user.id);
        await db.deleteCampSpot(input.id, ctx.user.id);
        await db.deleteSpotPhotosForSpot(input.id, ctx.user.id);
      }),
    photos: router({
      /** Fotos eines eigenen Platzes (leere Liste, wenn der Platz nicht dir gehört). */
      list: protectedProcedure
        .input(z.object({ spotId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          const spot = await db.getCampSpot(input.spotId, ctx.user.id);
          if (!spot) {
            return [] as Awaited<ReturnType<typeof db.getSpotPhotos>>;
          }
          return db.getSpotPhotos(input.spotId, ctx.user.id);
        }),
      /** Einzelnes Foto löschen (DB-Zeile + Datei auf dem Webspace). */
      remove: protectedProcedure
        .input(z.object({ photoId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const photo = await db.getSpotPhoto(input.photoId, ctx.user.id);
          if (!photo) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Foto nicht gefunden.",
            });
          }
          await db.deleteSpotPhoto(input.photoId, ctx.user.id);
          const { spotPhotoStorage } = await import("./photoStorage");
          await spotPhotoStorage.deleteFiles([photo.fileName]);
          return { success: true } as const;
        }),
    }),
    /** Teil-Link fürs Platz-Dossier erzeugen: gibt den Token zurück. */
    share: protectedProcedure
      .input(z.object({ id: z.number(), expiresInDays: shareExpiryInput }))
      .mutation(async ({ ctx, input }) => {
        const spots = await db.getCampSpots(ctx.user.id);
        const spot = spots.find(s => s.id === input.id);
        if (!spot) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Zeltplatz nicht gefunden.",
          });
        }
        const expiresAt = shareExpiryFor(
          input.expiresInDays,
          spot.shareExpiresAt
        );
        const token = spot.shareToken ?? nanoid(16);
        await db.setCampSpotShareToken(input.id, ctx.user.id, token, expiresAt);
        return { token, expiresAt };
      }),
    /** Teilen beenden: Token entfernen, Link wird ungültig. */
    unshare: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setCampSpotShareToken(input.id, ctx.user.id, null);
        return { success: true } as const;
      }),
    /** Geteilten Zeltplatz öffentlich abrufen (nur lesend, ohne Login). */
    sharedGet: publicProcedure
      .input(z.object({ token: z.string().min(8).max(32) }))
      .query(async ({ input }) => {
        const spot = await db.getCampSpotByToken(input.token);
        if (!spot) return null;
        return {
          name: spot.name,
          latitude: spot.latitude,
          longitude: spot.longitude,
          note: spot.note,
          // Eigenschaften sind unkritisch und für Empfänger*innen hilfreich
          attributesJson: spot.attributesJson,
          // Kontakt & Check-in ebenso – praktisch für Mitreisende vor Ort
          receptionPhone: spot.receptionPhone,
          checkinInfo: spot.checkinInfo,
          parcelNumber: spot.parcelNumber,
        };
      }),
  }),
  /**
   * Papierkorb (#295): Gelöschtes 30 Tage lang wiederherstellen.
   *
   * Die Einträge entstehen in den `remove`-Prozeduren der jeweiligen
   * Module – dort wird VOR dem Löschen ein Schnappschuss genommen.
   */
  trash: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Beim Öffnen aufräumen: Der Cronjob räumt den Speicher auf, dieser
      // Aufruf sorgt dafür, dass die Liste auch dann stimmt, wenn der
      // Cronjob ausfällt – und auf einem Webhosting fällt er aus.
      const { purgeExpired } = await import("./trash");
      await purgeExpired(
        new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
      ).catch(() => 0);
      const entries = await db.getTrashEntries(ctx.user.id);
      return visibleTrash(entries, Date.now());
    }),
    restore: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const { restore } = await import("./trash");
        const result = await restore(input.id, ctx.user.id);
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Der Eintrag ist nicht mehr im Papierkorb.",
          });
        }
        return { success: true, restored: result.restored } as const;
      }),
    /** Einen Eintrag endgültig löschen – samt seiner Dateien. */
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const { purgeOne } = await import("./trash");
        await purgeOne(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /** Papierkorb leeren. */
    empty: protectedProcedure.mutation(async ({ ctx }) => {
      const { purgeAll } = await import("./trash");
      const removed = await purgeAll(ctx.user.id);
      return { success: true, removed } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
