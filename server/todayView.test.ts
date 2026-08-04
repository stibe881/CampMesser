import { describe, expect, it } from "vitest";
import {
  nightsLeft,
  openTasks,
  pickRunningTrip,
  shouldOpenToday,
  todayMeals,
} from "@shared/todayView";

const trip = (id: number, startDate: string, endDate: string) => ({
  id,
  startDate,
  endDate,
  placeName: null,
});

describe("«Heute»-Ansicht", () => {
  describe("Sprung beim Öffnen", () => {
    it("springt beim ersten Öffnen während einer Reise", () => {
      expect(
        shouldOpenToday({
          enabled: true,
          hasRunningTrip: true,
          hasJumped: false,
        })
      ).toBe(true);
    });

    it("springt nur einmal pro Sitzung", () => {
      // Wer «Start» antippt, will die Kacheln sehen – die App darf ihn
      // nicht jedes Mal zurückwerfen
      expect(
        shouldOpenToday({
          enabled: true,
          hasRunningTrip: true,
          hasJumped: true,
        })
      ).toBe(false);
    });

    it("springt nicht ohne laufende Reise", () => {
      expect(
        shouldOpenToday({
          enabled: true,
          hasRunningTrip: false,
          hasJumped: false,
        })
      ).toBe(false);
    });

    it("springt nicht, wenn die Einstellung aus ist", () => {
      expect(
        shouldOpenToday({
          enabled: false,
          hasRunningTrip: true,
          hasJumped: false,
        })
      ).toBe(false);
    });
  });

  describe("Laufende Reise", () => {
    it("findet die Reise, in der man heute steckt", () => {
      const found = pickRunningTrip(
        [
          trip(1, "2026-06-01", "2026-06-05"),
          trip(2, "2026-08-01", "2026-08-10"),
        ],
        "2026-08-04"
      );
      expect(found?.id).toBe(2);
    });

    it("nimmt bei Überlappung die zuletzt angetretene", () => {
      // Am Anreisetag der neuen Reise meint man die neue
      const found = pickRunningTrip(
        [
          trip(1, "2026-08-01", "2026-08-10"),
          trip(2, "2026-08-04", "2026-08-08"),
        ],
        "2026-08-04"
      );
      expect(found?.id).toBe(2);
    });

    it("liefert null, wenn heute keine läuft", () => {
      expect(
        pickRunningTrip([trip(1, "2026-06-01", "2026-06-05")], "2026-08-04")
      ).toBeNull();
      expect(pickRunningTrip([], "2026-08-04")).toBeNull();
    });

    it("zählt die Nächte bis zur Abreise", () => {
      const t = trip(1, "2026-08-01", "2026-08-05");
      // Am 1. sind es noch vier Nächte, am Abreisetag keine mehr
      expect(nightsLeft(t, "2026-08-01")).toBe(4);
      expect(nightsLeft(t, "2026-08-04")).toBe(1);
      expect(nightsLeft(t, "2026-08-05")).toBe(0);
      expect(nightsLeft(t, "2026-09-01")).toBeNull();
    });
  });

  describe("Mahlzeiten von heute", () => {
    const entry = (
      day: string,
      meal: string,
      freeText: string | null = "X"
    ) => ({ day, meal, recipeId: null, customRecipeId: null, freeText });

    it("sortiert nach dem Tagesablauf, nicht nach der Eingabe", () => {
      const meals = todayMeals(
        [
          entry("2026-08-04", "dinner", "Risotto"),
          entry("2026-08-04", "breakfast", "Müesli"),
        ],
        "2026-08-04"
      );
      expect(meals.map(m => m.meal)).toEqual(["breakfast", "dinner"]);
    });

    it("lässt andere Tage weg", () => {
      const meals = todayMeals(
        [entry("2026-08-03", "dinner"), entry("2026-08-04", "lunch")],
        "2026-08-04"
      );
      expect(meals).toHaveLength(1);
      expect(meals[0].meal).toBe("lunch");
    });

    it("lässt leere Slots weg", () => {
      // «Mittagessen: –» ist keine Information
      const meals = todayMeals(
        [entry("2026-08-04", "lunch", null)],
        "2026-08-04"
      );
      expect(meals).toEqual([]);
    });

    it("nimmt auch Einträge mit Rezept statt Freitext", () => {
      const meals = todayMeals(
        [
          {
            day: "2026-08-04",
            meal: "dinner",
            recipeId: "chili",
            customRecipeId: null,
            freeText: null,
          },
        ],
        "2026-08-04"
      );
      expect(meals).toHaveLength(1);
    });
  });

  describe("Offene Aufgaben", () => {
    const note = (id: number, kind: string, doneAt: Date | null = null) => ({
      id,
      kind,
      text: `Aufgabe ${id}`,
      doneAt,
    });

    it("zeigt nur offene Aufgaben, keine Nachrichten", () => {
      const tasks = openTasks([
        note(1, "task"),
        note(2, "message"),
        note(3, "task", new Date()),
      ]);
      expect(tasks.map(t => t.id)).toEqual([1]);
    });

    it("stellt die älteste zuoberst", () => {
      // Was seit drei Tagen dasteht, ist dringender als das von vorhin
      const tasks = openTasks([note(9, "task"), note(2, "task")]);
      expect(tasks.map(t => t.id)).toEqual([2, 9]);
    });

    it("begrenzt die Liste", () => {
      const many = [1, 2, 3, 4, 5, 6, 7].map(id => note(id, "task"));
      expect(openTasks(many)).toHaveLength(5);
      expect(openTasks(many, 2)).toHaveLength(2);
    });

    it("kommt mit einer leeren Pinnwand zurecht", () => {
      expect(openTasks([])).toEqual([]);
    });
  });
});
