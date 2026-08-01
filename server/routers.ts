import { COOKIE_NAME } from "@shared/const";
import { nanoid } from "nanoid";
import { z } from "zod";
import { ONE_YEAR_MS } from "@shared/const";
import { packScenarios } from "@shared/packTemplates";
import { SETTING_VALUE_MAX_LENGTH, SYNCED_SETTING_KEYS } from "@shared/settings";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

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
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { validateEmail, validatePassword, normalizeEmail, findUserByEmail, registerUser, createLocalSessionToken } =
          await import("./localAuth");
        if (!validateEmail(normalizeEmail(input.email))) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Bitte gib eine gültige E-Mail-Adresse ein." });
        }
        const pwError = validatePassword(input.password);
        if (pwError) throw new TRPCError({ code: "BAD_REQUEST", message: pwError });
        const existing = await findUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Für diese E-Mail-Adresse existiert bereits ein Konto. Melde dich stattdessen an.",
          });
        }
        const user = await registerUser(input.name, input.email, input.password);
        const token = await createLocalSessionToken(user);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, name: user.name } as const;
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().min(3).max(320), password: z.string().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        const { findUserByEmail, verifyPassword, createLocalSessionToken, normalizeEmail } =
          await import("./localAuth");
        const { isRateLimited, registerFailure, clearFailures, lockoutMinutes } = await import(
          "./rateLimit"
        );
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
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, name: user.name } as const;
      }),
    updateName: protectedProcedure
      .input(z.object({ name: z.string().min(1, "Bitte gib einen Namen ein.").max(100) }))
      .mutation(async ({ ctx, input }) => {
        const { updateUserName } = await import("./localAuth");
        await updateUserName(ctx.user.id, input.name);
        return { success: true } as const;
      }),
    updatePassword: protectedProcedure
      .input(
        z.object({
          currentPassword: z.string().min(1).max(200),
          newPassword: z.string().min(1).max(200),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { validatePassword, verifyPassword, updateUserPassword } = await import("./localAuth");
        if (!ctx.user.passwordHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Für dieses Konto ist kein Passwort hinterlegt.",
          });
        }
        const ok = await verifyPassword(input.currentPassword, ctx.user.passwordHash);
        if (!ok) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Das aktuelle Passwort ist falsch." });
        }
        const pwError = validatePassword(input.newPassword);
        if (pwError) throw new TRPCError({ code: "BAD_REQUEST", message: pwError });
        await updateUserPassword(ctx.user.id, input.newPassword);
        return { success: true } as const;
      }),
    deleteAccount: protectedProcedure
      .input(z.object({ password: z.string().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        const { verifyPassword, deleteUserAccount } = await import("./localAuth");
        if (ctx.user.passwordHash) {
          const ok = await verifyPassword(input.password, ctx.user.passwordHash);
          if (!ok) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Das Passwort ist falsch." });
          }
        }
        await deleteUserAccount(ctx.user.id);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        return { success: true } as const;
      }),
    requestReset: publicProcedure
      .input(z.object({ email: z.string().min(3).max(320) }))
      .mutation(async ({ input }) => {
        const { findUserByEmail, createResetCode } = await import("./localAuth");
        const user = await findUserByEmail(input.email);
        // Aus Datenschutzgründen immer Erfolg melden, auch wenn das Konto nicht existiert
        if (user && user.email && user.passwordHash) {
          const code = await createResetCode(user.email);
          const { sendResetCode } = await import("./mailer");
          // Zustellung per SMTP (Selbst-Hosting) oder Manus-Benachrichtigung
          await sendResetCode(user.email, code).catch(() => {});
        }
        return { success: true } as const;
      }),
    resetPassword: publicProcedure
      .input(
        z.object({
          email: z.string().min(3).max(320),
          code: z.string().length(6),
          newPassword: z.string().min(1).max(200),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const {
          findUserByEmail,
          verifyResetCode,
          consumeResetCode,
          validatePassword,
          updateUserPassword,
          createLocalSessionToken,
        } = await import("./localAuth");
        const codeError = await verifyResetCode(input.email, input.code);
        if (codeError) throw new TRPCError({ code: "BAD_REQUEST", message: codeError });
        const pwError = validatePassword(input.newPassword);
        if (pwError) throw new TRPCError({ code: "BAD_REQUEST", message: pwError });
        const user = await findUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Konto nicht gefunden." });
        await updateUserPassword(user.id, input.newPassword);
        consumeResetCode(input.email);
        // Direkt anmelden
        const token = await createLocalSessionToken(user);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true } as const;
      }),
  }),

  packing: router({
    lists: protectedProcedure.query(({ ctx }) => db.getPackLists(ctx.user.id)),
    createList: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(120), scenario: z.string().max(60) }))
      .mutation(async ({ ctx, input }) => {
        const listId = await db.createPackList({
          userId: ctx.user.id,
          name: input.name,
          scenario: input.scenario,
        });
        const scenario = packScenarios.find(s => s.id === input.scenario);
        if (scenario && scenario.items.length > 0) {
          await db.addPackItems(
            scenario.items.map((item, idx) => ({
              listId,
              name: item.name,
              category: item.category,
              quantity: item.quantity ?? 1,
              sortOrder: idx,
            })),
          );
        }
        return { listId };
      }),
    deleteList: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deletePackList(input.id, ctx.user.id)),
    items: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .query(async ({ ctx, input }) => {
        const list = await db.getPackList(input.listId, ctx.user.id);
        if (!list) {
          return { list: null, items: [] as Awaited<ReturnType<typeof db.getPackItems>> };
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
            }),
          ),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const list = await db.getPackList(input.listId, ctx.user.id);
        if (!list) throw new Error("Liste nicht gefunden");
        await db.addPackItems(
          input.items.map((item, idx) => ({ listId: input.listId, sortOrder: 1000 + idx, ...item })),
        );
      }),
    toggleItem: protectedProcedure
      .input(z.object({ id: z.number(), checked: z.boolean() }))
      .mutation(({ input }) => db.setPackItemChecked(input.id, input.checked)),
    deleteItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deletePackItem(input.id)),
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
          return { list: null, items: [] as Awaited<ReturnType<typeof db.getPackItems>> };
        }
        const items = await db.getPackItems(list.id);
        return { list: { id: list.id, name: list.name, scenario: list.scenario }, items };
      }),
    /** Abhaken über den Teil-Link (kein Login nötig, Token dient als Berechtigung). */
    sharedToggle: publicProcedure
      .input(z.object({ token: z.string().min(8).max(32), itemId: z.number(), checked: z.boolean() }))
      .mutation(async ({ input }) => {
        const list = await db.getPackListByToken(input.token);
        if (!list) throw new Error("Geteilte Liste nicht gefunden");
        const items = await db.getPackItems(list.id);
        if (!items.some(i => i.id === input.itemId)) throw new Error("Eintrag gehört nicht zu dieser Liste");
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
        }),
      )
      .mutation(({ ctx, input }) => db.addInventoryItem({ userId: ctx.user.id, ...input })),
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
        }),
      )
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateInventoryItem(id, ctx.user.id, data);
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteInventoryItem(input.id, ctx.user.id)),
  }),

  energy: router({
    consumers: protectedProcedure.query(({ ctx }) => db.getPowerConsumers(ctx.user.id)),
    add: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(160),
          watts: z.number().min(0).max(10000),
          hoursPerDay: z.number().min(0).max(24),
        }),
      )
      .mutation(({ ctx, input }) => db.addPowerConsumer({ userId: ctx.user.id, ...input })),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          watts: z.number().min(0).max(10000).optional(),
          hoursPerDay: z.number().min(0).max(24).optional(),
          enabled: z.boolean().optional(),
        }),
      )
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updatePowerConsumer(id, ctx.user.id, data);
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deletePowerConsumer(input.id, ctx.user.id)),
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
        }),
      )
      .mutation(({ ctx, input }) =>
        db.addFoodItem({
          userId: ctx.user.id,
          name: input.name,
          quantity: input.quantity,
          expiryDate: input.expiryDate ?? null,
        }),
      ),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteFoodItem(input.id, ctx.user.id)),
  }),
  settings: router({
    /** Alle synchronisierten Einstellungen als key → JSON-String. */
    all: protectedProcedure.query(async ({ ctx }) => {
      const rows = await db.getUserSettings(ctx.user.id);
      return Object.fromEntries(rows.map(r => [r.key, r.value])) as Record<string, string>;
    }),
    set: protectedProcedure
      .input(
        z.object({
          key: z.enum(SYNCED_SETTING_KEYS),
          value: z.string().max(SETTING_VALUE_MAX_LENGTH),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserSetting(ctx.user.id, input.key, input.value);
        return { success: true } as const;
      }),
  }),

  trips: router({
    list: protectedProcedure.query(({ ctx }) => db.getTripLogs(ctx.user.id)),
    add: protectedProcedure
      .input(
        z
          .object({
            spotId: z.number().int().positive().nullish(),
            location: z.string().max(140).nullish(),
            title: z.string().max(140).nullish(),
            notes: z.string().max(2000).nullish(),
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          })
          .refine(v => v.endDate >= v.startDate, {
            message: "Die Abreise darf nicht vor der Anreise liegen.",
          })
          .refine(v => v.spotId != null || (v.location ?? "").trim().length > 0, {
            message: "Bitte einen Zeltplatz wählen oder einen Ort eintragen.",
          }),
      )
      .mutation(async ({ ctx, input }) => {
        // Nur eigene Zeltplatz-Favoriten dürfen verknüpft werden
        if (input.spotId != null) {
          const spots = await db.getCampSpots(ctx.user.id);
          if (!spots.some(s => s.id === input.spotId)) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Zeltplatz nicht gefunden." });
          }
        }
        const id = await db.addTripLog({
          userId: ctx.user.id,
          spotId: input.spotId ?? null,
          location: input.location?.trim() || null,
          title: input.title?.trim() || null,
          notes: input.notes?.trim() || null,
          startDate: input.startDate,
          endDate: input.endDate,
        });
        return { id };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteTripLog(input.id, ctx.user.id)),
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
        }),
      )
      .mutation(({ ctx, input }) => db.addCampSpot({ userId: ctx.user.id, ...input })),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(120).optional(),
          note: z.string().max(500).optional(),
        }),
      )
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateCampSpot(id, ctx.user.id, data);
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteCampSpot(input.id, ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
