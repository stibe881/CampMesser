import { afterEach, describe, expect, it } from "vitest";
import {
  generateResetToken,
  hashResetToken,
  resetTokenState,
  RESET_TOKEN_TTL_MS,
} from "./passwordReset";
import { buildPasswordResetMail, mailConfigured } from "./mailer";
import { LANGUAGES } from "@shared/i18n";

describe("Passwort-Reset-Tokens", () => {
  it("erzeugt Tokens aus 32 Zufallsbytes als Hex (64 Zeichen)", () => {
    const token = generateResetToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("erzeugt bei jedem Aufruf ein anderes Token", () => {
    const seen = new Set(
      Array.from({ length: 20 }, () => generateResetToken())
    );
    expect(seen.size).toBe(20);
  });

  it("hasht Tokens mit sha256 (nur der Hash wird gespeichert)", () => {
    // Bekannter sha256-Testvektor
    expect(hashResetToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    expect(hashResetToken("abc")).toHaveLength(64);
    expect(hashResetToken("abc")).not.toBe(hashResetToken("abd"));
  });

  it("gilt 60 Minuten", () => {
    expect(RESET_TOKEN_TTL_MS).toBe(60 * 60 * 1000);
  });

  it("meldet gültige, abgelaufene und verwendete Tokens korrekt", () => {
    const now = new Date("2026-08-02T12:00:00Z");
    const in30Min = new Date(now.getTime() + 30 * 60 * 1000);
    const before1Min = new Date(now.getTime() - 60 * 1000);
    expect(resetTokenState({ expiresAt: in30Min, usedAt: null }, now)).toBe(
      "valid"
    );
    expect(resetTokenState({ expiresAt: before1Min, usedAt: null }, now)).toBe(
      "expired"
    );
    // usedAt schlägt auch ein noch nicht abgelaufenes Token
    expect(
      resetTokenState({ expiresAt: in30Min, usedAt: before1Min }, now)
    ).toBe("used");
    // exakt zum Ablaufzeitpunkt noch gültig, 1 ms später nicht mehr
    expect(resetTokenState({ expiresAt: now, usedAt: null }, now)).toBe(
      "valid"
    );
    expect(
      resetTokenState(
        { expiresAt: now, usedAt: null },
        new Date(now.getTime() + 1)
      )
    ).toBe("expired");
  });
});

describe("Reset-Mail", () => {
  const url = "https://campmesser.ch/anmelden?reset=deadbeef";

  it("enthält in allen vier Sprachen den Link und einen Betreff mit CampMesser", () => {
    for (const lang of LANGUAGES) {
      const mail = buildPasswordResetMail(url, lang);
      expect(mail.subject).toContain("CampMesser");
      expect(mail.text).toContain(url);
      expect(mail.text.length).toBeGreaterThan(50);
    }
  });

  it("übersetzt Betreff und Text pro Sprache unterschiedlich", () => {
    const subjects = LANGUAGES.map(
      lang => buildPasswordResetMail(url, lang).subject
    );
    expect(new Set(subjects).size).toBe(LANGUAGES.length);
    expect(buildPasswordResetMail(url, "de").text).toContain("60 Minuten");
    expect(buildPasswordResetMail(url, "fr").text).toContain("60 minutes");
    expect(buildPasswordResetMail(url, "it").text).toContain("60 minuti");
    expect(buildPasswordResetMail(url, "en").text).toContain("60 minutes");
  });
});

describe("mailConfigured", () => {
  const KEYS = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const;
  const saved = new Map<string, string | undefined>();

  afterEach(() => {
    KEYS.forEach(key => {
      const value = saved.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  const setEnv = (values: Partial<Record<(typeof KEYS)[number], string>>) => {
    KEYS.forEach(key => {
      if (!saved.has(key)) saved.set(key, process.env[key]);
      if (values[key] === undefined) delete process.env[key];
      else process.env[key] = values[key];
    });
  };

  it("ist falsch ohne SMTP-Zugangsdaten", () => {
    setEnv({});
    expect(mailConfigured()).toBe(false);
  });

  it("ist wahr mit Host, Benutzer und Passwort (Absender fällt auf SMTP_USER zurück)", () => {
    setEnv({
      SMTP_HOST: "mail.example.ch",
      SMTP_USER: "noreply@example.ch",
      SMTP_PASS: "geheim",
    });
    expect(mailConfigured()).toBe(true);
  });

  it("ist falsch, wenn das Passwort fehlt", () => {
    setEnv({
      SMTP_HOST: "mail.example.ch",
      SMTP_USER: "noreply@example.ch",
      SMTP_FROM: "noreply@example.ch",
    });
    expect(mailConfigured()).toBe(false);
  });
});
