import { COOKIE_NAME } from "@shared/const";
import { nanoid } from "nanoid";
import { z } from "zod";
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
import { l4, pick } from "@shared/i18n";
import {
  SETTING_VALUE_MAX_LENGTH,
  SYNCED_SETTING_KEYS,
} from "@shared/settings";
import { MAX_STATIONS, solutionWordFromStations } from "@shared/hunts";
import { isBadgeId } from "@shared/badges";
import {
  MAX_QUIZ_OPTIONS,
  MAX_QUIZ_QUESTIONS,
  MIN_QUIZ_OPTIONS,
} from "@shared/quizzes";
import {
  expiryDateFromDays,
  MAX_EXPIRY_DAYS,
  MAX_FOOD_ITEM_NAME_LENGTH,
  MAX_FOOD_TEMPLATE_ITEMS,
  parseFoodTemplateItems,
} from "@shared/foodTemplates";
import { MEALS } from "@shared/menuPlan";
import {
  MAX_GEAR_INTERVAL_MONTHS,
  MAX_GEAR_TASK_TITLE_LENGTH,
  MIN_GEAR_INTERVAL_MONTHS,
} from "@shared/gearTasks";
import {
  TRIP_WEATHER_MAX_PRECIP_MM,
  TRIP_WEATHER_MAX_RAIN_DAYS,
  TRIP_WEATHER_TEMP_MAX,
  TRIP_WEATHER_TEMP_MIN,
} from "@shared/tripWeather";
import { SHOPPING_CATEGORIES } from "@shared/shopping";
import {
  parseSpotAttributes,
  SPOT_ATTRIBUTES_JSON_MAX_LENGTH,
} from "@shared/spotAttributes";
import { RECIPE_DIFFICULTIES, RECIPE_METHODS } from "@shared/customRecipes";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

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

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      // passwordHash niemals an den Client schicken
      const { passwordHash: _ph, ...safeUser } = opts.ctx.user;
      return safeUser;
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
        await updateUserEmail(ctx.user.id, email);
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
      .mutation(({ ctx, input }) => db.deletePackList(input.id, ctx.user.id)),
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
        createdAt: row.createdAt,
      }));
    }),
    /** Teil-Link für eine eigene Vorlage erzeugen: gibt den Token zurück. */
    shareTemplate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.getPackTemplate(input.id, ctx.user.id);
        if (!template)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vorlage nicht gefunden",
          });
        if (template.shareToken) return { token: template.shareToken };
        const token = nanoid(16);
        await db.setPackTemplateShareToken(input.id, ctx.user.id, token);
        return { token };
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
    /** Liste samt Einträgen – auch für Mitreisende einer verknüpften Reise. */
    items: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .query(async ({ ctx, input }) => {
        const list = await db.canAccessList(input.listId, ctx.user.id);
        if (!list) {
          return {
            list: null,
            items: [] as Awaited<ReturnType<typeof db.getPackItems>>,
          };
        }
        const items = await db.getPackItems(input.listId);
        return { list, items };
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
        await db.setPackItemChecked(input.id, input.checked);
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
     * Eintrag anpassen: Personen-Zuordnung («Wer packt das?», null entfernt
     * sie) und/oder Kategorie – Kategorien sind frei, neue entstehen implizit.
     */
    updateItem: protectedProcedure
      .input(
        z.object({
          id: z.number(),
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
          ...(input.assignee !== undefined ? { assignee: input.assignee } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
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
      .input(z.object({ listId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const list = await db.getPackList(input.listId, ctx.user.id);
        if (!list) throw new Error("Liste nicht gefunden");
        if (list.shareToken) return { token: list.shareToken };
        const token = nanoid(16);
        await db.setPackListShareToken(input.listId, ctx.user.id, token);
        return { token };
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
        await db.setPackItemChecked(input.itemId, input.checked);
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
        })
      )
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateInventoryItem(id, ctx.user.id, data);
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Foto-Datei mitputzen: erst Dateinamen sichern, dann DB-Zeile
        // löschen und zuletzt die Datei auf dem Webspace entfernen.
        const item = await db.getInventoryItem(input.id, ctx.user.id);
        await db.deleteInventoryItem(input.id, ctx.user.id);
        if (item?.imageFileName) {
          const { inventoryPhotoStorage } = await import("./photoStorage");
          await inventoryPhotoStorage.deleteFiles([item.imageFileName]);
        }
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

  shopping: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getShoppingItems(ctx.user.id)
    ),
    add: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(160),
          category: z.enum(SHOPPING_CATEGORIES).nullish(),
          quantity: z.string().max(40).nullish(),
          note: z.string().max(160).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const items = await db.getShoppingItems(ctx.user.id);
        const name = input.name.trim();
        // Duplikat-Schutz: steht der Name bereits unabgehakt auf der Liste
        // (case-insensitiv), wird kein zweiter Eintrag angelegt. Eine
        // mitgeschickte Menge/Notiz wird dann NICHT übernommen – der Client
        // zeigt einen Info-Toast, damit nichts stillschweigend verloren geht.
        const alreadyOpen = items.some(
          i => !i.checked && i.name.trim().toLowerCase() === name.toLowerCase()
        );
        if (alreadyOpen) return { success: true, added: false } as const;
        const nextPosition =
          items.reduce((max, i) => Math.max(max, i.position), 0) + 1;
        await db.addShoppingItems([
          {
            userId: ctx.user.id,
            name,
            position: nextPosition,
            category: input.category ?? null,
            quantity: input.quantity?.trim() || null,
            note: input.note?.trim() || null,
          },
        ]);
        return { success: true, added: true } as const;
      }),
    /** Mehrere Einträge auf einmal (z. B. Zutaten eines Rezepts) – wahlweise
     * als blosser Name oder als Objekt mit optionaler Menge/Notiz. */
    addMany: protectedProcedure
      .input(
        z.object({
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
          category: z.enum(SHOPPING_CATEGORIES).nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const items = await db.getShoppingItems(ctx.user.id);
        const nextPosition =
          items.reduce((max, i) => Math.max(max, i.position), 0) + 1;
        await db.addShoppingItems(
          input.names.map((entry, idx) => {
            const obj = typeof entry === "string" ? { name: entry } : entry;
            return {
              userId: ctx.user.id,
              name: obj.name.trim(),
              position: nextPosition + idx,
              category: input.category ?? null,
              quantity: ("quantity" in obj && obj.quantity?.trim()) || null,
              note: ("note" in obj && obj.note?.trim()) || null,
            };
          })
        );
        return { added: input.names.length };
      }),
    /** Menge und/oder Notiz eines eigenen Eintrags setzen (null/"" entfernt). */
    updateItem: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          quantity: z.string().max(40).nullish(),
          note: z.string().max(160).nullish(),
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
        })
      ),
    /** Laden-Kategorie eines Eintrags setzen; null entfernt sie wieder. */
    setCategory: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          category: z.enum(SHOPPING_CATEGORIES).nullable(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.setShoppingItemCategory(input.id, ctx.user.id, input.category)
      ),
    /** Neue Reihenfolge (Drag-and-drop) speichern: Positionen 0..n. */
    reorder: protectedProcedure
      .input(z.object({ itemIds: z.array(z.number().int()).min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        const items = await db.getShoppingItems(ctx.user.id);
        const valid = new Set(items.map(i => i.id));
        // Nur eigene Einträge umsortieren – fremde IDs werden ignoriert
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
    removeChecked: protectedProcedure.mutation(({ ctx }) =>
      db.deleteCheckedShoppingItems(ctx.user.id)
    ),
    clear: protectedProcedure.mutation(({ ctx }) =>
      db.clearShoppingItems(ctx.user.id)
    ),
    /** Teil-Link erzeugen (idempotent): gibt den Token zurück. */
    share: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await db.getShoppingShare(ctx.user.id);
      if (existing) return { token: existing.shareToken };
      const token = nanoid(16);
      await db.createShoppingShare(ctx.user.id, token);
      return { token };
    }),
    /** Teilen beenden: Token entfernen, Link wird ungültig. */
    unshare: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteShoppingShare(ctx.user.id);
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
        const items = await db.getShoppingItems(share.userId);
        return {
          active: true as const,
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
        const items = await db.getShoppingItems(share.userId);
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
          expiryDate: input.expiryDate ?? null,
        })
      ),
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
                expiryDays: z
                  .number()
                  .int()
                  .min(0)
                  .max(MAX_EXPIRY_DAYS)
                  .optional(),
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
        const existingNames = new Set(
          existing.map(i => i.name.trim().toLowerCase())
        );
        const toInsert: typeof items = [];
        let skipped = 0;
        for (const item of items) {
          const key = item.name.trim().toLowerCase();
          if (existingNames.has(key)) {
            skipped += 1;
            continue;
          }
          existingNames.add(key);
          toInsert.push(item);
        }
        await db.addFoodItems(
          toInsert.map(item => ({
            userId: ctx.user.id,
            name: item.name,
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
    /** Mitteilungs-Flags des Abos dieses Geräts setzen (teilweise erlaubt). */
    setPrefs: protectedProcedure
      .input(
        z.object({
          endpoint: z.string().min(10).max(500),
          wantsWeather: z.boolean().optional(),
          wantsFood: z.boolean().optional(),
          wantsTrips: z.boolean().optional(),
          wantsAstro: z.boolean().optional(),
          wantsGear: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { setSubscriptionPrefs } = await import("./push");
        const { endpoint, ...prefs } = input;
        await setSubscriptionPrefs(ctx.user.id, endpoint, prefs);
        return { success: true } as const;
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
        // Foto-Datei mitputzen: erst Dateinamen sichern, dann DB-Zeile
        // löschen und zuletzt die Datei auf dem Webspace entfernen.
        const recipe = await db.getCustomRecipe(input.id, ctx.user.id);
        await db.deleteCustomRecipe(input.id, ctx.user.id);
        if (recipe?.imageFileName) {
          const { recipePhotoStorage } = await import("./photoStorage");
          await recipePhotoStorage.deleteFiles([recipe.imageFileName]);
        }
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
      /** Kind entfernen – seine Abzeichen und Zähler gehen mit. */
      remove: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(({ ctx, input }) =>
          db.deleteFamilyChild(input.id, ctx.user.id)
        ),
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
      const merged = [
        ...own.map(trip => ({
          ...trip,
          role: "owner" as const,
          ownerName: null as string | null,
          spotName: null as string | null,
        })),
        ...member.map(({ trip, ownerName, ownerEmail, spotName }) => ({
          ...trip,
          role: "member" as const,
          ownerName: ownerName ?? ownerEmail ?? null,
          spotName,
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
        });
        return { id };
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
          ...(weatherStale ? { weatherJson: null } : {}),
        });
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
        // Zugehörige Fotos mitlöschen (auch die von Mitreisenden): erst
        // Dateinamen sichern, dann DB-Zeilen und zuletzt die Dateien auf
        // dem Webspace entfernen.
        const photos = await db.getTripPhotosForTrip(input.id);
        await db.deleteTripLog(input.id, ctx.user.id);
        await db.deleteAllTripPhotosForTrip(input.id);
        if (photos.length > 0) {
          const { tripPhotoStorage } = await import("./photoStorage");
          await tripPhotoStorage.deleteFiles(photos.map(p => p.fileName));
        }
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
          return { success: true } as const;
        }),
    }),
    /**
     * Teil-Link für den Reise-Hub erzeugen (nur Besitzerin/Besitzer):
     * ein öffentlicher Read-only-Link, unabhängig von den Reise-Mitgliedern.
     * Hat die verknüpfte Packliste noch keinen Teil-Token, bekommt sie hier
     * einen – so funktioniert das Abhaken im Hub über die BESTEHENDE
     * geteilte-Listen-Mechanik (packing.sharedToggle) unverändert.
     */
    share: protectedProcedure
      .input(z.object({ tripId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const trip = await db.getTripLog(input.tripId, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        if (trip.packListId != null) {
          const list = await db.getPackList(trip.packListId, ctx.user.id);
          if (list && !list.shareToken) {
            await db.setPackListShareToken(list.id, ctx.user.id, nanoid(16));
          }
        }
        if (trip.shareToken) return { token: trip.shareToken };
        const token = nanoid(16);
        await db.setTripLogShareToken(input.tripId, ctx.user.id, token);
        return { token };
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
          packList,
        };
      }),
  }),
  menu: router({
    /** Trip samt Menüplan-Einträgen (null, wenn kein Zugriff besteht). */
    listByTrip: protectedProcedure
      .input(z.object({ tripId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
        if (!trip) {
          return {
            trip: null,
            entries: [] as Awaited<ReturnType<typeof db.getMenuEntriesForTrip>>,
          };
        }
        const entries = await db.getMenuEntriesForTrip(input.tripId);
        return { trip, entries };
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
        });
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
        return { success: true } as const;
      }),
  }),
  spots: router({
    list: protectedProcedure.query(({ ctx }) => db.getCampSpots(ctx.user.id)),
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
        })
      )
      .mutation(({ ctx, input }) =>
        db.addCampSpot({
          userId: ctx.user.id,
          ...input,
          attributesJson: normalizeSpotAttributesJson(input.attributesJson),
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
        })
      )
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateCampSpot(id, ctx.user.id, {
          ...data,
          attributesJson: normalizeSpotAttributesJson(data.attributesJson),
        });
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Zugehörige Fotos mitlöschen: erst Dateinamen sichern, dann
        // DB-Zeilen und zuletzt die Dateien auf dem Webspace entfernen.
        const photos = await db.getSpotPhotos(input.id, ctx.user.id);
        await db.deleteCampSpot(input.id, ctx.user.id);
        await db.deleteSpotPhotosForSpot(input.id, ctx.user.id);
        if (photos.length > 0) {
          const { spotPhotoStorage } = await import("./photoStorage");
          await spotPhotoStorage.deleteFiles(photos.map(p => p.fileName));
        }
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
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const spots = await db.getCampSpots(ctx.user.id);
        const spot = spots.find(s => s.id === input.id);
        if (!spot) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Zeltplatz nicht gefunden.",
          });
        }
        if (spot.shareToken) return { token: spot.shareToken };
        const token = nanoid(16);
        await db.setCampSpotShareToken(input.id, ctx.user.id, token);
        return { token };
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
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
