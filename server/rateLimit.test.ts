import { afterEach, describe, expect, it } from "vitest";
import {
  allowAction,
  clearFailures,
  isRateLimited,
  lockoutMinutes,
  MAX_LOGIN_ATTEMPTS,
  registerFailure,
  resetRateLimits,
} from "./rateLimit";

const KEY = "user@example.com|203.0.113.7";
const T0 = 1_800_000_000_000;

afterEach(() => resetRateLimits());

describe("rateLimit", () => {
  it("sperrt erst nach dem Erreichen der Maximalzahl an Fehlversuchen", () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS - 1; i++)
      registerFailure(KEY, T0 + i);
    expect(isRateLimited(KEY, T0 + 1000)).toBe(false);
    registerFailure(KEY, T0 + 1000);
    expect(isRateLimited(KEY, T0 + 1001)).toBe(true);
  });

  it("hebt die Sperre nach Ablauf des 15-Minuten-Fensters auf", () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) registerFailure(KEY, T0);
    expect(isRateLimited(KEY, T0 + 14 * 60_000)).toBe(true);
    expect(isRateLimited(KEY, T0 + 15 * 60_000 + 1)).toBe(false);
  });

  it("startet nach Fenster-Ablauf ein frisches Fenster statt weiterzuzählen", () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) registerFailure(KEY, T0);
    // Neuer Fehlversuch nach Ablauf: zählt als 1. Versuch, keine Sperre
    registerFailure(KEY, T0 + 16 * 60_000);
    expect(isRateLimited(KEY, T0 + 16 * 60_000 + 1)).toBe(false);
  });

  it("löscht Fehlversuche bei erfolgreicher Anmeldung", () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) registerFailure(KEY, T0);
    expect(isRateLimited(KEY, T0 + 1)).toBe(true);
    clearFailures(KEY);
    expect(isRateLimited(KEY, T0 + 2)).toBe(false);
  });

  it("zählt verschiedene Schlüssel (E-Mail+IP) getrennt", () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) registerFailure(KEY, T0);
    expect(isRateLimited("andere@example.com|203.0.113.7", T0)).toBe(false);
  });

  it("meldet die verbleibende Sperrzeit in Minuten", () => {
    registerFailure(KEY, T0);
    expect(lockoutMinutes(KEY, T0 + 5 * 60_000)).toBe(10);
    expect(lockoutMinutes("unbekannt", T0)).toBe(0);
  });
});

describe("allowAction (generische Aktions-Begrenzung)", () => {
  const HOUR = 60 * 60_000;
  const RKEY = "pwreset|user@example.com|203.0.113.7";

  it("erlaubt bis zum Maximum und blockiert danach", () => {
    expect(allowAction(RKEY, 3, HOUR, T0)).toBe(true);
    expect(allowAction(RKEY, 3, HOUR, T0 + 1)).toBe(true);
    expect(allowAction(RKEY, 3, HOUR, T0 + 2)).toBe(true);
    expect(allowAction(RKEY, 3, HOUR, T0 + 3)).toBe(false);
  });

  it("zählt nach Ablauf des Fensters neu", () => {
    for (let i = 0; i < 4; i++) allowAction(RKEY, 3, HOUR, T0 + i);
    expect(allowAction(RKEY, 3, HOUR, T0 + HOUR + 1)).toBe(true);
  });

  it("zählt verschiedene Schlüssel getrennt", () => {
    for (let i = 0; i < 4; i++) allowAction(RKEY, 3, HOUR, T0 + i);
    expect(
      allowAction("pwreset|andere@example.com|203.0.113.7", 3, HOUR, T0)
    ).toBe(true);
  });
});
