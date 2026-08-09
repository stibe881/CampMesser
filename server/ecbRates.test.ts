import { describe, expect, it } from "vitest";
import { parseEcbDaily } from "./ecbRates";

/** Gekürztes Original-Format der EZB (einfache Anführungszeichen). */
const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
  <gesmes:subject>Reference rates</gesmes:subject>
  <Cube>
    <Cube time='2026-08-07'>
      <Cube currency='USD' rate='1.0876'/>
      <Cube currency='CHF' rate='0.9412'/>
      <Cube currency='GBP' rate='0.8571'/>
    </Cube>
  </Cube>
</gesmes:Envelope>`;

describe("EZB-Referenzkurs (#519)", () => {
  it("liest Kurstag und CHF-Kurs aus dem Tages-XML", () => {
    expect(parseEcbDaily(SAMPLE)).toEqual({
      date: "2026-08-07",
      chfPerEurX10000: 9412,
    });
  });

  it("kommt auch mit doppelten Anführungszeichen zurecht", () => {
    const xml = `<Cube time="2026-08-07"><Cube currency="CHF" rate="0.94"/></Cube>`;
    expect(parseEcbDaily(xml)).toEqual({
      date: "2026-08-07",
      chfPerEurX10000: 9400,
    });
  });

  it("liefert null bei fehlendem CHF oder fehlendem Datum", () => {
    expect(
      parseEcbDaily(
        `<Cube time='2026-08-07'><Cube currency='USD' rate='1.08'/></Cube>`
      )
    ).toBeNull();
    expect(parseEcbDaily(`<Cube currency='CHF' rate='0.94'/>`)).toBeNull();
    expect(parseEcbDaily("")).toBeNull();
  });

  it("verwirft Unplausibles über dieselben Grenzen wie der manuelle Kurs", () => {
    const at = (rate: string) =>
      parseEcbDaily(
        `<Cube time='2026-08-07'><Cube currency='CHF' rate='${rate}'/></Cube>`
      );
    // 0.5–2 CHF pro Euro sind erlaubt (EUR_RATE_MIN/MAX)
    expect(at("0.5")).not.toBeNull();
    expect(at("2.0")).not.toBeNull();
    expect(at("0.4")).toBeNull();
    expect(at("12.5")).toBeNull();
    expect(at("0")).toBeNull();
  });
});
