import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";
import PitchSketchView, { PitchSketchLegend } from "./PitchSketchView";
import type { PitchSketch } from "@shared/pitchSketch";

/**
 * Die gezeichnete Skizze (#382).
 *
 * WARUM HIER EIN TEST: Eine Zeichnung prüft man schlecht auf ihr
 * Aussehen – aber sehr gut darauf, ob sie ÜBERHAUPT BEDIENBAR ist. Genau
 * das ist bei einer SVG-Fläche die Stelle, an der man leicht danebengreift:
 * Rechtecke ohne Beschriftung sind für Screenreader unsichtbar, und ein
 * Bild ohne Tastaturweg ist für einen Teil der Leute schlicht nicht da.
 *
 * Auf Farben, Striche und Positionen prüft der Test bewusst NICHT. Das
 * ist Sache des Auges, und ein Test, der Koordinaten festschreibt, geht
 * beim ersten Feinschliff kaputt, ohne je einen Fehler gefunden zu haben.
 */
const SKETCH: PitchSketch = {
  widthM: 10,
  depthM: 8,
  items: [
    { id: "tent-1", kind: "tent", x: 0, y: 0, widthM: 3, depthM: 4 },
    { id: "car-1", kind: "car", x: 5, y: 0, widthM: 2, depthM: 4.5 },
  ],
};

describe("PitchSketchView", () => {
  it("beschriftet die Fläche und jedes Rechteck", async () => {
    renderWithI18n(<PitchSketchView sketch={SKETCH} onSelect={() => {}} />);
    // Im Bearbeiten-Modus ist die Fläche eine Gruppe und kein Bild: Ein
    // `img` erklärt seine Kinder für unwichtig, und darin verschwänden
    // genau die Knöpfe, über die man sie bedient.
    expect(await screen.findByRole("group")).toBeInTheDocument();
    // Jeder Gegenstand ist ein bedienbares Element mit Namen und Mass –
    // ohne das wäre die Skizze für Screenreader eine leere Fläche.
    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute(
      "aria-label",
      expect.stringContaining("3 m")
    );
  });

  it("meldet den angetippten Gegenstand", async () => {
    const onSelect = vi.fn();
    renderWithI18n(<PitchSketchView sketch={SKETCH} onSelect={onSelect} />);
    const buttons = await screen.findAllByRole("button");
    await userEvent.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith("car-1");
  });

  it("meldet beim Tippen auf ein Rechteck NICHT zusätzlich die Fläche", async () => {
    // Sonst spränge der eben gewählte Gegenstand unter den Finger.
    const onPlace = vi.fn();
    renderWithI18n(
      <PitchSketchView sketch={SKETCH} onSelect={() => {}} onPlace={onPlace} />
    );
    await userEvent.click((await screen.findAllByRole("button"))[0]);
    expect(onPlace).not.toHaveBeenCalled();
  });

  it("bleibt ohne onSelect eine reine Anzeige", async () => {
    renderWithI18n(<PitchSketchView sketch={SKETCH} />);
    expect(await screen.findByRole("img")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("hat keine A11y-Verstösse", async () => {
    const { container } = renderWithI18n(
      <PitchSketchView sketch={SKETCH} onSelect={() => {}} />
    );
    await screen.findByRole("group");
    await expectNoA11yViolations(container);
  });
});

describe("PitchSketchLegend", () => {
  it("nennt Nummer, Name und Mass jedes Gegenstands", async () => {
    renderWithI18n(<PitchSketchLegend sketch={SKETCH} />);
    // Die Nummer stellt die Verbindung zur Zeichnung her – im Rechteck
    // selbst hätte «Strom-Säule» keinen Platz.
    expect(await screen.findByText(/^1 ·/)).toBeInTheDocument();
    expect(screen.getByText(/^2 ·/)).toBeInTheDocument();
  });

  it("wird mit onSelect zur Auswahl ohne Maus", async () => {
    const onSelect = vi.fn();
    renderWithI18n(<PitchSketchLegend sketch={SKETCH} onSelect={onSelect} />);
    await userEvent.click(await screen.findByText(/^2 ·/));
    expect(onSelect).toHaveBeenCalledWith("car-1");
  });
});
