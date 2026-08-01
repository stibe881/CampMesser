import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { SETTING_VALUE_MAX_LENGTH } from "@shared/settings";

function createAnonContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "sample-user",
      email: "sample@example.com",
      name: "Sample User",
      loginMethod: "local",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as NonNullable<TrpcContext["user"]>,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("settings router", () => {
  it("verweigert anonymen Zugriff auf die Einstellungen", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.settings.all()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      caller.settings.set({ key: "moduleOrder", value: "[]" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("lehnt unbekannte Schlüssel ab", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      // @ts-expect-error – absichtlich ungültiger Schlüssel
      caller.settings.set({ key: "boesesFeld", value: "[]" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("lehnt übergrosse Werte ab", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.settings.set({
        key: "moduleOrder",
        value: "x".repeat(SETTING_VALUE_MAX_LENGTH + 1),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
