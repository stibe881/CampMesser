import { describe, expect, it } from "vitest";
import {
  generateVerifyToken,
  hashVerifyToken,
  verifyTokenState,
  VERIFY_TOKEN_TTL_MS,
} from "./emailVerify";
import { buildVerificationMail } from "./mailer";
import { LANGUAGES } from "@shared/i18n";

describe("E-Mail-Bestätigungs-Tokens", () => {
  it("erzeugt Tokens aus 32 Zufallsbytes als Hex (64 Zeichen)", () => {
    const token = generateVerifyToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("erzeugt bei jedem Aufruf ein anderes Token", () => {
    const seen = new Set(
      Array.from({ length: 20 }, () => generateVerifyToken())
    );
    expect(seen.size).toBe(20);
  });

  it("hasht Tokens mit sha256 (nur der Hash wird gespeichert)", () => {
    // Bekannter sha256-Testvektor
    expect(hashVerifyToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    expect(hashVerifyToken("abc")).toHaveLength(64);
    expect(hashVerifyToken("abc")).not.toBe(hashVerifyToken("abd"));
  });

  it("gilt 48 Stunden", () => {
    expect(VERIFY_TOKEN_TTL_MS).toBe(48 * 60 * 60 * 1000);
  });

  it("meldet gültige und abgelaufene Tokens korrekt", () => {
    const now = new Date("2026-08-03T12:00:00Z");
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const before1Min = new Date(now.getTime() - 60 * 1000);
    expect(verifyTokenState({ expiresAt: in1h }, now)).toBe("valid");
    expect(verifyTokenState({ expiresAt: before1Min }, now)).toBe("expired");
    // exakt zum Ablaufzeitpunkt noch gültig, 1 ms später nicht mehr
    expect(verifyTokenState({ expiresAt: now }, now)).toBe("valid");
    expect(
      verifyTokenState({ expiresAt: now }, new Date(now.getTime() + 1))
    ).toBe("expired");
  });
});

describe("Bestätigungs-Mail", () => {
  const url = "https://meinreisekompass.ch/anmelden?verify=deadbeef";

  it("enthält in allen vier Sprachen den Link und einen Betreff mit ReiseKompass", () => {
    for (const lang of LANGUAGES) {
      const mail = buildVerificationMail(url, lang);
      expect(mail.subject).toContain("ReiseKompass");
      expect(mail.text).toContain(url);
      expect(mail.text.length).toBeGreaterThan(50);
    }
  });

  it("übersetzt Betreff und Text pro Sprache unterschiedlich", () => {
    const subjects = LANGUAGES.map(
      lang => buildVerificationMail(url, lang).subject
    );
    expect(new Set(subjects).size).toBe(LANGUAGES.length);
    expect(buildVerificationMail(url, "de").text).toContain("48 Stunden");
    expect(buildVerificationMail(url, "fr").text).toContain("48 heures");
    expect(buildVerificationMail(url, "it").text).toContain("48 ore");
    expect(buildVerificationMail(url, "en").text).toContain("48 hours");
  });
});
