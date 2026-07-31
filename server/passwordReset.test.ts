import { describe, expect, it } from "vitest";
import { createResetCode, verifyResetCode, consumeResetCode } from "./localAuth";

describe("Passwort-Reset-Codes", () => {
  it("erzeugt einen 6-stelligen Code und akzeptiert ihn", async () => {
    const code = await createResetCode("test-reset@example.com");
    expect(code).toMatch(/^\d{6}$/);
    const err = await verifyResetCode("test-reset@example.com", code);
    expect(err).toBeNull();
  });

  it("normalisiert die E-Mail (Gross-/Kleinschreibung)", async () => {
    const code = await createResetCode("Mixed@Example.COM");
    const err = await verifyResetCode("mixed@example.com", code);
    expect(err).toBeNull();
  });

  it("lehnt falsche Codes ab", async () => {
    await createResetCode("wrong@example.com");
    const err = await verifyResetCode("wrong@example.com", "000000");
    expect(err).toContain("falsch");
  });

  it("lehnt Anfragen ohne angeforderten Code ab", async () => {
    const err = await verifyResetCode("nie-angefordert@example.com", "123456");
    expect(err).toContain("Kein Code");
  });

  it("entwertet Codes nach Nutzung", async () => {
    const code = await createResetCode("consume@example.com");
    expect(await verifyResetCode("consume@example.com", code)).toBeNull();
    consumeResetCode("consume@example.com");
    const err = await verifyResetCode("consume@example.com", code);
    expect(err).toContain("Kein Code");
  });

  it("sperrt nach zu vielen Fehlversuchen", async () => {
    const code = await createResetCode("bruteforce@example.com");
    for (let i = 0; i < 5; i++) {
      await verifyResetCode("bruteforce@example.com", "999999");
    }
    const err = await verifyResetCode("bruteforce@example.com", code);
    expect(err).toContain("Zu viele Fehlversuche");
  });
});
