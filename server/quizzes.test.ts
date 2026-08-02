import { describe, expect, it } from "vitest";
import { MAX_QUIZ_QUESTIONS, parseQuizQuestions } from "@shared/quizzes";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const question = (overrides: Record<string, unknown> = {}) => ({
  question: "Welcher Baum verliert im Winter seine Nadeln?",
  options: ["Lärche", "Fichte", "Tanne"],
  correctIndex: 0,
  ...overrides,
});

describe("parseQuizQuestions", () => {
  it("liest gültige Fragen samt optionaler Erklärung", () => {
    const json = JSON.stringify([
      question({ explanation: "Die Lärche ist ein Nadelbaum im Laub-Modus." }),
      question({ explanation: "   " }),
    ]);
    const questions = parseQuizQuestions(json);
    expect(questions).toHaveLength(2);
    expect(questions[0].explanation).toContain("Lärche");
    expect(questions[0].options).toHaveLength(3);
    expect(questions[1].explanation).toBeUndefined();
  });

  it("verwirft kaputtes JSON und fremde Formate", () => {
    expect(parseQuizQuestions("kaputt")).toEqual([]);
    expect(parseQuizQuestions('{"a":1}')).toEqual([]);
    expect(
      parseQuizQuestions(JSON.stringify([{ question: "ohne Optionen" }]))
    ).toEqual([]);
  });

  it("verwirft Fragen mit zu wenigen Optionen oder correctIndex ausserhalb", () => {
    const json = JSON.stringify([
      question({ options: ["nur eine"] }),
      question({ correctIndex: 3 }),
      question({ correctIndex: -1 }),
      question({ correctIndex: 1.5 }),
      question(),
    ]);
    expect(parseQuizQuestions(json)).toHaveLength(1);
  });

  it("kappt überzählige Optionen und prüft correctIndex gegen die gekappte Liste", () => {
    const json = JSON.stringify([
      question({ options: ["a", "b", "c", "d", "e"], correctIndex: 4 }),
      question({ options: ["a", "b", "c", "d", "e"], correctIndex: 2 }),
    ]);
    const questions = parseQuizQuestions(json);
    expect(questions).toHaveLength(1);
    expect(questions[0].options).toEqual(["a", "b", "c", "d"]);
  });

  it("begrenzt die Fragen-Anzahl", () => {
    const many = JSON.stringify(Array.from({ length: 40 }, () => question()));
    expect(parseQuizQuestions(many)).toHaveLength(MAX_QUIZ_QUESTIONS);
  });
});

describe("quizzes router", () => {
  it("verweigert anonymen Zugriff", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.quizzes.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
