/**
 * Teil-Link-Übersicht (#422): Der Katalog muss zu den Routen in App.tsx
 * passen, und die Sortierung wirft Abgelaufenes raus (Regel aus
 * shared/sharing.ts, #189).
 */
import { describe, expect, it } from "vitest";
import {
  SHARE_LINK_KINDS,
  SHARE_LINK_PATHS,
  shareLinkPath,
  sortShareLinks,
  type ShareLinkEntry,
} from "../shared/shareLinks";

const NOW = Date.parse("2026-08-08T12:00:00Z");

function entry(overrides: Partial<ShareLinkEntry>): ShareLinkEntry {
  return {
    kind: "spot",
    id: 1,
    label: "Camping Aare",
    token: "tok",
    expiresAt: null,
    ...overrides,
  };
}

describe("shareLinkPath", () => {
  it("bildet die öffentlichen Pfade aus App.tsx", () => {
    expect(shareLinkPath("spot", "abc")).toBe("/platz/abc");
    expect(shareLinkPath("packList", "abc")).toBe("/liste/abc");
    expect(shareLinkPath("packTemplate", "abc")).toBe("/vorlage/abc");
    expect(shareLinkPath("trip", "abc")).toBe("/reise/abc");
    expect(shareLinkPath("recipe", "abc")).toBe("/rezept/abc");
    expect(shareLinkPath("quiz", "abc")).toBe("/quiz/abc");
    expect(shareLinkPath("shopping", "abc")).toBe("/einkaufsliste/abc");
    expect(shareLinkPath("track", "abc")).toBe("/wanderung/abc");
    expect(shareLinkPath("location", "abc")).toBe("/standort/abc");
  });

  it("kennt für jede Art genau einen Pfad", () => {
    const paths = SHARE_LINK_KINDS.map(kind => SHARE_LINK_PATHS[kind]);
    expect(new Set(paths).size).toBe(SHARE_LINK_KINDS.length);
  });
});

describe("sortShareLinks", () => {
  it("sortiert nach Katalog-Reihenfolge, dann nach Name", () => {
    const sorted = sortShareLinks(
      [
        entry({ kind: "location", id: 9, label: null }),
        entry({ kind: "spot", id: 2, label: "Zermatt" }),
        entry({ kind: "spot", id: 1, label: "Aare" }),
        entry({ kind: "trip", id: 5, label: "Sommer" }),
      ],
      NOW
    );
    expect(sorted.map(e => `${e.kind}:${e.id}`)).toEqual([
      "spot:1",
      "spot:2",
      "trip:5",
      "location:9",
    ]);
  });

  it("wirft abgelaufene Links raus, behält unbegrenzte", () => {
    const sorted = sortShareLinks(
      [
        entry({ id: 1, expiresAt: "2026-08-01T00:00:00Z" }),
        entry({ id: 2, expiresAt: "2026-09-01T00:00:00Z" }),
        entry({ id: 3, expiresAt: null }),
      ],
      NOW
    );
    expect(sorted.map(e => e.id)).toEqual([1, 2, 3].slice(1));
  });
});
