import { describe, expect, it } from "vitest";
import { parseGpx } from "@shared/gpxImport";

/** GPX-Import (#426): echte Zeiten wenn vorhanden, sonst 4-km/h-Herleitung. */
const NOW = 1_700_000_000_000;

describe("parseGpx", () => {
  it("liest Trackpunkte samt Höhe und echten Zeiten", () => {
    const gpx = `<?xml version="1.0"?><gpx><trk><name>Aareweg</name><trkseg>
      <trkpt lat="46.95" lon="7.45"><ele>540</ele><time>2026-08-01T08:00:00Z</time></trkpt>
      <trkpt lat="46.96" lon="7.46"><ele>560</ele><time>2026-08-01T08:20:00Z</time></trkpt>
    </trkseg></trk></gpx>`;
    const result = parseGpx(gpx, NOW);
    expect(result?.name).toBe("Aareweg");
    expect(result?.timesEstimated).toBe(false);
    expect(result?.points).toHaveLength(2);
    expect(result?.points[0]).toMatchObject({
      lat: 46.95,
      lon: 7.45,
      ele: 540,
    });
    expect(result?.points[1].t - result!.points[0].t).toBe(20 * 60_000);
  });

  it("leitet fehlende Zeiten aus 4 km/h Gehtempo her", () => {
    // Geplante Routen (rtept) tragen keine Zeitstempel – eine erfundene
    // Sekunden-Taktung ergäbe absurde Tempi.
    const gpx = `<gpx><rte><rtept lat="46.95" lon="7.45"/><rtept lat="46.95" lon="7.4585"/></rte></gpx>`;
    const result = parseGpx(gpx, NOW);
    expect(result?.timesEstimated).toBe(true);
    // ~645 m bei 4 km/h ≈ 580 s
    const seconds = (result!.points[1].t - result!.points[0].t) / 1000;
    expect(seconds).toBeGreaterThan(400);
    expect(seconds).toBeLessThan(800);
  });

  it("Unlesbares ergibt null statt eines halben Tracks", () => {
    expect(parseGpx("kein xml", NOW)).toBeNull();
    expect(parseGpx("<gpx></gpx>", NOW)).toBeNull();
    expect(
      parseGpx(
        '<gpx><trk><trkseg><trkpt lat="46.9" lon="7.4"/></trkseg></trk></gpx>',
        NOW
      )
    ).toBeNull();
  });
});
