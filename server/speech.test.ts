import { describe, expect, it } from "vitest";
import { pickVoiceIndex, type VoiceLike } from "../client/src/lib/speech";

const voices: VoiceLike[] = [
  { lang: "en-US" },
  { lang: "de-DE" },
  { lang: "de-CH" },
  { lang: "fr-FR", default: true },
  { lang: "it-IT" },
];

describe("pickVoiceIndex", () => {
  it("liefert -1 ohne verfügbare Stimmen", () => {
    expect(pickVoiceIndex([], "de")).toBe(-1);
  });

  it("bevorzugt den exakten Locale-Treffer (de → de-CH)", () => {
    expect(pickVoiceIndex(voices, "de")).toBe(2);
  });

  it("fällt auf die gleiche Primärsprache zurück (fr → fr-FR)", () => {
    expect(pickVoiceIndex(voices, "fr")).toBe(3);
    expect(pickVoiceIndex(voices, "it")).toBe(4);
  });

  it("bevorzugt bei mehreren Primärsprach-Treffern die Standard-Stimme", () => {
    const many: VoiceLike[] = [
      { lang: "it-CH" },
      { lang: "en-AU" },
      { lang: "en-US", default: true },
    ];
    expect(pickVoiceIndex(many, "en")).toBe(2);
  });

  it("ist tolerant gegenüber Gross-/Kleinschreibung und Unterstrichen", () => {
    expect(pickVoiceIndex([{ lang: "DE_CH" }], "de")).toBe(0);
  });

  it("nimmt ohne Sprach-Treffer die erste verfügbare Stimme", () => {
    expect(pickVoiceIndex([{ lang: "sv-SE" }, { lang: "nb-NO" }], "it")).toBe(
      0
    );
  });
});
