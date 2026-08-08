/**
 * Geräte-Beschriftung (#423): Die Muster-Reihenfolge ist die eigentliche
 * Logik – Edge und Chrome geben sich beide als Safari aus.
 */
import { describe, expect, it } from "vitest";
import { deviceLabel, deviceLabelText } from "../shared/deviceLabel";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const WINDOWS_EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const MAC_FIREFOX =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:127.0) Gecko/20100101 Firefox/127.0";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1";

describe("deviceLabel", () => {
  it("erkennt iPhone mit Safari", () => {
    expect(deviceLabel(IPHONE_SAFARI)).toEqual({
      device: "iPhone",
      browser: "Safari",
    });
  });

  it("erkennt Edge, obwohl er sich als Chrome und Safari ausgibt", () => {
    expect(deviceLabel(WINDOWS_EDGE)).toEqual({
      device: "Windows",
      browser: "Edge",
    });
  });

  it("erkennt Android mit Chrome (Android schlägt Linux)", () => {
    expect(deviceLabel(ANDROID_CHROME)).toEqual({
      device: "Android",
      browser: "Chrome",
    });
  });

  it("erkennt Mac mit Firefox", () => {
    expect(deviceLabel(MAC_FIREFOX)).toEqual({
      device: "Mac",
      browser: "Firefox",
    });
  });

  it("erkennt Chrome auf dem iPhone (CriOS)", () => {
    expect(deviceLabel(IPHONE_CHROME)).toEqual({
      device: "iPhone",
      browser: "Chrome",
    });
  });

  it("bleibt bei Unbekanntem leer", () => {
    expect(deviceLabel(null)).toEqual({ device: null, browser: null });
    expect(deviceLabel("curl/8.5.0")).toEqual({ device: null, browser: null });
  });
});

describe("deviceLabelText", () => {
  it("verbindet Gerät und Browser mit Punkt", () => {
    expect(deviceLabelText(IPHONE_SAFARI)).toBe("iPhone · Safari");
  });

  it("gibt null, wenn nichts erkannt wurde", () => {
    expect(deviceLabelText("curl/8.5.0")).toBeNull();
  });
});
