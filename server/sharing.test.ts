import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  DEFAULT_LOCATION_SHARE_HOURS,
  LOCATION_SHARE_EXPIRY_HOURS,
  SHARE_EXPIRY_DAYS,
  isShareExpired,
  locationShareExpiry,
  relativeAge,
  sanitizeLocationShareHours,
  sanitizeShareExpiryDays,
  shareExpiryFromDays,
} from "@shared/sharing";

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
      caller.packing.sharedToggle({ token: "x", itemId: 1, checked: true })
    ).rejects.toThrow();
  });
});

describe("trips hub sharing", () => {
  it("verweigert anonymes Erstellen eines Reise-Hub-Links", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.trips.share({ tripId: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("verweigert anonymes Beenden des Reise-Hub-Teilens", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.trips.unshare({ tripId: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("lehnt zu kurze Tokens bei sharedGet ab (Input-Validierung)", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.trips.sharedGet({ token: "abc" })).rejects.toThrow();
  });
});

const now = new Date("2026-08-03T12:00:00Z");

describe("sanitizeShareExpiryDays", () => {
  it("lässt die erlaubten Dauern durch", () => {
    SHARE_EXPIRY_DAYS.forEach(days =>
      expect(sanitizeShareExpiryDays(days)).toBe(days)
    );
  });

  it("macht aus allem anderen «unbegrenzt» (null)", () => {
    expect(sanitizeShareExpiryDays(null)).toBeNull();
    expect(sanitizeShareExpiryDays(undefined)).toBeNull();
    expect(sanitizeShareExpiryDays(14)).toBeNull();
    expect(sanitizeShareExpiryDays("30")).toBeNull();
  });
});

describe("shareExpiryFromDays", () => {
  it("rechnet ganze Tage ab jetzt", () => {
    expect(shareExpiryFromDays(7, now)).toEqual(
      new Date("2026-08-10T12:00:00Z")
    );
    expect(shareExpiryFromDays(90, now)).toEqual(
      new Date("2026-11-01T12:00:00Z")
    );
  });

  it("liefert für «unbegrenzt» und für Unbekanntes null", () => {
    expect(shareExpiryFromDays(null, now)).toBeNull();
    expect(shareExpiryFromDays(undefined, now)).toBeNull();
    expect(shareExpiryFromDays(14 as never, now)).toBeNull();
  });
});

describe("isShareExpired", () => {
  it("gilt ohne Ablauf nie als abgelaufen", () => {
    expect(isShareExpired(null, now)).toBe(false);
    expect(isShareExpired(undefined, now)).toBe(false);
  });

  it("vergleicht mit dem angegebenen Zeitpunkt", () => {
    expect(isShareExpired(new Date("2026-08-03T12:00:01Z"), now)).toBe(false);
    expect(isShareExpired(new Date("2026-08-03T11:59:59Z"), now)).toBe(true);
  });

  it("zählt den Ablauf-Zeitpunkt selbst schon als abgelaufen", () => {
    expect(isShareExpired(now, now)).toBe(true);
  });

  it("versteht ISO-Strings und Millisekunden", () => {
    expect(isShareExpired("2026-08-02T12:00:00Z", now)).toBe(true);
    expect(isShareExpired("2026-08-04T12:00:00Z", now)).toBe(false);
    expect(isShareExpired(now.getTime() - 1, now)).toBe(true);
  });

  it("behandelt kaputte Werte als abgelaufen (im Zweifel nicht herausgeben)", () => {
    expect(isShareExpired("gestern", now)).toBe(true);
    expect(isShareExpired(Number.NaN, now)).toBe(true);
  });

  it("passt zu shareExpiryFromDays: frisch gültig, später abgelaufen", () => {
    const expires = shareExpiryFromDays(7, now);
    expect(isShareExpired(expires, now)).toBe(false);
    expect(isShareExpired(expires, new Date("2026-08-10T11:59:00Z"))).toBe(
      false
    );
    expect(isShareExpired(expires, new Date("2026-08-11T12:00:00Z"))).toBe(
      true
    );
  });
});

describe("location sharing", () => {
  it("verweigert anonymes Teilen des Standorts", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(
      caller.location.share({ latitude: 46.9, longitude: 7.4 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("verweigert anonymes Deaktivieren des Standort-Links", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.location.stop()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("lehnt zu kurze Tokens bei sharedGet ab (Input-Validierung)", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.location.sharedGet({ token: "abc" })).rejects.toThrow();
  });

  it("lehnt unmögliche Koordinaten ab", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(
      caller.location.share({ latitude: 100, longitude: 7.4 })
    ).rejects.toThrow();
  });
});

describe("sanitizeLocationShareHours", () => {
  it("lässt die erlaubten Dauern durch", () => {
    LOCATION_SHARE_EXPIRY_HOURS.forEach(hours =>
      expect(sanitizeLocationShareHours(hours)).toBe(hours)
    );
  });

  it("fällt auf die Voreinstellung zurück – NIE auf «unbegrenzt»", () => {
    expect(sanitizeLocationShareHours(null)).toBe(DEFAULT_LOCATION_SHARE_HOURS);
    expect(sanitizeLocationShareHours(undefined)).toBe(
      DEFAULT_LOCATION_SHARE_HOURS
    );
    expect(sanitizeLocationShareHours(72)).toBe(DEFAULT_LOCATION_SHARE_HOURS);
    expect(sanitizeLocationShareHours("4")).toBe(DEFAULT_LOCATION_SHARE_HOURS);
  });
});

describe("locationShareExpiry", () => {
  it("rechnet ganze Stunden ab jetzt", () => {
    expect(locationShareExpiry(1, now)).toEqual(
      new Date("2026-08-03T13:00:00Z")
    );
    expect(locationShareExpiry(24, now)).toEqual(
      new Date("2026-08-04T12:00:00Z")
    );
  });

  it("liefert auch bei Unsinn einen Ablauf (Standort läuft immer ab)", () => {
    expect(locationShareExpiry("bald", now)).toEqual(
      new Date("2026-08-03T16:00:00Z")
    );
    expect(isShareExpired(locationShareExpiry(null, now), now)).toBe(false);
  });

  it("passt zu isShareExpired: nach Ablauf der Stunden ist Schluss", () => {
    const expires = locationShareExpiry(1, now);
    expect(isShareExpired(expires, new Date("2026-08-03T12:59:00Z"))).toBe(
      false
    );
    expect(isShareExpired(expires, new Date("2026-08-03T13:00:00Z"))).toBe(
      true
    );
  });
});

describe("relativeAge", () => {
  it("liefert Minuten, Stunden und Tage – immer negativ (Vergangenheit)", () => {
    expect(relativeAge(new Date("2026-08-03T11:55:00Z"), now)).toEqual({
      value: -5,
      unit: "minute",
    });
    expect(relativeAge(new Date("2026-08-03T09:00:00Z"), now)).toEqual({
      value: -3,
      unit: "hour",
    });
    expect(relativeAge(new Date("2026-07-31T12:00:00Z"), now)).toEqual({
      value: -3,
      unit: "day",
    });
  });

  it("rundet Sekunden auf «vor 0 Minuten» ab", () => {
    expect(relativeAge(new Date("2026-08-03T11:59:30Z"), now)).toEqual({
      value: 0,
      unit: "minute",
    });
  });

  it("behandelt Zukunft und kaputte Werte als 0 Minuten", () => {
    expect(relativeAge(new Date("2026-08-03T13:00:00Z"), now)).toEqual({
      value: 0,
      unit: "minute",
    });
    expect(relativeAge("irgendwann", now)).toEqual({
      value: 0,
      unit: "minute",
    });
  });

  it("wechselt genau an den Grenzen die Einheit", () => {
    expect(relativeAge(new Date("2026-08-03T11:00:00Z"), now).unit).toBe(
      "hour"
    );
    expect(relativeAge(new Date("2026-08-03T11:00:01Z"), now).unit).toBe(
      "minute"
    );
    expect(relativeAge(new Date("2026-08-02T12:00:00Z"), now).unit).toBe("day");
  });
});
