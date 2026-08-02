import { describe, expect, it } from "vitest";
// Routen-Link liegt im Client-Code, ist aber reine Logik ohne DOM.
import { directionsUrl } from "../client/src/lib/directions";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

describe("directionsUrl", () => {
  it("öffnet auf dem iPhone Apple Karten mit daddr=lat,lon", () => {
    expect(directionsUrl(46.8182, 8.2275, IPHONE_UA)).toBe(
      "https://maps.apple.com/?daddr=46.8182,8.2275"
    );
  });

  it("öffnet auf dem iPad ebenfalls Apple Karten", () => {
    expect(directionsUrl(47.05, 8.31, IPAD_UA)).toBe(
      "https://maps.apple.com/?daddr=47.05,8.31"
    );
  });

  it("öffnet auf Android Google Maps im Directions-Format", () => {
    expect(directionsUrl(46.8182, 8.2275, ANDROID_UA)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=46.8182,8.2275"
    );
  });

  it("öffnet am Desktop Google Maps", () => {
    expect(directionsUrl(-33.9, 151.2, DESKTOP_UA)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=-33.9,151.2"
    );
  });

  it("fällt ohne User-Agent auf Google Maps zurück", () => {
    expect(directionsUrl(46, 8, "")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=46,8"
    );
  });
});
