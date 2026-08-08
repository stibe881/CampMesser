/**
 * Schulferien & Feiertage Schweiz (OpenHolidays-API, openholidaysapi.org):
 * Request-URLs, Kantonsliste und die Überlappungs-Logik für geplante
 * Aufenthalte. Reine Funktionen – von Client und Tests genutzt.
 */

import type { Language } from "./i18n";

/** Ein Name in einer Sprache, wie ihn die OpenHolidays-API liefert. */
export interface HolidayName {
  language: string;
  text: string;
}

/** Ferien- oder Feiertags-Eintrag der OpenHolidays-API (relevante Felder). */
export interface Holiday {
  id: string;
  /** "YYYY-MM-DD" (inklusive) */
  startDate: string;
  /** "YYYY-MM-DD" (inklusive) */
  endDate: string;
  name: HolidayName[];
}

/** Die 26 Schweizer Kantone (Code ohne CH-Präfix + amtlicher Name). */
export const CANTONS: { code: string; name: string }[] = [
  { code: "AG", name: "Aargau" },
  { code: "AR", name: "Appenzell Ausserrhoden" },
  { code: "AI", name: "Appenzell Innerrhoden" },
  { code: "BL", name: "Basel-Landschaft" },
  { code: "BS", name: "Basel-Stadt" },
  { code: "BE", name: "Bern" },
  { code: "FR", name: "Fribourg" },
  { code: "GE", name: "Genève" },
  { code: "GL", name: "Glarus" },
  { code: "GR", name: "Graubünden" },
  { code: "JU", name: "Jura" },
  { code: "LU", name: "Luzern" },
  { code: "NE", name: "Neuchâtel" },
  { code: "NW", name: "Nidwalden" },
  { code: "OW", name: "Obwalden" },
  { code: "SH", name: "Schaffhausen" },
  { code: "SZ", name: "Schwyz" },
  { code: "SO", name: "Solothurn" },
  { code: "SG", name: "St. Gallen" },
  { code: "TI", name: "Ticino" },
  { code: "TG", name: "Thurgau" },
  { code: "UR", name: "Uri" },
  { code: "VS", name: "Valais" },
  { code: "VD", name: "Vaud" },
  { code: "ZG", name: "Zug" },
  { code: "ZH", name: "Zürich" },
];

const OPENHOLIDAYS_BASE = "https://openholidaysapi.org";

/**
 * URL für die Schulferien eines Kantons. Ohne languageIsoCode, damit die
 * Namen in allen verfügbaren Sprachen zurückkommen (Auswahl im Client).
 */
export function schoolHolidaysUrl(
  cantonCode: string,
  validFrom: string,
  validTo: string
): string {
  const params = new URLSearchParams({
    countryIsoCode: "CH",
    subdivisionCode: `CH-${cantonCode}`,
    validFrom,
    validTo,
  });
  return `${OPENHOLIDAYS_BASE}/SchoolHolidays?${params.toString()}`;
}

/** URL für die Feiertage eines Kantons (inkl. landesweiter Feiertage). */
export function publicHolidaysUrl(
  cantonCode: string,
  validFrom: string,
  validTo: string
): string {
  const params = new URLSearchParams({
    countryIsoCode: "CH",
    subdivisionCode: `CH-${cantonCode}`,
    validFrom,
    validTo,
  });
  return `${OPENHOLIDAYS_BASE}/PublicHolidays?${params.toString()}`;
}

/**
 * Ziellands-Feiertage (#469): die vier Nachbarländer, in die von hier aus
 * tatsächlich gereist wird und die OpenHolidays abdeckt. Das Land wird wie
 * bei den Verkehrsregeln (#228) aus Titel und Ortsname geraten.
 */
export const HOLIDAY_COUNTRIES = ["DE", "AT", "FR", "IT"] as const;
export type HolidayCountry = (typeof HOLIDAY_COUNTRIES)[number];

export function isHolidayCountry(
  code: string | null | undefined
): code is HolidayCountry {
  return (
    code != null && (HOLIDAY_COUNTRIES as readonly string[]).includes(code)
  );
}

/** URL für die landesweiten Feiertage eines Ziellandes (ohne Subdivision). */
export function countryPublicHolidaysUrl(
  countryCode: string,
  validFrom: string,
  validTo: string
): string {
  const params = new URLSearchParams({
    countryIsoCode: countryCode,
    validFrom,
    validTo,
  });
  return `${OPENHOLIDAYS_BASE}/PublicHolidays?${params.toString()}`;
}

/** API-Antwort defensiv in Holiday-Einträge umwandeln (Unbekanntes fällt weg). */
export function parseHolidaysResponse(json: unknown): Holiday[] {
  if (!Array.isArray(json)) return [];
  const holidays: Holiday[] = [];
  json.forEach((entry, i) => {
    if (!entry || typeof entry !== "object") return;
    const record = entry as Record<string, unknown>;
    const startDate = record.startDate;
    const endDate = record.endDate;
    if (typeof startDate !== "string" || typeof endDate !== "string") return;
    const name: HolidayName[] = Array.isArray(record.name)
      ? record.name.filter(
          (n): n is HolidayName =>
            !!n &&
            typeof n === "object" &&
            typeof (n as HolidayName).language === "string" &&
            typeof (n as HolidayName).text === "string"
        )
      : [];
    if (name.length === 0) return;
    holidays.push({
      id: typeof record.id === "string" ? record.id : `holiday-${i}`,
      startDate: startDate.slice(0, 10),
      endDate: endDate.slice(0, 10),
      name,
    });
  });
  return holidays;
}

/**
 * Nur landesweite Feiertage behalten (#469): ohne Subdivision liefert die
 * API auch alle regionalen Feiertage – die würden das Zielland-Badge fluten
 * (in Deutschland z. B. jedes Bundesland einzeln).
 */
export function parseNationwideHolidays(json: unknown): Holiday[] {
  if (!Array.isArray(json)) return [];
  return parseHolidaysResponse(
    json.filter(
      entry =>
        !!entry &&
        typeof entry === "object" &&
        (entry as Record<string, unknown>).nationwide === true
    )
  );
}

/**
 * Alle Einträge, die sich mit dem Aufenthalt überschneiden (Datumsgrenzen
 * inklusive; ISO-Strings "YYYY-MM-DD" lassen sich direkt vergleichen).
 */
export function overlappingHolidays(
  tripStart: string,
  tripEnd: string,
  holidays: Holiday[]
): Holiday[] {
  return holidays.filter(h => h.startDate <= tripEnd && h.endDate >= tripStart);
}

/**
 * Anzeigename passend zur UI-Sprache: exakte Sprach-Übereinstimmung
 * (case-insensitiv), sonst Deutsch, sonst der erste vorhandene Name.
 */
export function holidayDisplayName(holiday: Holiday, lang: Language): string {
  const byLang = (code: string) =>
    holiday.name.find(n => n.language.toLowerCase() === code)?.text;
  return byLang(lang) ?? byLang("de") ?? holiday.name[0]?.text ?? "";
}
