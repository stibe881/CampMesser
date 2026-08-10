/**
 * Reisen – der grösste Brocken: Mitglieder, Kasse, Pinnwand, Fotos (#331).
 *
 * Aus `server/routers.ts` herausgelöst, Verhalten unverändert. Der
 * gemeinsame Unterbau steht in `_shared.ts`.
 */
import {
  comparableNightCostRappen,
  EXPENSE_CURRENCIES,
  EUR_RATE_MAX,
  EUR_RATE_MIN,
  toChfExpenses,
} from "@shared/expenses";
import { MAX_TRIP_STOPS, TRIP_STOP_NAME_MAX_LENGTH } from "@shared/tripStops";
import {
  MAX_TRIP_PLAN_ITEMS,
  TRIP_PLAN_TITLE_MAX_LENGTH,
} from "@shared/tripPlan";
import {
  READINESS_KEYS,
  parseReadinessDone,
  serializeReadinessDone,
} from "@shared/tripReadiness";
import { TRIP_KINDS, normalizeTripKind } from "@shared/tripKind";
import { getEcbEurRate } from "../ecbRates";
import { getHolidaysAbroad } from "../holidaysAbroad";
import {
  BUDGET_MAX_RAPPEN,
  EXPENSE_CATEGORIES,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_MAX_RAPPEN,
  EXPENSE_PAID_BY_MAX_LENGTH,
  MAX_DATE_OPTIONS,
  MAX_GUESTBOOK_MESSAGE_LENGTH,
  MAX_GUEST_NAME_LENGTH,
  MAX_OPTION_NOTE_LENGTH,
  TRIP_BOARD_KINDS,
  TRIP_BOARD_TEXT_MAX_LENGTH,
  TRIP_JOURNAL_MAX_LENGTH,
  TRIP_WEATHER_MAX_DAY_ENTRIES,
  TRIP_WEATHER_MAX_PRECIP_MM,
  TRIP_WEATHER_MAX_RAIN_DAYS,
  TRIP_WEATHER_TEMP_MAX,
  TRIP_WEATHER_TEMP_MIN,
  TRPCError,
  VOTE_VALUES,
  buildTripReadinessCounts,
  buildTripSectionCounts,
  ISO_DAY,
  boardAlertText,
  bundleChanges,
  canRemoveTripBoardEntry,
  db,
  expenseStats,
  isDuplicateOption,
  isValidGuestbookMessage,
  isValidOptionRange,
  nanoid,
  normalizeGuestName,
  normalizeGuestbookMessage,
  normalizeTripBoardKind,
  normalizeTripBoardText,
  notifyUsers,
  tripJoinAlertText,
  noteTripChange,
  packScenarios,
  parsePersons,
  pick,
  protectedProcedure,
  publicProcedure,
  remapMenuDays,
  tripDisplayName,
  router,
  serializePersons,
  shareExpiryFor,
  shareExpiryInput,
  sortTripBoardEntries,
  MAX_CUSTOM_TRIP_TEMPLATES,
  parseCustomTemplateStages,
  TEMPLATE_STAGE_LABEL,
  templateEndDate,
  templateListName,
  templateMenuPlan,
  templateStageSpans,
  tripTemplateById,
  z,
} from "./_shared";

/**
 * «Wer ist dabei?» aus dem Reise-Formular anwenden: nur eigene Personen
 * zählen (fremde Ids fallen still weg – kein Grund, das Speichern der
 * Reise scheitern zu lassen), undefined lässt alles unangetastet.
 */
async function applyAbsences(
  userId: number,
  tripId: number,
  absentChildIds: readonly number[] | undefined
) {
  if (absentChildIds === undefined) return;
  const children = await db.getFamilyChildren(userId);
  const own = new Set(children.map(c => c.id));
  await db.setPassportAbsencesForTrip(
    userId,
    tripId,
    absentChildIds.filter(id => own.has(id))
  );
}

