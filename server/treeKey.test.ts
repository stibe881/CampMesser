import { describe, expect, it } from "vitest";
import { LANGUAGES, type L4 } from "@shared/i18n";
import {
  MAX_STEPS,
  START_NODE,
  TREE_QUESTIONS,
  TREE_SPECIES,
  treeKeyPaths,
  treeQuestion,
  treeSpecies,
  walkTreeKey,
} from "@shared/treeKey";
import { natureEntries } from "@/data/nature";

/**
 * Wächter für den Bestimmungsschlüssel.
 *
 * Ein Schlüssel ist ein Graph, und Graphen gehen beim Anbauen still
 * kaputt: Eine Frage verweist auf eine Frage, die es nicht mehr gibt,
 * eine Art hängt plötzlich an keinem Ast mehr, oder zwei Fragen zeigen
 * im Kreis aufeinander. Auf dem Handy im Wald merkt man das erst, wenn
 * nichts mehr weitergeht. Diese Tests merken es vorher.
 */

const complete = (text: L4, label: string) =>
  LANGUAGES.forEach(lang =>
    expect(text[lang]?.trim().length, `${label} (${lang})`).toBeGreaterThan(0)
  );

describe("Bestimmungsschlüssel für Bäume", () => {
  it("fängt bei einer Frage an, die es gibt", () => {
    expect(treeQuestion(START_NODE)).not.toBeNull();
  });

  it("vergibt jede Frage-Id und jede Arten-Id nur einmal", () => {
    const questionIds = new Set(TREE_QUESTIONS.map(q => q.id));
    expect(questionIds.size).toBe(TREE_QUESTIONS.length);
    const speciesIds = new Set(TREE_SPECIES.map(s => s.id));
    expect(speciesIds.size).toBe(TREE_SPECIES.length);
  });

  it("stellt genau zwei Antworten pro Frage – nicht drei", () => {
    // Ein Kind vor einem Baum vergleicht zuverlässig zwei Dinge, nicht drei
    TREE_QUESTIONS.forEach(question => {
      expect(question.answers.length, question.id).toBe(2);
    });
  });

  it("lässt jede Antwort entweder weiterfragen oder entscheiden", () => {
    TREE_QUESTIONS.forEach(question => {
      question.answers.forEach((answer, index) => {
        const where = `${question.id}[${index}]`;
        const hasNext = answer.next != null;
        const hasSpecies = answer.species != null;
        expect(hasNext !== hasSpecies, where).toBe(true);
        if (hasNext) expect(treeQuestion(answer.next!), where).not.toBeNull();
        if (hasSpecies) {
          expect(treeSpecies(answer.species!), where).not.toBeNull();
        }
      });
    });
  });

  it("erreicht jede Frage vom Start aus", () => {
    // Eine Frage, die an keinem Ast hängt, ist toter Text
    const seen = new Set<string>();
    const visit = (id: string, depth: number) => {
      if (depth > MAX_STEPS || seen.has(id)) return;
      seen.add(id);
      const question = treeQuestion(id);
      if (!question) return;
      question.answers.forEach(answer => {
        if (answer.next) visit(answer.next, depth + 1);
      });
    };
    visit(START_NODE, 0);
    TREE_QUESTIONS.forEach(question =>
      expect(seen.has(question.id), question.id).toBe(true)
    );
  });

  it("endet auf jedem Weg bei einer Art", () => {
    const paths = treeKeyPaths();
    // Zwei Antworten pro Frage, acht Fragen: jeder Ast muss ankommen
    expect(paths.length).toBeGreaterThan(0);
    paths.forEach(path => {
      expect(path.species).not.toBeNull();
      expect(path.answers.length).toBeLessThan(MAX_STEPS);
    });
  });

  it("führt zu jeder Art auf genau einem Weg", () => {
    const paths = treeKeyPaths();
    const counts = new Map<string, number>();
    paths.forEach(path =>
      counts.set(path.species.id, (counts.get(path.species.id) ?? 0) + 1)
    );
    TREE_SPECIES.forEach(species => {
      expect(counts.get(species.id), species.id).toBe(1);
    });
    expect(paths.length).toBe(TREE_SPECIES.length);
  });

  it("kommt mit höchstens vier Fragen zum Ziel", () => {
    // Wer vor dem Baum steht, hält keine zehn Fragen durch
    treeKeyPaths().forEach(path => {
      expect(path.answers.length, path.species.id).toBeLessThanOrEqual(4);
    });
  });

  it("führt den Weg entlang, den die Antworten vorgeben", () => {
    const start = walkTreeKey([]);
    expect(start.current?.id).toBe(START_NODE);
    expect(start.species).toBeNull();
    expect(start.trail).toHaveLength(0);

    // Nadeln → einzeln → piksen: Fichte
    const spruce = walkTreeKey([0, 1, 0]);
    expect(spruce.species?.id).toBe("fichte");
    expect(spruce.current).toBeNull();
    expect(spruce.trail).toHaveLength(3);
    expect(spruce.trail[0].question.id).toBe(START_NODE);
  });

  it("kommt bei jeder Art an, wenn man ihren Weg nachgeht", () => {
    treeKeyPaths().forEach(path => {
      const walk = walkTreeKey(path.answers);
      expect(walk.species?.id, path.species.id).toBe(path.species.id);
      expect(walk.current).toBeNull();
    });
  });

  it("bricht bei einer unsinnigen Antwort ab, statt umzufallen", () => {
    // Ein alter Link darf nichts kaputtmachen
    const walk = walkTreeKey([0, 99, 0]);
    expect(walk.species).toBeNull();
    expect(walk.trail).toHaveLength(1);
  });

  it("hört auf, sobald die Art feststeht", () => {
    const walk = walkTreeKey([0, 1, 0, 1, 1, 0]);
    expect(walk.species?.id).toBe("fichte");
    expect(walk.trail).toHaveLength(3);
  });

  it("kennt jede Art auch im Natur-Lexikon", () => {
    // Wer den Schlüssel durchgeht, soll dort Bild und Geschichte finden
    TREE_SPECIES.forEach(species => {
      const entry = natureEntries.find(e => e.id === species.id);
      expect(entry, species.id).toBeDefined();
      expect(entry?.category, species.id).toBe("baeume");
      expect(entry?.latinOrExtra, species.id).toBe(species.latin);
    });
  });

  it("lässt keinen Baum des Lexikons im Schlüssel aus", () => {
    natureEntries
      .filter(entry => entry.category === "baeume")
      .forEach(entry => {
        expect(treeSpecies(entry.id), entry.id).not.toBeNull();
      });
  });

  it("schreibt jede Frage und jede Antwort in allen vier Sprachen", () => {
    TREE_QUESTIONS.forEach(question => {
      complete(question.question, `${question.id}.question`);
      complete(question.look, `${question.id}.look`);
      question.answers.forEach((answer, index) => {
        complete(answer.label, `${question.id}[${index}].label`);
        complete(answer.hint, `${question.id}[${index}].hint`);
      });
    });
  });

  it("schreibt jede Art in allen vier Sprachen – samt Gegenprobe", () => {
    // Ein Schlüssel ohne Gegenprobe erzieht zum Raten
    TREE_SPECIES.forEach(species => {
      complete(species.name, `${species.id}.name`);
      complete(species.mark, `${species.id}.mark`);
      complete(species.check, `${species.id}.check`);
      complete(species.confusion, `${species.id}.confusion`);
      expect(species.latin.trim().length, species.id).toBeGreaterThan(0);
    });
  });
});
