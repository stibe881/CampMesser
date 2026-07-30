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

describe("packing sharing", () => {
  it("verweigert anonymes Erstellen eines Teil-Links", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.packing.share({ listId: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("verweigert anonymes Zurückziehen eines Teil-Links", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.packing.unshare({ listId: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("lehnt zu kurze Tokens bei sharedGet ab (Input-Validierung)", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.packing.sharedGet({ token: "abc" })).rejects.toThrow();
  });

  it("lehnt zu kurze Tokens bei sharedToggle ab (Input-Validierung)", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(
      caller.packing.sharedToggle({ token: "x", itemId: 1, checked: true }),
    ).rejects.toThrow();
  });
});
