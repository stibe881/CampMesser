import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Gauge, RotateCcw, Smartphone } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  bubblePosition,
  levelingAdvice,
  sanitizeLevelProfile,
  screenTilt,
  LEVEL_PROFILES,
  LEVEL_TOLERANCES,
  type LevelProfile,
  type Tilt,
} from "@shared/level";
import { type Language } from "@shared/i18n";
import { useI18n } from "@/i18n";
import { useDeviceTilt } from "@/hooks/useDeviceTilt";
import { useWakeLock } from "@/lib/useWakeLock";
import { cn } from "@/lib/utils";

const CALIBRATION_KEY = "campmesser.levelCalibration";
const SOUND_KEY = "campmesser.levelSound";
const PROFILE_KEY = "campmesser.levelProfile";
/** Ausschlag der Libelle: bei dieser Neigung liegt die Blase am Rand. */
const MAX_DEG = 10;
/** Signalton: Frequenz und Dauer des kurzen «im Lot»-Pieps. */
const BEEP_HZ = 880;
const BEEP_MS = 120;

function loadSoundEnabled(): boolean {
  try {
    // Standard: an – nur ein ausdrückliches "0" schaltet ab.
    return localStorage.getItem(SOUND_KEY) !== "0";
  } catch {
    return true;
  }
}

function saveSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? "1" : "0");
  } catch {
    /* Sitzung reicht */
  }
}

function loadProfile(): LevelProfile {
  try {
    return sanitizeLevelProfile(localStorage.getItem(PROFILE_KEY));
  } catch {
    return sanitizeLevelProfile(null);
  }
}

function saveProfile(profile: LevelProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, profile);
  } catch {
    /* Sitzung reicht */
  }
}

/** Wiederverwendeter AudioContext – erst beim ersten Ton erzeugt. */
let audioCtx: AudioContext | null = null;

/**
 * Kurzer Signalton per WebAudio-Oszillator (keine Audiodatei, funktioniert
 * offline). Die Hüllkurve steigt/fällt sanft, damit es nicht knackst.
 * Auf Geräten ohne WebAudio oder mit blockiertem Audio bleibt es lautlos –
 * der visuelle Status ist ohnehin führend.
 */
function playLevelBeep() {
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
    const ctx = audioCtx;
    const now = ctx.currentTime;
    const end = now + BEEP_MS / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(BEEP_HZ, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(end + 0.02);
  } catch {
    /* Ton ist Beiwerk */
  }
}

/** Kurze Vibration (Android); auf iOS/Desktop ein No-op. */
function vibrateLevel() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(BEEP_MS);
    }
  } catch {
    /* egal */
  }
}

function loadCalibration(): Tilt {
  try {
    const raw = localStorage.getItem(CALIBRATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Tilt;
      if (typeof parsed?.pitch === "number" && typeof parsed?.roll === "number")
        return parsed;
    }
  } catch {
    /* Standard */
  }
  return { pitch: 0, roll: 0 };
}

function saveCalibration(cal: Tilt) {
  try {
    localStorage.setItem(CALIBRATION_KEY, JSON.stringify(cal));
  } catch {
    /* Sitzung reicht */
  }
}

function currentScreenAngle(): number {
  if (typeof screen !== "undefined" && screen.orientation)
    return screen.orientation.angle;
  // Ältere iOS-Versionen: window.orientation (deprecated, aber vorhanden)
  const legacy = (window as { orientation?: number }).orientation;
  return typeof legacy === "number" ? legacy : 0;
}

/** Toleranz eines Profils als Zahl (Dezimal-Komma ausser im Englischen). */
function fmtTolerance(profile: LevelProfile, lang: Language): string {
  const fixed = LEVEL_TOLERANCES[profile].toFixed(1);
  return lang === "en" ? fixed : fixed.replace(".", ",");
}

/** Grad-Wert mit Vorzeichen formatieren (Dezimal-Komma ausser im Englischen). */
function fmtDeg(v: number, lang: Language): string {
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  const fixed = Math.abs(v).toFixed(1);
  return `${sign}${lang === "en" ? fixed : fixed.replace(".", ",")}°`;
}

