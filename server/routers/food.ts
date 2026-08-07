/**
 * Kühlbox, Vorrat, Einkauf, Rezepte und Menüplan (#331).
 *
 * Aus `server/routers.ts` herausgelöst, Verhalten unverändert. Der
 * gemeinsame Unterbau steht in `_shared.ts`.
 */
import {
  DEFAULT_FOOD_STORAGE,
  DEFAULT_SHOPPING_LIST_NAME,
  EXPENSE_CATEGORIES,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_MAX_RAPPEN,
  EXPENSE_PAID_BY_MAX_LENGTH,
  FOOD_CATEGORIES,
  FOOD_STORAGES,
  FOOD_UNITS,
  FoodStorage,
  MAX_EXPIRY_DAYS,
  MAX_FOOD_ITEM_NAME_LENGTH,
  MAX_FOOD_ITEM_QUANTITY_LENGTH,
  MAX_FOOD_TEMPLATE_ITEMS,
  MAX_SHOPPING_LIST_NAME_LENGTH,
  MAX_SHOPPING_PRICE_RAPPEN,
  MEALS,
  RECIPE_DIFFICULTIES,
  RECIPE_METHODS,
  TRPCError,
  db,
  expiryDateFromDays,
  nanoid,
  normalizeDifficulty,
  normalizeFoodStorage,
  normalizeMethod,
  noteTripChange,
  parseFoodTemplateItems,
  parseStringList,
  pick,
  protectedProcedure,
  publicProcedure,
  requireShoppingList,
  requireTripAccess,
  router,
  shareExpiryFor,
  shareExpiryInput,
  shoppingBooking,
  shoppingCategoryInput,
  shoppingLangInput,
  z,
} from "./_shared";

export const foodRouters = {
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
        // Papierkorb (#318): Liste samt Einträgen und Teil-Link.
        const { capture } = await import("../trash");
        await capture("shoppingList", input.id, ctx.user.id);
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
        const { capture } = await import("../trash");
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
          const { recipePhotoStorage } = await import("../photoStorage");
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
          /** 230-V-Gerät am Wechselrichter (#405). */
          inverter: z.boolean().optional(),
          /** Kühlgerät – Laufzeit nach Wetter (#405). */
          cooling: z.boolean().optional(),
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
          inverter: z.boolean().optional(),
          cooling: z.boolean().optional(),
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
};
