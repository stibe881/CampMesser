import { describe, expect, it } from "vitest";
import {
  bestOption,
  isDecided,
  isDuplicateOption,
  isValidOptionRange,
  isVote,
  myVote,
  pendingVoters,
  pollProgress,
  rankOptions,
  tallyOption,
  type DateVoteLike,
} from "@shared/datePoll";

const optionA = { id: 1, startDate: "2026-08-21", endDate: "2026-08-23" };
const optionB = { id: 2, startDate: "2026-08-28", endDate: "2026-08-30" };
const participants = [10, 11, 12];

const vote = (optionId: number, userId: number, value: string): DateVoteLike =>
  ({ optionId, userId, vote: value }) as DateVoteLike;

describe("isVote", () => {
  it("kennt die drei Antworten", () => {
    expect(isVote("yes")).toBe(true);
    expect(isVote("maybe")).toBe(true);
    expect(isVote("no")).toBe(true);
  });

  it("weist alles andere ab", () => {
    expect(isVote("vielleicht")).toBe(false);
    expect(isVote(1)).toBe(false);
    expect(isVote(null)).toBe(false);
  });
});

describe("isValidOptionRange", () => {
  it("nimmt eine Spanne mit mindestens einer Nacht", () => {
    expect(isValidOptionRange("2026-08-21", "2026-08-22")).toBe(true);
  });

  it("lehnt Eintagesfliegen und Rückwärts-Spannen ab", () => {
    expect(isValidOptionRange("2026-08-21", "2026-08-21")).toBe(false);
    expect(isValidOptionRange("2026-08-23", "2026-08-21")).toBe(false);
  });

  it("lehnt Unsinn ab", () => {
    expect(isValidOptionRange("kein Datum", "2026-08-21")).toBe(false);
  });
});

describe("isDuplicateOption", () => {
  it("erkennt dieselbe Spanne", () => {
    expect(isDuplicateOption([optionA], "2026-08-21", "2026-08-23")).toBe(true);
  });

  it("lässt eine andere Spanne durch", () => {
    expect(isDuplicateOption([optionA], "2026-08-21", "2026-08-24")).toBe(
      false
    );
  });
});

describe("tallyOption", () => {
  it("zählt die Antworten und die Nächte", () => {
    const votes = [vote(1, 10, "yes"), vote(1, 11, "maybe"), vote(1, 12, "no")];
    const tally = tallyOption(optionA, votes, participants);
    expect(tally.yes).toBe(1);
    expect(tally.maybe).toBe(1);
    expect(tally.no).toBe(1);
    expect(tally.pending).toBe(0);
    expect(tally.nights).toBe(2);
    expect(tally.score).toBe(3);
  });

  it("zählt fehlende Antworten", () => {
    const tally = tallyOption(optionA, [vote(1, 10, "yes")], participants);
    expect(tally.pending).toBe(2);
  });

  it("ignoriert Stimmen zu anderen Vorschlägen", () => {
    const tally = tallyOption(optionA, [vote(2, 10, "yes")], participants);
    expect(tally.yes).toBe(0);
    expect(tally.pending).toBe(3);
  });

  it("ignoriert Stimmen von Ausgetretenen", () => {
    const tally = tallyOption(optionA, [vote(1, 99, "yes")], participants);
    expect(tally.yes).toBe(0);
    expect(tally.pending).toBe(3);
  });

  it("meldet Einstimmigkeit nur bei lauter Ja", () => {
    const alle = [vote(1, 10, "yes"), vote(1, 11, "yes"), vote(1, 12, "yes")];
    expect(tallyOption(optionA, alle, participants).unanimous).toBe(true);
    const fast = [vote(1, 10, "yes"), vote(1, 11, "yes"), vote(1, 12, "maybe")];
    expect(tallyOption(optionA, fast, participants).unanimous).toBe(false);
  });

  it("ist ohne Stimmberechtigte nicht einstimmig", () => {
    expect(tallyOption(optionA, [], []).unanimous).toBe(false);
  });
});

