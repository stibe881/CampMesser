/** Tageszeit-Schlüssel für die persönliche Begrüssung auf der Startseite. */
export type GreetingKey = "morning" | "day" | "evening";

/** 5–10 Uhr Morgen, 11–17 Uhr Tag, sonst Abend (18–4 Uhr). */
export function greetingKey(hour: number): GreetingKey {
  const h = ((Math.trunc(hour) % 24) + 24) % 24;
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 18) return "day";
  return "evening";
}

/** Vorname für die Anrede: erstes Wort des Anzeigenamens, sonst null. */
export function firstNameOf(name: string | null | undefined): string | null {
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  return first.length > 0 ? first : null;
}
