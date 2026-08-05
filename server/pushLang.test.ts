import { describe, expect, it } from "vitest";
import {
  buildDryingAlert,
  buildEvePackAlert,
  buildFoodAlert,
  buildGearAlert,
  buildHeatAlert,
  buildMeteorAlert,
  buildTripAlert,
} from "./push";
import { weatherAlertText } from "@shared/pushTexts";

/**
 * Die Mitteilungen waren bis #313 immer deutsch – im Code stand sechsmal
 * «der Server kennt die Sprache nicht». Seit die Sprache am Abo hängt,
 * stimmt das nicht mehr. Diese Tests halten fest, dass jede Meldung der
 * Sprache folgt UND dass ohne Angabe weiterhin Deutsch herauskommt (alte
 * Abos, die sich noch nie neu angemeldet haben).
 */
const TODAY = "2026-08-05";

describe("Mitteilungen folgen der Sprache des Abos", () => {
  it("Kühlbox: Titel und Text je Sprache", () => {
    const items = [{ name: "Butter", expiryDate: TODAY }];
    expect(buildFoodAlert(items, TODAY)?.body).toContain("läuft bald ab");
    expect(buildFoodAlert(items, TODAY, "fr")?.body).toContain(
      "arrive à expiration"
    );
    expect(buildFoodAlert(items, TODAY, "it")?.title).toContain("Frigo");
    expect(buildFoodAlert(items, TODAY, "en")?.body).toContain(
      "about to expire"
    );
  });

  it("Kühlbox: die Aufzählung «und N weitere» wird mitübersetzt", () => {
    const items = ["A", "B", "C", "D", "E"].map(name => ({
      name,
      expiryDate: TODAY,
    }));
    expect(buildFoodAlert(items, TODAY)?.body).toContain("und 2 weitere");
    expect(buildFoodAlert(items, TODAY, "fr")?.body).toContain("et 2 de plus");
    expect(buildFoodAlert(items, TODAY, "en")?.body).toContain("and 2 more");
  });

  it("Ausrüstung: Pflege-Erinnerung je Sprache", () => {
    const tasks = [
      {
        title: "Zelt imprägnieren",
        intervalMonths: 6,
        lastDoneAt: "2025-01-01",
        createdAt: "2025-01-01",
      },
    ];
    expect(buildGearAlert(tasks, TODAY)?.title).toContain("Pflege fällig");
    expect(buildGearAlert(tasks, TODAY, "fr")?.title).toContain("entretien");
    expect(buildGearAlert(tasks, TODAY, "en")?.body).toContain(
      "maintenance task is due"
    );
  });

  it("Trip-Countdown: Tage werden in der Zielsprache gebeugt", () => {
    const trips = [
      { id: 1, name: "Seeblick", startDate: "2026-08-08", packListId: null },
    ];
    const de = buildTripAlert(trips, new Map(), TODAY);
    const fr = buildTripAlert(trips, new Map(), TODAY, "fr");
    const en = buildTripAlert(trips, new Map(), TODAY, "en");
    expect(de?.title).toContain("In 3 Tagen");
    expect(fr?.title).toContain("Dans 3 jours");
    expect(en?.title).toContain("In 3 days");
    // Der Dedup-Schlüssel bleibt sprachunabhängig – sonst käme dieselbe
    // Meldung nach einem Sprachwechsel ein zweites Mal.
    expect(fr?.key).toBe(de?.key);
  });

  it("Vorabend-Check je Sprache", () => {
    const trips = [
      { id: 2, name: "Seeblick", startDate: "2026-08-06", packListId: 9 },
    ];
    const progress = new Map([[9, { total: 10, checked: 4 }]]);
    expect(buildEvePackAlert(trips, progress, TODAY)?.title).toContain(
      "Morgen geht's los"
    );
    expect(buildEvePackAlert(trips, progress, TODAY, "it")?.title).toContain(
      "Si parte domani"
    );
  });

  it("Trocknungs-Erinnerung je Sprache, mit und ohne Regenmenge", () => {
    const trips = [{ id: 3, name: "Seeblick", endDate: "2026-08-04" }];
    const rain = new Map([[3, 12]]);
    expect(buildDryingAlert(trips, rain, TODAY)?.body).toContain("12 mm");
    expect(buildDryingAlert(trips, rain, TODAY, "fr")?.body).toContain(
      "12 mm de pluie"
    );
    expect(buildDryingAlert(trips, new Map(), TODAY, "en")?.title).toContain(
      "air the tent"
    );
  });

  it("Hitze-Erinnerung: Dezimaltrennzeichen passt zur Sprache", () => {
    const input = {
      date: TODAY,
      uvIndexMax: 9,
      maxTempC: 33,
      placeName: "Seeblick",
    };
    // Im Deutschen «2,8 l», im Englischen «2.8 l» – ein Komma wäre dort
    // als Tausendertrennzeichen zu lesen.
    expect(buildHeatAlert(input)?.body).toMatch(/\d,\d l/);
    expect(buildHeatAlert(input, "en")?.body).toMatch(/\d\.\d l/);
    expect(buildHeatAlert(input, "fr")?.title).toContain("soleil");
  });

  it("Sternschnuppen-Tipp je Sprache", () => {
    const input = {
      date: TODAY,
      cloudCoverNight: 10,
      moonIllumination: 0.1,
      activeShower: { name: "Perseiden", zhr: 100 },
      placeName: "Bern",
    };
    expect(buildMeteorAlert(input)?.title).toContain("Heute Nacht");
    expect(buildMeteorAlert(input, "it")?.title).toContain("Stanotte");
    expect(buildMeteorAlert(input, "en")?.body).toContain("Clear sky");
  });

  it("Unwetter: amtliche Warnung und Zusatz je Sprache", () => {
    const input = {
      official: true,
      title: "Sturm",
      spotName: "Seeblick",
      description: "MeteoSchweiz · Mittelland",
      more: 2,
    };
    expect(weatherAlertText(input, "de").title).toContain("Amtliche Warnung");
    expect(weatherAlertText(input, "fr").title).toContain(
      "Avertissement officiel"
    );
    expect(weatherAlertText(input, "en").body).toContain("+2 more warnings");
    expect(weatherAlertText({ ...input, official: false }, "de").title).toMatch(
      /^⚠️/
    );
  });

  it("ohne Sprachangabe bleibt es deutsch (alte Abos)", () => {
    // Die Migration setzt «de» als Standard; Abos, die sich seither nicht
    // neu angemeldet haben, dürfen sich nicht plötzlich ändern.
    expect(
      buildFoodAlert([{ name: "Butter", expiryDate: TODAY }], TODAY)?.title
    ).toBe("🧊 Kühlbox: MHD-Erinnerung");
  });
});