export default function LevelPage() {
  const { lang, t } = useI18n();
  const { reading, active, permission, start } = useDeviceTilt();
  // Display anlassen, solange die Wasserwaage offen und sichtbar ist
  const wakeLock = useWakeLock();
  const [calibration, setCalibration] = useState<Tilt>(() => loadCalibration());
  const [screenAngle, setScreenAngle] = useState<number>(() =>
    typeof window === "undefined" ? 0 : currentScreenAngle()
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    loadSoundEnabled()
  );
  const [profile, setProfile] = useState<LevelProfile>(() => loadProfile());

  // Sensor direkt starten (Android/Desktop); iOS verlangt den Button unten
  useEffect(() => {
    void start();
  }, [start]);

  useEffect(() => {
    const onChange = () => setScreenAngle(currentScreenAngle());
    window.addEventListener("orientationchange", onChange);
    screen.orientation?.addEventListener?.("change", onChange);
    return () => {
      window.removeEventListener("orientationchange", onChange);
      screen.orientation?.removeEventListener?.("change", onChange);
    };
  }, []);

  const rawTilt = useMemo<Tilt | null>(
    () =>
      reading ? screenTilt(reading.beta, reading.gamma, screenAngle) : null,
    [reading, screenAngle]
  );
  const tilt = useMemo<Tilt | null>(
    () =>
      rawTilt
        ? {
            pitch: rawTilt.pitch - calibration.pitch,
            roll: rawTilt.roll - calibration.roll,
          }
        : null,
    [rawTilt, calibration]
  );
  const advice = tilt ? levelingAdvice(tilt, undefined, lang, profile) : null;
  const bubble = tilt ? bubblePosition(tilt, MAX_DEG) : { x: 0, y: 0 };
  const isCalibrated = calibration.pitch !== 0 || calibration.roll !== 0;

  // Signal nur beim ÜBERGANG «nicht im Lot» → «im Lot»; solange es im Lot
  // bleibt, passiert nichts mehr. Erst wenn der Zustand verlassen wurde,
  // kann es beim nächsten Treffer wieder piepsen.
  const wasLevel = useRef(false);
  useEffect(() => {
    const nowLevel = advice?.level === true;
    if (nowLevel && !wasLevel.current && soundEnabled) {
      playLevelBeep();
      vibrateLevel();
    }
    wasLevel.current = nowLevel;
  }, [advice?.level, soundEnabled]);

  return (
    <div className="container max-w-xl py-6">
      <PageHeader title={t.level.title} subtitle={t.level.subtitle} />

      {permission === "unsupported" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Smartphone
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              {t.level.unsupported}
            </p>
          </CardContent>
        </Card>
      )}

      {permission === "denied" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Gauge
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              {t.level.needsSensor}
            </p>
            <Button onClick={() => void start()}>
              {t.level.activateSensor}
            </Button>
          </CardContent>
        </Card>
      )}

      {active && (
        <>
          {/* Fahrzeug-Profil: bestimmt Toleranz und Formulierung der Tipps */}
          <div
            className="mb-4 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={t.level.profileLabel}
          >
            {LEVEL_PROFILES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setProfile(p);
                  saveProfile(p);
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  profile === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={profile === p}
              >
                {t.level.profileNames[p]}
              </button>
            ))}
            <span className="text-xs text-muted-foreground">
              {t.level.profileTolerance(fmtTolerance(profile, lang))}
            </span>
          </div>

          {/* Libelle */}
          <Card
            className={cn(
              "mb-4",
              advice?.level && "border-primary/60 bg-accent/30"
            )}
          >
            <CardContent className="flex flex-col items-center pt-6">
              <div
                className="relative h-64 w-64 rounded-full border-2 border-border bg-card shadow-inner"
                role="img"
                aria-label={
                  tilt
                    ? t.level.bubbleAria(
                        fmtDeg(tilt.pitch, lang),
                        fmtDeg(tilt.roll, lang)
                      )
                    : t.level.waitingSensor
                }
              >
                {/* Zielringe */}
                <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/60" />
                <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/70" />
                {/* Fadenkreuz */}
                <div className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-border/60" />
                <div className="absolute top-1/2 left-2 right-2 h-px -translate-y-1/2 bg-border/60" />
                {/* Blase: wandert zur höheren Seite (y positiv = obere Kante) */}
                <div
                  className={cn(
                    "absolute h-12 w-12 rounded-full border shadow-md transition-transform duration-100 ease-out",
                    advice?.level
                      ? "border-primary bg-primary/70"
                      : "border-chart-1 bg-chart-1/60"
                  )}
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${(bubble.x * 104).toFixed(1)}px), calc(-50% - ${(bubble.y * 104).toFixed(1)}px))`,
                  }}
                />
              </div>

              {/* Zahlen */}
              <div className="mt-5 grid w-full grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-accent/50 py-2.5">
                  <p className="font-mono text-2xl font-bold">
                    {tilt ? fmtDeg(tilt.pitch, lang) : "–"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.level.pitchLabel}
                  </p>
                </div>
                <div className="rounded-lg bg-accent/50 py-2.5">
                  <p className="font-mono text-2xl font-bold">
                    {tilt ? fmtDeg(tilt.roll, lang) : "–"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.level.rollLabel}
                  </p>
                </div>
              </div>

              {/* Status und Tipps */}
              {advice && (
                <div className="mt-4 w-full">
                  {/* Der visuelle Status ist führend: die Live-Region bleibt
                      dauerhaft im DOM und wird nur beim «im Lot» gefüllt –
                      die laufend wechselnden Tipps stehen bewusst daneben. */}
                  <div role="status">
                    {advice.level && (
                      <p className="rounded-lg bg-primary/10 px-4 py-2.5 text-center text-sm font-semibold text-primary">
                        {t.level.levelNow}
                      </p>
                    )}
                  </div>
                  {!advice.level && (
                    <ul className="space-y-1.5">
                      {advice.tips.map(tip => (
                        <li
                          key={tip}
                          className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground"
                        >
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kalibrierung */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!rawTilt}
              onClick={() => {
                if (!rawTilt) return;
                setCalibration(rawTilt);
                saveCalibration(rawTilt);
              }}
            >
              <Crosshair className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.level.zeroHere}
            </Button>
            {isCalibrated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const zero = { pitch: 0, roll: 0 };
                  setCalibration(zero);
                  saveCalibration(zero);
                }}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.level.resetCalibration}
              </Button>
            )}
          </div>
          {/* Signalton */}
          <div className="mt-4 flex items-center gap-3">
            <Switch
              id="level-sound"
              checked={soundEnabled}
              onCheckedChange={checked => {
                setSoundEnabled(checked);
                saveSoundEnabled(checked);
                // Direkt hörbar machen, was der Schalter bewirkt
                if (checked) playLevelBeep();
              }}
            />
            <div>
              <Label htmlFor="level-sound" className="text-sm">
                {t.level.soundLabel}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t.level.soundHint}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t.level.calibrationHint}
          </p>
          {wakeLock.active && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t.common.screenAwake}
            </p>
          )}
        </>
      )}
    </div>
  );
}
