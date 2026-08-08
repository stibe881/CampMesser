/**
 * Wanderungen, Routen, Standort, Wasser und Beobachtungen (#331).
 *
 * Aus `server/routers.ts` herausgelöst, Verhalten unverändert. Der
 * gemeinsame Unterbau steht in `_shared.ts`.
 */
import {
  ENV,
  LOCATION_SHARE_EXPIRY_HOURS,
  MAX_ROUTE_PATH_POINTS,
  MAX_ROUTE_SAMPLES,
  MAX_ROUTE_WAYPOINTS,
  MAX_TRACK_POINTS,
  ROUTE_NAME_MAX_LENGTH,
  TRACK_ACTIVITIES,
  guessTrackActivity,
  RouteWaypoint,
  TRACK_NAME_MAX_LENGTH,
  TRPCError,
  TrackPoint,
  db,
  fishCatchInput,
  fishCatchValues,
  hikingMinutes,
  locationShareExpiry,
  nanoid,
  nearestWaterStation,
  parseTrackPoints,
  protectedProcedure,
  publicProcedure,
  requireTripAccess,
  routeElevation,
  routeLengthM,
  routeSamples,
  router,
  selectVisiblePasses,
  serializeTrackPoints,
  serializeWaypoints,
  shareExpiryFor,
  shareExpiryInput,
  thinTrackPoints,
  trackStats,
  waterTrend,
  z,
} from "./_shared";

export const outdoorRouters = {
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
          /** Aktivität (#449); ohne Angabe rät der Server aus dem Tempo. */
          activity: z.enum(TRACK_ACTIVITIES).optional(),
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
          activity:
            input.activity ??
            guessTrackActivity(stats.distanceM, stats.durationS),
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
          activity: z.enum(TRACK_ACTIVITIES).optional(),
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
          ...(input.activity !== undefined ? { activity: input.activity } : {}),
        });
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const { capture } = await import("../trash");
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
      const { isDriveTimeConfigured } = await import("../driveTime");
      return { configured: isDriveTimeConfigured() };
    }),
    /**
     * Fahrzeit für eine Autofahrt. `departureAtMs` ist freiwillig: mit
     * Zeitpunkt kommt die Verkehrs-Prognose für diese Tageszeit, ohne den
     * Verkehr von jetzt. Ist nichts zu holen, kommt `driveTime: null` –
     * ausdrücklich kein Fehler, denn die Ansicht hat bereits eine Zahl.
     */
    /**
     * Verkehrslage je Stützstelle (Nutzerwunsch 04.08.2026).
     *
     * Der Client schickt SEINE Punkte – die liegen auf der OSRM-Route.
     * Der Server holt bei Google die Strecke mit Verkehr, ordnet jeden
     * Punkt einem Abschnitt zu und schickt nur die Einstufung zurück.
     * GOOGLES LINIE VERLÄSST DEN SERVER NIE; sie ist hier nur das
     * Nachschlagewerk. Begründung in `shared/googleRoutes.ts`.
     */
    routeTraffic: protectedProcedure
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
          points: z
            .array(
              z.object({
                lat: z.number().min(-90).max(90),
                lon: z.number().min(-180).max(180),
              })
            )
            .min(1)
            .max(16),
          departureAtMs: z.number().int().positive().nullable().default(null),
        })
      )
      .query(async ({ input }) => {
        const { fetchRouteTraffic, isDriveTimeConfigured } =
          await import("../driveTime");
        if (!isDriveTimeConfigured()) {
          return { configured: false as const, levels: [] };
        }
        const levels = await fetchRouteTraffic(
          input.from,
          input.to,
          input.points,
          input.departureAtMs
        );
        if (!levels) return { configured: false as const, levels: [] };
        return { configured: true as const, levels };
      }),
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
          await import("../driveTime");
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
          await import("../bathingWater");
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
        const { fetchIssPasses } = await import("../iss");
        const raw = await fetchIssPasses(input.latitude, input.longitude);
        return {
          passes: selectVisiblePasses(raw, input.latitude, input.longitude),
          /** Wurden überhaupt Überflüge geliefert? Trennt «keine sichtbaren» von «Quelle stumm». */
          sourceReachable: raw.length > 0,
        };
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
          const { sightingPhotoStorage } = await import("../photoStorage");
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
          const { sightingPhotoStorage } = await import("../photoStorage");
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
          const { catchPhotoStorage } = await import("../photoStorage");
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
          const { catchPhotoStorage } = await import("../photoStorage");
          await catchPhotoStorage.deleteFiles([entry.fileName]);
        }
        return { success: true } as const;
      }),
  }),
};
