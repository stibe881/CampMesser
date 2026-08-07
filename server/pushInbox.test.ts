import { describe, expect, it } from "vitest";
import {
  newestSentAt,
  PUSH_UNREAD_MAX,
  unreadBadgeLabel,
  unreadPushCount,
} from "@shared/pushInbox";

/**
 * Der Punkt an der Glocke (#374).
 *
 * WARUM DAS PRÜFENSWERT IST: «Ungelesen» wird hier nicht gespeichert,
 * sondern aus zwei Zeitpunkten GERECHNET. Ein Vergleich, der bei
 * Gleichstand falsch herum steht, zeigt entweder ewig einen Punkt oder
 * verschluckt genau die Meldung, die man noch nie gesehen hat – beides
 * merkt man am Bildschirm erst Tage später.
 */
const entry = (sentAt: string | Date) => ({ sentAt });

describe("unreadPushCount", () => {
  const entries = [
    entry("2026-08-07T10:00:00.000Z"),
    entry("2026-08-06T18:30:00.000Z"),
    entry("2026-08-05T09:00:00.000Z"),
  ];

  it("ohne gemerkten Zeitpunkt ist alles neu", () => {
    // Das erste Öffnen auf einem Gerät: «nichts ist neu» würde eine
    // Meldung verschlucken, die man noch nie gesehen hat.
    expect(unreadPushCount(entries, null)).toBe(3);
  });

  it("zählt nur, was NACH dem letzten Blick kam", () => {
    expect(unreadPushCount(entries, "2026-08-06T00:00:00.000Z")).toBe(2);
    expect(unreadPushCount(entries, "2026-08-07T09:59:59.000Z")).toBe(1);
  });

  it("der gemerkte Zeitpunkt selbst zählt nicht mehr", () => {
    // Genau der Eintrag, mit dem gemerkt wurde, ist gesehen – sonst
    // bliebe nach jedem Öffnen eine 1 stehen.
    expect(unreadPushCount(entries, "2026-08-07T10:00:00.000Z")).toBe(0);
  });

  it("nimmt Date-Werte genauso wie ISO-Text", () => {
    // Aus der API kommt ein Date (superjson), aus dem localStorage Text.
    const mixed = [entry(new Date("2026-08-07T10:00:00.000Z"))];
    expect(unreadPushCount(mixed, "2026-08-06T00:00:00.000Z")).toBe(1);
  });

  it("ignoriert kaputte Zeitpunkte, statt sie zu zählen", () => {
    expect(unreadPushCount([entry("kaputt")], "2026-08-06T00:00:00.000Z")).toBe(
      0
    );
    // Ein unbrauchbarer Merker gilt wie keiner: lieber alles zeigen.
    expect(unreadPushCount(entries, "kaputt")).toBe(3);
  });

  it("leere Liste ist leer", () => {
    expect(unreadPushCount([], null)).toBe(0);
  });
});

describe("newestSentAt", () => {
  it("findet den jüngsten Zeitpunkt, egal in welcher Reihenfolge", () => {
    expect(
      newestSentAt([
        entry("2026-08-05T09:00:00.000Z"),
        entry("2026-08-07T10:00:00.000Z"),
        entry("2026-08-06T18:30:00.000Z"),
      ])
    ).toBe("2026-08-07T10:00:00.000Z");
  });

  it("gibt bei leerer Liste null – und schreibt nicht «jetzt» fest", () => {
    // Sonst wäre eine ältere Meldung, die gleich danach nachkommt, schon
    // abgehakt, bevor man sie hatte.
    expect(newestSentAt([])).toBeNull();
    expect(newestSentAt([entry("kaputt")])).toBeNull();
  });
});

describe("unreadBadgeLabel", () => {
  it("zeigt die Zahl, ab zehn ein Plus", () => {
    expect(unreadBadgeLabel(0)).toBe("");
    expect(unreadBadgeLabel(3)).toBe("3");
    expect(unreadBadgeLabel(PUSH_UNREAD_MAX)).toBe(String(PUSH_UNREAD_MAX));
    expect(unreadBadgeLabel(PUSH_UNREAD_MAX + 1)).toBe(`${PUSH_UNREAD_MAX}+`);
    expect(unreadBadgeLabel(999)).toBe(`${PUSH_UNREAD_MAX}+`);
  });
});
