import { describe, expect, it } from "vitest";
import {
  PASSWORD_HINT_LIMIT,
  passwordStrength,
  type PasswordHint,
} from "@shared/passwordStrength";

/** Kurzform: nur die Hinweis-Schlüssel eines Passworts. */
const hintsOf = (pw: string): PasswordHint[] => passwordStrength(pw).hints;

describe("passwordStrength", () => {
  it("bewertet zu kurze Passwörter immer mit 0 und mahnt die Länge an", () => {
    expect(passwordStrength("Ab1!").score).toBe(0);
    expect(hintsOf("Ab1!")).toContain("tooShort");
    expect(passwordStrength("").score).toBe(0);
  });

  it("steigert die Bewertung mit Länge und Zeichenvielfalt", () => {
    // 8 Zeichen, nur Kleinbuchstaben → schwach
    expect(passwordStrength("wanderwg").score).toBe(0);
    // 8 Zeichen mit Ziffer und Gross-/Kleinschreibung → mittel
    expect(passwordStrength("Wander1x").score).toBe(2);
    // 11 Zeichen mit allen vier Zeichenklassen → gut
    expect(passwordStrength("Wanderweg1!").score).toBe(3);
    // 16 Zeichen mit allen vier Zeichenklassen → stark
    expect(passwordStrength("Wanderweg1!Nord2").score).toBe(4);
  });

  it("zieht bei häufigen Mustern ab", () => {
    expect(passwordStrength("Passwort123!").score).toBeLessThan(
      passwordStrength("Wanderweg123!").score
    );
    expect(hintsOf("Passwort123!")).toContain("avoidCommon");
    expect(hintsOf("Camp2026!xyz")).toContain("avoidCommon");
    expect(passwordStrength("12345678").score).toBe(0);
  });

  it("erkennt Wiederholungen", () => {
    expect(hintsOf("Aaaa1234!")).toContain("avoidRepeat");
    expect(hintsOf("ab7Xab7Xab7X")).toContain("avoidRepeat");
    expect(hintsOf("Wanderweg1!")).not.toContain("avoidRepeat");
  });

  it("nennt die fehlenden Zeichenklassen als Hinweis", () => {
    expect(hintsOf("wanderweg1!")).toContain("addCase");
    expect(hintsOf("Wanderweg!!x")).toContain("addNumber");
    expect(hintsOf("Wanderweg1x")).toContain("addSpecial");
    expect(hintsOf("Wander1!")).toContain("addLength");
  });

  it("liefert höchstens PASSWORD_HINT_LIMIT Hinweise", () => {
    const result = passwordStrength("abc");
    expect(result.hints.length).toBeLessThanOrEqual(PASSWORD_HINT_LIMIT);
    expect(result.hints.length).toBeGreaterThan(0);
  });

  it("gibt bei starken Passwörtern keine Hinweise mehr aus", () => {
    expect(hintsOf("Nordwand-Biwak-2026!")).toEqual([]);
  });

  it("ist rein: gleiche Eingabe, gleiches Ergebnis", () => {
    expect(passwordStrength("Wanderweg1!")).toEqual(
      passwordStrength("Wanderweg1!")
    );
  });
});
