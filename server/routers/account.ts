/**
 * Startseite, Push, Einstellungen und Papierkorb (#331).
 *
 * Aus `server/routers.ts` herausgelöst, Verhalten unverändert. Der
 * gemeinsame Unterbau steht in `_shared.ts`.
 */
import { nanoid } from "nanoid";
import { CALENDAR_TOKEN_LENGTH } from "@shared/calendarFeed";
import { SHARE_LINK_KINDS } from "@shared/shareLinks";
import {
  LANGUAGES,
  RAIN_THRESHOLD_MAX_MM,
  RAIN_THRESHOLD_MIN_MM,
  RETENTION_DAYS,
  SETTING_VALUE_MAX_LENGTH,
  SYNCED_SETTING_KEYS,
  TRPCError,
  WIND_THRESHOLD_MAX_KMH,
  WIND_THRESHOLD_MIN_KMH,
  db,
  protectedProcedure,
  publicProcedure,
  router,
  visibleTrash,
  z,
} from "./_shared";

export const accountRouters = {
  /**
   * Kalender-Abo (#377): eine Adresse, die der Kalender selbst abholt.
   *
   * Warum ein Abo und nicht die Datei aus #244 – und warum der Schlüssel
   * in der Adresse steckt, steht in `shared/calendarFeed.ts`.
   */
  calendar: router({
    /** Schlüssel des Kontos; entsteht beim ersten Abruf. */
    feed: protectedProcedure.query(async ({ ctx }) => {
      const token = await db.getOrCreateCalendarToken(ctx.user.id, () =>
        nanoid(CALENDAR_TOKEN_LENGTH)
      );
      return { token };
    }),
    /**
     * Neuen Schlüssel erzeugen. Danach zeigt der alte Link ins Leere –
     * das ist der Sinn: Er ist das einzige Mittel gegen eine Adresse,
     * die man versehentlich weitergegeben hat.
     */
    reset: protectedProcedure.mutation(async ({ ctx }) => {
      const token = await db.resetCalendarToken(ctx.user.id, () =>
        nanoid(CALENDAR_TOKEN_LENGTH)
      );
      return { token };
    }),
  }),
  /**
   * Angemeldete Geräte (#423): jede Anmeldung seit der Geräte-Verwaltung
   * ist eine userSessions-Zeile; «abmelden» löscht sie und macht das
   * zugehörige Cookie sofort wertlos. Ältere Anmeldungen (JWT ohne sid)
   * erscheinen erst nach dem nächsten Login.
   */
  devices: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { sdk } = await import("../_core/sdk");
      const sid = await sdk.sessionTokenIdFromRequest(ctx.req);
      const rows = await db.listUserSessions(ctx.user.id);
      // tokenId bleibt auf dem Server – der Client bekommt nur die Zeilen-Id
      return rows.map(row => ({
        id: row.id,
        userAgent: row.userAgent,
        createdAt: row.createdAt,
        lastSeenAt: row.lastSeenAt,
        current: sid !== null && row.tokenId === sid,
      }));
    }),
    revoke: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteUserSession(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /** Alle anderen Geräte abmelden – die aktuelle Anmeldung bleibt. */
    revokeOthers: protectedProcedure.mutation(async ({ ctx }) => {
      const { sdk } = await import("../_core/sdk");
      const sid = await sdk.sessionTokenIdFromRequest(ctx.req);
      const removed = await db.deleteUserSessions(ctx.user.id, sid);
      return { removed } as const;
    }),
  }),
  /**
   * Teil-Link-Übersicht (#422): alle aktiven Teil-Links des Kontos an
   * einem Ort, samt Beenden. Erzeugt wird weiterhin am jeweiligen Ort –
   * hier ist die Inventur.
   */
  shares: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { sortShareLinks } = await import("@shared/shareLinks");
      const entries = await db.getShareLinkOverview(ctx.user.id);
      return sortShareLinks(entries, Date.now());
    }),
    revoke: protectedProcedure
      .input(
        z.object({
          kind: z.enum(SHARE_LINK_KINDS),
          id: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.revokeShareLink(input.kind, input.id, ctx.user.id);
        return { success: true } as const;
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
      const { pushConfigured } = await import("../push");
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
          /** Sprache des Geräts für die Mitteilungs-Texte (#313) */
          lang: z.enum(LANGUAGES).default("de"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { saveSubscription } = await import("../push");
        await saveSubscription(
          ctx.user.id,
          input.endpoint,
          input.p256dh,
          input.auth,
          input.lang
        );
        return { success: true } as const;
      }),
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string().min(10).max(500) }))
      .mutation(async ({ ctx, input }) => {
        const { deleteSubscription } = await import("../push");
        await deleteSubscription(ctx.user.id, input.endpoint);
        return { success: true } as const;
      }),
    status: protectedProcedure
      .input(z.object({ endpoint: z.string().min(10).max(500) }))
      .query(async ({ ctx, input }) => {
        const { hasSubscription } = await import("../push");
        return {
          subscribed: await hasSubscription(ctx.user.id, input.endpoint),
        };
      }),
    /** Mitteilungs-Flags des Abos dieses Geräts (null = kein Abo gespeichert). */
    getPrefs: protectedProcedure
      .input(z.object({ endpoint: z.string().min(10).max(500) }))
      .query(async ({ ctx, input }) => {
        const { getSubscriptionPrefs } = await import("../push");
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
        const { setSubscriptionPrefs } = await import("../push");
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
        const { getPushLog, PUSH_LOG_LIMIT } = await import("../push");
        return getPushLog(ctx.user.id, input.limit ?? PUSH_LOG_LIMIT);
      }),
    /**
     * Wann die Prüfung zuletzt gelaufen ist (#314).
     *
     * Die Prüfung hängt an einem externen Cronjob. Fällt der aus, bleibt
     * alles still – und Stille sieht genau aus wie «es gab nichts zu
     * melden». Dieser Zeitstempel macht den Unterschied sichtbar, an der
     * Stelle, an der man Mitteilungen ohnehin verwaltet.
     */
    lastCheck: protectedProcedure.query(async () => {
      const { getState } = await import("../systemState");
      const at = await getState("lastPushCheck");
      return { at };
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
      const { purgeExpired } = await import("../trash");
      await purgeExpired(
        new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
      ).catch(() => 0);
      const entries = await db.getTrashEntries(ctx.user.id);
      return visibleTrash(entries, Date.now());
    }),
    restore: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const { restore } = await import("../trash");
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
        const { purgeOne } = await import("../trash");
        await purgeOne(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /** Papierkorb leeren. */
    empty: protectedProcedure.mutation(async ({ ctx }) => {
      const { purgeAll } = await import("../trash");
      const removed = await purgeAll(ctx.user.id);
      return { success: true, removed } as const;
    }),
  }),
};
