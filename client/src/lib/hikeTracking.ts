/**
 * Laufende Wanderungs-Aufzeichnung (#220): ein Speicher ausserhalb von React
 * – nach dem Muster der Küchen-Timer (lib/cookTimers.ts).
 *
 * Zwei Dinge müssen einen Seitenwechsel überleben:
 *
 * 1. DIE PUNKTE. Sie liegen in localStorage; wer die App schliesst oder das
 *    Handy neu startet, findet die Aufzeichnung beim Zurückkehren wieder
 *    (Zustand «pausiert», sobald die Seite neu geladen wurde – der Browser
 *    gibt einen `watchPosition` beim Neuladen nicht zurück).
 * 2. DIE MESSUNG SELBST. Der `watchPosition` hängt bewusst NICHT an einer
 *    React-Komponente, sondern an diesem Modul: solange die Seite nicht neu
 *    geladen wird, läuft er beim Wechsel auf Wetter, Karte oder Rezepte
 *    einfach weiter. Erst «Stopp» (oder ein Neuladen) beendet ihn.
 *
 * Gefiltert wird ausschliesslich mit `evaluateTrackPoint()` aus
 * shared/track.ts, damit Live-Anzeige, gespeicherte Statistik und Tests
 * dieselbe Wahrheit verwenden.
 */
import {
  evaluateTrackPoint,
  MAX_TRACK_POINTS,
  type TrackPoint,
} from "@shared/track";
import { useEffect, useState } from "react";

const STORAGE_KEY = "campmesser.hikeRecording";

export type HikeRecordingStatus = "recording" | "paused";

/** Eine laufende (oder pausierte) Aufzeichnung. */
export interface HikeRecording {
  /** Zeitpunkt des Starts in Millisekunden seit Epoch. */
  startedAt: number;
  status: HikeRecordingStatus;
  points: TrackPoint[];
  /** Zeitpunkt des letzten verworfenen/angenommenen Fixes (für die Anzeige). */
  lastFixAt: number | null;
  /** Genauigkeit des letzten Fixes in Metern; null = noch keiner. */
  lastAccuracyM: number | null;
  /** Vorgewählte Reise; null = ohne Reise. */
  tripId: number | null;
}

/** Warum kommen gerade keine Punkte an? Steuert den Hinweis auf der Seite. */
export type HikeGeoError = "unsupported" | "denied" | "failed" | null;

function loadRecording(): HikeRecording | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const r = parsed as Partial<HikeRecording>;
    if (typeof r.startedAt !== "number" || !Number.isFinite(r.startedAt)) {
      return null;
    }
    const points: TrackPoint[] = [];
    if (Array.isArray(r.points)) {
      r.points.slice(0, MAX_TRACK_POINTS).forEach(entry => {
        if (typeof entry !== "object" || entry === null) return;
        const p = entry as Partial<TrackPoint>;
        if (typeof p.lat !== "number" || typeof p.lon !== "number") return;
        if (typeof p.t !== "number" || !Number.isFinite(p.t)) return;
        points.push({
          lat: p.lat,
          lon: p.lon,
          ele:
            typeof p.ele === "number" && Number.isFinite(p.ele) ? p.ele : null,
          t: p.t,
        });
      });
    }
    return {
      startedAt: r.startedAt,
      // Nach einem Neuladen misst niemand mehr – bewusst als «pausiert»
      // zurückholen, damit niemand eine tote Aufzeichnung für laufend hält.
      status: "paused",
      points,
      lastFixAt: typeof r.lastFixAt === "number" ? r.lastFixAt : null,
      lastAccuracyM:
        typeof r.lastAccuracyM === "number" ? r.lastAccuracyM : null,
      tripId: typeof r.tripId === "number" ? r.tripId : null,
    };
  } catch {
    return null;
  }
}

function storeRecording(recording: HikeRecording | null): void {
  try {
    if (recording === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(recording));
  } catch {
    /* Sitzung reicht – die Aufzeichnung läuft trotzdem weiter */
  }
}

let recording: HikeRecording | null =
  typeof window === "undefined" ? null : loadRecording();
let geoError: HikeGeoError = null;
const listeners: Array<() => void> = [];
let watchId: number | null = null;

function emit(): void {
  listeners.forEach(fn => fn());
}

/**
 * Neuen Zustand setzen, speichern und alle informieren. Das Schreiben in
 * localStorage passiert bei JEDEM angenommenen Punkt: eine Wanderung
 * überlebt so auch einen Absturz der App, und bei einem Punkt alle paar
 * Sekunden fällt der Schreibaufwand nicht ins Gewicht.
 */
function commit(next: HikeRecording | null): void {
  recording = next;
  storeRecording(next);
  emit();
}

export function getHikeRecording(): HikeRecording | null {
  return recording;
}

export function getHikeGeoError(): HikeGeoError {
  return geoError;
}

/** Auf Änderungen hören; gibt die Abmelde-Funktion zurück. */
export function subscribeHikeRecording(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}

