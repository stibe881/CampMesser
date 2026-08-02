import { useEffect, useRef, useState } from "react";
import {
  BellOff,
  LineChart,
  Mic,
  MicOff,
  Moon,
  Trash2,
  Volume2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Camp-Quiet-Timer: misst die Umgebungslautstärke über das Mikrofon (rein lokal,
 * es wird nichts aufgezeichnet oder übertragen) und erinnert während der
 * Nachtruhe dezent, wenn Gespräche zu laut werden.
 */

const STORAGE_KEY = "campmesser.quiet.settings";

interface QuietSettings {
  quietFrom: string; // "22:00"
  quietTo: string; // "07:00"
  threshold: number; // 0–100 relativer Pegel
}

function loadSettings(): QuietSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw)
      return {
        quietFrom: "22:00",
        quietTo: "07:00",
        threshold: 55,
        ...JSON.parse(raw),
      };
  } catch {
    /* defaults */
  }
  return { quietFrom: "22:00", quietTo: "07:00", threshold: 55 };
}

/** Liegt die Uhrzeit im Nachtruhe-Fenster (kann über Mitternacht gehen)? */
export function isQuietTime(now: Date, from: string, to: string): boolean {
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = fh * 60 + (fm || 0);
  const end = th * 60 + (tm || 0);
  if (start <= end) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end; // Fenster über Mitternacht
}

