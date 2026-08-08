import { describe, expect, it } from "vitest";
import {
  NO_FIRE_GUSTS_KMH,
  SPARK_GUSTS_KMH,
  campfireVerdict,
} from "@shared/campfire";
import { BAN_LIKELY_FROM_LEVEL } from "@shared/fireBans";

describe("campfireVerdict", () => {
  it("gibt bei tiefer Stufe und ruhigem Wind grün", () => {
    const v = campfireVerdict({ dangerLevel: 2, gustsMaxKmh: 15 });
    expect(v.state).toBe("ok");
    expect(v.dangerKnown).toBe(true);
    expect(v.windKnown).toBe(true);
  });

  it("lässt das wahrscheinliche Verbot alles schlagen", () => {
    // Windstill und trotzdem rot: Die Verfügung fragt nicht nach dem Wetter.
    const v = campfireVerdict({
      dangerLevel: BAN_LIKELY_FROM_LEVEL,
      gustsMaxKmh: 5,
    });
    expect(v.state).toBe("no");
    expect(v.banLikely).toBe(true);
  });

  it("macht aus starken Böen ein Nein, auch bei Stufe 1", () => {
    const v = campfireVerdict({
      dangerLevel: 1,
      gustsMaxKmh: NO_FIRE_GUSTS_KMH,
    });
    expect(v.state).toBe("no");
    expect(v.strongWind).toBe(true);
    expect(v.banLikely).toBe(false);
  });

  it("warnt bei Stufe 3 und bei Funkenflug-Wind", () => {
    expect(campfireVerdict({ dangerLevel: 3, gustsMaxKmh: 10 }).state).toBe(
      "caution"
    );
    const wind = campfireVerdict({
      dangerLevel: 1,
      gustsMaxKmh: SPARK_GUSTS_KMH,
    });
    expect(wind.state).toBe("caution");
    expect(wind.sparkWind).toBe(true);
  });

  it("addiert zwei Vorsichts-Gründe NICHT zu einem Verbot", () => {
    // Die Ampel soll begründbar bleiben, nicht dramatisch.
    const v = campfireVerdict({
      dangerLevel: 3,
      gustsMaxKmh: SPARK_GUSTS_KMH + 5,
    });
    expect(v.state).toBe("caution");
  });

  it("gibt ohne Gefahrenstufe höchstens gelb – nie grün aus halben Daten", () => {
    // Ausserhalb der Schweiz fehlt die amtliche Stufe. Eine Entwarnung
    // aus der halben Rechnung wäre eine Zusage, die niemand geben kann.
    const v = campfireVerdict({ dangerLevel: null, gustsMaxKmh: 10 });
    expect(v.state).toBe("caution");
    expect(v.dangerKnown).toBe(false);
  });

  it("bleibt bei starkem Wind auch ohne Gefahrenstufe ein Nein", () => {
    expect(campfireVerdict({ dangerLevel: null, gustsMaxKmh: 60 }).state).toBe(
      "no"
    );
  });

  it("sagt ohne jede Quelle «unbekannt» statt irgendetwas", () => {
    expect(
      campfireVerdict({ dangerLevel: null, gustsMaxKmh: null }).state
    ).toBe("unknown");
  });
});
