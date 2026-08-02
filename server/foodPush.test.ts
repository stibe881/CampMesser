import { describe, expect, it } from "vitest";
import { buildFoodAlert } from "./push";

const TODAY = "2026-08-02";

describe("buildFoodAlert", () => {
  it("gibt null zurück, wenn nichts heute oder morgen abläuft", () => {
    expect(buildFoodAlert([], TODAY)).toBeNull();
    expect(
      buildFoodAlert(
        [
          { name: "Ohne Datum", expiryDate: null },
          { name: "Erst übermorgen", expiryDate: "2026-08-04" },
          { name: "Schon abgelaufen", expiryDate: "2026-08-01" },
          { name: "Kaputtes Datum", expiryDate: "quark" },
        ],
        TODAY
      )
    ).toBeNull();
  });

  it("meldet einen heute ablaufenden Eintrag im Singular", () => {
    const alert = buildFoodAlert(
      [{ name: "Joghurt", expiryDate: "2026-08-02" }],
      TODAY
    );
    expect(alert).not.toBeNull();
    expect(alert!.body).toBe("1 Lebensmittel läuft bald ab: Joghurt");
    expect(alert!.key).toBe("food:2026-08-02");
  });

  it("meldet heute und morgen ablaufende Einträge, heute zuerst", () => {
    const alert = buildFoodAlert(
      [
        { name: "Wurst", expiryDate: "2026-08-03" },
        { name: "Milch", expiryDate: "2026-08-02" },
        { name: "Haltbar", expiryDate: "2026-09-01" },
      ],
      TODAY
    );
    expect(alert!.body).toBe("2 Lebensmittel laufen bald ab: Milch, Wurst");
  });

  it("kürzt auf drei Namen und zählt den Rest", () => {
    const alert = buildFoodAlert(
      [
        { name: "Aprikosen", expiryDate: "2026-08-02" },
        { name: "Brie", expiryDate: "2026-08-02" },
        { name: "Cervelat", expiryDate: "2026-08-03" },
        { name: "Dörrfleisch", expiryDate: "2026-08-03" },
        { name: "Eier", expiryDate: "2026-08-03" },
      ],
      TODAY
    );
    expect(alert!.body).toBe(
      "5 Lebensmittel laufen bald ab: Aprikosen, Brie, Cervelat und 2 weitere"
    );
  });

  it("liefert den Tages-Schlüssel für die Deduplizierung", () => {
    const alert = buildFoodAlert(
      [{ name: "Milch", expiryDate: "2026-08-03" }],
      TODAY
    );
    expect(alert!.key).toBe(`food:${TODAY}`);
  });
});
