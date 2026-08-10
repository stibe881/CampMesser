/**
 * Geburtstage unterwegs (#656): Fällt der Geburtstag einer Person aus dem
 * Familien-Modus in einen Reisezeitraum, soll es die Heute-Ansicht sagen –
 * Kuchen und Geschenk wollen eingeplant sein.
 *
 * Nur Monat und Tag zählen; das Geburtsjahr bestimmt höchstens das Alter.
 * Der 29. Februar feiert in Nicht-Schaltjahren am 28. – gefeiert wird
 * immer.
 */

export interface BirthdayPersonLike {
  name: string;
  /** ISO-Datum (YYYY-MM-DD) oder null = nicht erfasst. */
  birthday: string | null;
}

export interface RangeBirthday {
  name: string;
  /** Der Feier-Tag als ISO-Datum IM Zeitraum. */
  date: string;
  /** Alter, das an diesem Tag erreicht wird; null bei unplausiblem Jahr. */
  age: number | null;
}

/** Gibt es den Tag in diesem Jahr? 29.02. weicht auf den 28.02. aus. */
function celebrationDay(year: number, month: string, day: string): string {
  if (month === "02" && day === "29") {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (!leap) return `${year}-02-28`;
  }
  return `${year}-${month}-${day}`;
}

/**
 * Alle Geburtstage im Zeitraum [startDate..endDate], sortiert nach Datum.
 * Der Zeitraum darf über den Jahreswechsel gehen; bei Zeiträumen über
 * einem Jahr zählt jeder Geburtstag einmal.
 */
export function birthdaysInRange(
  people: readonly BirthdayPersonLike[],
  startDate: string,
  endDate: string
): RangeBirthday[] {
  const startYear = Number(startDate.slice(0, 4));
  const endYear = Number(endDate.slice(0, 4));
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return [];
  const result: RangeBirthday[] = [];
  people.forEach(person => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(person.birthday ?? "");
    if (!m) return;
    const birthYear = Number(m[1]);
    for (let year = startYear; year <= endYear; year++) {
      const date = celebrationDay(year, m[2], m[3]);
      if (date >= startDate && date <= endDate) {
        const age = year - birthYear;
        result.push({
          name: person.name,
          date,
          age: age > 0 && age < 130 ? age : null,
        });
        break; // eine Feier pro Person und Zeitraum reicht
      }
    }
  });
  return result.sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  );
}
