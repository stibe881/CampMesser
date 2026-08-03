import { describe, expect, it } from "vitest";
import {
  assessTickRisk,
  FSME_DATA_AS_OF,
  fsmeRegionByCode,
  fsmeRegions,
  fsmeStatusAt,
  TICK_ALTITUDE_LIMIT_M,
  tickActivity,
} from "@shared/tickRisk";
import { LANGUAGES, pick } from "@shared/i18n";

describe("fsmeRegions", () => {
  it("führt alle 26 Kantone mit eindeutigem Kürzel", () => {
    expect(fsmeRegions).toHaveLength(26);
    const codes = new Set(fsmeRegions.map(r => r.code));
    expect(codes.size).toBe(26);
  });

  it("stuft nur Genf und Tessin als Nicht-Risikogebiet ein (BAG-Stand)", () => {
    const safe = fsmeRegions.filter(r => !r.riskArea).map(r => r.code);
    expect(safe.sort()).toEqual(["GE", "TI"]);
    expect(FSME_DATA_AS_OF).toBe("2019-02-01");
  });

  it("hat jeden Kantonsnamen in allen vier Sprachen", () => {
    fsmeRegions.forEach(region => {
      LANGUAGES.forEach(lang => {
        expect(pick(region.name, lang).trim().length).toBeGreaterThan(0);
      });
    });
  });

  it("findet Kantone über ihr Kürzel, gross wie klein", () => {
    expect(fsmeRegionByCode("ti")?.riskArea).toBe(false);
    expect(fsmeRegionByCode(" BE ")?.riskArea).toBe(true);
    expect(fsmeRegionByCode("XX")).toBeNull();
  });
});

describe("fsmeStatusAt", () => {
  it("erkennt das Mittelland als Risikogebiet", () => {
    // Bern, Zürich, Luzern, St. Gallen
    expect(fsmeStatusAt(46.948, 7.447).status).toBe("risk");
    expect(fsmeStatusAt(47.377, 8.54).status).toBe("risk");
    expect(fsmeStatusAt(47.05, 8.31).status).toBe("risk");
    expect(fsmeStatusAt(47.424, 9.377).status).toBe("risk");
  });

  it("nimmt Genf und das Tessin aus", () => {
    const geneva = fsmeStatusAt(46.204, 6.143);
    expect(geneva.status).toBe("no-risk");
    expect(geneva.region?.code).toBe("GE");

    const lugano = fsmeStatusAt(46.005, 8.951);
    expect(lugano.status).toBe("no-risk");
    expect(lugano.region?.code).toBe("TI");

    const bellinzona = fsmeStatusAt(46.195, 9.024);
    expect(bellinzona.region?.code).toBe("TI");
  });

  it("nennt für Risikogebiete keinen Kanton – nur die Ausnahmen zählen", () => {
    expect(fsmeStatusAt(46.948, 7.447).region).toBeNull();
  });

  it("sagt ausserhalb der Schweiz nichts", () => {
    // München, Mailand, Lyon, Wien
    expect(fsmeStatusAt(48.137, 11.575).status).toBe("unknown");
    expect(fsmeStatusAt(45.464, 9.19).status).toBe("unknown");
    expect(fsmeStatusAt(45.764, 4.836).status).toBe("unknown");
    expect(fsmeStatusAt(48.209, 16.373).status).toBe("unknown");
  });

  it("verträgt kaputte Koordinaten", () => {
    expect(fsmeStatusAt(Number.NaN, 8).status).toBe("unknown");
    expect(fsmeStatusAt(47, Number.POSITIVE_INFINITY).status).toBe("unknown");
  });
});

describe("tickActivity", () => {
  it("folgt der Saison mit Frühlingsgipfel und Winterruhe", () => {
    expect(tickActivity(1)).toBe("none");
    expect(tickActivity(3)).toBe("low");
    expect(tickActivity(5)).toBe("high");
    expect(tickActivity(8)).toBe("moderate");
    expect(tickActivity(11)).toBe("low");
    expect(tickActivity(12)).toBe("none");
  });

  it("schaltet oberhalb der Zeckengrenze auf keine Aktivität", () => {
    expect(tickActivity(5, TICK_ALTITUDE_LIMIT_M + 1)).toBe("none");
    expect(tickActivity(5, 2200)).toBe("none");
    // Genau auf der Grenze zählt es noch nicht als darüber
    expect(tickActivity(5, TICK_ALTITUDE_LIMIT_M)).toBe("moderate");
  });

  it("nimmt zwischen 1000 und 1500 m eine Stufe weg", () => {
    expect(tickActivity(5, 1200)).toBe("moderate");
    expect(tickActivity(8, 1200)).toBe("low");
    expect(tickActivity(3, 1200)).toBe("none");
    // Unter 1000 m bleibt die Monatsstufe stehen
    expect(tickActivity(5, 1000)).toBe("high");
    expect(tickActivity(5, 400)).toBe("high");
  });

  it("lässt bei unbekannter Höhe die Monatsstufe stehen", () => {
    expect(tickActivity(5, null)).toBe("high");
    expect(tickActivity(5, Number.NaN)).toBe("high");
  });

  it("verträgt unmögliche Monate", () => {
    expect(tickActivity(0)).toBe("none");
    expect(tickActivity(13)).toBe("none");
    expect(tickActivity(5.5)).toBe("none");
  });
});

describe("assessTickRisk", () => {
  it("verbindet Einstufung und Aktivität für einen Platz im Mittelland", () => {
    const risk = assessTickRisk({
      month: 5,
      elevationM: 500,
      latitude: 47.05,
      longitude: 8.31,
    });
    expect(risk.status).toBe("risk");
    expect(risk.activity).toBe("high");
    expect(risk.aboveTickLine).toBe(false);
    expect(risk.relevant).toBe(true);
  });

  it("hält Einstufung und Aktivität auseinander", () => {
    // Januar im Risikogebiet: Gebiet bleibt Risikogebiet, Zecken ruhen
    const winter = assessTickRisk({
      month: 1,
      elevationM: 500,
      latitude: 47.05,
      longitude: 8.31,
    });
    expect(winter.status).toBe("risk");
    expect(winter.activity).toBe("none");
    expect(winter.relevant).toBe(false);
  });

  it("meldet über der Zeckengrenze Ruhe, auch im Mai", () => {
    const alpine = assessTickRisk({
      month: 5,
      elevationM: 2100,
      latitude: 46.5,
      longitude: 8.0,
    });
    expect(alpine.aboveTickLine).toBe(true);
    expect(alpine.activity).toBe("none");
    expect(alpine.relevant).toBe(false);
  });

  it("kommt ohne Koordinaten und ohne Höhe aus", () => {
    const risk = assessTickRisk({ month: 6 });
    expect(risk.status).toBe("unknown");
    expect(risk.region).toBeNull();
    expect(risk.activity).toBe("high");
    expect(risk.aboveTickLine).toBe(false);
  });

  it("nennt im Tessin den Kanton und keine Risikogebiets-Einstufung", () => {
    const ticino = assessTickRisk({
      month: 6,
      elevationM: 300,
      latitude: 46.005,
      longitude: 8.951,
    });
    expect(ticino.status).toBe("no-risk");
    expect(ticino.region?.code).toBe("TI");
    // Zecken gibt es dort trotzdem – nur eben ohne FSME-Einstufung
    expect(ticino.activity).toBe("high");
  });
});
