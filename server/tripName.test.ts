import { describe, expect, it } from "vitest";
import { tripDisplayName, tripPlaceName } from "@shared/tripName";
import { LANGUAGES } from "@shared/i18n";

describe("Wie eine Reise heisst", () => {
  it("der eigene Titel gewinnt", () => {
    expect(
      tripDisplayName(
        { title: "Sommerferien", spotName: "Seeblick", location: "Thun" },
        "de"
      )
    ).toBe("Sommerferien");
  });

  it("ohne Titel der Zeltplatz", () => {
    // Vorher hiess dieselbe Reise hier «Ohne Namen» und anderswo
    // «Seeblick» – das wirkt wie zwei verschiedene Reisen.
    expect(
      tripDisplayName({ spotName: "Seeblick", location: "Thun" }, "de")
    ).toBe("Seeblick");
  });

  it("ohne Zeltplatz der Freitext-Ort", () => {
    expect(tripDisplayName({ location: "Thun" }, "de")).toBe("Thun");
  });

  it("ohne alles ein neutrales Wort, keine leere Zeile", () => {
    expect(tripDisplayName({}, "de")).toBe("Aufenthalt");
  });

  it("Leerzeichen zählen nicht als Name", () => {
    // Ein Titel aus drei Leerzeichen ist kein Titel – ohne `trim` stünde
    // in der Liste eine leere Zeile, die man nicht anklicken kann.
    expect(tripDisplayName({ title: "   ", spotName: "Seeblick" }, "de")).toBe(
      "Seeblick"
    );
  });

  it("der frisch aufgelöste Favorit schlägt den mitgelieferten Namen", () => {
    // Wird ein Favorit umbenannt, steht in der Reise noch der alte Name.
    expect(
      tripDisplayName({ spotName: "Alter Name" }, "de", "Neuer Name")
    ).toBe("Neuer Name");
  });

  it("in jeder Sprache beschriftet", () => {
    for (const lang of LANGUAGES) {
      expect(tripDisplayName({}, lang).length).toBeGreaterThan(0);
      expect(tripPlaceName({}, lang).length).toBeGreaterThan(0);
    }
  });
});

describe("Wo eine Reise stattfindet", () => {
  it("der Titel zählt hier NICHT", () => {
    // «Sommerferien» als Ortsangabe an eine Umkreissuche zu geben,
    // liefert Unsinn.
    expect(
      tripPlaceName({ title: "Sommerferien", location: "Thun" }, "de")
    ).toBe("Thun");
  });

  it("Zeltplatz vor Freitext", () => {
    expect(
      tripPlaceName({ spotName: "Seeblick", location: "Thun" }, "de")
    ).toBe("Seeblick");
  });

  it("ohne alles ein eigener Text, nicht «Aufenthalt»", () => {
    expect(tripPlaceName({}, "de")).toBe("Unbekannter Ort");
  });
});
