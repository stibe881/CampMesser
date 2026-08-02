import { COOKIE_NAME } from "@shared/const";
import { nanoid } from "nanoid";
import { z } from "zod";
import { ONE_YEAR_MS } from "@shared/const";
import {
  packScenarios,
  parseCustomTemplateItems,
  type CustomTemplateItem,
} from "@shared/packTemplates";
import { l4, pick } from "@shared/i18n";
import {
  SETTING_VALUE_MAX_LENGTH,
  SYNCED_SETTING_KEYS,
} from "@shared/settings";
import { MAX_STATIONS, solutionWordFromStations } from "@shared/hunts";
import { MEALS } from "@shared/menuPlan";
import { RECIPE_DIFFICULTIES, RECIPE_METHODS } from "@shared/customRecipes";
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
        const { verifyPassword, deleteUserAccount } = await import(
          "./localAuth"
        );
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
        const { mailConfigured, sendPasswordResetMail } = await import(
          "./mailer"
        );
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
        })
      )
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
    /** Leichter Pack-Fortschritt einer Liste (für den Trip-Planer). */
    progress: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .query(async ({ ctx, input }) => {
        const list = await db.getPackList(input.listId, ctx.user.id);
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
        });
        await db.addPackItems(
          items.map(item => ({
            listId: newListId,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
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
        createdAt: row.createdAt,
      }));
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
    items: protectedProcedure
      .input(z.object({ listId: z.number() }))
      .query(async ({ ctx, input }) => {
        const list = await db.getPackList(input.listId, ctx.user.id);
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
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const list = await db.getPackList(input.listId, ctx.user.id);
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
      .mutation(({ input }) => db.setPackItemChecked(input.id, input.checked)),
    /** Personen-Zuordnung («Wer packt das?») setzen; null entfernt sie wieder. */
    updateItem: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          assignee: z.string().trim().min(1).max(80).nullable(),
        })
      )
      .mutation(({ input }) =>
        db.setPackItemAssignee(input.id, input.assignee)
      ),
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
          return {
            list: null,
            items: [] as Awaited<ReturnType<typeof db.getPackItems>>,
          };
        }
        const items = await db.getPackItems(list.id);
        return {
          list: { id: list.id, name: list.name, scenario: list.scenario },
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
      .mutation(({ ctx, input }) =>
        db.deleteInventoryItem(input.id, ctx.user.id)
      ),
  }),

  shopping: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getShoppingItems(ctx.user.id)
    ),
    add: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(160) }))
      .mutation(async ({ ctx, input }) => {
        const items = await db.getShoppingItems(ctx.user.id);
        const nextPosition =
          items.reduce((max, i) => Math.max(max, i.position), 0) + 1;
        await db.addShoppingItems([
          {
            userId: ctx.user.id,
            name: input.name.trim(),
            position: nextPosition,
          },
        ]);
        return { success: true } as const;
      }),
    /** Mehrere Einträge auf einmal (z. B. Zutaten eines Rezepts). */
    addMany: protectedProcedure
      .input(
        z.object({
          names: z.array(z.string().min(1).max(160)).min(1).max(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const items = await db.getShoppingItems(ctx.user.id);
        const nextPosition =
          items.reduce((max, i) => Math.max(max, i.position), 0) + 1;
        await db.addShoppingItems(
          input.names.map((name, idx) => ({
            userId: ctx.user.id,
            name: name.trim(),
            position: nextPosition + idx,
          }))
        );
        return { added: input.names.length };
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
    list: protectedProcedure.query(({ ctx }) => db.getTripLogs(ctx.user.id)),
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
    /** Sterne-Bewertung nachträglich setzen oder mit null wieder entfernen. */
    setRating: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          rating: z.number().int().min(1).max(5).nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trip = await db.getTripLog(input.id, ctx.user.id);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aufenthalt nicht gefunden.",
          });
        }
        await db.setTripLogRating(input.id, ctx.user.id, input.rating);
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Zugehörige Fotos mitlöschen: erst Dateinamen sichern, dann
        // DB-Zeilen und zuletzt die Dateien auf dem Webspace entfernen.
        const photos = await db.getTripPhotos(input.id, ctx.user.id);
        await db.deleteTripLog(input.id, ctx.user.id);
        await db.deleteTripPhotosForTrip(input.id, ctx.user.id);
        if (photos.length > 0) {
          const { tripPhotoStorage } = await import("./photoStorage");
          await tripPhotoStorage.deleteFiles(photos.map(p => p.fileName));
        }
      }),
    photos: router({
      /** Fotos eines eigenen Trips (leere Liste, wenn der Trip nicht dir gehört). */
      list: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          const trip = await db.getTripLog(input.tripId, ctx.user.id);
          if (!trip) {
            return [] as Awaited<ReturnType<typeof db.getTripPhotos>>;
          }
          return db.getTripPhotos(input.tripId, ctx.user.id);
        }),
      /** Einzelnes Foto löschen (DB-Zeile + Datei auf dem Webspace). */
      remove: protectedProcedure
        .input(z.object({ photoId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const photo = await db.getTripPhoto(input.photoId, ctx.user.id);
          if (!photo) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Foto nicht gefunden.",
            });
          }
          await db.deleteTripPhoto(input.photoId, ctx.user.id);
          const { tripPhotoStorage } = await import("./photoStorage");
          await tripPhotoStorage.deleteFiles([photo.fileName]);
          return { success: true } as const;
        }),
    }),
  }),
  menu: router({
    /** Trip samt Menüplan-Einträgen (null, wenn der Trip nicht dir gehört). */
    listByTrip: protectedProcedure
      .input(z.object({ tripId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const trip = await db.getTripLog(input.tripId, ctx.user.id);
        if (!trip) {
          return {
            trip: null,
            entries: [] as Awaited<ReturnType<typeof db.getMenuEntries>>,
          };
        }
        const entries = await db.getMenuEntries(input.tripId, ctx.user.id);
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
        const trip = await db.getTripLog(input.tripId, ctx.user.id);
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
        await db.deleteMenuEntry(
          input.tripId,
          ctx.user.id,
          input.day,
          input.meal
        );
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
        })
      )
      .mutation(({ ctx, input }) =>
        db.addCampSpot({ userId: ctx.user.id, ...input })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(120).optional(),
          note: z.string().max(500).optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateCampSpot(id, ctx.user.id, data);
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteCampSpot(input.id, ctx.user.id)),
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
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
