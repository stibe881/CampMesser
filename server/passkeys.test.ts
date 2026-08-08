import { afterEach, describe, expect, it } from "vitest";
import {
  CHALLENGE_TTL_MS,
  challengeFromClientData,
  consumeChallenge,
  originFrom,
  rememberChallenge,
  resetChallenges,
  rpIdFrom,
} from "./passkeys";

/**
 * Getestet werden nur die reinen Helfer (rpID/Origin-Ableitung, Challenge-
 * Zwischenspeicher, clientDataJSON-Parsing) – die WebAuthn-Krypto selbst
 * stammt aus @simplewebauthn/server und wird hier bewusst nicht geprüft.
 */

describe("rpIdFrom", () => {
  it("nimmt den Hostname aus APP_URL (ohne Port und Pfad)", () => {
    expect(rpIdFrom("https://meinreisekompass.ch", "ignoriert.example")).toBe(
      "meinreisekompass.ch"
    );
    expect(rpIdFrom("https://meinreisekompass.ch:8443/app", undefined)).toBe(
      "meinreisekompass.ch"
    );
  });

  it("fällt bei fehlender oder kaputter APP_URL auf den Request-Host zurück", () => {
    expect(rpIdFrom(undefined, "meinreisekompass.ch")).toBe(
      "meinreisekompass.ch"
    );
    expect(rpIdFrom("kein url", "meinreisekompass.ch:3000")).toBe(
      "meinreisekompass.ch"
    );
  });

  it("streift den Port vom Request-Host ab", () => {
    expect(rpIdFrom(undefined, "localhost:5173")).toBe("localhost");
  });

  it("liefert localhost, wenn gar nichts bekannt ist", () => {
    expect(rpIdFrom(undefined, undefined)).toBe("localhost");
    expect(rpIdFrom("", "")).toBe("localhost");
  });
});

describe("originFrom", () => {
  it("nimmt die Origin aus APP_URL (Pfad wird verworfen)", () => {
    expect(originFrom("https://meinreisekompass.ch/app", "http", "x")).toBe(
      "https://meinreisekompass.ch"
    );
  });

  it("baut die Origin sonst aus Protokoll und Request-Host", () => {
    expect(originFrom(undefined, "https", "meinreisekompass.ch")).toBe(
      "https://meinreisekompass.ch"
    );
    expect(originFrom(undefined, "http", "localhost:3000")).toBe(
      "http://localhost:3000"
    );
  });

  it("nimmt https als Protokoll-Default und localhost als letzten Fallback", () => {
    expect(originFrom(undefined, undefined, "meinreisekompass.ch")).toBe(
      "https://meinreisekompass.ch"
    );
    expect(originFrom(undefined, undefined, undefined)).toBe(
      "http://localhost:3000"
    );
  });
});

describe("Challenge-Zwischenspeicher", () => {
  afterEach(() => resetChallenges());

  it("löst eine gemerkte Challenge genau einmal ein", () => {
    rememberChallenge("abc", 7);
    expect(consumeChallenge("abc")).toEqual({ userId: 7 });
    expect(consumeChallenge("abc")).toBeNull();
  });

  it("kennt unbekannte Challenges nicht", () => {
    expect(consumeChallenge("nie-gemerkt")).toBeNull();
  });

  it("speichert Login-Challenges ohne Konto (userId null)", () => {
    rememberChallenge("login", null);
    expect(consumeChallenge("login")).toEqual({ userId: null });
  });

  it("lässt Challenges nach 5 Minuten ablaufen", () => {
    const t0 = 1_000_000;
    rememberChallenge("alt", 1, t0);
    expect(consumeChallenge("alt", t0 + CHALLENGE_TTL_MS)).toBeNull();
    rememberChallenge("frisch", 2, t0);
    expect(consumeChallenge("frisch", t0 + CHALLENGE_TTL_MS - 1)).toEqual({
      userId: 2,
    });
  });
});

describe("challengeFromClientData", () => {
  it("liest die Challenge aus einem Base64URL-codierten clientDataJSON", () => {
    const encoded = Buffer.from(
      JSON.stringify({ type: "webauthn.get", challenge: "meine-challenge" })
    ).toString("base64url");
    expect(challengeFromClientData(encoded)).toBe("meine-challenge");
  });

  it("gibt bei kaputten oder fehlenden Daten null zurück", () => {
    expect(challengeFromClientData(undefined)).toBeNull();
    expect(challengeFromClientData("")).toBeNull();
    expect(challengeFromClientData("%%%nicht-base64%%%")).toBeNull();
    expect(
      challengeFromClientData(
        Buffer.from(JSON.stringify({ type: "webauthn.get" })).toString(
          "base64url"
        )
      )
    ).toBeNull();
    expect(challengeFromClientData(42)).toBeNull();
  });
});
