import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAnonContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("spots router", () => {
  it("verweigert anonymen Zugriff auf die Favoritenliste", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.spots.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("verweigert anonymes Anlegen eines Favoriten", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(
      caller.spots.add({ name: "Test", latitude: 46.8, longitude: 8.2 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
