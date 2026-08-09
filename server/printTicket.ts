/**
 * Druck-Ticket für die installierte App (Nutzermeldung 09.08.2026,
 * dritter Anlauf «Pass drucken funktioniert nicht»).
 *
 * DIE EIGENTLICHE URSACHE: Der Druck-Knopf öffnet im Standalone-Modus
 * einen echten Browser-Tab (window.print() ist dort wirkungslos). Dieser
 * Tab teilt aber die Cookies der installierten App NICHT – iOS hält die
 * Speicher getrennt. Der Tab zeigte deshalb «Anmeldung erforderlich»
 * statt der Druckseite; der Link-Umbau der letzten Runde konnte daran
 * nichts ändern.
 *
 * DIE ANTWORT: Ein kurzlebiges, signiertes Ticket in der Link-Adresse.
 * `/api/print-login?ticket=…&next=/reisepass` prüft das Ticket, meldet
 * den Browser mit einer normalen Sitzung an und leitet auf die Druckseite
 * weiter. Das Ticket trägt nur Konto-Nummer und Ablauf (30 Minuten),
 * signiert mit dem JWT-Geheimnis – kein Datenbank-Zustand, kein neues
 * Secret, nicht wiederverwendbar über den Ablauf hinaus. Dass die eigene
 * Safari danach angemeldet ist, ist gewollt: Es ist das Gerät der
 * Nutzerin/des Nutzers, und der nächste Druck geht sofort.
 */
import { createHmac, timingSafeEqual } from "crypto";

/** 30 Minuten: lange genug für «Seite offen lassen», kurz genug für URLs. */
export const PRINT_TICKET_TTL_MS = 30 * 60 * 1000;

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Ticket ausstellen: `userId.exp.signatur` – URL-tauglich ohne Encoding. */
export function createPrintTicket(
  userId: number,
  secret: string,
  now: number = Date.now()
): string {
  const exp = now + PRINT_TICKET_TTL_MS;
  const payload = `print:${userId}:${exp}`;
  return `${userId}.${exp}.${signPayload(payload, secret)}`;
}

/**
 * Ticket prüfen: Konto-Nummer zurückgeben oder null. Abgelaufene,
 * verbogene und fremd signierte Tickets fallen durch – der Vergleich
 * läuft in konstanter Zeit.
 */
export function verifyPrintTicket(
  ticket: string,
  secret: string,
  now: number = Date.now()
): number | null {
  if (!secret) return null;
  const parts = ticket.split(".");
  if (parts.length !== 3) return null;
  const userId = Number(parts[0]);
  const exp = Number(parts[1]);
  if (!Number.isInteger(userId) || userId <= 0) return null;
  if (!Number.isFinite(exp) || exp < now) return null;
  const expected = signPayload(`print:${userId}:${exp}`, secret);
  const given = Buffer.from(parts[2]);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length) return null;
  return timingSafeEqual(given, wanted) ? userId : null;
}

/**
 * Weiterleitungs-Ziel absichern: nur eigene Pfade («/reisepass»), nie
 * fremde Adressen («https://…», «//…») – sonst wäre die Route ein
 * offener Weiterleiter mit Anmelde-Nebenwirkung.
 */
export function sanitizeNextPath(next: unknown): string {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
