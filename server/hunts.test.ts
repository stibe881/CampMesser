import { describe, expect, it } from "vitest";
import { parseHuntStations, solutionWordFromStations } from "@shared/hunts";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const station = (letter?: string) => ({
  title: "Station 1",
  story: "Es war einmal …",
  task: "Findet drei Tannzapfen.",
  letter,
});

describe("parseHuntStations", () => {
  it("liest gültige Stationen und normalisiert Buchstaben", () => {
    const json = JSON.stringify([
      { ...station("s"), hint: "Beim grossen Baum" },
      station(),
    ]);
    const stations = parseHuntStations(json);
    expect(stations).toHaveLength(2);
    expect(stations[0].letter).toBe("S");
    expect(stations[0].hint).toBe("Beim grossen Baum");
    expect(stations[1].letter).toBeUndefined();
  });

  it("verwirft kaputtes JSON und fremde Formate", () => {
    expect(parseHuntStations("kaputt")).toEqual([]);
    expect(parseHuntStations('{"a":1}')).toEqual([]);
    expect(parseHuntStations(JSON.stringify([{ title: "ohne Rest" }]))).toEqual(
      []
    );
  });

  it("begrenzt die Stations-Anzahl", () => {
    const many = JSON.stringify(Array.from({ length: 20 }, () => station()));
    expect(parseHuntStations(many)).toHaveLength(12);
  });
});

describe("solutionWordFromStations", () => {
  it("bildet das Lösungswort aus den Buchstaben in Reihenfolge", () => {
    const stations = [
      station("Z"),
      station(),
      station("e"),
      station("l"),
      station("t"),
    ];
    expect(
      solutionWordFromStations(parseHuntStations(JSON.stringify(stations)))
    ).toBe("ZELT");
  });

  it("gibt null ohne Buchstaben zurück", () => {
    expect(solutionWordFromStations([station()])).toBeNull();
  });
});

describe("hunts router", () => {
  it("verweigert anonymen Zugriff", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.hunts.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("recipes router", () => {
  it("verweigert anonymen Zugriff auf eigene Rezepte", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.recipes.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
