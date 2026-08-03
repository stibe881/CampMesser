import { describe, expect, it } from "vitest";
import { bedtimeStories } from "../client/src/data/bedtimeStories";
import { LANGUAGES } from "@shared/i18n";
import {
  SEASON_KEYS,
  SEASON_RANGES,
  inSeason,
  seasonKeyForDate,
  seasonKeyForMonth,
} from "@shared/season";
import {
  MAX_TRACKED_STORIES,
  sanitizeReadStories,
  toggleReadStory,
} from "../client/src/lib/storyProgress";

describe("seasonKeyForMonth", () => {
  it("ordnet die meteorologischen Jahreszeiten zu", () => {
    expect(seasonKeyForMonth(3)).toBe("spring");
    expect(seasonKeyForMonth(5)).toBe("spring");
    expect(seasonKeyForMonth(6)).toBe("summer");
    expect(seasonKeyForMonth(8)).toBe("summer");
    expect(seasonKeyForMonth(9)).toBe("autumn");
    expect(seasonKeyForMonth(11)).toBe("autumn");
    expect(seasonKeyForMonth(12)).toBe("winter");
    expect(seasonKeyForMonth(1)).toBe("winter");
    expect(seasonKeyForMonth(2)).toBe("winter");
  });

  it("faltet Monate ausserhalb von 1–12 zurück", () => {
    expect(seasonKeyForMonth(13)).toBe("winter"); // = Januar
    expect(seasonKeyForMonth(0)).toBe("winter"); // = Dezember
    expect(seasonKeyForMonth(-2)).toBe("autumn"); // = Oktober
  });

  it("jeder Monat gehört zu genau einer Jahreszeit", () => {
    for (let month = 1; month <= 12; month++) {
      const matching = SEASON_KEYS.filter(key =>
        inSeason(SEASON_RANGES[key], month)
      );
      expect(matching.length).toBe(1);
    }
  });
});

describe("seasonKeyForDate", () => {
  it("nimmt den Monat des Datums", () => {
    expect(seasonKeyForDate(new Date(2026, 6, 15))).toBe("summer"); // Juli
    expect(seasonKeyForDate(new Date(2026, 9, 1))).toBe("autumn"); // Oktober
    expect(seasonKeyForDate(new Date(2026, 0, 31))).toBe("winter"); // Januar
    expect(seasonKeyForDate(new Date(2026, 3, 2))).toBe("spring"); // April
  });
});

describe("Geschichten-Datensatz", () => {
  it("hat mindestens acht Geschichten", () => {
    expect(bedtimeStories.length).toBeGreaterThanOrEqual(8);
  });

  it("verwendet jede Id nur einmal", () => {
    const ids = bedtimeStories.map(story => story.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("jede Geschichte hat Titel und Text in allen vier Sprachen", () => {
    bedtimeStories.forEach(story => {
      LANGUAGES.forEach(lang => {
        expect(story.title[lang].trim().length).toBeGreaterThan(0);
        expect(story.text[lang].trim().length).toBeGreaterThan(400);
      });
    });
  });

  it("die vier Sprachfassungen sind ähnlich lang – nichts wurde weggelassen", () => {
    bedtimeStories.forEach(story => {
      const lengths = LANGUAGES.map(lang => story.text[lang].length);
      const shortest = Math.min(...lengths);
      const longest = Math.max(...lengths);
      expect(longest / shortest).toBeLessThan(1.5);
    });
  });

  it("trägt eine plausible Vorlesedauer von 3 bis 5 Minuten", () => {
    bedtimeStories.forEach(story => {
      expect(story.minutes).toBeGreaterThanOrEqual(3);
      expect(story.minutes).toBeLessThanOrEqual(5);
    });
  });

  it("trägt eine plausible Altersempfehlung", () => {
    bedtimeStories.forEach(story => {
      expect(story.minAge).toBeGreaterThanOrEqual(3);
      expect(story.minAge).toBeLessThanOrEqual(9);
    });
  });

  it("nennt nur bekannte Jahreszeiten (oder gar keine)", () => {
    bedtimeStories.forEach(story => {
      if (story.season !== undefined) {
        expect(SEASON_KEYS).toContain(story.season);
      }
    });
  });

  it("jede Jahreszeit hat mindestens eine eigene Geschichte", () => {
    SEASON_KEYS.forEach(key => {
      expect(bedtimeStories.some(story => story.season === key)).toBe(true);
    });
  });

  it("mindestens eine Geschichte passt das ganze Jahr", () => {
    expect(bedtimeStories.some(story => story.season === undefined)).toBe(true);
  });

  it("mindestens eine Geschichte ist für die Kleinsten und eine für Grössere", () => {
    expect(bedtimeStories.some(story => story.minAge <= 3)).toBe(true);
    expect(bedtimeStories.some(story => story.minAge >= 6)).toBe(true);
  });

  it("die Texte sind in Absätze gegliedert (Leerzeile als Trenner)", () => {
    bedtimeStories.forEach(story => {
      LANGUAGES.forEach(lang => {
        const paragraphs = story.text[lang]
          .split("\n\n")
          .filter(p => p.trim() !== "");
        expect(paragraphs.length).toBeGreaterThanOrEqual(5);
      });
    });
  });

  it("kein Absatz ist leer oder beginnt mit einem Leerzeichen", () => {
    bedtimeStories.forEach(story => {
      LANGUAGES.forEach(lang => {
        story.text[lang].split("\n\n").forEach(paragraph => {
          expect(paragraph).toBe(paragraph.trim());
          expect(paragraph.length).toBeGreaterThan(0);
        });
      });
    });
  });

  it("schweizerdeutsche Schreibweise: kein ß im deutschen Text", () => {
    bedtimeStories.forEach(story => {
      expect(story.title.de).not.toContain("ß");
      expect(story.text.de).not.toContain("ß");
    });
  });

  it("die Filter-Voreinstellung liefert für jede Jahreszeit etwas zu lesen", () => {
    // Ganzjährige Geschichten zählen mit – so steht der Filter nie leer da
    SEASON_KEYS.forEach(key => {
      const visible = bedtimeStories.filter(
        story => story.season === undefined || story.season === key
      );
      expect(visible.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("storyProgress", () => {
  it("merkt eine Geschichte und nimmt sie wieder heraus", () => {
    expect(toggleReadStory([], "a")).toEqual(["a"]);
    expect(toggleReadStory(["a", "b"], "a")).toEqual(["b"]);
  });

  it("merkt dieselbe Geschichte nicht doppelt", () => {
    const once = toggleReadStory([], "a");
    expect(toggleReadStory(toggleReadStory(once, "a"), "a")).toEqual(["a"]);
  });

  it("liest kaputte Speicherstände als leere Liste", () => {
    expect(sanitizeReadStories(null)).toEqual([]);
    expect(sanitizeReadStories("igel-herbst")).toEqual([]);
    expect(sanitizeReadStories({ id: "igel-herbst" })).toEqual([]);
  });

  it("wirft Nicht-Texte und Doppel aus der Liste", () => {
    expect(sanitizeReadStories(["a", 3, "", "a", null, "b"])).toEqual([
      "a",
      "b",
    ]);
  });

  it("hält höchstens MAX_TRACKED_STORIES Einträge", () => {
    const many = Array.from({ length: MAX_TRACKED_STORIES + 20 }, (_, i) =>
      String(i)
    );
    expect(sanitizeReadStories(many).length).toBe(MAX_TRACKED_STORIES);
  });
});
