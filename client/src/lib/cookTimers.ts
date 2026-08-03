/**
 * Laufende Küchen-Timer (#218): ein kleiner Speicher ausserhalb von React,
 * damit Rezept-Seite und die globale Timer-Leiste dieselben Timer sehen.
 *
 * Wichtigste Entscheidung: gespeichert wird der ZIELZEITPUNKT (Timestamp),
 * nicht ein heruntergezählter Zähler. Dadurch stimmt die Restzeit auch dann,
 * wenn der Tab im Hintergrund gedrosselt wird, die Seite gewechselt oder die
 * App zwischendurch geschlossen wird. Der Timer lebt in localStorage weiter.
 */
import { MAX_ACTIVE_TIMERS, MAX_TIMER_MINUTES } from "@shared/cookTimer";
import { useEffect, useState } from "react";

const STORAGE_KEY = "campmesser.cookTimers";

/** Ein Timer, wie er gespeichert und angezeigt wird. */
export interface CookTimer {
  id: string;
  /** Anzeigename, z. B. Rezeptname oder «15 Minuten köcheln». */
  name: string;
  /** Ursprüngliche Dauer in Sekunden (für den Fortschrittsbalken). */
  totalSeconds: number;
  /** Zielzeitpunkt in Millisekunden seit Epoch (gilt, solange nicht pausiert). */
  endsAt: number;
  /** Restsekunden im pausierten Zustand; null = läuft. */
  pausedSeconds: number | null;
  /** Rezept, aus dem der Timer gestartet wurde (Rücksprung aus der Leiste). */
  recipeId: string | null;
  /** Ist der Ablauf-Alarm bereits ausgelöst worden? */
  alerted: boolean;
}

/** Sicher aus localStorage lesen – kaputte Einträge werden verworfen. */
function loadTimers(): CookTimer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const clean: CookTimer[] = [];
    parsed.forEach(entry => {
      if (typeof entry !== "object" || entry === null) return;
      const t = entry as Partial<CookTimer>;
      if (typeof t.id !== "string" || typeof t.endsAt !== "number") return;
      if (!Number.isFinite(t.endsAt)) return;
      clean.push({
        id: t.id,
        name: typeof t.name === "string" ? t.name : "",
        totalSeconds:
          typeof t.totalSeconds === "number" && t.totalSeconds > 0
            ? t.totalSeconds
            : 60,
        endsAt: t.endsAt,
        pausedSeconds:
          typeof t.pausedSeconds === "number" && t.pausedSeconds >= 0
            ? t.pausedSeconds
            : null,
        recipeId: typeof t.recipeId === "string" ? t.recipeId : null,
        alerted: t.alerted === true,
      });
    });
    return clean.slice(0, MAX_ACTIVE_TIMERS);
  } catch {
    return [];
  }
}

function storeTimers(list: CookTimer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* Sitzung reicht */
  }
}

let timers: CookTimer[] = typeof window === "undefined" ? [] : loadTimers();
const listeners: Array<() => void> = [];
let ticker: number | null = null;

function emit(): void {
  listeners.forEach(fn => fn());
}

/** Neue Liste setzen, speichern, Tick sicherstellen und alle informieren. */
function commit(next: CookTimer[]): void {
  timers = next;
  storeTimers(timers);
  ensureTicker();
  emit();
}

/** Aktuelle Timer (unveränderliche Referenz je Änderung). */
export function getCookTimers(): CookTimer[] {
  return timers;
}

/** Auf Änderungen hören; gibt die Abmelde-Funktion zurück. */
export function subscribeCookTimers(listener: () => void): () => void {
  listeners.push(listener);
  ensureTicker();
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}

/** Restzeit in Sekunden (kann Nachkommastellen haben – Anzeige rundet auf). */
export function remainingSeconds(timer: CookTimer, now: number): number {
  if (timer.pausedSeconds !== null) return timer.pausedSeconds;
  return Math.max(0, (timer.endsAt - now) / 1000);
}

/** Ist der Timer abgelaufen (läuft und Zielzeitpunkt erreicht)? */
export function isExpired(timer: CookTimer, now: number): boolean {
  return timer.pausedSeconds === null && timer.endsAt <= now;
}

// ── Signalton und Vibration ──

/**
 * WebAudio wird erst bei einer echten Nutzerinteraktion aufgebaut
 * (Autoplay-Regeln). Ohne vorherige Interaktion – etwa wenn die Seite nach
 * einem Neustart nur den gespeicherten Timer weiterlaufen lässt – bleibt der
 * Alarm stumm; der sichtbare Hinweis und die Vibration bleiben davon
 * unberührt.
 */
let audioCtx: AudioContext | null = null;

