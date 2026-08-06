/**
 * Inventar, Kisten, Pflege und Zeckenstiche (#331).
 *
 * Aus `server/routers.ts` herausgelöst, Verhalten unverändert. Der
 * gemeinsame Unterbau steht in `_shared.ts`.
 */
import {
  ISO_DAY,
  MAX_BOX_CODE_LENGTH,
  MAX_BOX_NAME_LENGTH,
  MAX_GEAR_INTERVAL_MONTHS,
  MAX_GEAR_TASK_TITLE_LENGTH,
  MAX_LENT_TO_LENGTH,
  MAX_TICK_BODY_PART_LENGTH,
  MAX_TICK_NOTE_LENGTH,
  MAX_WARRANTY_MONTHS,
  MIN_GEAR_INTERVAL_MONTHS,
  MIN_WARRANTY_MONTHS,
  TRPCError,
  db,
  normalizeBoxCode,
  protectedProcedure,
  router,
  z,
} from "./_shared";

export const gearRouters = {
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
        // Papierkorb (#318): Foto und Beleg bleiben liegen, bis der
        // Eintrag abläuft – sonst käme der Gegenstand ohne sie zurück.
        const { capture } = await import("../trash");
        await capture("gear", input.id, ctx.user.id);
        await db.deleteInventoryItem(input.id, ctx.user.id);
        if (item?.imageFileName || item?.receiptFileName) {
          const { inventoryPhotoStorage, receiptPhotoStorage } =
            await import("../photoStorage");
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
          const { inventoryPhotoStorage } = await import("../photoStorage");
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
          const { receiptPhotoStorage } = await import("../photoStorage");
          await receiptPhotoStorage.deleteFiles([item.receiptFileName]);
        }
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
        // Papierkorb (#318): Die Kiste selbst plus die Ids ihres
        // Inhalts – deleteStorageBox löscht die Gegenstände nicht, es
        // setzt bei ihnen nur boxId auf null.
        const { capture } = await import("../trash");
        await capture("box", input.id, ctx.user.id);
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
};
