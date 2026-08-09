/**
 * Zeltplätze, Orte, Notizen und Warnungen (#331).
 *
 * Aus `server/routers.ts` herausgelöst, Verhalten unverändert. Der
 * gemeinsame Unterbau steht in `_shared.ts`.
 */
import {
  LANGUAGES,
  MAX_STARS,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TEXT_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  SPOT_ATTRIBUTES_JSON_MAX_LENGTH,
  SPOT_ELEVATION_INPUT,
  SPOT_PRICE_INPUT,
  TRPCError,
  clampStars,
  db,
  nanoid,
  normalizeNoteText,
  normalizeNoteTitle,
  normalizeSpotAttributesJson,
  parseNextTimeNotes,
  parsePitchSketch,
  parseSpotTariffs,
  serializeNextTimeNotes,
  serializePitchSketch,
  serializeSpotTariffs,
  NEXT_TIME_JSON_MAX_LENGTH,
  PITCH_SKETCH_JSON_MAX_LENGTH,
  TARIFFS_JSON_MAX_LENGTH,
  protectedProcedure,
  publicProcedure,
  router,
  serializeNoteTags,
  shareExpiryFor,
  shareExpiryInput,
  sortNotes,
  z,
} from "./_shared";
import {
  SAVED_PLACE_COLORS,
  SAVED_PLACE_NAME_MAX_LENGTH,
  SAVED_PLACE_NOTE_MAX_LENGTH,
} from "@shared/savedPlaces";

