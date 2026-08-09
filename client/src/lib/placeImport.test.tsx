/**
 * GPX/KML-Import für Merkorte (#632): Wegpunkte aus beiden Formaten,
 * kaputte Dateien still zu `[]`.
 */
import { describe, expect, it } from "vitest";
import { MAX_IMPORT_PLACES, parsePlacesFile } from "@/lib/placeImport";

const GPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <wpt lat="46.6203" lon="8.0399"><name>Grindelwald</name></wpt>
  <wpt lat="46.0207" lon="7.7491"><name>Zermatt</name></wpt>
  <wpt lat="999" lon="8"><name>Kaputt</name></wpt>
  <wpt lat="45.9763" lon="7.6586"></wpt>
</gpx>`;

const KML = `<?xml version="1.0"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <Placemark><name>Lago di Como</name>
    <Point><coordinates>9.2572,45.9860,0</coordinates></Point>
  </Placemark>
  <Placemark><name>Nur eine Linie</name>
    <LineString><coordinates>9,45 10,46</coordinates></LineString>
  </Placemark>
</Document></kml>`;

describe("parsePlacesFile (#632)", () => {
  it("liest GPX-Wegpunkte mit Name und überspringt kaputte", () => {
    const places = parsePlacesFile(GPX);
    expect(places).toHaveLength(3);
    expect(places[0]).toEqual({
      name: "Grindelwald",
      latitude: 46.6203,
      longitude: 8.0399,
    });
    // Ohne Namen gibt es einen Zähler-Namen statt eines leeren Strings
    expect(places[2].name).toBe("Wegpunkt 3");
  });

  it("liest KML-Placemarks mit Punkt und ignoriert Linien", () => {
    const places = parsePlacesFile(KML);
    expect(places).toHaveLength(1);
    expect(places[0]).toEqual({
      name: "Lago di Como",
      latitude: 45.986,
      longitude: 9.2572,
    });
  });

  it("gibt bei unlesbarem Inhalt eine leere Liste zurück", () => {
    expect(parsePlacesFile("kein XML")).toEqual([]);
    expect(parsePlacesFile("")).toEqual([]);
  });

  it("kappt bei der Obergrenze", () => {
    const many = `<gpx>${Array.from(
      { length: MAX_IMPORT_PLACES + 10 },
      (_, i) => `<wpt lat="46" lon="${7 + i * 0.01}"><name>P${i}</name></wpt>`
    ).join("")}</gpx>`;
    expect(parsePlacesFile(many)).toHaveLength(MAX_IMPORT_PLACES);
  });
});