export const tripsRouters = {
  trips: router({
    /**
     * Feiertage des Reiselands (#539) im Reisezeitraum – fürs Cockpit.
     * Serverseitig gecacht (Nager.Date); null = Quelle nicht erreichbar.
     */
    holidaysAbroad: protectedProcedure
      .input(
        z.object({
          country: z.string().regex(/^[A-Za-z]{2}$/),
          from: z.string().regex(ISO_DAY),
          to: z.string().regex(ISO_DAY),
        })
      )
      .query(({ input }) =>
        getHolidaysAbroad(input.country, input.from, input.to)
      ),
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
          const { reservationStorage } = await import("../photoStorage");
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
            // Koordinaten des Freitext-Orts aus der Ortssuche (#465)
            latitude: z.number().min(-90).max(90).nullish(),
            longitude: z.number().min(-180).max(180).nullish(),
            // Reise-Art (#460); fehlt sie (alte Clients), gilt Camping
            kind: z.enum(TRIP_KINDS).optional(),
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
            // «Wer ist dabei?»: Personen (familyChildren), die bei DIESER
            // Reise fehlen. undefined = Abwesenheiten nicht anfassen.
            absentChildIds: z
              .array(z.number().int().positive())
              .max(100)
              .optional(),
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
        // Koordinaten nur als Paar – eine halbe Position ist keine (#465)
        const hasCoords = input.latitude != null && input.longitude != null;
        const id = await db.addTripLog({
          userId: ctx.user.id,
          spotId: input.spotId ?? null,
          packListId: input.packListId ?? null,
          location: input.location?.trim() || null,
          latitude: hasCoords ? input.latitude : null,
          longitude: hasCoords ? input.longitude : null,
          kind: normalizeTripKind(input.kind),
          title: input.title?.trim() || null,
          notes: input.notes?.trim() || null,
          startDate: input.startDate,
          endDate: input.endDate,
          rating: input.rating ?? null,
          arrivalTime: input.arrivalTime ?? null,
          departureTime: input.departureTime ?? null,
        });
        await applyAbsences(ctx.user.id, id, input.absentChildIds);
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

        // 2. Die Reise selbst – die Vorlage bringt ihre Art mit (#463)
        const tripId = await db.addTripLog({
          userId: ctx.user.id,
          spotId: input.spotId ?? null,
          packListId,
          location: input.location?.trim() || null,
          kind: normalizeTripKind(template.kind),
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

        // 4. Rundreise-Gerüst (#619): Etappen ohne Koordinaten anlegen –
        // die Orte trägt man nach, sobald die Route feststeht.
        if (template.stages && template.stages >= 2) {
          const spans = templateStageSpans(
            input.startDate,
            endDate,
            template.stages
          );
          const stageLabel = pick(TEMPLATE_STAGE_LABEL, input.lang);
          for (let i = 0; i < spans.length; i++) {
            await db.addTripStop({
              tripId,
              name: `${stageLabel} ${i + 1}`,
              latitude: null,
              longitude: null,
              startDate: spans[i].startDate,
              endDate: spans[i].endDate,
            });
          }
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
            // Koordinaten des Freitext-Orts aus der Ortssuche (#465);
            // undefined = unangetastet lassen (alte Clients)
            latitude: z.number().min(-90).max(90).nullish(),
            longitude: z.number().min(-180).max(180).nullish(),
            // Reise-Art (#460); fehlt sie (alte Clients), bleibt sie stehen
            kind: z.enum(TRIP_KINDS).optional(),
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
            // «Wer ist dabei?» – siehe add; Mitglieder ohne Wirkung, die
            // Personen gehören dem Konto der Besitzerin/des Besitzers.
            absentChildIds: z
              .array(z.number().int().positive())
              .max(100)
              .optional(),
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
        // Koordinaten nur als Paar (#465); undefined = unangetastet
        const coordsGiven =
          input.latitude !== undefined || input.longitude !== undefined;
        const hasCoords = input.latitude != null && input.longitude != null;
        await db.updateTripLog(input.id, trip.userId, {
          spotId,
          packListId: input.packListId ?? null,
          location,
          ...(coordsGiven
            ? {
                latitude: hasCoords ? input.latitude : null,
                longitude: hasCoords ? input.longitude : null,
              }
            : {}),
          // Ohne Angabe bleibt die gespeicherte Art unangetastet
          ...(input.kind !== undefined
            ? { kind: normalizeTripKind(input.kind) }
            : {}),
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
        if (isOwner) {
          await applyAbsences(ctx.user.id, input.id, input.absentChildIds);
        }
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
     * Aufenthalt archivieren/hervorholen (Nutzerwunsch 09.08.2026):
     * nur der EIGENE Eintrag – die userId-Bedingung in der DB-Schicht
     * lässt fremde und Mitglieds-Reisen unangetastet.
     */
    setArchived: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          archived: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.setTripLogArchived(input.id, ctx.user.id, input.archived);
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
          // Ort samt Koordinaten (#465) und Art (#460) wandern mit
          latitude: trip.latitude,
          longitude: trip.longitude,
          kind: normalizeTripKind(trip.kind),
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
        // Etappen mitnehmen (#609): Rundreisen wiederholen sich gern –
        // dieselben Orte, um die Tagesdifferenz verschoben. Etappen, die
        // nach dem neuen Ende lägen, werden aufs Ende gekappt.
        const stops = await db.getTripStops(input.tripId);
        const dayShift = Math.round(
          (new Date(`${input.startDate}T00:00:00Z`).getTime() -
            new Date(`${trip.startDate}T00:00:00Z`).getTime()) /
            86_400_000
        );
        const shiftDay = (iso: string) => {
          const date = new Date(`${iso}T00:00:00Z`);
          date.setUTCDate(date.getUTCDate() + dayShift);
          return date.toISOString().slice(0, 10);
        };
        const clampDay = (iso: string) =>
          iso > input.endDate
            ? input.endDate
            : iso < input.startDate
              ? input.startDate
              : iso;
        for (const stop of stops) {
          const startDate = clampDay(shiftDay(stop.startDate));
          const endDate = clampDay(shiftDay(stop.endDate));
          await db.addTripStop({
            tripId: id,
            name: stop.name,
            startDate,
            endDate,
            latitude: stop.latitude,
            longitude: stop.longitude,
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
          // Tages-Wetter fürs Journal (#608) – optional, alte Clients
          // schicken weiterhin nur die Zusammenfassung
          days: z
            .array(
              z
                .object({
                  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                  tMax: z
                    .number()
                    .min(TRIP_WEATHER_TEMP_MIN)
                    .max(TRIP_WEATHER_TEMP_MAX),
                  tMin: z
                    .number()
                    .min(TRIP_WEATHER_TEMP_MIN)
                    .max(TRIP_WEATHER_TEMP_MAX),
                  precip: z.number().min(0).max(TRIP_WEATHER_MAX_PRECIP_MM),
                })
                .refine(v => v.tMin <= v.tMax, {
                  message: "Minimum darf nicht über dem Maximum liegen.",
                })
            )
            .max(TRIP_WEATHER_MAX_DAY_ENTRIES)
            .optional(),
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
          JSON.stringify(
            input.days && input.days.length > 0
              ? { ...input.summary, days: input.days }
              : input.summary
          )
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
        const { capture } = await import("../trash");
        await capture("trip", input.id, ctx.user.id);
        await db.deleteTripLog(input.id, ctx.user.id);
        await db.deleteAllTripPhotosForTrip(input.id);
        // Reisekasse gehört zur Reise und wird mitgelöscht (#219)
        await db.deleteAllTripExpensesForTrip(input.id);
        // Etappen (#536) ebenso
        await db.deleteAllTripStopsForTrip(input.id);
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
          const { tripPhotoStorage } = await import("../photoStorage");
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
    /**
     * Tagesplan (#666): WAS an WELCHEM Reisetag ansteht – mit optionaler
     * Zeit und Abhaken unterwegs. Einträge gehören zur REISE; Mitreisende
     * planen mit (canAccessTrip), wie beim Journal und der Pinnwand.
     */
    /**
     * Bereitschafts-Punkt von Hand auf «erledigt» setzen (#667).
     *
     * Die Ampel rechnet aus Daten – wer ohne Packliste und Menüplan
     * unterwegs ist (freies Campen, eine Nacht), soll die Punkte trotzdem
     * abhaken können. Gespeichert wird die Liste der erledigten Bereiche
     * an der Reise; `done: false` nimmt das Häkchen wieder weg.
     */
    setReadinessDone: protectedProcedure
      .input(
        z.object({
          tripId: z.number().int().positive(),
          key: z.enum(READINESS_KEYS),
          done: z.boolean(),
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
        const current = new Set(parseReadinessDone(trip.readinessDoneJson));
        if (input.done) {
          current.add(input.key);
        } else {
          current.delete(input.key);
        }
        await db.setTripReadinessDone(
          input.tripId,
          ctx.user.id,
          serializeReadinessDone(Array.from(current))
        );
        return { success: true } as const;
      }),
    plan: router({
      list: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) return [];
          return db.getTripPlanItems(input.tripId);
        }),
      add: protectedProcedure
        .input(
          z.object({
            tripId: z.number().int().positive(),
            day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            title: z.string().trim().min(1).max(TRIP_PLAN_TITLE_MAX_LENGTH),
            timeAt: z
              .string()
              .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
              .nullish(),
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
          const existing = await db.getTripPlanItems(input.tripId);
          if (existing.length >= MAX_TRIP_PLAN_ITEMS) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Der Tagesplan ist voll.",
            });
          }
          const id = await db.addTripPlanItem({
            tripId: input.tripId,
            day: input.day,
            title: input.title.trim(),
            timeAt: input.timeAt ?? null,
            createdByUserId: ctx.user.id,
          });
          await noteTripChange(
            input.tripId,
            ctx.user.id,
            "plan",
            "add",
            input.title.trim()
          );
          return { id };
        }),
      update: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            day: z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}$/)
              .optional(),
            title: z
              .string()
              .trim()
              .min(1)
              .max(TRIP_PLAN_TITLE_MAX_LENGTH)
              .optional(),
            /** null räumt die Zeit weg, undefined lässt sie stehen. */
            timeAt: z
              .string()
              .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
              .nullish(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const item = await db.getTripPlanItem(input.id);
          const trip = item
            ? await db.canAccessTrip(item.tripId, ctx.user.id)
            : null;
          if (!item || !trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Eintrag nicht gefunden.",
            });
          }
          if (
            input.day !== undefined &&
            (input.day < trip.startDate || input.day > trip.endDate)
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Der Tag liegt ausserhalb des Aufenthalts.",
            });
          }
          await db.updateTripPlanItem(input.id, {
            ...(input.day !== undefined ? { day: input.day } : {}),
            ...(input.title !== undefined ? { title: input.title.trim() } : {}),
            ...(input.timeAt !== undefined ? { timeAt: input.timeAt } : {}),
          });
          await noteTripChange(
            item.tripId,
            ctx.user.id,
            "plan",
            "edit",
            input.title?.trim() ?? item.title
          );
          return { success: true } as const;
        }),
      /** Abhaken – bewusst ohne Verlaufs-Eintrag (Haken sind Alltag). */
      toggle: protectedProcedure
        .input(z.object({ id: z.number().int().positive(), done: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
          const item = await db.getTripPlanItem(input.id);
          const trip = item
            ? await db.canAccessTrip(item.tripId, ctx.user.id)
            : null;
          if (!item || !trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Eintrag nicht gefunden.",
            });
          }
          await db.updateTripPlanItem(input.id, { done: input.done });
          return { success: true } as const;
        }),
      remove: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const item = await db.getTripPlanItem(input.id);
          const trip = item
            ? await db.canAccessTrip(item.tripId, ctx.user.id)
            : null;
          if (!item || !trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Eintrag nicht gefunden.",
            });
          }
          await db.deleteTripPlanItem(input.id);
          await noteTripChange(
            item.tripId,
            ctx.user.id,
            "plan",
            "remove",
            item.title
          );
          return { success: true } as const;
        }),
    }),
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
            /** Stimmungs-Emoji (#661); undefined = unverändert lassen. */
            mood: z.string().trim().max(8).nullish(),
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
              ctx.user.id,
              input.mood === undefined ? undefined : input.mood?.trim() || null
            );
          } else {
            // Das Tages-Foto (#590) hängt am Eintrag – ohne Zeile keine Datei.
            const entry = await db.getTripJournalEntryByDay(
              input.tripId,
              input.day
            );
            await db.deleteTripJournalEntry(input.tripId, input.day);
            if (entry?.photoFileName) {
              const { journalPhotoStorage } = await import("../photoStorage");
              await journalPhotoStorage.deleteFiles([entry.photoFileName]);
            }
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
      /**
       * Tages-Foto (#590) eines Journal-Eintrags entfernen, ohne den Text
       * zu löschen – der Upload läuft als Raw-POST über
       * /api/trips/journal/:id/photo (server/_core/index.ts).
       */
      removePhoto: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const entry = await db.getTripJournalEntryById(input.id);
          const trip = entry
            ? await db.canAccessTrip(entry.tripId, ctx.user.id)
            : undefined;
          if (!entry || !trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Eintrag nicht gefunden.",
            });
          }
          if (entry.photoFileName) {
            await db.setTripJournalPhoto(input.id, null);
            const { journalPhotoStorage } = await import("../photoStorage");
            await journalPhotoStorage.deleteFiles([entry.photoFileName]);
          }
          return { success: true } as const;
        }),
    }),
    /**
     * Eigene Reise-Vorlagen (#628, Muster der Packvorlagen #78): eine
     * gelungene Reise wird zur Vorlage – gespeichert werden Dauer, Art,
     * Ort und die Etappen mit RELATIVER Nächtezahl. Beim Anwenden
     * entstehen aus dem gewählten Anreisetag konkrete Daten; die Etappen
     * werden verkettet wie beim Umsortieren (#627).
     */
    ownTemplates: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const rows = await db.getTripTemplatesCustom(ctx.user.id);
        return rows.map(row => ({
          id: row.id,
          name: row.name,
          kind: normalizeTripKind(row.kind),
          nights: row.nights,
          location: row.location,
          stages: parseCustomTemplateStages(row.stagesJson),
        }));
      }),
      saveFromTrip: protectedProcedure
        .input(
          z.object({
            tripId: z.number().int().positive(),
            name: z.string().min(1).max(140),
          })
        )
        .mutation(async ({ ctx, input }) => {
          // Nur die EIGENE Reise wird zur Vorlage – Vorlagen sind privat.
          const trip = await db.getTripLog(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Aufenthalt nicht gefunden.",
            });
          }
          const existing = await db.getTripTemplatesCustom(ctx.user.id);
          if (existing.length >= MAX_CUSTOM_TRIP_TEMPLATES) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Höchstens ${MAX_CUSTOM_TRIP_TEMPLATES} eigene Vorlagen – bitte zuerst eine löschen.`,
            });
          }
          const nightsOf = (start: string, end: string) =>
            Math.max(
              0,
              Math.round(
                (Date.parse(`${end}T00:00:00Z`) -
                  Date.parse(`${start}T00:00:00Z`)) /
                  86_400_000
              )
            );
          const stops = await db.getTripStops(input.tripId);
          const stages = stops.map(stop => ({
            name: stop.name,
            latitude: stop.latitude,
            longitude: stop.longitude,
            nights: nightsOf(stop.startDate, stop.endDate),
          }));
          // Ort der Reise: Freitext oder Name des verknüpften Platzes
          let location = trip.location;
          if (!location && trip.spotId != null) {
            const spot = await db.getCampSpot(trip.spotId, ctx.user.id);
            location = spot?.name ?? null;
          }
          const id = await db.addTripTemplateCustom({
            userId: ctx.user.id,
            name: input.name.trim().slice(0, 140),
            kind: normalizeTripKind(trip.kind),
            nights: nightsOf(trip.startDate, trip.endDate),
            location,
            latitude: trip.latitude,
            longitude: trip.longitude,
            stagesJson: JSON.stringify(stages),
          });
          return { id, stages: stages.length } as const;
        }),
      remove: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          await db.deleteTripTemplateCustom(input.id, ctx.user.id);
          return { success: true } as const;
        }),
      createTrip: protectedProcedure
        .input(
          z.object({
            templateId: z.number().int().positive(),
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const template = await db.getTripTemplateCustom(
            input.templateId,
            ctx.user.id
          );
          if (!template) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Vorlage nicht gefunden.",
            });
          }
          const nights = Math.max(0, template.nights);
          const endDate = templateEndDate(input.startDate, nights);
          const tripId = await db.addTripLog({
            userId: ctx.user.id,
            spotId: null,
            packListId: null,
            location: template.location || template.name,
            latitude: template.latitude,
            longitude: template.longitude,
            kind: normalizeTripKind(template.kind),
            title: template.name,
            notes: null,
            startDate: input.startDate,
            endDate,
            rating: null,
          });
          // Etappen verketten: jede behält ihre Nächtezahl, beginnt, wo
          // die vorherige endet – Überhang wird am Reiseende gekappt.
          const stages = parseCustomTemplateStages(template.stagesJson);
          let cursor = input.startDate;
          for (const stage of stages) {
            const stageEnd = templateEndDate(cursor, stage.nights);
            await db.addTripStop({
              tripId,
              name: stage.name,
              latitude: stage.latitude,
              longitude: stage.longitude,
              startDate: cursor > endDate ? endDate : cursor,
              endDate: stageEnd > endDate ? endDate : stageEnd,
            });
            cursor = stageEnd;
          }
          return { id: tripId, endDate } as const;
        }),
    }),
    /**
     * Etappen (#536): Eine Rundreise besteht aus mehreren Orten mit je
     * eigenem Von/Bis. Wie Journal und Reisekasse gehören sie zur REISE –
     * Mitreisende dürfen mitplanen (canAccessTrip). Koordinaten kommen
     * aus der Ortssuche des Clients und dürfen fehlen.
     */
    stops: router({
      list: protectedProcedure
        .input(z.object({ tripId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          const trip = await db.canAccessTrip(input.tripId, ctx.user.id);
          if (!trip) {
            return [] as Awaited<ReturnType<typeof db.getTripStops>>;
          }
          return db.getTripStops(input.tripId);
        }),
      /**
       * Alle Etappen aller zugänglichen Reisen auf einmal (#573): Der
       * Reise-Kalender markiert die Etappen-Wechsel – eine Abfrage für
       * die ganze Ansicht statt einer je Reise.
       */
      listAll: protectedProcedure.query(async ({ ctx }) => {
        const [own, member] = await Promise.all([
          db.getTripLogs(ctx.user.id),
          db.getMemberTripLogs(ctx.user.id),
        ]);
        const tripIds = [
          ...own.map(trip => trip.id),
          ...member.map(({ trip }) => trip.id),
        ];
        const stops = await db.getTripStopsForTrips(tripIds);
        return stops.map(stop => ({
          id: stop.id,
          tripId: stop.tripId,
          name: stop.name,
          startDate: stop.startDate,
          endDate: stop.endDate,
          // Koordinaten für die Rundreise-Kilometer (#580)
          latitude: stop.latitude,
          longitude: stop.longitude,
        }));
      }),
      add: protectedProcedure
        .input(
          z.object({
            tripId: z.number().int().positive(),
            name: z.string().trim().min(1).max(TRIP_STOP_NAME_MAX_LENGTH),
            latitude: z.number().min(-90).max(90).nullish(),
            longitude: z.number().min(-180).max(180).nullish(),
            startDate: z.string().regex(ISO_DAY),
            endDate: z.string().regex(ISO_DAY),
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
          if (input.endDate < input.startDate) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Die Weiterreise liegt vor der Ankunft.",
            });
          }
          const existing = await db.getTripStops(input.tripId);
          if (existing.length >= MAX_TRIP_STOPS) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Höchstens ${MAX_TRIP_STOPS} Etappen pro Reise.`,
            });
          }
          const id = await db.addTripStop({
            tripId: input.tripId,
            name: input.name.trim(),
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            startDate: input.startDate,
            endDate: input.endDate,
          });
          return { id };
        }),
      update: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            name: z
              .string()
              .trim()
              .min(1)
              .max(TRIP_STOP_NAME_MAX_LENGTH)
              .optional(),
            latitude: z.number().min(-90).max(90).nullish(),
            longitude: z.number().min(-180).max(180).nullish(),
            startDate: z.string().regex(ISO_DAY).optional(),
            endDate: z.string().regex(ISO_DAY).optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const stop = await db.getTripStopById(input.id);
          const trip = stop
            ? await db.canAccessTrip(stop.tripId, ctx.user.id)
            : undefined;
          if (!stop || !trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Etappe nicht gefunden.",
            });
          }
          const startDate = input.startDate ?? stop.startDate;
          const endDate = input.endDate ?? stop.endDate;
          if (endDate < startDate) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Die Weiterreise liegt vor der Ankunft.",
            });
          }
          await db.updateTripStop(input.id, {
            ...(input.name !== undefined ? { name: input.name.trim() } : {}),
            ...(input.latitude !== undefined
              ? { latitude: input.latitude ?? null }
              : {}),
            ...(input.longitude !== undefined
              ? { longitude: input.longitude ?? null }
              : {}),
            ...(input.startDate !== undefined
              ? { startDate: input.startDate }
              : {}),
            ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
          });
          return { success: true } as const;
        }),
      remove: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
          const stop = await db.getTripStopById(input.id);
          const trip = stop
            ? await db.canAccessTrip(stop.tripId, ctx.user.id)
            : undefined;
          if (!stop || !trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Etappe nicht gefunden.",
            });
          }
          await db.deleteTripStop(input.id);
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
      /**
       * Kosten-Schätzung beim Planen (#568): «Vergleichbare Reisen
       * kosteten ≈ X pro Nacht» – Median der eigenen Reisen gleicher
       * Art, ehrlich erst ab zwei vergleichbaren (shared/expenses.ts).
       */
      costHint: protectedProcedure
        .input(z.object({ kind: z.string().max(40) }))
        .query(async ({ ctx, input }) => {
          const trips = await db.getTripLogs(ctx.user.id);
          const expenses = await db.getExpensesForTrips(trips.map(t => t.id));
          const rateByTrip = new Map(
            trips.map(trip => [trip.id, trip.eurRateX10000 ?? null])
          );
          const converted = expenses.flatMap(
            expense =>
              toChfExpenses([expense], rateByTrip.get(expense.tripId) ?? null)
                .converted
          );
          return comparableNightCostRappen(trips, converted, input.kind);
        }),
      stats: protectedProcedure.query(async ({ ctx }) => {
        const trips = await db.getTripLogs(ctx.user.id);
        const expenses = await db.getExpensesForTrips(trips.map(t => t.id));
        // Euro-Beträge (#441) zählen zum Kurs ihrer Reise; ohne Kurs
        // fallen sie ehrlich raus, statt still 1:1 gezählt zu werden.
        const rateByTrip = new Map(
          trips.map(trip => [trip.id, trip.eurRateX10000 ?? null])
        );
        const { converted } = expenses.reduce<{
          converted: typeof expenses;
        }>(
          (acc, expense) => {
            const result = toChfExpenses(
              [expense],
              rateByTrip.get(expense.tripId) ?? null
            );
            acc.converted.push(...result.converted);
            return acc;
          },
          { converted: [] }
        );
        // Reisekosten nach Land (#643): CHF-Summe je Reise mitliefern –
        // das Land rät der Client mit derselben Logik wie die
        // Länder-Statistik (#510/#606, shared/countryGuess).
        const perTripMap = new Map<number, number>();
        converted.forEach(expense => {
          const amount =
            Number.isFinite(expense.amountRappen) && expense.amountRappen > 0
              ? Math.round(expense.amountRappen)
              : 0;
          perTripMap.set(
            expense.tripId,
            (perTripMap.get(expense.tripId) ?? 0) + amount
          );
        });
        return {
          ...expenseStats(
            trips.map(trip => ({
              id: trip.id,
              startDate: trip.startDate,
              endDate: trip.endDate,
            })),
            converted
          ),
          perTrip: Array.from(perTripMap, ([tripId, rappen]) => ({
            tripId,
            rappen,
          })),
        };
      }),
      /**
       * Nur die Summe je Reise (#345) – für das Zeichen am ZUGEKLAPPTEN
       * Reisekassen-Abschnitt.
       *
       * Bis jetzt stand der Betrag nur da, wenn der Abschnitt offen war,
       * weil die Einzelposten erst dann geholt werden (`enabled: open`).
       * Genau dann sieht man ihn aber ohnehin – zugeklappt war die Zahl
       * weg, obwohl sie dort am meisten wert ist.
       *
       * EINE Abfrage für ALLE Reisen, nicht eine pro Abschnitt: Auf der
       * Reise-Seite stehen schnell zwanzig davon. Der Client fragt aus
       * jedem Abschnitt heraus dasselbe ab, TanStack Query bündelt das zu
       * einer einzigen Anfrage.
       *
       * Anders als `stats` auch MITGLIEDS-Reisen: Der Abschnitt erscheint
       * dort genauso, also braucht er dort auch seine Summe.
       */
      totals: protectedProcedure.query(async ({ ctx }) => {
        const [own, member] = await Promise.all([
          db.getTripLogs(ctx.user.id),
          db.getMemberTripLogs(ctx.user.id),
        ]);
        const trips = [...own, ...member.map(({ trip }) => trip)];
        const rows = await db.getExpenseTotalsForTrips(
          trips.map(trip => trip.id)
        );
        // Euro (#441): zum Reise-Kurs eingerechnet; ohne Kurs bleibt der
        // Euro-Anteil als eigener Wert stehen, damit das Zeichen am
        // zugeklappten Abschnitt nichts still verschluckt.
        const rateByTrip = new Map(
          trips.map(trip => [trip.id, trip.eurRateX10000 ?? null])
        );
        const byTrip = new Map<
          number,
          { totalRappen: number; eurOpenRappen: number }
        >();
        for (const row of rows) {
          const entry = byTrip.get(row.tripId) ?? {
            totalRappen: 0,
            eurOpenRappen: 0,
          };
          if (row.currency === "EUR") {
            const rate = rateByTrip.get(row.tripId) ?? null;
            if (rate === null) entry.eurOpenRappen += row.totalRappen;
            else
              entry.totalRappen += Math.round(
                (row.totalRappen * rate) / 10_000
              );
          } else {
            entry.totalRappen += row.totalRappen;
          }
          byTrip.set(row.tripId, entry);
        }
        return Array.from(byTrip, ([tripId, entry]) => ({
          tripId,
          ...entry,
        }));
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
      /**
       * Euro-Kurs der Reise (#441) setzen oder mit null entfernen –
       * wie das Budget für alle Mitreisenden, die Kasse gehört allen.
       */
      setEurRate: protectedProcedure
        .input(
          z.object({
            tripId: z.number().int().positive(),
            eurRateX10000: z
              .number()
              .int()
              .min(EUR_RATE_MIN)
              .max(EUR_RATE_MAX)
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
          await db.setTripEurRate(input.tripId, input.eurRateX10000);
          return { success: true } as const;
        }),
      /**
       * EZB-Referenzkurs CHF/EUR (#519) als Vorschlag für den Kurs-Dialog.
       * Serverseitig gecacht; bei EZB-Ausfall kommt der letzte bekannte
       * Kurs (sein Datum sagt, wie alt er ist), sonst null.
       */
      ecbRate: protectedProcedure.query(() => getEcbEurRate()),
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
            currency: z.enum(EXPENSE_CURRENCIES).default("CHF"),
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
            currency: input.currency,
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
            currency: z.enum(EXPENSE_CURRENCIES).optional(),
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
            ...(input.currency !== undefined
              ? { currency: input.currency }
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
          // Der Beleg (#540) hängt an der Ausgabe – ohne Zeile keine Datei.
          if (expense.photoFileName) {
            const { expensePhotoStorage } = await import("../photoStorage");
            await expensePhotoStorage.deleteFiles([expense.photoFileName]);
          }
          await noteTripChange(
            expense.tripId,
            ctx.user.id,
            "expense",
            "remove",
            expense.description || expense.category
          );
          return { success: true } as const;
        }),
      /**
       * Beleg-Foto (#540) einer Ausgabe entfernen, ohne die Ausgabe zu
       * löschen – der Upload läuft als Raw-POST über
       * /api/trips/expenses/:id/photo (server/_core/index.ts).
       */
      removePhoto: protectedProcedure
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
          if (expense.photoFileName) {
            await db.updateTripExpense(input.id, { photoFileName: null });
            const { expensePhotoStorage } = await import("../photoStorage");
            await expensePhotoStorage.deleteFiles([expense.photoFileName]);
          }
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
          /**
           * MITREISENDE SOFORT BENACHRICHTIGEN (#367, Nutzerwunsch).
           *
           * Die Pinnwand ist der Ort für «Brot ist alle» und «bin am See».
           * Ohne Meldung sieht das nur, wer zufällig nachschaut – dann kann
           * man es auch gleich mündlich sagen. Der Push geht an alle
           * Mitreisenden AUSSER an die Person, die geschrieben hat.
           *
           * `await` mit `catch`: Der Zettel ist gespeichert, bevor hier
           * irgendetwas passiert. Ein Push-Dienst, der nicht antwortet,
           * darf die Mutation nicht scheitern lassen.
           */
          const members = await db.getTripMembersWithUsers(input.tripId);
          const audience = [
            trip.userId,
            ...members.map(member => member.userId),
          ].filter(id => id !== ctx.user.id);
          const authorName =
            (await db.getUserDisplayNames([ctx.user.id])).get(ctx.user.id) ??
            "?";
          await notifyUsers(
            Array.from(new Set(audience)),
            "trip",
            "board",
            `/tagebuch/${input.tripId}#pinnwand`,
            lang =>
              boardAlertText(
                {
                  author: authorName,
                  // Der Reisename wird JE SPRACHE gebildet – ohne Titel
                  // greift ein übersetzter Ersatztext.
                  tripName: tripDisplayName(trip, lang),
                  text,
                  isTask: input.kind === "task",
                },
                lang
              )
          ).catch(() => 0);
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

          /**
           * Wer eingeladen hat, erfährt es (#376).
           *
           * Die Einladung geht als LINK raus – ob sie angenommen wurde,
           * sah bis jetzt nur, wer von sich aus den Mitreisenden-Dialog
           * öffnete. Dabei wartet man genau darauf: Solange nicht klar
           * ist, wer mitkommt, kann man weder Betten noch Essen
           * einteilen.
           *
           * AN ALLE SCHON BETEILIGTEN, nicht nur an die Besitzerin: Wer
           * gemeinsam plant, plant gemeinsam. Die beitretende Person
           * bekommt nichts – sie weiss es.
           *
           * Fehler werden geschluckt wie bei der Pinnwand (#367): Die
           * Mitgliedschaft steht, bevor hier irgendetwas passiert.
           */
          const joined = await db.getTripMembersWithUsers(trip.id);
          const audience = [
            trip.userId,
            ...joined.map(member => member.userId),
          ].filter(id => id !== ctx.user.id);
          const personName =
            (await db.getUserDisplayNames([ctx.user.id])).get(ctx.user.id) ??
            "?";
          await notifyUsers(
            Array.from(new Set(audience)),
            "trip",
            "join",
            `/tagebuch/${trip.id}`,
            lang =>
              tripJoinAlertText(
                { person: personName, tripName: tripDisplayName(trip, lang) },
                lang
              )
          ).catch(() => 0);

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
    /**
     * Die Zahlen für die ZUGEKLAPPTEN Abschnitte (#346).
     *
     * Eine Reise stapelt ein Dutzend gleich aussehender Balken – Tagebuch,
     * Reisekasse, Pinnwand, Verlauf, Gästebuch. Ob einer davon etwas
     * enthält, erfuhr man erst beim Aufklappen, weil jeder Abschnitt seine
     * Daten an `enabled: open` hängt. Also klappte man der Reihe nach auf.
     *
     * EINE Abfrage für ALLE Reisen, wie bei den Reisekassen-Summen (#345):
     * Jeder Balken fragt aus sich heraus dasselbe ab, TanStack Query
     * bündelt es zu einer einzigen Anfrage.
     *
     * Die Bereitschafts-Karte fehlt hier bewusst: Ihr Stand hängt an
     * Packliste, Menüplan und Einkaufsliste. Das vorzurechnen wäre kein
     * Zählen mehr, sondern das halbe Cockpit – und für zwanzig Reisen auf
     * Vorrat schon gar nicht.
     */
    counts: protectedProcedure.query(async ({ ctx }) => {
      const [own, member] = await Promise.all([
        db.getTripLogs(ctx.user.id),
        db.getMemberTripLogs(ctx.user.id),
      ]);
      const ids = [
        ...own.map(trip => trip.id),
        ...member.map(({ trip }) => trip.id),
      ];
      const raw = await db.getTripSectionCounts(ids);
      return buildTripSectionCounts(ids, raw);
    }),
    /**
     * Die Bereitschafts-Zahlen aller noch offenen Reisen (#362).
     *
     * KORREKTUR ZU #346: Ein paar Zeilen weiter oben steht, die
     * Bereitschaft bleibe bewusst draussen, weil ihr Stand an Packliste,
     * Menüplan und Einkaufsliste hängt. Der Befund stimmte, der Schluss
     * nicht: Der Server rechnet nichts vor, er ZÄHLT nur – bewertet wird
     * weiterhin im Browser mit `tripReadiness()`, derselben Funktion wie
     * beim aufgeklappten Abschnitt.
     *
     * NUR REISEN, DIE NOCH NICHT VORBEI SIND: Die Bereitschafts-Karte gibt
     * es bei vergangenen Aufenthalten gar nicht, und «zwanzig Reisen auf
     * Vorrat» war genau der Einwand von damals. `today` kommt vom Client,
     * weil es der Tag am Zeltplatz ist und nicht der des Servers (#333).
     */
    readiness: protectedProcedure
      .input(z.object({ today: z.string().regex(ISO_DAY) }))
      .query(async ({ ctx, input }) => {
        const [own, member] = await Promise.all([
          db.getTripLogs(ctx.user.id),
          db.getMemberTripLogs(ctx.user.id),
        ]);
        const trips = [...own, ...member.map(({ trip }) => trip)]
          .filter(trip => trip.endDate >= input.today)
          .map(trip => ({
            id: trip.id,
            startDate: trip.startDate,
            endDate: trip.endDate,
            packListId: trip.packListId,
          }));
        const raw = await db.getTripReadinessRaw(trips);
        return buildTripReadinessCounts(trips, raw);
      }),
    /**
     * Der geschriebene Inhalt aller Reisen – für die globale Suche (#349).
     *
     * WARUM EIN EIGENER ENDPUNKT: Die Suche baut ihren Index im Browser
     * aus dem, was sie hat. Journal, Pinnwand und Gästebuch hatte sie
     * nicht, weil jeder Abschnitt seine Einträge erst beim Aufklappen
     * holt – also fand sie den Text nicht, der dort steht.
     *
     * DER PREIS, ehrlich: Das sind alle Journal-Texte aller Reisen auf
     * einmal. Getragen wird er nur von denen, die suchen: Die Startseite
     * ruft ihn erst beim ANTIPPEN des Suchfelds ab, wie alle anderen
     * Listen der Suche auch (#307). Wer nie sucht, holt nichts.
     */
    texts: protectedProcedure.query(async ({ ctx }) => {
      const [own, member] = await Promise.all([
        db.getTripLogs(ctx.user.id),
        db.getMemberTripLogs(ctx.user.id),
      ]);
      const ids = [
        ...own.map(trip => trip.id),
        ...member.map(({ trip }) => trip.id),
      ];
      return db.getTripTexts(ids);
    }),
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
     * jemand ohne Konto in ReiseKompass schreibt. Deshalb drei Bremsen: Der
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
        const { allowAction } = await import("../rateLimit");
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
          // welche Zeile zu welchem ReiseKompass-Konto gehört; ob der Eintrag
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
    /**
     * Geteilter Reise-BERICHT (#629): Journal, Fotos und Etappen als
     * schreibgeschützte Seite für Verwandte – über denselben Teil-Token
     * wie der Hub (ein Link-Leben, ein Ablaufdatum, ein «Teilen beenden»).
     * Anders als der Hub (bewusst ohne Fotos, #128) ist der Bericht die
     * ERINNERUNGS-Ansicht: Die Fotos laufen über eigene Token-Routen
     * (/api/bericht/…), nie über die privaten Foto-Pfade.
     */
    sharedReport: publicProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .query(async ({ input }) => {
        const trip = await db.getTripLogByShareToken(input.token);
        if (!trip) return null;
        const spot =
          trip.spotId != null
            ? await db.getCampSpot(trip.spotId, trip.userId)
            : undefined;
        const journal = await db.getTripJournal(trip.id);
        const photos = await db.getTripPhotosForTrip(trip.id);
        const stops = await db.getTripStops(trip.id);
        return {
          trip: {
            title: trip.title,
            location: trip.location,
            startDate: trip.startDate,
            endDate: trip.endDate,
            notes: trip.notes,
            rating: trip.rating,
            weatherJson: trip.weatherJson,
            coverPhotoId: trip.coverPhotoId,
          },
          spotName: spot?.name ?? null,
          // Journal ohne Konto-Bezug (Muster Gästebuch): Text und Tag
          // reichen – wer geschrieben hat, geht Aussenstehende nichts an.
          journal: journal.map(entry => ({
            day: entry.day,
            text: entry.text,
            photoFileName: entry.photoFileName,
          })),
          photos: photos.map(photo => ({
            id: photo.id,
            fileName: photo.fileName,
          })),
          stops: stops.map(stop => ({
            name: stop.name,
            startDate: stop.startDate,
            endDate: stop.endDate,
          })),
        };
      }),
  }),
};
