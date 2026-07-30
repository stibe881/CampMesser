import { useEffect, useMemo, useState } from "react";
import { Compass, MapPin, Moon, RefreshCw, Sunrise, Sunset, Sun as SunIcon } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { getSunPosition, getSunTimes } from "@/lib/sun";

interface GeoState {
  status: "loading" | "ok" | "error";
  lat?: number;
  lng?: number;
  errorMessage?: string;
}

function fmtTime(d: Date | null) {
  return d ? d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }) : "–";
}

function directionLabel(azimuth: number): string {
  const dirs = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"];
  return dirs[Math.round(azimuth / 45) % 8];
}

/**
 * 2D-Sonnenstand-Diagramm: Kompassrose mit Sonnenbahn (Projektion von oben).
 * Der Abstand vom Zentrum entspricht dem Zenitwinkel (aussen = Horizont).
 */
function SunDiagram({
  lat,
  lng,
  selectedDate,
}: {
  lat: number;
  lng: number;
  selectedDate: Date;
}) {
  const size = 340;
  const c = size / 2;
  const rHorizon = size / 2 - 30;

  const toXY = (azimuth: number, altitude: number) => {
    const r = rHorizon * (1 - Math.max(0, altitude) / 90);
    const rad = ((azimuth - 90) * Math.PI) / 180;
    return { x: c + r * Math.cos(rad), y: c + r * Math.sin(rad) };
  };

  // Sonnenbahn des Tages, aufgeteilt in «schon vergangen» und «kommt noch»
  const { pastPath, futurePath, riseXY, setXY } = useMemo(() => {
    const past: { x: number; y: number }[] = [];
    const future: { x: number; y: number }[] = [];
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const selectedMs = selectedDate.getTime();
    let rise: { x: number; y: number } | null = null;
    let set: { x: number; y: number } | null = null;
    for (let m = 0; m < 1440; m += 5) {
      const t = new Date(dayStart.getTime() + m * 60000);
      const pos = getSunPosition(t, lat, lng);
      if (pos.altitude > 0) {
        const xy = toXY(pos.azimuth, pos.altitude);
        if (!rise) rise = toXY(pos.azimuth, 0);
        set = toXY(pos.azimuth, 0);
        if (t.getTime() <= selectedMs) past.push(xy);
        else future.push(xy);
      }
    }
    // Übergangspunkt verbinden, damit keine Lücke entsteht
    if (past.length > 0 && future.length > 0) future.unshift(past[past.length - 1]);
    const toPath = (pts: { x: number; y: number }[]) =>
      pts.length < 2
        ? ""
        : pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    return { pastPath: toPath(past), futurePath: toPath(future), riseXY: rise, setXY: set };
  }, [lat, lng, selectedDate]);

  const sunPos = getSunPosition(selectedDate, lat, lng);
  const sunXY = toXY(sunPos.azimuth, sunPos.altitude);
  const isUp = sunPos.altitude > 0;

  // Stundenmarkierungen auf der Bahn
  const hourMarks = useMemo(() => {
    const marks: { x: number; y: number; label: string }[] = [];
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    for (let h = 0; h < 24; h += 3) {
      const t = new Date(dayStart.getTime() + h * 3600000);
      const pos = getSunPosition(t, lat, lng);
      if (pos.altitude > 2) {
        const xy = toXY(pos.azimuth, pos.altitude);
        marks.push({ ...xy, label: `${h} Uhr` });
      }
    }
    return marks;
  }, [lat, lng, selectedDate]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto w-full max-w-sm"
      role="img"
      aria-label={`Sonnenstand-Diagramm: Sonne aktuell im ${directionLabel(sunPos.azimuth)} bei ${Math.round(sunPos.altitude)} Grad Höhe`}
    >
      <defs>
        <radialGradient id="skyGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.55" />
          <stop offset="70%" stopColor="var(--color-accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-card)" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5B841" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#F5B841" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Himmel (Blick von oben auf die Himmelskuppel) */}
      <circle cx={c} cy={c} r={rHorizon} fill="url(#skyGradient)" stroke="var(--color-border)" strokeWidth="2" />
      {/* Höhen-Ringe: 30° und 60° über dem Horizont */}
      {[2 / 3, 1 / 3].map(f => (
        <circle key={f} cx={c} cy={c} r={rHorizon * f} fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 5" opacity="0.8" />
      ))}
      <text x={c + 5} y={c - rHorizon + 12} fontSize="8" fill="var(--color-muted-foreground)">Horizont (0°)</text>
      <text x={c + 5} y={c - rHorizon * (2 / 3) + 10} fontSize="8" fill="var(--color-muted-foreground)">30° hoch</text>
      <text x={c + 5} y={c - rHorizon / 3 + 10} fontSize="8" fill="var(--color-muted-foreground)">60° hoch</text>

      {/* Himmelsrichtungen */}
      {[
        { label: "N", az: 0, full: "Norden" },
        { label: "O", az: 90, full: "Osten" },
        { label: "S", az: 180, full: "Süden" },
        { label: "W", az: 270, full: "Westen" },
      ].map(({ label, az }) => {
        const rad = ((az - 90) * Math.PI) / 180;
        const x = c + (rHorizon + 18) * Math.cos(rad);
        const y = c + (rHorizon + 18) * Math.sin(rad);
        return (
          <text
            key={label}
            x={x}
            y={y + 4}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill={label === "N" ? "var(--color-destructive)" : "var(--color-muted-foreground)"}
          >
            {label}
          </text>
        );
      })}

      {/* Sonnenbahn: vergangen (blass) und noch kommend (kräftig) */}
      {pastPath && (
        <path d={pastPath} fill="none" stroke="var(--color-chart-1)" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      )}
      {futurePath && (
        <path d={futurePath} fill="none" stroke="var(--color-chart-1)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      )}

      {/* Auf- und Untergangspunkte am Horizont */}
      {riseXY && (
        <g>
          <circle cx={riseXY.x} cy={riseXY.y} r="5" fill="var(--color-card)" stroke="var(--color-chart-1)" strokeWidth="2" />
          <text x={riseXY.x} y={riseXY.y + 16} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="var(--color-muted-foreground)">Aufgang</text>
        </g>
      )}
      {setXY && (
        <g>
          <circle cx={setXY.x} cy={setXY.y} r="5" fill="var(--color-card)" stroke="var(--color-chart-1)" strokeWidth="2" />
          <text x={setXY.x} y={setXY.y + 16} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="var(--color-muted-foreground)">Untergang</text>
        </g>
      )}

      {/* Stundenmarken */}
      {hourMarks.map(m => (
        <g key={m.label}>
          <circle cx={m.x} cy={m.y} r="2.5" fill="var(--color-foreground)" opacity="0.55" />
          <text x={m.x} y={m.y - 6} textAnchor="middle" fontSize="7.5" fontWeight="600" fill="var(--color-muted-foreground)">
            {m.label}
          </text>
        </g>
      ))}

      {/* Richtungslinie vom Standort zur Sonne */}
      {isUp && (
        <line
          x1={c}
          y1={c}
          x2={sunXY.x}
          y2={sunXY.y}
          stroke="#F5B841"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.7"
        />
      )}

      {/* Zentrum = Standort */}
      <circle cx={c} cy={c} r="10" fill="var(--color-primary)" opacity="0.15" />
      <circle cx={c} cy={c} r="4.5" fill="var(--color-primary)" stroke="var(--color-card)" strokeWidth="1.5" />
      <text x={c} y={c + 20} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-foreground)">
        Du bist hier
      </text>

      {/* Sonne mit Strahlen */}
      {isUp && (
        <g>
          <circle cx={sunXY.x} cy={sunXY.y} r="20" fill="url(#sunGlow)" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * 45 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={sunXY.x + 10.5 * Math.cos(a)}
                y1={sunXY.y + 10.5 * Math.sin(a)}
                x2={sunXY.x + 14 * Math.cos(a)}
                y2={sunXY.y + 14 * Math.sin(a)}
                stroke="#E09B2D"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
          <circle cx={sunXY.x} cy={sunXY.y} r="8.5" fill="#F5B841" stroke="#E09B2D" strokeWidth="1.5" />
        </g>
      )}
      {/* Mond-Symbol, wenn die Sonne unter dem Horizont ist */}
      {!isUp && (
        <g opacity="0.75">
          <circle cx={c} cy={c - rHorizon / 2} r="9" fill="var(--color-muted-foreground)" opacity="0.25" />
          <path
            d={`M ${c + 3} ${c - rHorizon / 2 - 6} a 6.5 6.5 0 1 0 0 12 a 5 5 0 1 1 0 -12`}
            fill="var(--color-muted-foreground)"
          />
          <text x={c} y={c - rHorizon / 2 + 22} textAnchor="middle" fontSize="8.5" fill="var(--color-muted-foreground)">
            Sonne unter dem Horizont
          </text>
        </g>
      )}
    </svg>
  );
}