// ── Messung ──

/** Einen Fix der Geolocation-API einsortieren (annehmen oder verwerfen). */
function handlePosition(position: GeolocationPosition): void {
  const current = recording;
  if (!current || current.status !== "recording") return;
  const last = current.points.length
    ? current.points[current.points.length - 1]
    : null;
  const fix = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    ele: position.coords.altitude ?? null,
    t: position.timestamp,
    accuracyM: position.coords.accuracy ?? null,
  };
  geoError = null;
  const verdict = evaluateTrackPoint(last, fix);
  const meta = {
    lastFixAt: Date.now(),
    lastAccuracyM: Number.isFinite(fix.accuracyM ?? Number.NaN)
      ? fix.accuracyM
      : null,
  };
  if (verdict !== "ok" || current.points.length >= MAX_TRACK_POINTS) {
    // Auch verworfene Fixes aktualisieren die Genauigkeits-Anzeige –
    // so sieht man, dass gemessen wird, obwohl die Strecke stehen bleibt.
    commit({ ...current, ...meta });
    return;
  }
  commit({
    ...current,
    ...meta,
    points: [
      ...current.points,
      { lat: fix.lat, lon: fix.lon, ele: fix.ele, t: fix.t },
    ],
  });
}

function handleGeoError(error: GeolocationPositionError): void {
  geoError = error.code === error.PERMISSION_DENIED ? "denied" : "failed";
  emit();
}

/** Messung starten, falls sie nicht schon läuft. */
function startWatch(): void {
  if (watchId !== null) return;
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    geoError = "unsupported";
    emit();
    return;
  }
  watchId = navigator.geolocation.watchPosition(
    handlePosition,
    handleGeoError,
    {
      enableHighAccuracy: true,
      // Keine gecachten Positionen: für einen Track zählt der frische Fix
      maximumAge: 0,
      timeout: 30_000,
    }
  );
}

function stopWatch(): void {
  if (watchId === null) return;
  try {
    navigator.geolocation.clearWatch(watchId);
  } catch {
    /* Watch war bereits weg */
  }
  watchId = null;
}

// ── Aktionen ──

/** Neue Aufzeichnung beginnen (eine bestehende wird ersetzt). */
export function startHikeRecording(tripId: number | null = null): void {
  geoError = null;
  commit({
    startedAt: Date.now(),
    status: "recording",
    points: [],
    lastFixAt: null,
    lastAccuracyM: null,
    tripId,
  });
  startWatch();
}

/**
 * Anhalten: Die Messung wird beendet, die Punkte bleiben. Die Lücke bis zum
 * Fortsetzen zählt `trackStats()` ohnehin nicht mit, sobald sie länger als
 * `TRACK_PAUSE_GAP_MS` dauert.
 */
export function pauseHikeRecording(): void {
  if (!recording) return;
  stopWatch();
  commit({ ...recording, status: "paused" });
}

/** Fortsetzen – auch nach einem Neuladen der App. */
export function resumeHikeRecording(): void {
  if (!recording) return;
  geoError = null;
  commit({ ...recording, status: "recording" });
  startWatch();
}

/** Reise-Zuordnung der laufenden Aufzeichnung ändern. */
export function setHikeRecordingTrip(tripId: number | null): void {
  if (!recording) return;
  commit({ ...recording, tripId });
}

/**
 * Aufzeichnung beenden: gibt den letzten Stand zurück (zum Speichern) und
 * räumt den Speicher. Ein leerer Rückgabewert heisst «da war nichts».
 */
export function stopHikeRecording(): HikeRecording | null {
  const finished = recording;
  stopWatch();
  commit(null);
  return finished;
}

/** Aufzeichnung wegwerfen, ohne sie zu speichern. */
export function discardHikeRecording(): void {
  stopHikeRecording();
}

// Beim Laden des Moduls: läuft laut localStorage noch etwas, bleibt es
// pausiert stehen (loadRecording setzt den Status) – erst ein Tipp auf
// «Fortsetzen» startet die Messung wieder.

/** React-Anbindung: Aufzeichnung, Fehlerzustand und ein tickendes «Jetzt». */
export function useHikeRecording(): {
  recording: HikeRecording | null;
  geoError: HikeGeoError;
  now: number;
} {
  const [state, setState] = useState<{
    recording: HikeRecording | null;
    geoError: HikeGeoError;
  }>(() => ({
    recording: getHikeRecording(),
    geoError: getHikeGeoError(),
  }));
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setState({ recording: getHikeRecording(), geoError: getHikeGeoError() });
    return subscribeHikeRecording(() =>
      setState({ recording: getHikeRecording(), geoError: getHikeGeoError() })
    );
  }, []);

  // Die Uhr läuft nur, solange tatsächlich aufgezeichnet wird
  useEffect(() => {
    if (state.recording?.status !== "recording") return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.recording?.status]);

  return { recording: state.recording, geoError: state.geoError, now };
}
