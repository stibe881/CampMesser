/**
 * EZB-Referenzkurs für die Reisekasse (#519).
 *
 * Die Europäische Zentralbank veröffentlicht werktags gegen 16:00 MEZ einen
 * Referenzkurs je Währung gegenüber dem Euro – ohne Schlüssel, ohne Limit.
 * Für die Reisekasse interessiert genau EINE Zahl daraus: CHF pro Euro, in
 * derselben Auflösung wie der Kurs an der Reise (tripLogs.eurRateX10000).
 *
 * Der Kurs ist ein VORSCHLAG für den Kurs-Dialog, keine stille Umrechnung:
 * Übernommen wird er ausdrücklich und liegt dann fest an der Reise – wie
 * man ihn damals getauscht hat (Begründung am Schema-Feld).
 *
 * Offline-Tauglichkeit in zwei Schichten: hier ein Zwischenspeicher, der
 * bei Abruf-Fehlern den letzten bekannten Kurs weiterreicht (die EZB
 * publiziert werktäglich – ein Kurs von gestern ist als Vorschlag genauso
 * brauchbar), und im Client der persistierte Query-Cache (#302).
 */
import { EUR_RATE_MAX, EUR_RATE_MIN, EUR_RATE_SCALE } from "../shared/expenses";

const ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

/** Zeitlimit des Abrufs: lieber ohne Vorschlag als mit hängender Kasse. */
const FETCH_TIMEOUT_MS = 8000;

/**
 * Zwölf Stunden reichen: Die EZB stellt pro Werktag genau einen Kurs –
 * öfter nachzufragen brächte nur dieselbe Antwort.
 */
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export interface EcbEurRate {
  /** Kurstag der EZB (ISO-Tag) – am Wochenende der letzte Werktag. */
  date: string;
  /** CHF pro Euro × 10 000 – die Auflösung von tripLogs.eurRateX10000. */
  chfPerEurX10000: number;
}

interface CacheEntry {
  fetchedAt: number;
  value: EcbEurRate;
}

/** Ein einziger Eintrag – der Abruf ist für alle gleich (Muster excursions.ts). */
let cache: CacheEntry | null = null;

/** Nur für Tests: Zwischenspeicher leeren. */
export function clearEcbRateCache(): void {
  cache = null;
}

/**
 * Das EZB-XML auf die eine gesuchte Zeile reduzieren.
 *
 * Bewusst zwei reguläre Ausdrücke statt eines XML-Parsers: Das Dokument ist
 * eine flache Liste von `<Cube currency='CHF' rate='0.94'/>`-Zeilen mit
 * einem `time`-Attribut darüber – dafür eine Parser-Abhängigkeit einzuführen
 * stünde in keinem Verhältnis. Die Plausibilitätsgrenzen des manuellen
 * Kurses (0.5–2 CHF pro Euro) gelten auch hier: Was ausserhalb liegt, ist
 * ein Format-Irrtum, kein Kurs.
 */
export function parseEcbDaily(xml: string): EcbEurRate | null {
  const time = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/);
  const chf = xml.match(/currency=['"]CHF['"]\s+rate=['"]([\d.]+)['"]/);
  if (!time || !chf) return null;
  const rate = Number(chf[1]);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  const scaled = Math.round(rate * EUR_RATE_SCALE);
  if (scaled < EUR_RATE_MIN || scaled > EUR_RATE_MAX) return null;
  return { date: time[1], chfPerEurX10000: scaled };
}

/**
 * Aktuellen EZB-Kurs liefern – aus dem Zwischenspeicher, sonst frisch.
 * Scheitert der Abruf, kommt der letzte bekannte Kurs zurück (sein Datum
 * sagt ehrlich, wie alt er ist); ganz ohne je einen Abruf gibt es null,
 * und der Dialog zeigt schlicht keinen Vorschlag.
 */
export async function getEcbEurRate(): Promise<EcbEurRate | null> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.value;
  try {
    const res = await fetch(ECB_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "application/xml" },
    });
    if (!res.ok) throw new Error(`ecb ${res.status}`);
    const parsed = parseEcbDaily(await res.text());
    if (!parsed) throw new Error("ecb xml unlesbar");
    cache = { fetchedAt: now, value: parsed };
    return parsed;
  } catch {
    return cache?.value ?? null;
  }
}