export const spotsRouters = {
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
          /** Weitere Tarife als JSON (#369); null löscht sie. */
          tariffsJson: z.string().max(TARIFFS_JSON_MAX_LENGTH).nullish(),
          /** Stellplatz-Skizze als JSON (#382); null löscht sie. */
          pitchSketchJson: z
            .string()
            .max(PITCH_SKETCH_JSON_MAX_LENGTH)
            .nullish(),
          /** «Beim nächsten Mal»-Zettel als JSON (#396); null löscht ihn. */
          nextTimeJson: z.string().max(NEXT_TIME_JSON_MAX_LENGTH).nullish(),
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
          tariffsJson,
          pitchSketchJson,
          nextTimeJson,
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
          // Tarife (#369) laufen durch DENSELBEN Parser wie die Anzeige –
          // was hier hereinkommt, ist Nutzer-Eingabe, kein Vertrauensbeweis.
          ...(tariffsJson !== undefined
            ? {
                tariffsJson: serializeSpotTariffs(
                  parseSpotTariffs(tariffsJson ?? null)
                ),
              }
            : {}),
          // Skizze (#382) ebenso: durch DENSELBEN Parser wie die Anzeige.
          // Was hier hereinkommt, ist Nutzer-Eingabe, kein Vertrauensbeweis.
          ...(pitchSketchJson !== undefined
            ? {
                pitchSketchJson: serializePitchSketch(
                  parsePitchSketch(pitchSketchJson ?? null)
                ),
              }
            : {}),
          // «Beim nächsten Mal»-Zettel (#396): derselbe Parser wie die
          // Anzeige. Bleibt bewusst AUS dem geteilten Dossier draussen –
          // «Parzelle 12 meiden» ist eine private Notiz, kein Steckbrief.
          ...(nextTimeJson !== undefined
            ? {
                nextTimeJson: serializeNextTimeNotes(
                  parseNextTimeNotes(nextTimeJson ?? null)
                ),
              }
            : {}),
        });
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Papierkorb (#295): Schnappschuss samt Foto-Zeilen; die Dateien
        // auf dem Webspace bleiben liegen, bis der Eintrag abläuft.
        const { capture } = await import("../trash");
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
          const { spotPhotoStorage } = await import("../photoStorage");
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
          // Die Skizze (#382) ist genau das, was man Mitreisenden schickt:
          // «So haben wir letztes Jahr gestanden.» Sie enthält Rechtecke
          // und Meter, sonst nichts – nichts Persönliches.
          pitchSketchJson: spot.pitchSketchJson,
          // Die Preistafel (#369, #392): Für Mitreisende mindestens so
          // nützlich wie die Skizze – «nimm Bargeld mit, der Platz kostet
          // 24.– plus 8.– pro Kind». Öffentliche Information von der
          // Tafel an der Rezeption, nichts Persönliches.
          tariffsJson: spot.tariffsJson,
        };
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
          await import("../googlePlaces");
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
   * Merkorte (#537): Wunschziele von der Karte – schlichtes CRUD auf
   * eigenen Zeilen. Leichter als ein Zeltplatz-Favorit (kein Dossier,
   * keine Fotos); die Pin-Farbe kommt aus dem festen Katalog in
   * shared/savedPlaces.ts, damit die Karte nie fremde Werte zeichnet.
   */
  savedPlaces: router({
    list: protectedProcedure.query(({ ctx }) => db.getSavedPlaces(ctx.user.id)),
    add: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(SAVED_PLACE_NAME_MAX_LENGTH),
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          note: z.string().max(SAVED_PLACE_NOTE_MAX_LENGTH).nullish(),
          color: z.enum(SAVED_PLACE_COLORS).default("red"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.addSavedPlace({
          userId: ctx.user.id,
          name: input.name.trim(),
          latitude: input.latitude,
          longitude: input.longitude,
          note: input.note?.trim() || null,
          color: input.color,
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
            .max(SAVED_PLACE_NAME_MAX_LENGTH)
            .optional(),
          note: z.string().max(SAVED_PLACE_NOTE_MAX_LENGTH).nullish(),
          color: z.enum(SAVED_PLACE_COLORS).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateSavedPlace(input.id, ctx.user.id, {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.note !== undefined
            ? { note: input.note?.trim() || null }
            : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
        });
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        // Papierkorb (#613): Schnappschuss samt Foto-Verweis; die Datei
        // bleibt auf dem Webspace liegen, bis der Eintrag abläuft.
        const { capture } = await import("../trash");
        await capture("savedPlace", input.id, ctx.user.id);
        await db.deleteSavedPlace(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /**
     * Foto (#589) eines Merkorts entfernen, ohne den Merkort zu löschen –
     * der Upload läuft als Raw-POST über /api/places/:id/photo
     * (server/_core/index.ts).
     */
    removePhoto: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const place = await db.getSavedPlace(input.id, ctx.user.id);
        if (!place) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Merkort nicht gefunden.",
          });
        }
        if (place.photoFileName) {
          await db.updateSavedPlace(input.id, ctx.user.id, {
            photoFileName: null,
          });
          const { placePhotoStorage } = await import("../photoStorage");
          await placePhotoStorage.deleteFiles([place.photoFileName]);
        }
        return { success: true } as const;
      }),
    /**
     * Merkort befördern (#600): aus dem Wunsch wird ein Zeltplatz-Favorit
     * mit Dossier. Name, Koordinaten und Notiz ziehen um, das Foto (#589)
     * wandert in die Platz-Galerie (Datei wird kopiert, dann räumt der
     * Merkort-Speicher auf). Der Merkort selbst wird danach gelöscht –
     * sein Inhalt lebt im Favoriten weiter.
     */
    promote: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const place = await db.getSavedPlace(input.id, ctx.user.id);
        if (!place) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Merkort nicht gefunden.",
          });
        }
        const spotId = await db.addCampSpot({
          userId: ctx.user.id,
          name: place.name,
          latitude: place.latitude,
          longitude: place.longitude,
          note: place.note || null,
        });
        if (place.photoFileName) {
          try {
            const { placePhotoStorage, spotPhotoStorage } =
              await import("../photoStorage");
            const { readFile } = await import("node:fs/promises");
            const { nanoid } = await import("nanoid");
            const data = await readFile(
              placePhotoStorage.photoPath(place.photoFileName)
            );
            const extension = place.photoFileName.slice(
              place.photoFileName.lastIndexOf(".")
            );
            const fileName = `${nanoid(16)}${extension}`;
            await spotPhotoStorage.saveFile(fileName, data);
            await db.addSpotPhoto({
              userId: ctx.user.id,
              spotId,
              fileName,
            });
            await placePhotoStorage.deleteFiles([place.photoFileName]);
          } catch (error) {
            // Foto-Umzug gescheitert (Datei fehlt auf der Platte) – der
            // Favorit ist trotzdem angelegt, nur ohne Bild.
            console.error("[SavedPlaces] Foto-Umzug fehlgeschlagen:", error);
          }
        }
        await db.deleteSavedPlace(input.id, ctx.user.id);
        return { spotId };
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
    /** Anpinnen (#455): Wichtiges bleibt oben statt zu verschwinden. */
    setPinned: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), pinned: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const note = await db.getUserNote(input.id, ctx.user.id);
        if (!note) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notiz nicht gefunden.",
          });
        }
        await db.updateUserNote(input.id, ctx.user.id, {
          pinned: input.pinned,
        });
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        // Das Foto bleibt auf dem Webspace liegen – der Papierkorb kennt
        // es (#433) und räumt es erst beim endgültigen Löschen weg.
        const { capture } = await import("../trash");
        await capture("note", input.id, ctx.user.id);
        await db.deleteUserNote(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /** Foto einer Notiz entfernen (Feld + Datei auf dem Webspace, #433). */
    removePhoto: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const note = await db.getUserNote(input.id, ctx.user.id);
        if (!note) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notiz nicht gefunden.",
          });
        }
        if (note.fileName) {
          await db.updateUserNote(input.id, ctx.user.id, { fileName: null });
          const { notePhotoStorage } = await import("../photoStorage");
          await notePhotoStorage.deleteFiles([note.fileName]);
        }
        return { success: true } as const;
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
        const { getOfficialWarnings } = await import("../meteoAlarm");
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
   * Ausflugfinder-Anbindung (#271): die Ausflugsziele aus der Supabase-
   * Datenbank der eigenen Ausflugfinder-App. Der Abruf läuft ausschliesslich
   * serverseitig (server/excursions.ts, mit Zwischenspeicher) – der
   * Zugriffsschlüssel steht in der `.env` und nie im Browser-Bundle.
   *
   * Bewusst angemeldet-only: Es sind die eigenen Daten aus der zweiten App;
   * ReiseKompass soll dafür kein offener Weiterleiter werden. Ist die
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
      const { isExcursionsConfigured } = await import("../excursions");
      return { configured: isExcursionsConfigured() };
    }),
    /** Alle Ausflugsziele – ohne Filter auf `status`, ausdrücklich alle. */
    list: protectedProcedure.query(async () => {
      const { fetchExcursions, isExcursionsConfigured } =
        await import("../excursions");
      if (!isExcursionsConfigured()) {
        return { configured: false as const, excursions: [] };
      }
      return { configured: true as const, excursions: await fetchExcursions() };
    }),
  }),
};
