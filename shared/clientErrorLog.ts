/**
 * Das Absturz-Protokoll lesbar machen (#352).
 *
 * SEIT #36 melden Abstürze im Browser an `/api/log`, und der Server hängt
 * sie an `logs/client-errors.log`. Gelesen hat diese Datei nie jemand –
 * man hätte sich dafür per SSH auf den Server verbinden müssen. Eine
 * Absturzschleife fiele also erst auf, wenn sich jemand beschwert.
 *
 * Dieselbe Lücke hatte #314 beim Cron-Lauf geschlossen: sichtbar machen,
 * was sonst im Verborgenen passiert.
 *
 * HIER STEHT NUR DAS LESEN DER ZEILEN – ohne Dateisystem, damit es
 * prüfbar bleibt. Das Anhängen und die Rotation macht weiterhin der
 * Server-Einstieg.
 */

/** Eine Zeile des Protokolls, so wie `/api/log` sie schreibt. */
export interface ClientErrorEntry {
  at: string;
  message: string;
  url: string;
  stack: string;
  componentStack: string;
  userAgent: string;
}

/** Wie viele Meldungen die Ansicht höchstens zeigt. */
export const CLIENT_ERROR_LIMIT = 30;

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Das Protokoll in Einträge zerlegen, NEUESTE ZUERST.
 *
 * KAPUTTE ZEILEN WERDEN ÜBERSPRUNGEN, nicht gemeldet: Die Rotation
 * schneidet die Datei mittendrin ab, die erste Zeile danach ist also
 * regelmässig ein halber Datensatz. Daran soll die Ansicht nicht
 * scheitern – sie zeigt dann eine Meldung weniger.
 *
 * Ein Eintrag ohne Zeitstempel ist ebenfalls keiner: Ohne «wann» ist eine
 * Absturzmeldung nicht einzuordnen.
 */
export function parseClientErrorLog(
  text: string,
  limit = CLIENT_ERROR_LIMIT
): ClientErrorEntry[] {
  const entries: ClientErrorEntry[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let raw: unknown;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (typeof raw !== "object" || raw === null) continue;
    const row = raw as Record<string, unknown>;
    const at = asText(row.at);
    if (!at) continue;
    entries.push({
      at,
      message: asText(row.message),
      url: asText(row.url),
      stack: asText(row.stack),
      componentStack: asText(row.componentStack),
      userAgent: asText(row.userAgent),
    });
  }
  return entries.reverse().slice(0, Math.max(0, limit));
}

/**
 * Wie oft dieselbe Meldung vorkommt – eine Absturzschleife sieht in einer
 * reinen Liste aus wie dreissig verschiedene Probleme.
 */
export function countByMessage(
  entries: readonly ClientErrorEntry[]
): { message: string; count: number }[] {
  const counts = new Map<string, number>();
  entries.forEach(entry => {
    const key = entry.message || "?";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts, ([message, count]) => ({ message, count })).sort(
    (a, b) => b.count - a.count
  );
}