export default function SunCompassPage() {
  // Optional: Koordinaten aus URL-Parametern (z. B. von Zeltplatz-Favoriten)
  const [urlSpot] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get("lat") ?? "");
    const lon = parseFloat(params.get("lon") ?? "");
    const name = params.get("name");
    if (!Number.isNaN(lat) && !Number.isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon, name: name ?? undefined };
    }
    return null;
  });
  const [geo, setGeo] = useState<GeoState>(() =>
    urlSpot ? { status: "ok", lat: urlSpot.lat, lng: urlSpot.lon } : { status: "loading" },
  );
  const [baseDate] = useState(() => new Date());
  const [minutes, setMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const locate = () => {
    if (!navigator.geolocation) {
      setGeo({ status: "error", errorMessage: "Dieses Gerät unterstützt keine Standortermittlung." });
      return;
    }
    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      pos => setGeo({ status: "ok", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err =>
        setGeo({
          status: "error",
          errorMessage:
            err.code === err.PERMISSION_DENIED
              ? "Standortzugriff verweigert. Bitte in den Browser-Einstellungen erlauben."
              : "Standort konnte nicht ermittelt werden.",
        }),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  };

  useEffect(() => {
    if (!urlSpot) locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDate = useMemo(() => {
    const d = new Date(baseDate);
    d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return d;
  }, [baseDate, minutes]);

  const spotBanner = urlSpot ? (
    <div className="mb-4 flex items-center justify-between gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
      <span>
        Sonnenstand für gespeicherten Zeltplatz{urlSpot.name ? `: ${urlSpot.name}` : ""}
      </span>
      <button
        type="button"
        onClick={() => {
          window.history.replaceState(null, "", "/sonne");
          locate();
        }}
        className="shrink-0 font-medium text-primary underline"
      >
        Eigenen Standort nutzen
      </button>
    </div>
  ) : null;

  const sunTimes = useMemo(
    () => (geo.status === "ok" ? getSunTimes(selectedDate, geo.lat!, geo.lng!) : null),
    [geo, selectedDate],
  );
  const sunPos = useMemo(
    () => (geo.status === "ok" ? getSunPosition(selectedDate, geo.lat!, geo.lng!) : null),
    [geo, selectedDate],
  );

  const timeLabel = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader
        title="Sonnenstand-Kompass"
        subtitle="Wo steht die Sonne wann? Perfekt für die Wahl des Stellplatzes und die Ausrichtung der Solarpanels."
      />

      {spotBanner}

      {geo.status === "loading" && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6 text-muted-foreground">
            <Compass className="h-5 w-5 animate-pulse" aria-hidden="true" />
            Standort wird ermittelt …
          </CardContent>
        </Card>
      )}

      {geo.status === "error" && (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-destructive">{geo.errorMessage}</p>
            <Button variant="outline" onClick={locate}>
              <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      )}

      {geo.status === "ok" && sunTimes && sunPos && (
        <>
          {/* Verständliche Live-Zusammenfassung */}
          <div className="mb-4 rounded-xl bg-primary px-4 py-3.5 text-primary-foreground">
            <p className="text-sm leading-relaxed">
              {sunPos.altitude > 0 ? (
                <>
                  Um <strong>{timeLabel} Uhr</strong> steht die Sonne im{" "}
                  <strong>{directionLabel(sunPos.azimuth)}</strong> ({Math.round(sunPos.azimuth)}°),{" "}
                  <strong>{Math.round(sunPos.altitude)}°</strong> über dem Horizont
                  {sunPos.altitude > 45
                    ? " – fast senkrecht, kaum Schatten."
                    : sunPos.altitude > 20
                      ? " – Bäume und Zelte werfen mittellange Schatten."
                      : " – tiefer Stand, lange Schatten: Hindernisse verschatten jetzt viel."}
                </>
              ) : (
                <>
                  Um <strong>{timeLabel} Uhr</strong> ist die Sonne unter dem Horizont. Nächster
                  Aufgang: <strong>{fmtTime(sunTimes.sunrise)} Uhr</strong> im Osten.
                </>
              )}
            </p>
          </div>

          {/* Diagramm */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <p className="mb-3 text-center text-xs text-muted-foreground">
                Blick von oben auf deinen Platz: Aussenring = Horizont, Mitte = senkrecht über dir.
              </p>
              <SunDiagram lat={geo.lat!} lng={geo.lng!} selectedDate={selectedDate} />

              {/* Legende */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-hidden="true">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-[#E09B2D] bg-[#F5B841]" />
                  Sonne jetzt
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1 w-5 rounded-full bg-chart-1 opacity-90" />
                  Bahn (kommt noch)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1 w-5 rounded-full bg-chart-1 opacity-30" />
                  Bahn (vorbei)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-card bg-primary" />
                  Dein Standort
                </span>
              </div>

              {/* Zeit-Slider */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="time-slider" className="text-sm font-medium text-muted-foreground">
                    Zieh den Regler, um in die Zukunft zu schauen
                  </label>
                  <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold">
                    {timeLabel} Uhr
                  </span>
                </div>
                <Slider
                  id="time-slider"
                  min={0}
                  max={1439}
                  step={5}
                  value={[minutes]}
                  onValueChange={v => setMinutes(v[0])}
                  aria-label="Uhrzeit für die Sonnenstand-Anzeige wählen"
                />
                <div className="mt-1.5 flex justify-between text-xs text-muted-foreground" aria-hidden="true">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>24:00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kennzahlen */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-3.5 text-center">
              <Sunrise className="mx-auto mb-1 h-5 w-5 text-chart-1" aria-hidden="true" />
              <p className="font-mono text-sm font-semibold">{fmtTime(sunTimes.sunrise)}</p>
              <p className="text-xs text-muted-foreground">Sonnenaufgang</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5 text-center">
              <Sunset className="mx-auto mb-1 h-5 w-5 text-chart-1" aria-hidden="true" />
              <p className="font-mono text-sm font-semibold">{fmtTime(sunTimes.sunset)}</p>
              <p className="text-xs text-muted-foreground">Sonnenuntergang</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5 text-center">
              {sunPos.altitude > 0 ? (
                <SunIcon className="mx-auto mb-1 h-5 w-5 text-chart-1" aria-hidden="true" />
              ) : (
                <Moon className="mx-auto mb-1 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              )}
              <p className="font-mono text-sm font-semibold">
                {sunPos.altitude > 0 ? `${sunPos.altitude.toFixed(0)}°` : "unter Horizont"}
              </p>
              <p className="text-xs text-muted-foreground">Sonnenhöhe um {timeLabel}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5 text-center">
              <Compass className="mx-auto mb-1 h-5 w-5 text-primary" aria-hidden="true" />
              <p className="font-mono text-sm font-semibold">
                {sunPos.azimuth.toFixed(0)}° ({directionLabel(sunPos.azimuth)})
              </p>
              <p className="text-xs text-muted-foreground">Richtung um {timeLabel}</p>
            </div>
          </div>

          {/* Standort & Tipps */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Standort: {geo.lat!.toFixed(4)}, {geo.lng!.toFixed(4)}
                <Button variant="ghost" size="sm" className="ml-auto" onClick={locate} aria-label="Standort aktualisieren">
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-accent/50">
            <CardContent className="pt-6 text-sm leading-relaxed">
              <p className="mb-2 font-semibold">Tipps für den Stellplatz</p>
              <p className="mb-2 text-muted-foreground">
                <strong className="text-foreground">Morgens Schatten:</strong> Stelle das Zelt so,
                dass im Osten (Sonnenaufgang um {fmtTime(sunTimes.sunrise)}) Bäume oder ein Hang
                stehen – so bleibt es im Zelt länger kühl.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Solarpanels:</strong> Richte die Panels nach
                Süden aus. Um die Mittagszeit steht die Sonne mit{" "}
                {Math.round(getSunPosition(sunTimes.solarNoon, geo.lat!, geo.lng!).altitude)}° am
                höchsten – der{" "}
                <a href="/energie" className="font-medium text-primary hover:underline">
                  Energie-Budget-Rechner
                </a>{" "}
                hilft bei der Ertragsplanung.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
