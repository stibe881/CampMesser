import { describe, expect, it } from "vitest";
import {
  duelFinished,
  duelPlayer,
  duelQuestionIndex,
  duelWinner,
} from "../client/src/lib/quizDuel";

describe("duelPlayer / duelQuestionIndex", () => {
  it("wechselt die Kinder ab: A F1, B F1, A F2, B F2 …", () => {
    const order = [0, 1, 2, 3, 4, 5].map(turn => ({
      player: duelPlayer(turn),
      question: duelQuestionIndex(turn),
    }));
    expect(order).toEqual([
      { player: 0, question: 0 },
      { player: 1, question: 0 },
      { player: 0, question: 1 },
      { player: 1, question: 1 },
      { player: 0, question: 2 },
      { player: 1, question: 2 },
    ]);
  });
});

describe("duelFinished", () => {
  it("ist erst nach 2·n Zügen fertig", () => {
    expect(duelFinished(0, 3)).toBe(false);
    expect(duelFinished(5, 3)).toBe(false); // letzter Zug läuft noch
    expect(duelFinished(6, 3)).toBe(true);
    expect(duelFinished(7, 3)).toBe(true);
  });

  it("funktioniert auch mit einer einzigen Frage", () => {
    expect(duelFinished(1, 1)).toBe(false);
    expect(duelFinished(2, 1)).toBe(true);
  });
});

describe("duelWinner", () => {
  it("kürt das Kind mit mehr Punkten", () => {
    expect(duelWinner(3, 1)).toBe(0);
    expect(duelWinner(2, 5)).toBe(1);
  });

  it("liefert null bei Unentschieden", () => {
    expect(duelWinner(0, 0)).toBeNull();
    expect(duelWinner(4, 4)).toBeNull();
  });
});