/** Beim Start eines Timers aufrufen – läuft im Klick-Handler des Nutzers. */
export function primeTimerAudio(): void {
  try {
    const Ctor =
      typeof window === "undefined"
        ? undefined
        : (window.AudioContext ??
          (window as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext);
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    void audioCtx.resume?.();
  } catch {
    /* Ton ist Beiwerk */
  }
}

/** Dreifacher kurzer Signalton per Oszillator – ohne Audio-Datei, offline. */
function playAlarm(): void {
  const ctx = audioCtx;
  if (!ctx) return; // nie durch eine Nutzerinteraktion freigegeben
  try {
    void ctx.resume?.();
    const start = ctx.currentTime + 0.02;
    for (let i = 0; i < 3; i++) {
      const from = start + i * 0.32;
      const to = from + 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, from);
      gain.gain.setValueAtTime(0.0001, from);
      gain.gain.exponentialRampToValueAtTime(0.25, from + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, to);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(from);
      osc.stop(to + 0.02);
    }
  } catch {
    /* Ton ist Beiwerk */
  }
}

/** Spürbares Muster (Android); auf iOS/Desktop ein No-op. */
function vibrateAlarm(): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([200, 120, 200, 120, 400]);
    }
  } catch {
    /* egal */
  }
}

// ── Ticken und Ablauf erkennen ──

/**
 * Ein einziger Sekunden-Tick für die ganze App: er erkennt abgelaufene Timer
 * und löst den Alarm GENAU EINMAL aus (Merker `alerted`), egal wie viele
 * Komponenten gerade zuhören.
 */
function ensureTicker(): void {
  if (typeof window === "undefined") return;
  if (timers.length === 0) {
    if (ticker !== null) {
      window.clearInterval(ticker);
      ticker = null;
    }
    return;
  }
  if (ticker !== null) return;
  ticker = window.setInterval(() => {
    const now = Date.now();
    let changed = false;
    const next = timers.map(timer => {
      if (!timer.alerted && isExpired(timer, now)) {
        changed = true;
        return { ...timer, alerted: true };
      }
      return timer;
    });
    if (changed) {
      timers = next;
      storeTimers(timers);
      playAlarm();
      vibrateAlarm();
      emit();
    }
  }, 1000);
}

// ── Aktionen ──

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Timer starten. Gibt die Id zurück oder null, wenn schon zu viele Timer
 * laufen bzw. die Dauer unplausibel ist. Muss aus einer Nutzerinteraktion
 * heraus aufgerufen werden – nur so darf später der Ton spielen.
 */
export function startCookTimer(options: {
  name: string;
  minutes: number;
  recipeId?: string | null;
}): string | null {
  const minutes = Math.round(options.minutes);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > MAX_TIMER_MINUTES) {
    return null;
  }
  if (timers.length >= MAX_ACTIVE_TIMERS) return null;
  primeTimerAudio();
  const seconds = minutes * 60;
  const timer: CookTimer = {
    id: newId(),
    name: options.name.trim().slice(0, 80),
    totalSeconds: seconds,
    endsAt: Date.now() + seconds * 1000,
    pausedSeconds: null,
    recipeId: options.recipeId ?? null,
    alerted: false,
  };
  commit([...timers, timer]);
  return timer.id;
}

/** Laufenden Timer anhalten – die Restzeit wird eingefroren. */
export function pauseCookTimer(id: string): void {
  const now = Date.now();
  commit(
    timers.map(timer =>
      timer.id === id && timer.pausedSeconds === null
        ? { ...timer, pausedSeconds: remainingSeconds(timer, now) }
        : timer
    )
  );
}

/** Pausierten Timer fortsetzen – der Zielzeitpunkt wird neu gesetzt. */
export function resumeCookTimer(id: string): void {
  const now = Date.now();
  primeTimerAudio();
  commit(
    timers.map(timer =>
      timer.id === id && timer.pausedSeconds !== null
        ? {
            ...timer,
            endsAt: now + timer.pausedSeconds * 1000,
            pausedSeconds: null,
            alerted: false,
          }
        : timer
    )
  );
}

/** Timer abbrechen bzw. den Ablauf-Hinweis wegklicken. */
export function removeCookTimer(id: string): void {
  try {
    navigator.vibrate?.(0);
  } catch {
    /* egal */
  }
  commit(timers.filter(timer => timer.id !== id));
}

/** Alle Timer entfernen (z. B. «Alle abbrechen»). */
export function clearCookTimers(): void {
  commit([]);
}

// Andere Tabs/Fenster: dieselbe Wahrheit aus localStorage übernehmen
if (typeof window !== "undefined") {
  window.addEventListener("storage", event => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    timers = loadTimers();
    ensureTicker();
    emit();
  });
}

/**
 * React-Anbindung: liefert die Timer und einen laufenden «Jetzt»-Zeitstempel.
 * Der Halbsekunden-Takt läuft nur, solange überhaupt ein Timer existiert.
 */
export function useCookTimers(): { timers: CookTimer[]; now: number } {
  const [list, setList] = useState<CookTimer[]>(getCookTimers);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setList(getCookTimers());
    return subscribeCookTimers(() => setList(getCookTimers()));
  }, []);

  useEffect(() => {
    if (list.length === 0) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [list.length]);

  return { timers: list, now };
}