describe("rankOptions", () => {
  it("stellt den Termin ohne Absage nach vorn, auch mit weniger Ja", () => {
    // A: drei Ja, aber eine Absage – B: nur Vielleicht, dafür niemand verhindert
    const votes = [
      vote(1, 10, "yes"),
      vote(1, 11, "yes"),
      vote(1, 12, "no"),
      vote(2, 10, "maybe"),
      vote(2, 11, "maybe"),
      vote(2, 12, "maybe"),
    ];
    const ranked = rankOptions([optionA, optionB], votes, participants);
    expect(ranked[0].option.id).toBe(2);
  });

  it("sortiert bei gleicher Absagen-Zahl nach Zustimmung", () => {
    const votes = [vote(1, 10, "maybe"), vote(2, 10, "yes")];
    const ranked = rankOptions([optionA, optionB], votes, participants);
    expect(ranked[0].option.id).toBe(2);
  });

  it("nimmt bei Gleichstand das frühere Datum", () => {
    const ranked = rankOptions([optionB, optionA], [], participants);
    expect(ranked.map(r => r.option.id)).toEqual([1, 2]);
  });

  it("kommt ohne Vorschläge klar", () => {
    expect(rankOptions([], [], participants)).toEqual([]);
  });
});

describe("bestOption", () => {
  it("gibt ohne eine einzige Stimme keinen Sieger aus", () => {
    const ranked = rankOptions([optionA, optionB], [], participants);
    expect(bestOption(ranked)).toBeNull();
  });

  it("nennt den führenden Vorschlag, sobald abgestimmt wurde", () => {
    const ranked = rankOptions(
      [optionA, optionB],
      [vote(2, 10, "yes")],
      participants
    );
    expect(bestOption(ranked)?.option.id).toBe(2);
  });
});

describe("isDecided", () => {
  it("ist offen, solange jemand fehlt", () => {
    const ranked = rankOptions(
      [optionA, optionB],
      [vote(1, 10, "yes")],
      participants
    );
    expect(isDecided(ranked)).toBe(false);
  });

  it("ist offen bei Gleichstand an der Spitze", () => {
    const votes = participants.flatMap(id => [
      vote(1, id, "yes"),
      vote(2, id, "yes"),
    ]);
    expect(
      isDecided(rankOptions([optionA, optionB], votes, participants))
    ).toBe(false);
  });

  it("ist entschieden bei vollständiger Abstimmung mit klarer Spitze", () => {
    const votes = participants.flatMap(id => [
      vote(1, id, "yes"),
      vote(2, id, "no"),
    ]);
    const ranked = rankOptions([optionA, optionB], votes, participants);
    expect(isDecided(ranked)).toBe(true);
    expect(ranked[0].option.id).toBe(1);
  });

  it("ist ohne Vorschläge nicht entschieden", () => {
    expect(isDecided([])).toBe(false);
  });
});

describe("pendingVoters", () => {
  it("nennt die, die noch nichts gesagt haben", () => {
    expect(pendingVoters(1, [vote(1, 10, "yes")], participants)).toEqual([
      11, 12,
    ]);
  });

  it("ist leer, wenn alle geantwortet haben", () => {
    const votes = participants.map(id => vote(1, id, "maybe"));
    expect(pendingVoters(1, votes, participants)).toEqual([]);
  });
});

describe("myVote", () => {
  it("findet die eigene Antwort", () => {
    expect(myVote(1, 10, [vote(1, 10, "maybe")])).toBe("maybe");
  });

  it("gibt null zurück, solange nichts abgegeben wurde", () => {
    expect(myVote(1, 11, [vote(1, 10, "maybe")])).toBeNull();
  });
});

describe("pollProgress", () => {
  it("zählt Antworten über alle Vorschläge", () => {
    const votes = [vote(1, 10, "yes"), vote(2, 10, "no")];
    const progress = pollProgress([optionA, optionB], votes, participants);
    expect(progress.answered).toBe(2);
    expect(progress.expected).toBe(6);
    expect(progress.complete).toBe(false);
  });

  it("meldet Vollständigkeit", () => {
    const votes = participants.flatMap(id => [
      vote(1, id, "yes"),
      vote(2, id, "no"),
    ]);
    expect(pollProgress([optionA, optionB], votes, participants).complete).toBe(
      true
    );
  });

  it("ist ohne Vorschläge nicht vollständig", () => {
    expect(pollProgress([], [], participants).complete).toBe(false);
  });
});