export default function QuietPage() {
  const t = useT();
  const [settings, setSettings] = useState<QuietSettings>(() => loadSettings());
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const [error, setError] = useState(false);
  const [tooLoudSince, setTooLoudSince] = useState<number | null>(null);
  const [reminder, setReminder] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const lastVibrateRef = useRef(0);
  // Nacht-Protokoll: höchster Pegel pro Minute (max. 8 Stunden), bleibt nach
  // dem Stoppen für den Morgen-Rückblick erhalten
  const [history, setHistory] = useState<{ time: string; max: number }[]>([]);
  const minuteRef = useRef<{ key: string; max: number } | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  const saveSettings = (next: QuietSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* egal */
    }
  };

  // Uhr für die Nachtruhe-Anzeige
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    setListening(false);
    setLevel(0);
    setPeak(0);
    setTooLoudSince(null);
    setReminder(false);
  };

  const start = async () => {
    setError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        // RMS des Zeitsignals → relativer Pegel 0–100
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        // Logarithmische Skalierung für gefühlte Lautstärke
        const pct = Math.min(
          100,
          Math.round((Math.log10(1 + rms * 30) / Math.log10(31)) * 100)
        );
        setLevel(pct);
        setPeak(p => Math.max(p * 0.995, pct));
        // Protokoll: Maximum je Minute festhalten
        const d = new Date();
        const key = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
        if (!minuteRef.current || minuteRef.current.key !== key) {
          if (minuteRef.current) {
            const finished = minuteRef.current;
            setHistory(h => [
              ...h.slice(-479),
              { time: finished.key, max: finished.max },
            ]);
          }
          minuteRef.current = { key, max: pct };
        } else if (pct > minuteRef.current.max) {
          minuteRef.current.max = pct;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setListening(true);
    } catch {
      setError(true);
    }
  };

  // Aufräumen beim Verlassen der Seite
  useEffect(() => stop, []);

  const quietNow = isQuietTime(now, settings.quietFrom, settings.quietTo);

  // Erinnerung: Pegel länger als 3 Sekunden über der Schwelle während der Nachtruhe.
  // Zusätzlich zur visuellen Erinnerung vibriert das Handy dezent (wo unterstützt),
  // höchstens alle 15 Sekunden.
  useEffect(() => {
    if (!listening || !quietNow) {
      setTooLoudSince(null);
      setReminder(false);
      return;
    }
    if (level > settings.threshold) {
      if (tooLoudSince === null) {
        setTooLoudSince(Date.now());
      } else if (Date.now() - tooLoudSince > 3000) {
        setReminder(true);
        if (
          typeof navigator !== "undefined" &&
          "vibrate" in navigator &&
          Date.now() - lastVibrateRef.current > 15000
        ) {
          lastVibrateRef.current = Date.now();
          try {
            navigator.vibrate([200, 100, 200]);
          } catch {
            /* nicht unterstützt */
          }
        }
      }
    } else {
      setTooLoudSince(null);
      if (level < settings.threshold * 0.7) setReminder(false);
    }
  }, [level, listening, quietNow, settings.threshold, tooLoudSince]);

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={t.quiet.title} subtitle={t.quiet.subtitle} />

      {/* Status Nachtruhe */}
      <div
        className={cn(
          "mb-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm",
          quietNow
            ? "bg-primary/10 text-primary"
            : "bg-accent/60 text-accent-foreground"
        )}
      >
        <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {quietNow
          ? t.quiet.quietActive(settings.quietFrom, settings.quietTo)
          : t.quiet.quietInactive(settings.quietFrom)}
      </div>

      {/* Erinnerung */}
      {reminder && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive"
        >
          <BellOff className="h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t.quiet.shhTitle}</p>
            <p className="text-sm">{t.quiet.shhBody}</p>
            <p className="mt-1 text-xs opacity-80">{t.quiet.vibrateNote}</p>
          </div>
        </div>
      )}

      {/* Pegel-Anzeige */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Volume2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.quiet.levelTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="mb-3 h-6 overflow-hidden rounded-full bg-muted"
            aria-hidden="true"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-150",
                level > settings.threshold
                  ? "bg-destructive"
                  : level > settings.threshold * 0.75
                    ? "bg-chart-4"
                    : "bg-primary"
              )}
              style={{ width: `${level}%` }}
            />
          </div>
          <div className="mb-4 flex justify-between text-xs text-muted-foreground">
            <span>
              {t.quiet.currentLabel}{" "}
              <span className="font-mono font-semibold">{level}</span>
            </span>
            <span>
              {t.quiet.thresholdLabel}{" "}
              <span className="font-mono font-semibold">
                {settings.threshold}
              </span>
            </span>
            <span>
              {t.quiet.peakLabel}{" "}
              <span className="font-mono font-semibold">
                {Math.round(peak)}
              </span>
            </span>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => (listening ? stop() : void start())}
          >
            {listening ? (
              <>
                <MicOff className="mr-1.5 h-4 w-4" aria-hidden="true" />{" "}
                {t.quiet.stopMeasuring}
              </>
            ) : (
              <>
                <Mic className="mr-1.5 h-4 w-4" aria-hidden="true" />{" "}
                {t.quiet.startMeasuring}
              </>
            )}
          </Button>
          {error && (
            <p className="mt-2 text-xs text-destructive">{t.quiet.micError}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {t.quiet.privacyNote}
          </p>
        </CardContent>
      </Card>

      {/* Nacht-Protokoll */}
      {history.length > 1 && (
        <Card className="mb-5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <LineChart
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                {t.quiet.protocolTitle}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setHistory([]);
                  minuteRef.current = null;
                }}
                aria-label={t.quiet.clearAria}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {t.quiet.clear}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={history}
                  margin={{ top: 4, right: 4, bottom: 0, left: -22 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/60"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    minTickGap={40}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: number) => [
                      t.quiet.tooltipValue(value),
                      t.quiet.tooltipName,
                    ]}
                    labelFormatter={(label: string) =>
                      t.quiet.tooltipLabel(label)
                    }
                  />
                  <ReferenceLine
                    y={settings.threshold}
                    stroke="var(--destructive)"
                    strokeDasharray="4 4"
                  />
                  <Area
                    type="monotone"
                    dataKey="max"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.25}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.quiet.protocolNote(history.length)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Einstellungen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.quiet.settingsTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="from" className="mb-1.5 block text-xs">
                {t.quiet.fromLabel}
              </Label>
              <Input
                id="from"
                type="time"
                value={settings.quietFrom}
                onChange={e =>
                  saveSettings({ ...settings, quietFrom: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="to" className="mb-1.5 block text-xs">
                {t.quiet.toLabel}
              </Label>
              <Input
                id="to"
                type="time"
                value={settings.quietTo}
                onChange={e =>
                  saveSettings({ ...settings, quietTo: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="threshold" className="text-xs">
                {t.quiet.thresholdSetting}
              </Label>
              <span className="font-mono text-xs font-semibold">
                {settings.threshold}
              </span>
            </div>
            <Slider
              id="threshold"
              min={20}
              max={90}
              step={5}
              value={[settings.threshold]}
              onValueChange={v =>
                saveSettings({ ...settings, threshold: v[0] })
              }
              aria-label={t.quiet.thresholdAria}
            />
            <p className="mt-2 text-xs text-muted-foreground">{t.quiet.tip}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
