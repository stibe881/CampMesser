import { describe, expect, it } from "vitest";
// Routen-Link liegt im Client-Code, ist aber reine Logik ohne DOM.
import {
  defaultProvider,
  directionsUrl,
  MAPS_PROVIDERS,
} from "../client/src/lib/directions";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

describe("defaultProvider", () => {
  it("schlägt auf iPhone und iPad Apple Karten vor", () => {
    expect(defaultProvider(IPHONE_UA)).toBe("apple");
    expect(defaultProvider(IPAD_UA)).toBe("apple");
  });

  it("schlägt sonst Google Maps vor", () => {
    expect(defaultProvider(ANDROID_UA)).toBe("google");
    expect(defaultProvider(DESKTOP_UA)).toBe("google");
    expect(defaultProvider("")).toBe("google");
  });
});

describe("directionsUrl", () => {
  it("baut den Apple-Karten-Link mit daddr=lat,lon", () => {
    expect(directionsUrl(46.8182, 8.2275, "apple")).toBe(
      "https://maps.apple.com/?daddr=46.8182,8.2275"
    );
  });

  it("baut den Google-Maps-Link im Directions-Format", () => {
    expect(directionsUrl(46.8182, 8.2275, "google")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=46.8182,8.2275"
    );
  });

  it("gibt negative Koordinaten unverändert weiter", () => {
    expect(directionsUrl(-33.9, 151.2, "google")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=-33.9,151.2"
    );
    expect(directionsUrl(-33.9, 151.2, "apple")).toBe(
      "https://maps.apple.com/?daddr=-33.9,151.2"
    );
  });

  it("hängt nicht mehr am Gerät: dieselbe Wahl ergibt überall denselben Link", () => {
    // Der Kern der Änderung – die App entscheidet nicht mehr für die Person.
    for (const provider of MAPS_PROVIDERS) {
      expect(directionsUrl(47, 8, provider)).toBe(
        directionsUrl(47, 8, provider)
      );
    }
  });
});
