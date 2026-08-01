import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Integrationstest gegen eine echte MySQL-Datenbank: läuft nur, wenn
 * DATABASE_URL gesetzt ist (CI-Job mit MySQL-Service und angewendeten
 * Migrationen). Lokal ohne Datenbank wird die Datei übersprungen.
 * Ablauf: Registrieren → Anmelden → Packliste anlegen → Einstellung syncen
 * → Konto samt Daten wieder löschen.
 */

const hasDb = Boolean(process.env.DATABASE_URL);

function createRes() {
  const cookies: { name: string; value?: string }[] = [];
  return {
    res: {
      cookie: (name: string, value: string) => cookies.push({ name, value }),
      clearCookie: (name: string) => cookies.push({ name }),
    } as unknown as TrpcContext["res"],
    cookies,
  };
}

function anonContext(): { ctx: TrpcContext; cookies: { name: string }[] } {
  const { res, cookies } = createRes();
  return {
    ctx: {
      user: null,
      req: { protocol: "https", headers: {}, ip: "203.0.113.99" } as TrpcContext["req"],
      res,
    },
    cookies,
  };
}

describe.skipIf(!hasDb)("Datenbank-Integration (Auth-Flow)", () => {
  const email = `ci-test-${Date.now()}@example.com`;
  const password = "test-passwort-123";

  it("registriert, meldet an, legt Daten an und löscht das Konto wieder", async () => {
    // Registrieren setzt ein Session-Cookie
    const anon = anonContext();
    const anonCaller = appRouter.createCaller(anon.ctx);
    const registered = await anonCaller.auth.register({ name: "CI Test", email, password });
    expect(registered.success).toBe(true);
    expect(anon.cookies.length).toBeGreaterThan(0);

    // Anmelden mit denselben Zugangsdaten funktioniert
    const login = await appRouter
      .createCaller(anonContext().ctx)
      .auth.login({ email, password });
    expect(login.success).toBe(true);

    // Authentifizierter Kontext: Nutzer aus der DB laden
    const { findUserByEmail } = await import("./localAuth");
    const user = await findUserByEmail(email);
    expect(user).toBeDefined();
    const authed = appRouter.createCaller({
      user: user as NonNullable<TrpcContext["user"]>,
      req: { protocol: "https", headers: {}, ip: "203.0.113.99" } as TrpcContext["req"],
      res: createRes().res,
    });

    // Packliste anlegen und wiederfinden (Migrationen + Schreibpfad ok)
    const { listId } = await authed.packing.createList({ name: "CI-Liste", scenario: "solo" });
    expect(listId).toBeTruthy();
    const lists = await authed.packing.lists();
    expect(lists.some(l => l.name === "CI-Liste")).toBe(true);

    // Einstellungs-Sync: Schreiben und Lesen über die userSettings-Tabelle
    await authed.settings.set({ key: "moduleOrder", value: JSON.stringify(["/sos"]) });
    const settings = await authed.settings.all();
    expect(settings.moduleOrder).toBe(JSON.stringify(["/sos"]));

    // Aufräumen: Konto löschen entfernt auch die angelegten Daten
    const deleted = await authed.auth.deleteAccount({ password });
    expect(deleted.success).toBe(true);
    expect(await findUserByEmail(email)).toBeUndefined();
  });
});
