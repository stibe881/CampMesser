import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  hashPassword,
  normalizeEmail,
  validateEmail,
  validatePassword,
  verifyPassword,
} from "./localAuth";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("localAuth Passwort-Hashing", () => {
  it("hasht und verifiziert ein Passwort korrekt", async () => {
    const hash = await hashPassword("geheim123");
    expect(hash).toContain(":");
    expect(await verifyPassword("geheim123", hash)).toBe(true);
    expect(await verifyPassword("falsch123", hash)).toBe(false);
  });

  it("erzeugt für dasselbe Passwort unterschiedliche Hashes (Salt)", async () => {
    const a = await hashPassword("geheim123");
    const b = await hashPassword("geheim123");
    expect(a).not.toBe(b);
  });

  it("lehnt kaputte gespeicherte Hashes ab", async () => {
    expect(await verifyPassword("x", "kein-doppelpunkt")).toBe(false);
  });
});

describe("localAuth Validierung", () => {
  it("normalisiert E-Mail-Adressen", () => {
    expect(normalizeEmail("  Test@Beispiel.CH ")).toBe("test@beispiel.ch");
  });

  it("validiert E-Mail-Adressen", () => {
    expect(validateEmail("du@beispiel.ch")).toBe(true);
    expect(validateEmail("keine-email")).toBe(false);
    expect(validateEmail("a@b")).toBe(false);
  });

  it("validiert Passwörter (mind. 8 Zeichen)", () => {
    expect(validatePassword("kurz")).not.toBeNull();
    expect(validatePassword("geheim123")).toBeNull();
  });
});

describe("auth.me", () => {
  it("liefert das Nutzerobjekt ohne passwordHash", async () => {
    const user = {
      id: 1,
      openId: "local:abc",
      email: "test@beispiel.ch",
      name: "Test",
      loginMethod: "email",
      passwordHash: "salt:hash",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const ctx = {
      user,
      req: { protocol: "https", headers: {} },
      res: {},
    } as unknown as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).not.toBeNull();
    expect((me as Record<string, unknown>).passwordHash).toBeUndefined();
    expect((me as Record<string, unknown>).email).toBe("test@beispiel.ch");
  });
});

describe("auth.register Validierung", () => {
  const ctx = {
    user: null,
    req: { protocol: "https", headers: {} },
    res: { cookie: () => {} },
  } as unknown as TrpcContext;

  it("lehnt ungültige E-Mail-Adressen ab", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.register({ name: "Test", email: "keine-email", password: "geheim123" }),
    ).rejects.toThrowError(TRPCError);
  });

  it("lehnt zu kurze Passwörter ab", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.register({ name: "Test", email: "du@beispiel.ch", password: "kurz" }),
    ).rejects.toThrow(/mindestens 8 Zeichen/);
  });
});
