/**
 * Packlisten und Packvorlagen (#331).
 *
 * Aus `server/routers.ts` herausgelöst, Verhalten unverändert. Der
 * gemeinsame Unterbau steht in `_shared.ts`.
 */
import {
  CustomTemplateItem,
  MAX_PACK_SUGGESTIONS,
  MAX_PERSONS,
  MAX_PERSON_NAME_LENGTH,
  TRPCError,
  db,
  l4,
  nanoid,
  normalizePersons,
  packScenarios,
  packSuggestions,
  parseCustomTemplateItems,
  parsePersons,
  pick,
  protectedProcedure,
  publicProcedure,
  router,
  serializePersons,
  shareExpiryFor,
  shareExpiryInput,
  z,
} from "./_shared";

export const packingRouters = {
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
        const { capture } = await import("../trash");
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
};
