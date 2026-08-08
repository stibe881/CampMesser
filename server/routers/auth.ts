/**
 * Anmeldung, Konto und Sitzung (#331).
 *
 * Aus `server/routers.ts` herausgelöst, Verhalten unverändert. Der
 * gemeinsame Unterbau steht in `_shared.ts`.
 */
import {
  COOKIE_NAME,
  ONE_YEAR_MS,
  TRPCError,
  getSessionCookieOptions,
  protectedProcedure,
  publicProcedure,
  router,
  sendVerifyMailFor,
  z,
} from "./_shared";

export const authRouters = {
  auth: router({
    me: publicProcedure.query(async opts => {
      if (!opts.ctx.user) return null;
      // passwordHash niemals an den Client schicken
      const { passwordHash: _ph, ...safeUser } = opts.ctx.user;
      const { mailConfigured } = await import("../mailer");
      return {
        ...safeUser,
        /** Ist die E-Mail-Adresse des Kontos bestätigt? */
        emailVerified: Boolean(safeUser.emailVerifiedAt),
        /** Nur mit SMTP zeigt der Client Bestätigungs-Hinweis und Neu-Versand. */
        verifyMailEnabled: mailConfigured(),
      };
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      // Angemeldete Geräte (#423): die eigene Anmeldungs-Zeile mitputzen,
      // damit sie nicht als Geist in der Geräte-Liste stehen bleibt.
      try {
        const { sdk } = await import("../_core/sdk");
        const sid = await sdk.sessionTokenIdFromRequest(ctx.req);
        if (sid) {
          const db = await import("../db");
          await db.deleteUserSessionByTokenId(sid);
        }
      } catch {
        // Aufräumen darf das Abmelden nie verhindern
      }
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
          lang: z.enum(["de", "fr", "it", "en"]).default("de"),
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
        } = await import("../localAuth");
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
        const token = await createLocalSessionToken(
          user,
          ctx.req.headers["user-agent"]
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        // Mit SMTP eine Bestätigungs-Mail schicken – ohne SMTP läuft die
        // Registrierung unverändert, das Konto gilt einfach als unbestätigt.
        const { mailConfigured } = await import("../mailer");
        if (mailConfigured() && user.email) {
          await sendVerifyMailFor(user.id, user.email, input.lang, ctx.req);
        }
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
        } = await import("../localAuth");
        const {
          isRateLimited,
          registerFailure,
          clearFailures,
          lockoutMinutes,
        } = await import("../rateLimit");
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
        const token = await createLocalSessionToken(
          user,
          ctx.req.headers["user-agent"]
        );
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
        const { updateUserName } = await import("../localAuth");
        await updateUserName(ctx.user.id, input.name);
        return { success: true } as const;
      }),
    updateEmail: protectedProcedure
      .input(
        z.object({
          newEmail: z.string().min(3).max(320),
          currentPassword: z.string().min(1).max(200),
          lang: z.enum(["de", "fr", "it", "en"]).default("de"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const {
          validateEmail,
          normalizeEmail,
          verifyPassword,
          findUserByEmail,
        } = await import("../localAuth");
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
        const { updateUserEmail } = await import("../localAuth");
        // Setzt emailVerifiedAt zurück – die neue Adresse ist unbestätigt
        await updateUserEmail(ctx.user.id, email);
        const { mailConfigured } = await import("../mailer");
        if (mailConfigured()) {
          await sendVerifyMailFor(ctx.user.id, email, input.lang, ctx.req);
        }
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
          await import("../localAuth");
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
          await import("../localAuth");
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
          await import("../mailer");
        if (!mailConfigured()) {
          // Der Client übersetzt diesen Fall anhand des Fehler-Codes.
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Der Passwort-Reset per E-Mail ist derzeit nicht verfügbar.",
          });
        }
        const { normalizeEmail, findUserByEmail } =
          await import("../localAuth");
        const { allowAction } = await import("../rateLimit");
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
          const { createResetToken } = await import("../passwordReset");
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
          await import("../passwordReset");
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
        } = await import("../localAuth");
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
        const token = await createLocalSessionToken(
          user,
          ctx.req.headers["user-agent"]
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true } as const;
      }),
    /**
     * E-Mail-Bestätigung über den Link aus der Mail: Token nachschlagen,
     * Ablauf prüfen, Konto als bestätigt markieren, Tokens löschen.
     */
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string().length(64) }))
      .mutation(async ({ input }) => {
        const { findVerifyToken, verifyTokenState, deleteVerifyTokens } =
          await import("../emailVerify");
        const entry = await findVerifyToken(input.token);
        if (!entry || verifyTokenState(entry) !== "valid") {
          // Der Client übersetzt diesen Fall anhand des Fehler-Codes.
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Der Bestätigungs-Link ist ungültig oder abgelaufen. Fordere einen neuen an.",
          });
        }
        const { markEmailVerified } = await import("../localAuth");
        await markEmailVerified(entry.userId);
        await deleteVerifyTokens(entry.userId);
        return { success: true } as const;
      }),
    /**
     * Bestätigungs-Mail erneut anfordern (eingeloggt): neutrale Antwort,
     * max. 3 Anfragen pro Stunde und Konto.
     */
    resendVerification: protectedProcedure
      .input(z.object({ lang: z.enum(["de", "fr", "it", "en"]).default("de") }))
      .mutation(async ({ ctx, input }) => {
        const { mailConfigured } = await import("../mailer");
        if (!mailConfigured()) {
          // Der Client übersetzt diesen Fall anhand des Fehler-Codes.
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Der E-Mail-Versand ist derzeit nicht verfügbar.",
          });
        }
        const { allowAction } = await import("../rateLimit");
        if (!allowAction(`verifymail|${ctx.user.id}`, 3, 60 * 60 * 1000)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Zu viele Anfragen. Bitte versuche es in einer Stunde erneut.",
          });
        }
        // Bereits bestätigt oder ohne E-Mail: neutral Erfolg melden
        if (ctx.user.email && !ctx.user.emailVerifiedAt) {
          await sendVerifyMailFor(
            ctx.user.id,
            ctx.user.email,
            input.lang,
            ctx.req
          );
        }
        return { success: true } as const;
      }),
    /**
     * Passkey-Registrierung, Schritt 1: WebAuthn-Optionen fürs eingeloggte
     * Konto (excludeCredentials verhindert Duplikate, Challenge 5 Min gültig).
     */
    passkeyRegisterOptions: protectedProcedure.mutation(async ({ ctx }) => {
      const { createRegistrationOptions, rpIdFrom } =
        await import("../passkeys");
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
          await import("../passkeys");
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
      const { listPasskeys } = await import("../passkeys");
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
        const { deletePasskey } = await import("../passkeys");
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
        const { createLoginOptions, rpIdFrom } = await import("../passkeys");
        const { normalizeEmail } = await import("../localAuth");
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
          await import("../passkeys");
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
        const { createLocalSessionToken } = await import("../localAuth");
        const token = await createLocalSessionToken(
          user,
          ctx.req.headers["user-agent"]
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true, name: user.name } as const;
      }),
  }),
};
