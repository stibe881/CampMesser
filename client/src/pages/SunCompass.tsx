import { useEffect, useMemo, useState } from "react";
import {
  Compass,
  MapPin,
  Moon,
  Mountain,
  Plus,
  RefreshCw,
  Sunrise,
  Sunset,
  Sun as SunIcon,
  Trash2,
  TreePine,
  Building2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { getSunPosition, getSunTimes } from "@/lib/sun";
import { isBlocked, type ObstacleShape } from "@shared/obstacles";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";

interface GeoState {
  status: "loading" | "ok" | "error";
  lat?: number;
  lng?: number;
  errorMessage?: string;
}

/** Ein Hindernis am Horizont: verdeckt einen Richtungs-Sektor bis zu einer bestimmten Höhe. */
interface Obstacle extends ObstacleShape {
  id: string;
  kind: "baum" | "berg" | "gebaeude";
}

const OBSTACLE_KINDS = {
  baum: { label: "Baum / Wald", icon: TreePine, defaultHeight: 25, defaultWidth: 30 },
  berg: { label: "Berg / Hügel", icon: Mountain, defaultHeight: 15, defaultWidth: 60 },
  gebaeude: { label: "Gebäude", icon: Building2, defaultHeight: 30, defaultWidth: 20 },
} as const;

const OBSTACLES_STORAGE_KEY = "campmesser.sunObstacles.v1";

function loadObstacles(): Obstacle[] {
  try {
    const raw = localStorage.getItem(OBSTACLES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Obstacle[];
    return Array.isArray(parsed) ? parsed.filter(o => o && typeof o.azimuth === "number") : [];
  } catch {
    return [];
  }
}

/** Zusammenhängende Schatten-Zeitfenster eines Tages berechnen (nur während die Sonne über dem Horizont ist). */
function computeShadowWindows(
  date: Date,
  lat: number,
  lng: number,
  obstacles: Obstacle[],
): { from: Date; to: Date }[] {
  if (obstacles.length === 0) return [];
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const windows: { from: Date; to: Date }[] = [];
  let openStart: Date | null = null;
  for (let m = 0; m <= 1440; m += 5) {
    const t = new Date(dayStart.getTime() + m * 60000);
    const pos = getSunPosition(t, lat, lng);
    const shadowed = pos.altitude > 0 && isBlocked(pos.azimuth, pos.altitude, obstacles);
    if (shadowed && !openStart) openStart = t;
    if (!shadowed && openStart) {
      windows.push({ from: openStart, to: t });
      openStart = null;
    }
  }
  if (openStart) windows.push({ from: openStart, to: new Date(dayStart.getTime() + 1440 * 60000) });
  return windows;
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
  obstacles,
  placeMode,
  onPlace,
  rotation = 0,
  deviceHeading = null,
}: {
  lat: number;
  lng: number;
  selectedDate: Date;
  obstacles: Obstacle[];
  /** Wenn aktiv, setzt ein Tipp aufs Diagramm ein Hindernis. */
  placeMode: boolean;
  onPlace?: (azimuth: number, height: number) => void;
  /** Rotation des gesamten Diagramms in Grad (Live-Kompass: -Geräte-Heading). */
  rotation?: number;
  /** Geräte-Blickrichtung in Grad (0 = Nord). Zeichnet einen Sichtkegel, wenn gesetzt. */
  deviceHeading?: number | null;
}) {
  const size = 340;
  const c = size / 2;
  const rHorizon = size / 2 - 30;

  /** Klick-/Tipp-Position im SVG in Azimut (0–360°) und Höhe (0–89°) umrechnen. */
  const handlePointer = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!placeMode || !onPlace) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * size;
    const y = ((e.clientY - rect.top) / rect.height) * size;
    const dx = x - c;
    const dy = y - c;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r > rHorizon + 12) return; // ausserhalb der Himmelskuppel
    // Bei gedrehtem Diagramm (Live-Kompass) die Rotation herausrechnen
    const azimuth = (((Math.atan2(dy, dx) * 180) / Math.PI + 90 - rotation) + 720) % 360;
    const height = Math.min(89, Math.max(1, Math.round((1 - Math.min(r, rHorizon) / rHorizon) * 90)));
    onPlace(Math.round(azimuth), height);
  };

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
  const sunBlocked = isUp && isBlocked(sunPos.azimuth, sunPos.altitude, obstacles);

  /** Ring-Sektor-Pfad für ein Hindernis: vom Horizont (aussen) bis zur Oberkante (innen). */
  const obstaclePath = (o: Obstacle) => {
    const rInner = rHorizon * (1 - Math.min(o.height, 89) / 90);
    const a0 = o.azimuth - o.width / 2;
    const a1 = o.azimuth + o.width / 2;
    const pt = (az: number, r: number) => {
      const rad = ((az - 90) * Math.PI) / 180;
      return `${(c + r * Math.cos(rad)).toFixed(1)} ${(c + r * Math.sin(rad)).toFixed(1)}`;
    };
    const large = o.width > 180 ? 1 : 0;
    return [
      `M ${pt(a0, rHorizon)}`,
      `A ${rHorizon} ${rHorizon} 0 ${large} 1 ${pt(a1, rHorizon)}`,
      `L ${pt(a1, rInner)}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${pt(a0, rInner)}`,
      "Z",
    ].join(" ");
  };

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
      className={`mx-auto w-full max-w-sm ${placeMode ? "cursor-crosshair" : ""}`}
      onClick={handlePointer}
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: "transform 0.25s ease-out",
        transformOrigin: "center",
      }}
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

      {/* Hindernis-Sektoren am Horizont */}
      {obstacles.map(o => {
        const Icon = OBSTACLE_KINDS[o.kind];
        void Icon;
        const midRad = ((o.azimuth - 90) * Math.PI) / 180;
        const rMid = rHorizon * (1 - Math.min(o.height, 89) / 90 / 2);
        return (
          <g key={o.id}>
            <path
              d={obstaclePath(o)}
              fill="var(--color-primary)"
              opacity="0.22"
              stroke="var(--color-primary)"
              strokeWidth="1"
              strokeOpacity="0.45"
            />
            <text
              x={c + rMid * Math.cos(midRad)}
              y={c + rMid * Math.sin(midRad) + 3}
              textAnchor="middle"
              fontSize="9"
              aria-hidden="true"
            >
              {o.kind === "baum" ? "🌲" : o.kind === "berg" ? "⛰️" : "🏠"}
            </text>
          </g>
        );
      })}

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

      {/* Sichtkegel: zeigt die Blickrichtung des Smartphones (Live-Kompass) */}
      {deviceHeading !== null && deviceHeading !== undefined && (
        <g>
          {(() => {
            const cone = 25; // halber Öffnungswinkel in Grad
            const rad = (a: number) => ((a - 90) * Math.PI) / 180;
            const r = rHorizon;
            const a1 = rad(deviceHeading - cone);
            const a2 = rad(deviceHeading + cone);
            const x1 = c + r * Math.cos(a1);
            const y1 = c + r * Math.sin(a1);
            const x2 = c + r * Math.cos(a2);
            const y2 = c + r * Math.sin(a2);
            const tipA = rad(deviceHeading);
            const tipX = c + r * 0.92 * Math.cos(tipA);
            const tipY = c + r * 0.92 * Math.sin(tipA);
            return (
              <>
                <path
                  d={`M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                  fill="var(--color-primary)"
                  opacity="0.14"
                />
                <line
                  x1={c}
                  y1={c}
                  x2={tipX}
                  y2={tipY}
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  opacity="0.6"
                />
                <path
                  d={`M ${tipX} ${tipY} l -5 10 l 5 -3.5 l 5 3.5 Z`}
                  fill="var(--color-primary)"
                  transform={`rotate(${deviceHeading} ${tipX} ${tipY})`}
                  opacity="0.85"
                />
              </>
            );
          })()}
        </g>
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
          <circle cx={sunXY.x} cy={sunXY.y} r="20" fill="url(#sunGlow)" opacity={sunBlocked ? 0.35 : 1} />
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
                opacity={sunBlocked ? 0.35 : 1}
              />
            );
          })}
          <circle
            cx={sunXY.x}
            cy={sunXY.y}
            r="8.5"
            fill="#F5B841"
            stroke="#E09B2D"
            strokeWidth="1.5"
            opacity={sunBlocked ? 0.4 : 1}
          />
          {sunBlocked && (
            <text x={sunXY.x} y={sunXY.y - 16} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--color-destructive)">
              im Schatten
            </text>
          )}
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
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => loadObstacles());
  const [newKind, setNewKind] = useState<Obstacle["kind"]>("baum");
  const [newAzimuth, setNewAzimuth] = useState("180");
  const [newHeight, setNewHeight] = useState("25");
  const [newWidth, setNewWidth] = useState("30");
  const [placeMode, setPlaceMode] = useState(false);
  const compass = useDeviceHeading();

  const saveObstacles = (next: Obstacle[]) => {
    setObstacles(next);
    try {
      localStorage.setItem(OBSTACLES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Speicher voll oder blockiert – Anzeige funktioniert trotzdem */
    }
  };

  const addObstacle = () => {
    const az = parseFloat(newAzimuth.replace(",", "."));
    const h = parseFloat(newHeight.replace(",", "."));
    const w = parseFloat(newWidth.replace(",", "."));
    if (Number.isNaN(az) || az < 0 || az > 360) return;
    const next: Obstacle = {
      id: `${Date.now()}`,
      kind: newKind,
      azimuth: ((az % 360) + 360) % 360,
      height: Number.isNaN(h) ? OBSTACLE_KINDS[newKind].defaultHeight : Math.min(Math.max(h, 1), 89),
      width: Number.isNaN(w) ? OBSTACLE_KINDS[newKind].defaultWidth : Math.min(Math.max(w, 5), 180),
    };
    saveObstacles([...obstacles, next]);
  };

  /** Hindernis per Tipp aufs Diagramm setzen: Richtung und Höhe aus der Position, Breite je nach Art. */
  const placeObstacleAt = (azimuth: number, height: number) => {
    const next: Obstacle = {
      id: `${Date.now()}`,
      kind: newKind,
      azimuth,
      height,
      width: OBSTACLE_KINDS[newKind].defaultWidth,
    };
    saveObstacles([...obstacles, next]);
    setPlaceMode(false);
  };

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

  // Slider auf die aktuelle Uhrzeit stellen, wenn die App aus dem Hintergrund
  // zurückkehrt (bei installierter PWA bleibt die Seite sonst auf der alten Zeit stehen)
  useEffect(() => {
    const syncToNow = () => {
      if (document.visibilityState === "visible") {
        const now = new Date();
        setMinutes(now.getHours() * 60 + now.getMinutes());
      }
    };
    document.addEventListener("visibilitychange", syncToNow);
    return () => document.removeEventListener("visibilitychange", syncToNow);
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

  const shadowWindows = useMemo(
    () =>
      geo.status === "ok"
        ? computeShadowWindows(selectedDate, geo.lat!, geo.lng!, obstacles)
        : [],
    [geo, selectedDate, obstacles],
  );
  const sunBlockedNow =
    sunPos !== null && sunPos.altitude > 0 && isBlocked(sunPos.azimuth, sunPos.altitude, obstacles);

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
                  {sunBlockedNow
                    ? " – aber ein eingetragenes Hindernis verdeckt sie: dein Platz liegt im Schatten."
                    : sunPos.altitude > 45
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
              {placeMode && (
                <div className="mb-3 rounded-lg border border-primary/40 bg-accent/60 px-3 py-2 text-center text-sm text-accent-foreground">
                  Tippe jetzt auf die Stelle im Diagramm, wo das Hindernis (
                  {OBSTACLE_KINDS[newKind].label}) steht – Richtung und Höhe werden automatisch
                  übernommen.{" "}
                  <button
                    type="button"
                    onClick={() => setPlaceMode(false)}
                    className="font-medium text-primary underline"
                  >
                    Abbrechen
                  </button>
                </div>
              )}
              {/* Live-Kompass: Diagramm dreht sich mit der Geräte-Ausrichtung */}
              <div className="mb-3 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant={compass.active ? "default" : "outline"}
                  size="sm"
                  onClick={() => (compass.active ? compass.stop() : void compass.start())}
                >
                  <Compass className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {compass.active ? "Live-Kompass aus" : "Live-Kompass ein"}
                </Button>
                {compass.active && compass.heading !== null && (
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold">
                    {Math.round(compass.heading)}° {directionLabel(compass.heading)}
                  </span>
                )}
              </div>
              {compass.permission === "denied" && (
                <p className="mb-3 text-center text-xs text-destructive">
                  Zugriff auf den Bewegungssensor wurde abgelehnt – erlaube ihn in den
                  Browser-Einstellungen, um den Live-Kompass zu nutzen.
                </p>
              )}
              {compass.permission === "unsupported" && (
                <p className="mb-3 text-center text-xs text-muted-foreground">
                  Dieses Gerät hat keinen Richtungssensor – der Live-Kompass funktioniert nur auf
                  Smartphones und Tablets.
                </p>
              )}
              {compass.active && compass.heading === null && (
                <p className="mb-3 text-center text-xs text-muted-foreground">
                  Warte auf Sensordaten … bewege das Gerät leicht in einer Acht, um den Kompass zu
                  kalibrieren.
                </p>
              )}
              <SunDiagram
                lat={geo.lat!}
                lng={geo.lng!}
                selectedDate={selectedDate}
                obstacles={obstacles}
                placeMode={placeMode}
                onPlace={placeObstacleAt}
                rotation={compass.active && compass.heading !== null ? -compass.heading : 0}
                deviceHeading={compass.active ? compass.heading : null}
              />

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
                {obstacles.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-primary opacity-25 ring-1 ring-primary/50" />
                    Hindernis
                  </span>
                )}
              </div>

              {/* Zeit-Slider */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="time-slider" className="text-sm font-medium text-muted-foreground">
                    Zieh den Regler, um in die Zukunft zu schauen
                  </label>
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setMinutes(now.getHours() * 60 + now.getMinutes());
                      }}
                      className="rounded-md border border-border px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent"
                      aria-label="Regler auf die aktuelle Uhrzeit stellen"
                    >
                      Jetzt
                    </button>
                    <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold">
                      {timeLabel} Uhr
                    </span>
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
                {/* Sonnenauf-/-untergangs-Marker auf der Slider-Achse */}
                {sunTimes && sunTimes.sunrise && sunTimes.sunset && (
                  <div className="relative mt-1 h-5" aria-hidden="true">
                    <span
                      className="absolute flex -translate-x-1/2 flex-col items-center"
                      style={{
                        left: `${((sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes()) / 1439) * 100}%`,
                      }}
                      title="Sonnenaufgang"
                    >
                      <Sunrise className="h-4 w-4 text-chart-1" />
                    </span>
                    <span
                      className="absolute flex -translate-x-1/2 flex-col items-center"
                      style={{
                        left: `${((sunTimes.sunset.getHours() * 60 + sunTimes.sunset.getMinutes()) / 1439) * 100}%`,
                      }}
                      title="Sonnenuntergang"
                    >
                      <Sunset className="h-4 w-4 text-destructive" />
                    </span>
                  </div>
                )}
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
          {/* Hindernis-Profil: Bäume, Berge, Gebäude erfassen und Schattenzeiten sehen */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <p className="mb-1 flex items-center gap-2 font-semibold">
                <TreePine className="h-4 w-4 text-primary" aria-hidden="true" />
                Hindernisse am Horizont
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                Trage Bäume, Berge oder Gebäude rund um deinen Platz ein. Der Kompass zeigt sie im
                Diagramm und berechnet, wann sie die Sonne verdecken – wichtig für Zelt und
                Solarpanels.
              </p>

              {obstacles.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {obstacles.map(o => {
                    const Icon = OBSTACLE_KINDS[o.kind].icon;
                    return (
                      <li
                        key={o.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          {OBSTACLE_KINDS[o.kind].label} im {directionLabel(o.azimuth)} (
                          {Math.round(o.azimuth)}°) · {Math.round(o.height)}° hoch ·{" "}
                          {Math.round(o.width)}° breit
                        </span>
                        <button
                          type="button"
                          onClick={() => saveObstacles(obstacles.filter(x => x.id !== o.id))}
                          aria-label={`${OBSTACLE_KINDS[o.kind].label} entfernen`}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <Label htmlFor="obstacle-kind" className="text-xs">
                    Art
                  </Label>
                  <Select
                    value={newKind}
                    onValueChange={v => {
                      const kind = v as Obstacle["kind"];
                      setNewKind(kind);
                      setNewHeight(String(OBSTACLE_KINDS[kind].defaultHeight));
                      setNewWidth(String(OBSTACLE_KINDS[kind].defaultWidth));
                    }}
                  >
                    <SelectTrigger id="obstacle-kind">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OBSTACLE_KINDS).map(([value, def]) => (
                        <SelectItem key={value} value={value}>
                          {def.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="obstacle-azimuth" className="text-xs">
                    Richtung (°)
                  </Label>
                  <Input
                    id="obstacle-azimuth"
                    value={newAzimuth}
                    onChange={e => setNewAzimuth(e.target.value)}
                    inputMode="numeric"
                    placeholder="180 = Süden"
                  />
                </div>
                <div>
                  <Label htmlFor="obstacle-height" className="text-xs">
                    Höhe (°)
                  </Label>
                  <Input
                    id="obstacle-height"
                    value={newHeight}
                    onChange={e => setNewHeight(e.target.value)}
                    inputMode="numeric"
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label htmlFor="obstacle-width" className="text-xs">
                    Breite (°)
                  </Label>
                  <Input
                    id="obstacle-width"
                    value={newWidth}
                    onChange={e => setNewWidth(e.target.value)}
                    inputMode="numeric"
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  variant={placeMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlaceMode(v => !v)}
                >
                  <Compass className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {placeMode ? "Tipp-Modus aktiv …" : "Per Tipp im Diagramm setzen"}
                </Button>
                <Button variant="outline" size="sm" onClick={addObstacle}>
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Mit Zahlen eintragen
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Tipp zur Höhe: Strecke den Arm aus – eine Faust entspricht etwa 10°. Ein Baum, der
                zweieinhalb Fäuste über dem Horizont endet, hat also rund 25°.
              </p>

              {obstacles.length > 0 && (
                <div className="mt-4 rounded-lg bg-accent/50 p-3">
                  <p className="mb-1.5 text-sm font-semibold">Schattenzeiten heute</p>
                  {shadowWindows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Deine Hindernisse verdecken die Sonne heute nie – freie Sicht den ganzen Tag.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {shadowWindows.map((w, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            <strong className="text-foreground">
                              {fmtTime(w.from)}–{fmtTime(w.to)} Uhr
                            </strong>{" "}
                            – Sonne hinter Hindernis, Platz im Schatten
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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
