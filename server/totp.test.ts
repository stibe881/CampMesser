/**
 * TOTP (#453): HOTP/TOTP gegen die RFC-Testvektoren, Base32 und
 * Wiederherstellungs-Codes.
 */
import { describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  consumeRecoveryCode,
  generateRecoveryCodes,
  generateTotpSecret,
  hotp,
  otpauthUrl,
  serializeRecoveryHashes,
  verifyTotp,
} from "./totp";

/** RFC-Testschlüssel «12345678901234567890» als Base32. */
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("base32", () => {
  it("kodiert und dekodiert verlustfrei", () => {
    const buf = Buffer.from("12345678901234567890", "ascii");
    expect(base32Encode(buf)).toBe(RFC_SECRET);
    expect(base32Decode(RFC_SECRET).toString("ascii")).toBe(
      "12345678901234567890"
    );
    // Kleinschreibung, Leerraum und Bindestriche sind egal
    expect(base32Decode("gezd gnbv-gy3tqojq gezdgnbvgy3tqojq")).toEqual(
      base32Decode(RFC_SECRET)
    );
  });

  it("wirft bei unlesbaren Zeichen", () => {
    expect(() => base32Decode("ABC1!")).toThrow();
  });
});

describe("hotp (RFC 4226, Anhang D)", () => {
  it("liefert die dokumentierten 6-stelligen Codes", () => {
    const expected = [
      "755224",
      "287082",
      "359152",
      "969429",
      "338314",
      "254676",
    ];
    expected.forEach((code, counter) => {
      expect(hotp(RFC_SECRET, counter)).toBe(code);
    });
  });
});

describe("verifyTotp (RFC 6238)", () => {
  it("akzeptiert den Code des aktuellen Fensters", () => {
    // t = 59 s → Zähler 1 → HOTP(1) = 287082 (RFC-6238-Vektor, 6 Stellen)
    expect(verifyTotp(RFC_SECRET, "287082", 59_000)).toBe(true);
    expect(verifyTotp(RFC_SECRET, "287 082", 59_000)).toBe(true);
  });

  it("toleriert eine Periode Uhren-Drift, mehr nicht", () => {
    // Zähler 1 gilt auch bei t = 60–89 s (Fenster ±1)
    expect(verifyTotp(RFC_SECRET, "287082", 75_000)).toBe(true);
    // Bei t = 150 s (Zähler 5) ist Zähler 1 zwei Fenster alt
    expect(verifyTotp(RFC_SECRET, "287082", 150_000)).toBe(false);
  });

  it("verwirft Unsinn", () => {
    expect(verifyTotp(RFC_SECRET, "000000", 59_000)).toBe(false);
    expect(verifyTotp(RFC_SECRET, "12345", 59_000)).toBe(false);
    expect(verifyTotp(RFC_SECRET, "abcdef", 59_000)).toBe(false);
  });
});

describe("Geheimnis und otpauth-URL", () => {
  it("erzeugt 32 Base32-Zeichen (160 Bit)", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(generateTotpSecret()).not.toBe(secret);
  });

  it("baut eine App-taugliche otpauth-URL", () => {
    const url = otpauthUrl("stefan@example.ch", RFC_SECRET);
    expect(url).toContain("otpauth://totp/ReiseKompass%3Astefan%40example.ch");
    expect(url).toContain(`secret=${RFC_SECRET}`);
    expect(url).toContain("issuer=ReiseKompass");
    expect(url).toContain("digits=6");
  });
});

describe("Wiederherstellungs-Codes", () => {
  it("acht Codes im Format XXXX-XXXX, jeder gilt genau einmal", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    for (const code of codes) expect(code).toMatch(/^[A-Z2-7]{4}-[A-Z2-7]{4}$/);

    const json = serializeRecoveryHashes(codes);
    // Einlösen ist unabhängig von Schreibweise
    const first = consumeRecoveryCode(json, codes[0].toLowerCase());
    expect(first.ok).toBe(true);
    // Derselbe Code ein zweites Mal: verbraucht
    const again = consumeRecoveryCode(first.nextJson, codes[0]);
    expect(again.ok).toBe(false);
    // Ein anderer Code geht weiterhin
    expect(consumeRecoveryCode(first.nextJson, codes[1]).ok).toBe(true);
  });

  it("übersteht kaputtes JSON", () => {
    expect(consumeRecoveryCode("kaputt", "AAAA-AAAA").ok).toBe(false);
    expect(consumeRecoveryCode(null, "AAAA-AAAA").ok).toBe(false);
  });
});
