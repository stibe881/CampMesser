/**
 * Eigene Daten offline verfügbar halten.
 *
 * DAS PROBLEM: Der Service Worker cacht bewusst keine `/api/`-Antworten
 * (sw.js) – Live-Daten sollen nicht veralten. Der Abfrage-Zwischenspeicher
 * von TanStack Query wiederum lebt nur im Arbeitsspeicher. Zusammen hiess
 * das: Ohne Empfang startete die App zwar, aber Packliste, Menüplan,
 * Einkaufsliste, Kühlbox und Reisedaten waren leer. Ausgerechnet die
 * Packliste, die man beim Zusammenräumen im Funkloch abhaken will.
 *
 * DIE LÖSUNG: Der Abfrage-Zwischenspeicher wird nach jeder Änderung
 * (leicht verzögert) nach IndexedDB geschrieben und beim Start wieder
 * eingelesen. Es ist ein Speicher, keine zweite Wahrheit: Sobald wieder
 * Verbindung besteht, holt Query frische Daten und überschreibt alles.
 *
 * WARUM INDEXEDDB und nicht localStorage: Der Zwischenspeicher wird schnell
 * einige hundert Kilobyte gross, localStorage ist auf ~5 MB begrenzt UND
 * synchron – jedes Schreiben würde die Oberfläche blockieren. IndexedDB
 * speichert ausserdem echte Date-Objekte, was superjson-Antworten (Datum
 * von Reisen, Ablaufdaten der Kühlbox) unverändert übersteht.
 *
 * WAS NICHT GESPEICHERT WIRD: Fehlgeschlagene Abfragen (das erledigt
 * `dehydrate` von sich aus) und alles, was älter als zwei Wochen ist. Beim
 * Abmelden wird der Speicher gelöscht – auf einem geteilten Gerät sollen
 * keine fremden Listen zurückbleiben.
 */
import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query";

const DB_NAME = "campmesser-cache";
const DB_VERSION = 1;
const STORE = "queries";
const RECORD_KEY = "react-query";

/**
 * Formatversion des Gespeicherten. HOCHZÄHLEN, wenn sich die Struktur von
 * tRPC-Antworten so ändert, dass alte Daten eine Seite zum Absturz bringen
 * könnten – dann wird der Speicher beim nächsten Start verworfen statt
 * eingelesen. Für gewöhnliche Feature-Arbeit bleibt die Zahl gleich, sonst
 * verliert jede Person nach jedem Update ihre Offline-Daten.
 */
const SCHEMA_VERSION = 1;

/** Älteres wird nicht mehr angezeigt – lieber leer als grob veraltet. */
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/** Sammelfenster: viele Cache-Ereignisse in einem Schreibvorgang bündeln. */
const WRITE_DELAY_MS = 2000;

interface PersistedRecord {
  version: number;
  savedAt: number;
  state: unknown;
}

/** IndexedDB öffnen – liefert null, wenn der Browser sie verweigert. */
function openDb(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      // Privater Modus mancher Browser wirft hier direkt
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

/** Einen Wert lesen/schreiben/löschen – Fehler enden immer still. */
function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> {
  return openDb().then(
    db =>
      new Promise<T | null>(resolve => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const tx = db.transaction(STORE, mode);
          const request = action(tx.objectStore(STORE));
          request.onsuccess = () => resolve(request.result ?? null);
          request.onerror = () => resolve(null);
          tx.oncomplete = () => db.close();
          tx.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch {
          resolve(null);
        }
      })
  );
}

/**
 * Gespeicherten Zwischenspeicher einlesen.
 *
 * Bewusst NACH dem ersten Rendern aufgerufen: `hydrate` überschreibt keine
 * frischeren Daten, ein bereits laufender Abruf gewinnt also. Offline
 * erscheinen die gespeicherten Listen einen Wimpernschlag nach dem Aufbau.
 */
export async function restoreQueryCache(client: QueryClient): Promise<void> {
  const record = (await withStore<PersistedRecord>("readonly", store =>
    store.get(RECORD_KEY)
  )) as PersistedRecord | null;
  if (!record) return;
  if (record.version !== SCHEMA_VERSION) {
    void clearPersistedQueryCache();
    return;
  }
  if (Date.now() - record.savedAt > MAX_AGE_MS) {
    void clearPersistedQueryCache();
    return;
  }
  try {
    hydrate(client, record.state);
  } catch {
    // Unlesbarer Stand: wegwerfen statt die App damit zu belasten
    void clearPersistedQueryCache();
  }
}

/** Alles Gespeicherte löschen (Abmelden, Konto wechseln, kaputter Stand). */
export async function clearPersistedQueryCache(): Promise<void> {
  await withStore("readwrite", store => store.delete(RECORD_KEY));
}

/**
 * Laufend speichern: Nach jeder Änderung am Zwischenspeicher wird verzögert
 * geschrieben; zusätzlich sofort, wenn die Seite in den Hintergrund geht
 * (auf dem Handy der Normalfall – die App wird selten «geschlossen»).
 */
export function startQueryPersistence(client: QueryClient): () => void {
  let timer: number | undefined;
  let disposed = false;

  const write = () => {
    if (disposed) return;
    let record: PersistedRecord;
    try {
      record = {
        version: SCHEMA_VERSION,
        savedAt: Date.now(),
        // dehydrate nimmt von sich aus nur erfolgreiche Abfragen mit.
        state: dehydrate(client),
      };
    } catch {
      return;
    }
    void withStore("readwrite", store => store.put(record, RECORD_KEY));
  };

  const schedule = () => {
    if (disposed) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(write, WRITE_DELAY_MS);
  };

  const flush = () => {
    window.clearTimeout(timer);
    write();
  };

  const unsubscribe = client.getQueryCache().subscribe(schedule);
  const onHide = () => {
    if (document.visibilityState === "hidden") flush();
  };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", flush);

  return () => {
    disposed = true;
    window.clearTimeout(timer);
    unsubscribe();
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", flush);
  };
}
