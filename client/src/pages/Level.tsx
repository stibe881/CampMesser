import { useEffect, useMemo, useState } from "react";
import { Crosshair, Gauge, RotateCcw, Smartphone } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { bubblePosition, levelingAdvice, screenTilt, type Tilt } from "@shared/level";
import { useDeviceTilt } from "@/hooks/useDeviceTilt";
import { cn } from "@/lib/utils";

const CALIBRATION_KEY = "campmesser.levelCalibration";
/** Ausschlag der Libelle: bei dieser Neigung liegt die Blase am Rand. */
const MAX_DEG = 10;

function loadCalibration(): Tilt {
  try {
    const raw = localStorage.getItem(CALIBRATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Tilt;
      if (typeof parsed?.pitch === "number" && typeof parsed?.roll === "number") return parsed;
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
  if (typeof screen !== "undefined" && screen.orientation) return screen.orientation.angle;
  // Ältere iOS-Versionen: window.orientation (deprecated, aber vorhanden)
  const legacy = (window as { orientation?: number }).orientation;
  return typeof legacy === "number" ? legacy : 0;
}

function fmtDeg(v: number): string {
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(1).replace(".", ",")}°`;
}

export default function LevelPage() {
  const { reading, active, permission, start } = useDeviceTilt();
  const [calibration, setCalibration] = useState<Tilt>(() => loadCalibration());
  const [screenAngle, setScreenAngle] = useState<number>(() =>
    typeof window === "undefined" ? 0 : currentScreenAngle(),
  );

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
    () => (reading ? screenTilt(reading.beta, reading.gamma, screenAngle) : null),
    [reading, screenAngle],
  );
  const tilt = useMemo<Tilt | null>(
    () =>
      rawTilt
        ? { pitch: rawTilt.pitch - calibration.pitch, roll: rawTilt.roll - calibration.roll }
        : null,
    [rawTilt, calibration],
  );
  const advice = tilt ? levelingAdvice(tilt) : null;
  const bubble = tilt ? bubblePosition(tilt, MAX_DEG) : { x: 0, y: 0 };
  const isCalibrated = calibration.pitch !== 0 || calibration.roll !== 0;

  return (
    <div className="container max-w-xl py-6">
      <PageHeader
        title="Wasserwaage"
        subtitle="Wohnwagen, Kocher oder Tisch ausrichten – Handy flach auflegen, Display nach oben."
      />

      {permission === "unsupported" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Smartphone className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Dieses Gerät hat keinen Lagesensor. Öffne die Wasserwaage auf deinem Smartphone –
              sie funktioniert komplett offline.
            </p>
          </CardContent>
        </Card>
      )}

      {permission === "denied" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Gauge className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Für die Wasserwaage braucht die App Zugriff auf den Lagesensor.
            </p>
            <Button onClick={() => void start()}>Sensor aktivieren</Button>
          </CardContent>
        </Card>
      )}

      {active && (
        <>
          {/* Libelle */}
          <Card className={cn("mb-4", advice?.level && "border-primary/60 bg-accent/30")}>
            <CardContent className="flex flex-col items-center pt-6">
              <div
                className="relative h-64 w-64 rounded-full border-2 border-border bg-card shadow-inner"
                role="img"
                aria-label={
                  tilt
                    ? `Neigung: vor/zurück ${fmtDeg(tilt.pitch)}, links/rechts ${fmtDeg(tilt.roll)}`
                    : "Warte auf Sensordaten"
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
                      : "border-chart-1 bg-chart-1/60",
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
                  <p className="font-mono text-2xl font-bold">{tilt ? fmtDeg(tilt.pitch) : "–"}</p>
                  <p className="text-xs text-muted-foreground">Vor / zurück</p>
                </div>
                <div className="rounded-lg bg-accent/50 py-2.5">
                  <p className="font-mono text-2xl font-bold">{tilt ? fmtDeg(tilt.roll) : "–"}</p>
                  <p className="text-xs text-muted-foreground">Links / rechts</p>
                </div>
              </div>

              {/* Status und Tipps */}
              {advice && (
                <div className="mt-4 w-full">
                  {advice.level ? (
                    <p className="rounded-lg bg-primary/10 px-4 py-2.5 text-center text-sm font-semibold text-primary">
                      In Waage – perfekter Stand!
                    </p>
                  ) : (
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
              Hier nullen
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
                Kalibrierung zurücksetzen
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            «Hier nullen» gleicht eine schiefe Handy-Hülle oder Tischplatte aus: Lege das Handy auf
            eine Fläche, von der du weisst, dass sie eben ist, und nulle dort. Für den Wohnwagen:
            Handy auf den Boden oder eine Arbeitsfläche im Innern legen und die tiefe Seite mit
            Keilen unterlegen, bis die Blase in der Mitte ist.
          </p>
        </>
      )}
    </div>
  );
}
