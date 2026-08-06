import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import TentWindHelper from "./TentWindHelper";
import { renderWithI18n } from "@/test/render";

/**
 * Der Windrichtungs-Assistent am Fuss des Zelt-Finders (#358).
 *
 * WORAUF ES ANKOMMT: Der Zelt-Finder verfolgt die Position fortlaufend
 * mit `watchPosition` und hoher Genauigkeit. Jeder Fix wackelt um ein
 * paar Meter, und es kommt sekündlich einer. Hing dieser Abschnitt an den
 * rohen Koordinaten, lud er jedes Mal neu – und die fertige Kompassrose
 * wurde dabei wieder zum Ladeskelett. Weil der Abschnitt zuunterst steht,
 * schrumpfte die Seite um mehrere hundert Pixel, und wer ganz unten war,
 * wurde vom Browser nach oben geschoben.
 *
 * Beides wird hier geprüft: dass ein Wackeln von wenigen Metern KEINEN
 * neuen Abruf auslöst, und dass ein echter Ortswechsel die schon
 * gezeichnete Rose stehen lässt, statt sie durch das Skelett zu ersetzen.
 */
vi.mock("@/hooks/useDeviceHeading", () => ({
  useDeviceHeading: () => ({
    heading: null,
    active: false,
    permission: "unknown",
    start: vi.fn(),
  }),
}));

const WIND = {
  current: {
    wind_direction_10m: 308,
    wind_speed_10m: 6,
    wind_gusts_10m: 10,
  },
};

let fetchMock: ReturnType<typeof vi.fn>;

/**
 * Nur die Abrufe beim Wetterdienst zählen. Im Test hängt auch die
 * tRPC-Hülle am selben `fetch` – die gehört nicht in diese Rechnung.
 */
const windCalls = () =>
  fetchMock.mock.calls.filter(call => String(call[0]).includes("open-meteo"))
    .length;

beforeEach(() => {
  fetchMock = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(WIND) })
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Windrichtungs-Assistent", () => {
  it("ohne Standort erscheint gar nichts", () => {
    const { container } = renderWithI18n(
      <TentWindHelper latitude={null} longitude={null} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(windCalls()).toBe(0);
  });

  it("GPS-Wackeln von wenigen Metern löst keinen neuen Abruf aus", async () => {
    const { rerender } = renderWithI18n(
      <TentWindHelper latitude={46.005} longitude={8.955} />
    );
    // Auf die erste Antwort warten, sonst zählt man ins Leere
    await screen.findAllByText(/308°/);
    expect(windCalls()).toBe(1);

    // Rund drei Meter weiter – derselbe Wind, dieselbe Antwort
    rerender(<TentWindHelper latitude={46.005027} longitude={8.955031} />);
    rerender(<TentWindHelper latitude={46.004981} longitude={8.954972} />);
    expect(windCalls()).toBe(1);
  });

  it("auch ein Spaziergang über den Platz lädt nicht neu", async () => {
    // Ein Zeltplatz ist ein paar hundert Meter gross. Wer von der
    // Rezeption zur Wiese geht, soll den Abschnitt nicht neu laden sehen.
    const { rerender } = renderWithI18n(
      <TentWindHelper latitude={46.005} longitude={8.955} />
    );
    await screen.findAllByText(/308°/);
    rerender(<TentWindHelper latitude={46.0075} longitude={8.9565} />);
    expect(windCalls()).toBe(1);
  });

  it("ein echter Ortswechsel lädt nach, ohne die Rose wegzunehmen", async () => {
    const { rerender } = renderWithI18n(
      <TentWindHelper latitude={46.005} longitude={8.955} />
    );
    await screen.findAllByText(/308°/);

    // Gut drei Kilometer weiter: jetzt lohnt sich ein neuer Abruf
    rerender(<TentWindHelper latitude={46.035} longitude={8.955} />);
    expect(windCalls()).toBe(2);
    // Entscheidend: Die Anzeige bleibt stehen. Verschwände sie, würde die
    // Seite unter dem Finger zusammenschrumpfen.
    expect(screen.getAllByText(/308°/).length).toBeGreaterThan(0);
  });
});
