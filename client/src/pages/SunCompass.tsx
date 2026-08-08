import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Compass,
  MapPin,
  Moon,
  Mountain,
  Plus,
  RefreshCw,
  Sunrise,
  Sunset,
  Sun as SunIcon,
  Tent,
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
import { isBlocked } from "@shared/obstacles";
import { shadeTimeline, type ShadeSample } from "@shared/shadeTimeline";
import {
  delayVersusOpen,
  sunWindow,
  type SunSample,
} from "@shared/sunOverHorizon";
import { formatDuration, formatMinutes } from "@shared/turnaround";
import { compassDirection, goldenBlueHours } from "@shared/solar";
import { LOCALE_TAGS, type Language } from "@shared/i18n";
import { useI18n } from "@/i18n";
import {
  loadObstacleProfiles,
  saveObstacleProfiles,
  type Obstacle,
  type ObstacleProfiles,
} from "@/lib/obstacleStore";
import {
  getProfileObstacles,
  normalizeProfiles,
  withProfileObstacles,
} from "@shared/obstacleProfiles";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { useWakeLock } from "@/lib/useWakeLock";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { fetchHorizonReadings } from "@/lib/elevation";
import {
  buildTerrainObstacles,
  mergeTerrainObstacles,
} from "@shared/terrainHorizon";
import { cn } from "@/lib/utils";

interface GeoState {
  status: "loading" | "ok" | "error";
  lat?: number;
  lng?: number;
  errorKey?: "geoUnsupported" | "geoDenied" | "geoFailed";
}

/** Hindernis-Arten: Icon und Standardmasse (Labels kommen aus dem Wörterbuch). */
const OBSTACLE_KINDS = {
  baum: {
    icon: TreePine,
    defaultHeight: 25,
    defaultWidth: 30,
  },
  berg: {
    icon: Mountain,
    defaultHeight: 15,
    defaultWidth: 60,
  },
  gebaeude: {
    icon: Building2,
    defaultHeight: 30,
    defaultWidth: 20,
  },
} as const;

/** Zusammenhängende Schatten-Zeitfenster eines Tages berechnen (nur während die Sonne über dem Horizont ist). */
function computeShadowWindows(
  date: Date,
  lat: number,
  lng: number,
  obstacles: Obstacle[]
): { from: Date; to: Date }[] {
  if (obstacles.length === 0) return [];
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const windows: { from: Date; to: Date }[] = [];
  let openStart: Date | null = null;
  for (let m = 0; m <= 1440; m += 5) {
    const t = new Date(dayStart.getTime() + m * 60000);
    const pos = getSunPosition(t, lat, lng);
    const shadowed =
      pos.altitude > 0 && isBlocked(pos.azimuth, pos.altitude, obstacles);
    if (shadowed && !openStart) openStart = t;
    if (!shadowed && openStart) {
      windows.push({ from: openStart, to: t });
      openStart = null;
    }
  }
  if (openStart)
    windows.push({
      from: openStart,
      to: new Date(dayStart.getTime() + 1440 * 60000),
    });
  return windows;
}

/** Minute des Tages als Uhrzeit des gewählten Datums (#452). */
function minutesToDate(date: Date, minutes: number): Date {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  return new Date(dayStart.getTime() + minutes * 60000);
}

function fmtTime(d: Date | null, lang: Language) {
  return d
    ? d.toLocaleTimeString(LOCALE_TAGS[lang], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "–";
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
  const { lang, t } = useI18n();
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
    const azimuth =
      ((Math.atan2(dy, dx) * 180) / Math.PI + 90 - rotation + 720) % 360;
    const height = Math.min(
      89,
      Math.max(1, Math.round((1 - Math.min(r, rHorizon) / rHorizon) * 90))
    );
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
    if (past.length > 0 && future.length > 0)
      future.unshift(past[past.length - 1]);
    const toPath = (pts: { x: number; y: number }[]) =>
      pts.length < 2
        ? ""
        : pts
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
            )
            .join(" ");
    return {
      pastPath: toPath(past),
      futurePath: toPath(future),
      riseXY: rise,
      setXY: set,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, selectedDate]);

  const sunPos = getSunPosition(selectedDate, lat, lng);
  const sunXY = toXY(sunPos.azimuth, sunPos.altitude);
  const isUp = sunPos.altitude > 0;
  const sunBlocked =
    isUp && isBlocked(sunPos.azimuth, sunPos.altitude, obstacles);

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
      const time = new Date(dayStart.getTime() + h * 3600000);
      const pos = getSunPosition(time, lat, lng);
      if (pos.altitude > 2) {
        const xy = toXY(pos.azimuth, pos.altitude);
        marks.push({ ...xy, label: t.sunCompass.hourMark(h) });
      }
    }
    return marks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, selectedDate, t]);

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
      aria-label={t.sunCompass.diagramAria(
        compassDirection(sunPos.azimuth, lang),
        Math.round(sunPos.altitude)
      )}
    >
      <defs>
        <radialGradient id="skyGradient" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor="var(--color-accent)"
            stopOpacity="0.55"
          />
          <stop
            offset="70%"
            stopColor="var(--color-accent)"
            stopOpacity="0.25"
          />
          <stop offset="100%" stopColor="var(--color-card)" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5B841" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#F5B841" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Himmel (Blick von oben auf die Himmelskuppel) */}
      <circle
        cx={c}
        cy={c}
        r={rHorizon}
        fill="url(#skyGradient)"
        stroke="var(--color-border)"
        strokeWidth="2"
      />
      {/* Höhen-Ringe: 30° und 60° über dem Horizont */}
      {[2 / 3, 1 / 3].map(f => (
        <circle
          key={f}
          cx={c}
          cy={c}
          r={rHorizon * f}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeDasharray="3 5"
          opacity="0.8"
        />
      ))}
      <text
        x={c + 5}
        y={c - rHorizon + 12}
        fontSize="8"
        fill="var(--color-muted-foreground)"
      >
        {t.sunCompass.horizonLabel}
      </text>
      <text
        x={c + 5}
        y={c - rHorizon * (2 / 3) + 10}
        fontSize="8"
        fill="var(--color-muted-foreground)"
      >
        {t.sunCompass.ring30}
      </text>
      <text
        x={c + 5}
        y={c - rHorizon / 3 + 10}
        fontSize="8"
        fill="var(--color-muted-foreground)"
      >
        {t.sunCompass.ring60}
      </text>

      {/* Hindernis-Sektoren am Horizont */}
      {obstacles.map(o => {
        const Icon = OBSTACLE_KINDS[o.kind].icon;
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
        { key: "N", label: t.sunCompass.cardinalN, az: 0 },
        { key: "E", label: t.sunCompass.cardinalE, az: 90 },
        { key: "S", label: t.sunCompass.cardinalS, az: 180 },
        { key: "W", label: t.sunCompass.cardinalW, az: 270 },
      ].map(({ key, label, az }) => {
        const rad = ((az - 90) * Math.PI) / 180;
        const x = c + (rHorizon + 18) * Math.cos(rad);
        const y = c + (rHorizon + 18) * Math.sin(rad);
        return (
          <text
            key={key}
            x={x}
            y={y + 4}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill={
              key === "N"
                ? "var(--color-destructive)"
                : "var(--color-muted-foreground)"
            }
          >
            {label}
          </text>
        );
      })}

      {/* Sonnenbahn: vergangen (blass) und noch kommend (kräftig) */}
      {pastPath && (
        <path
          d={pastPath}
          fill="none"
          stroke="var(--color-chart-1)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.3"
        />
      )}
      {futurePath && (
        <path
          d={futurePath}
          fill="none"
          stroke="var(--color-chart-1)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
      )}

      {/* Auf- und Untergangspunkte am Horizont */}
      {riseXY && (
        <g>
          <circle
            cx={riseXY.x}
            cy={riseXY.y}
            r="5"
            fill="var(--color-card)"
            stroke="var(--color-chart-1)"
            strokeWidth="2"
          />
          <text
            x={riseXY.x}
            y={riseXY.y + 16}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="600"
            fill="var(--color-muted-foreground)"
          >
            {t.sunCompass.risePoint}
          </text>
        </g>
      )}
      {setXY && (
        <g>
          <circle
            cx={setXY.x}
            cy={setXY.y}
            r="5"
            fill="var(--color-card)"
            stroke="var(--color-chart-1)"
            strokeWidth="2"
          />
          <text
            x={setXY.x}
            y={setXY.y + 16}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="600"
            fill="var(--color-muted-foreground)"
          >
            {t.sunCompass.setPoint}
          </text>
        </g>
      )}

      {/* Stundenmarken */}
      {hourMarks.map(m => (
        <g key={m.label}>
          <circle
            cx={m.x}
            cy={m.y}
            r="2.5"
            fill="var(--color-foreground)"
            opacity="0.55"
          />
          <text
            x={m.x}
            y={m.y - 6}
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="600"
            fill="var(--color-muted-foreground)"
          >
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
      <circle
        cx={c}
        cy={c}
        r="4.5"
        fill="var(--color-primary)"
        stroke="var(--color-card)"
        strokeWidth="1.5"
      />
      <text
        x={c}
        y={c + 20}
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="var(--color-foreground)"
      >
        {t.sunCompass.youAreHere}
      </text>

      {/* Sonne mit Strahlen */}
      {isUp && (
        <g>
          <circle
            cx={sunXY.x}
            cy={sunXY.y}
            r="20"
            fill="url(#sunGlow)"
            opacity={sunBlocked ? 0.35 : 1}
          />
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
            <text
              x={sunXY.x}
              y={sunXY.y - 16}
              textAnchor="middle"
              fontSize="8.5"
              fontWeight="700"
              fill="var(--color-destructive)"
            >
              {t.sunCompass.inShadow}
            </text>
          )}
        </g>
      )}
      {/* Mond-Symbol, wenn die Sonne unter dem Horizont ist */}
      {!isUp && (
        <g opacity="0.75">
          <circle
            cx={c}
            cy={c - rHorizon / 2}
            r="9"
            fill="var(--color-muted-foreground)"
            opacity="0.25"
          />
          <path
            d={`M ${c + 3} ${c - rHorizon / 2 - 6} a 6.5 6.5 0 1 0 0 12 a 5 5 0 1 1 0 -12`}
            fill="var(--color-muted-foreground)"
          />
          <text
            x={c}
            y={c - rHorizon / 2 + 22}
            textAnchor="middle"
            fontSize="8.5"
            fill="var(--color-muted-foreground)"
          >
            {t.sunCompass.sunBelowHorizon}
          </text>
        </g>
      )}
    </svg>
  );
}

export default function SunCompassPage() {
  const { lang, t } = useI18n();
  // Display anlassen, solange der Kompass offen und sichtbar ist
  const wakeLock = useWakeLock();
  // Optional: Koordinaten aus URL-Parametern (z. B. von Zeltplatz-Favoriten)
  const [urlSpot] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get("lat") ?? "");
    const lon = parseFloat(params.get("lon") ?? "");
    const name = params.get("name");
    const spotId = parseInt(params.get("spot") ?? "", 10);
    if (
      !Number.isNaN(lat) &&
      !Number.isNaN(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180
    ) {
      return {
        lat,
        lon,
        name: name ?? undefined,
        spotId: Number.isNaN(spotId) ? null : spotId,
      };
    }
    return null;
  });
  const [geo, setGeo] = useState<GeoState>(() =>
    urlSpot
      ? { status: "ok", lat: urlSpot.lat, lng: urlSpot.lon }
      : { status: "loading" }
  );
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [minutes, setMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  // Hindernis-Profile: allgemein plus optional eines pro Zeltplatz-Favorit
  const [profiles, setProfiles] = useState<ObstacleProfiles>(() =>
    loadObstacleProfiles()
  );
  const [terrainBusy, setTerrainBusy] = useState(false);
  const [activeSpotId, setActiveSpotId] = useState<number | null>(
    () => urlSpot?.spotId ?? null
  );
  const { isAuthenticated } = useAuth();
  const { data: spots } = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const obstacles = getProfileObstacles(profiles, activeSpotId);
  const [newKind, setNewKind] = useState<Obstacle["kind"]>("baum");
  const [newAzimuth, setNewAzimuth] = useState("180");
  const [newHeight, setNewHeight] = useState("25");
  const [newWidth, setNewWidth] = useState("30");
  const [placeMode, setPlaceMode] = useState(false);
  const compass = useDeviceHeading();

  // Geräte-Sync: Hindernis-Profile vom Konto übernehmen bzw. Änderungen hochladen.
  // normalizeProfiles versteht auch die alte Array-Form (nur globales Profil).
  const obstaclesSync = useSyncedSetting<unknown>("sunObstacles", value => {
    const normalized = normalizeProfiles(value);
    if (!normalized) return;
    setProfiles(normalized);
    saveObstacleProfiles(normalized);
  });

  /** Hindernis-Liste des aktiven Profils ersetzen, lokal speichern und syncen. */
  const saveObstacles = (next: Obstacle[]) => {
    const nextProfiles = withProfileObstacles(profiles, activeSpotId, next);
    setProfiles(nextProfiles);
    saveObstacleProfiles(nextProfiles);
    obstaclesSync.push(nextProfiles);
  };

  /**
   * BERGE AUS DEM HÖHENMODELL (#372, Nutzerwunsch): Einen Baum zeichnet
   * man in zehn Sekunden; einen Alpenkamm nach Augenmass in Azimut und
   * Höhenwinkel zu übersetzen ist Raterei. Der Strahlenkranz holt 192
   * Geländehöhen rund um den Punkt und rechnet daraus den Horizont –
   * gerechnet wird in `shared/terrainHorizon.ts`, hier steht nur die
   * Bedienung.
   *
   * VON HAND GEZEICHNETES BLEIBT: `mergeTerrainObstacles` wirft nur die
   * alten Terrain-Sektoren weg. Der Baum vor dem Zelt überlebt jeden
   * weiteren Durchgang.
   */
  const detectTerrain = async () => {
    const activeSpot =
      activeSpotId === null
        ? undefined
        : spots?.find(spot => spot.id === activeSpotId);
    // Das gewählte Platz-Profil hat Vorrang; ohne Platz zählt der
    // aktuelle Standort – sonst rechnet man den Horizont von daheim.
    const lat = activeSpot?.latitude ?? geo.lat;
    const lon = activeSpot?.longitude ?? geo.lng;
    if (lat == null || lon == null) {
      toast.error(t.sunCompass.terrainNoLocation);
      return;
    }
    setTerrainBusy(true);
    try {
      const readings = await fetchHorizonReadings(lat, lon);
      // Die eigene Höhe steht mit im Kranz nicht drin – der nächste
      // Stützpunkt (250 m) ist die beste verfügbare Näherung, wenn der
      // Platz keine gespeicherte Höhe hat.
      const own =
        activeSpot?.elevationM ??
        readings.find(r => r.distanceM === 250 && r.elevationM !== null)
          ?.elevationM ??
        null;
      if (own === null) {
        toast.error(t.sunCompass.terrainFailed);
        return;
      }
      const terrain = buildTerrainObstacles(own, readings);
      saveObstacles(mergeTerrainObstacles(obstacles, terrain));
      toast.success(t.sunCompass.terrainDone(terrain.length));
    } catch {
      toast.error(t.sunCompass.terrainFailed);
    } finally {
      setTerrainBusy(false);
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
      height: Number.isNaN(h)
        ? OBSTACLE_KINDS[newKind].defaultHeight
        : Math.min(Math.max(h, 1), 89),
      width: Number.isNaN(w)
        ? OBSTACLE_KINDS[newKind].defaultWidth
        : Math.min(Math.max(w, 5), 180),
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
      setGeo({ status: "error", errorKey: "geoUnsupported" });
      return;
    }
    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      pos =>
        setGeo({
          status: "ok",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      err =>
        setGeo({
          status: "error",
          errorKey:
            err.code === err.PERMISSION_DENIED ? "geoDenied" : "geoFailed",
        }),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    if (!urlSpot) locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Slider auf die aktuelle Uhrzeit stellen, wenn die App aus dem Hintergrund
  // zurückkehrt (bei installierter PWA bleibt die Seite sonst auf der alten Zeit
  // stehen) – aber nur, wenn kein Planungs-Datum in der Zukunft gewählt ist
  const baseDateRef = useRef(baseDate);
  baseDateRef.current = baseDate;
  useEffect(() => {
    const syncToNow = () => {
      if (document.visibilityState === "visible") {
        const now = new Date();
        if (baseDateRef.current.toDateString() !== now.toDateString()) return;
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
        {t.sunCompass.spotBanner}
        {urlSpot.name ? `: ${urlSpot.name}` : ""}
      </span>
      <button
        type="button"
        onClick={() => {
          window.history.replaceState(null, "", "/sonne");
          locate();
        }}
        className="shrink-0 font-medium text-primary underline"
      >
        {t.sunCompass.useOwnLocation}
      </button>
    </div>
  ) : null;

  const sunTimes = useMemo(
    () =>
      geo.status === "ok"
        ? getSunTimes(selectedDate, geo.lat!, geo.lng!)
        : null,
    [geo, selectedDate]
  );
  const sunPos = useMemo(
    () =>
      geo.status === "ok"
        ? getSunPosition(selectedDate, geo.lat!, geo.lng!)
        : null,
    [geo, selectedDate]
  );

  // Fotolicht: goldene und blaue Stunde für das gewählte Datum am Ort.
  // Nur vom Tag abhängig – der Zeit-Slider ändert daran nichts.
  const photoLight = useMemo(
    () =>
      geo.status === "ok"
        ? goldenBlueHours(baseDate, geo.lat!, geo.lng!)
        : null,
    [geo, baseDate]
  );

  const shadowWindows = useMemo(
    () =>
      geo.status === "ok"
        ? computeShadowWindows(selectedDate, geo.lat!, geo.lng!, obstacles)
        : [],
    [geo, selectedDate, obstacles]
  );

  /**
   * Schattenverlauf (#452): der Tag als Balken von Auf- bis Untergang
   * plus Sonnen-/Schatten-Summen. Dieselben 5-Minuten-Proben wie die
   * Schattenzeiten-Liste; ausgewertet in shared/shadeTimeline.ts.
   */
  const shade = useMemo(() => {
    if (geo.status !== "ok" || obstacles.length === 0) return null;
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const samples: ShadeSample[] = [];
    for (let m = 0; m <= 1440; m += 5) {
      const time = new Date(dayStart.getTime() + m * 60000);
      const pos = getSunPosition(time, geo.lat!, geo.lng!);
      const up = pos.altitude > 0;
      samples.push({
        minutes: m,
        up,
        shaded: up && isBlocked(pos.azimuth, pos.altitude, obstacles),
      });
    }
    return shadeTimeline(samples);
  }, [geo, selectedDate, obstacles]);

  /**
   * Wann kommt die Sonne über den Grat, wann ist sie wieder weg (#380)?
   *
   * DER SONNENAUFGANG AUS DER WETTER-APP GILT AM MEER. Im Bergtal ist
   * die Sonne schnell eine Stunde später da – und seit #372 weiss das
   * Hindernis-Profil, wo die Berge stehen. Die Proben werden hier
   * gebaut, ausgewertet wird in `shared/sunOverHorizon.ts`.
   *
   * ZWEI-MINUTEN-SCHRITTE: Die Sonnenscheibe braucht selbst gut zwei
   * Minuten, um ihren eigenen Durchmesser zu wandern – feiner wäre eine
   * Genauigkeit, die weder das Höhenmodell noch der Baum vor dem Zelt
   * hergibt.
   */
  const horizonSun = useMemo(() => {
    if (geo.status !== "ok" || obstacles.length === 0) return null;
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const samples: SunSample[] = [];
    for (let m = 0; m <= 1440; m += 2) {
      const at = new Date(dayStart.getTime() + m * 60000);
      const pos = getSunPosition(at, geo.lat!, geo.lng!);
      samples.push({
        minutes: m,
        azimuth: pos.azimuth,
        altitude: pos.altitude,
      });
    }
    const window = sunWindow(samples, obstacles);
    const open = getSunTimes(selectedDate, geo.lat!, geo.lng!);
    const openSunrise = open.sunrise
      ? open.sunrise.getHours() * 60 + open.sunrise.getMinutes()
      : null;
    return {
      ...window,
      delayMinutes: delayVersusOpen(window.firstMinutes, openSunrise),
    };
  }, [geo, selectedDate, obstacles]);
  const sunBlockedNow =
    sunPos !== null &&
    sunPos.altitude > 0 &&
    isBlocked(sunPos.azimuth, sunPos.altitude, obstacles);

  const timeLabel = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={t.sunCompass.title} subtitle={t.sunCompass.subtitle} />

      {spotBanner}

      {geo.status === "loading" && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6 text-muted-foreground">
            <Compass className="h-5 w-5 animate-pulse" aria-hidden="true" />
            {t.sunCompass.locating}
          </CardContent>
        </Card>
      )}

      {geo.status === "error" && (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-destructive">
              {t.sunCompass[geo.errorKey ?? "geoFailed"]}
            </p>
            <Button variant="outline" onClick={locate}>
              <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.sunCompass.retry}
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
                  <strong>{t.sunCompass.atTime(timeLabel)}</strong>{" "}
                  {t.sunCompass.sunIsIn}{" "}
                  <strong>{compassDirection(sunPos.azimuth, lang)}</strong> (
                  {Math.round(sunPos.azimuth)}°),{" "}
                  <strong>{Math.round(sunPos.altitude)}°</strong>{" "}
                  {t.sunCompass.aboveHorizon}
                  {sunBlockedNow
                    ? t.sunCompass.summaryBlocked
                    : sunPos.altitude > 45
                      ? t.sunCompass.summaryHigh
                      : sunPos.altitude > 20
                        ? t.sunCompass.summaryMid
                        : t.sunCompass.summaryLow}
                </>
              ) : (
                <>
                  <strong>{t.sunCompass.atTime(timeLabel)}</strong>{" "}
                  {t.sunCompass.belowHorizonNext}{" "}
                  <strong>
                    {t.sunCompass.clock(fmtTime(sunTimes.sunrise, lang))}
                  </strong>{" "}
                  {t.sunCompass.inTheEast}
                </>
              )}
            </p>
          </div>

          {/* Diagramm */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <p className="mb-3 text-center text-xs text-muted-foreground">
                {t.sunCompass.viewFromAbove}
              </p>
              {placeMode && (
                <div className="mb-3 rounded-lg border border-primary/40 bg-accent/60 px-3 py-2 text-center text-sm text-accent-foreground">
                  {t.sunCompass.placeModeHint(t.sunCompass.kinds[newKind])}{" "}
                  <button
                    type="button"
                    onClick={() => setPlaceMode(false)}
                    className="font-medium text-primary underline"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              )}
              {/* Live-Kompass: Diagramm dreht sich mit der Geräte-Ausrichtung */}
              <div className="mb-3 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant={compass.active ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    compass.active ? compass.stop() : void compass.start()
                  }
                >
                  <Compass className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {compass.active
                    ? t.sunCompass.liveCompassOff
                    : t.sunCompass.liveCompassOn}
                </Button>
                {compass.active && compass.heading !== null && (
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold">
                    {Math.round(compass.heading)}°{" "}
                    {compassDirection(compass.heading, lang)}
                  </span>
                )}
              </div>
              {compass.permission === "denied" && (
                <p className="mb-3 text-center text-xs text-destructive">
                  {t.sunCompass.compassDenied}
                </p>
              )}
              {compass.permission === "unsupported" && (
                <p className="mb-3 text-center text-xs text-muted-foreground">
                  {t.sunCompass.compassUnsupported}
                </p>
              )}
              {compass.active && compass.heading === null && (
                <p className="mb-3 text-center text-xs text-muted-foreground">
                  {t.sunCompass.compassWaiting}
                </p>
              )}
              <SunDiagram
                lat={geo.lat!}
                lng={geo.lng!}
                selectedDate={selectedDate}
                obstacles={obstacles}
                placeMode={placeMode}
                onPlace={placeObstacleAt}
                rotation={
                  compass.active && compass.heading !== null
                    ? -compass.heading
                    : 0
                }
                deviceHeading={compass.active ? compass.heading : null}
              />

              {/* Legende */}
              <div
                className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
                aria-hidden="true"
              >
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-[#E09B2D] bg-[#F5B841]" />
                  {t.sunCompass.legendSunNow}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1 w-5 rounded-full bg-chart-1 opacity-90" />
                  {t.sunCompass.legendPathFuture}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1 w-5 rounded-full bg-chart-1 opacity-30" />
                  {t.sunCompass.legendPathPast}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-card bg-primary" />
                  {t.sunCompass.legendYourLocation}
                </span>
                {obstacles.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-primary opacity-25 ring-1 ring-primary/50" />
                    {t.sunCompass.legendObstacle}
                  </span>
                )}
              </div>

              {/* Datum für die Planung: die Sonnenbahn steht je nach Jahreszeit anders */}
              <div className="mt-4 flex items-center gap-2">
                <label
                  htmlFor="sun-date"
                  className="text-sm font-medium text-muted-foreground"
                >
                  {t.sunCompass.dateLabel}
                </label>
                <Input
                  id="sun-date"
                  type="date"
                  className="h-8 w-40"
                  value={`${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(baseDate.getDate()).padStart(2, "0")}`}
                  onChange={e => {
                    const parsed = new Date(`${e.target.value}T12:00:00`);
                    if (!Number.isNaN(parsed.getTime())) setBaseDate(parsed);
                  }}
                  aria-label={t.sunCompass.dateAria}
                />
                {baseDate.toDateString() !== new Date().toDateString() && (
                  <span className="rounded-full bg-chart-4/20 px-2.5 py-1 text-xs font-medium">
                    {t.sunCompass.planningView}
                  </span>
                )}
              </div>

              {/* Zeit-Slider */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="time-slider"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    {t.sunCompass.sliderLabel}
                  </label>
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setBaseDate(now);
                        setMinutes(now.getHours() * 60 + now.getMinutes());
                      }}
                      className="rounded-md border border-border px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent"
                      aria-label={t.sunCompass.nowAria}
                    >
                      {t.sunCompass.nowButton}
                    </button>
                    <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold">
                      {t.sunCompass.clock(timeLabel)}
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
                  aria-label={t.sunCompass.timeAria}
                />
                {/* Sonnenauf-/-untergangs-Marker auf der Slider-Achse */}
                {sunTimes && sunTimes.sunrise && sunTimes.sunset && (
                  <div className="relative mt-1 h-5" aria-hidden="true">
                    <span
                      className="absolute flex -translate-x-1/2 flex-col items-center"
                      style={{
                        left: `${((sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes()) / 1439) * 100}%`,
                      }}
                      title={t.sunCompass.sunriseTitle}
                    >
                      <Sunrise className="h-4 w-4 text-chart-1" />
                    </span>
                    <span
                      className="absolute flex -translate-x-1/2 flex-col items-center"
                      style={{
                        left: `${((sunTimes.sunset.getHours() * 60 + sunTimes.sunset.getMinutes()) / 1439) * 100}%`,
                      }}
                      title={t.sunCompass.sunsetTitle}
                    >
                      <Sunset className="h-4 w-4 text-destructive" />
                    </span>
                  </div>
                )}
                <div
                  className="mt-1.5 flex justify-between text-xs text-muted-foreground"
                  aria-hidden="true"
                >
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
              <Sunrise
                className="mx-auto mb-1 h-5 w-5 text-chart-1"
                aria-hidden="true"
              />
              <p className="font-mono text-sm font-semibold">
                {fmtTime(sunTimes.sunrise, lang)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.sunCompass.sunriseTitle}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5 text-center">
              <Sunset
                className="mx-auto mb-1 h-5 w-5 text-chart-1"
                aria-hidden="true"
              />
              <p className="font-mono text-sm font-semibold">
                {fmtTime(sunTimes.sunset, lang)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.sunCompass.sunsetTitle}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5 text-center">
              {sunPos.altitude > 0 ? (
                <SunIcon
                  className="mx-auto mb-1 h-5 w-5 text-chart-1"
                  aria-hidden="true"
                />
              ) : (
                <Moon
                  className="mx-auto mb-1 h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <p className="font-mono text-sm font-semibold">
                {sunPos.altitude > 0
                  ? `${sunPos.altitude.toFixed(0)}°`
                  : t.sunCompass.belowHorizonShort}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.sunCompass.sunHeightAt(timeLabel)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5 text-center">
              <Compass
                className="mx-auto mb-1 h-5 w-5 text-primary"
                aria-hidden="true"
              />
              <p className="font-mono text-sm font-semibold">
                {sunPos.azimuth.toFixed(0)}° (
                {compassDirection(sunPos.azimuth, lang)})
              </p>
              <p className="text-xs text-muted-foreground">
                {t.sunCompass.directionAt(timeLabel)}
              </p>
            </div>
          </div>

          {/* Fotolicht: goldene und blaue Stunde morgens/abends am gewählten Datum */}
          {photoLight && (photoLight.morning || photoLight.evening) && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <p className="mb-1 flex items-center gap-2 font-semibold">
                  <Camera className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t.sunCompass.photoLightTitle}
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t.sunCompass.photoLightIntro}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {photoLight.morning && (
                    <div className="rounded-xl border border-border bg-card p-3.5">
                      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                        <Sunrise
                          className="h-4 w-4 text-chart-4"
                          aria-hidden="true"
                        />
                        {t.sunCompass.photoLightMorning}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t.sunCompass.blueHour}:{" "}
                        <strong className="font-mono text-foreground">
                          {t.sunCompass.photoLightRange(
                            fmtTime(photoLight.morning.blueStart, lang),
                            fmtTime(photoLight.morning.blueEnd, lang)
                          )}
                        </strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t.sunCompass.goldenHour}:{" "}
                        <strong className="font-mono text-foreground">
                          {t.sunCompass.photoLightRange(
                            fmtTime(photoLight.morning.goldenStart, lang),
                            fmtTime(photoLight.morning.goldenEnd, lang)
                          )}
                        </strong>
                      </p>
                    </div>
                  )}
                  {photoLight.evening && (
                    <div className="rounded-xl border border-border bg-card p-3.5">
                      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                        <Sunset
                          className="h-4 w-4 text-chart-1"
                          aria-hidden="true"
                        />
                        {t.sunCompass.photoLightEvening}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t.sunCompass.goldenHour}:{" "}
                        <strong className="font-mono text-foreground">
                          {t.sunCompass.photoLightRange(
                            fmtTime(photoLight.evening.goldenStart, lang),
                            fmtTime(photoLight.evening.goldenEnd, lang)
                          )}
                        </strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t.sunCompass.blueHour}:{" "}
                        <strong className="font-mono text-foreground">
                          {t.sunCompass.photoLightRange(
                            fmtTime(photoLight.evening.blueStart, lang),
                            fmtTime(photoLight.evening.blueEnd, lang)
                          )}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Standort & Tipps */}
          {/* Hindernis-Profil: Bäume, Berge, Gebäude erfassen und Schattenzeiten sehen */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <p className="mb-1 flex items-center gap-2 font-semibold">
                <TreePine className="h-4 w-4 text-primary" aria-hidden="true" />
                {t.sunCompass.obstaclesTitle}
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                {t.sunCompass.obstaclesIntro}
              </p>

              {/* Profil-Auswahl: allgemeines Panorama oder eines pro Zeltplatz-Favorit */}
              {(spots?.length ?? 0) > 0 && (
                <div
                  className="mb-4 flex flex-wrap items-center gap-2"
                  role="group"
                  aria-label={t.sunCompass.profileGroupAria}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSpotId(null)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      activeSpotId === null
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.sunCompass.profileGeneral}
                  </button>
                  {spots!.map(spot => {
                    const count = profiles.spots[String(spot.id)]?.length ?? 0;
                    return (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => setActiveSpotId(spot.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          activeSpotId === spot.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        <Tent className="h-3.5 w-3.5" aria-hidden="true" />
                        {spot.name}
                        {count > 0 && (
                          <span className="rounded-full bg-background/60 px-1.5 text-[10px] font-semibold">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void detectTerrain()}
                  disabled={terrainBusy}
                >
                  <Mountain className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {terrainBusy
                    ? t.sunCompass.terrainBusy
                    : t.sunCompass.terrainButton}
                </Button>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t.sunCompass.terrainHint}
                </p>
              </div>

              {obstacles.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {obstacles.map(o => {
                    const Icon = OBSTACLE_KINDS[o.kind].icon;
                    return (
                      <li
                        key={o.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <Icon
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          {t.sunCompass.obstacleLine(
                            t.sunCompass.kinds[o.kind],
                            compassDirection(o.azimuth, lang),
                            Math.round(o.azimuth),
                            Math.round(o.height),
                            Math.round(o.width)
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            saveObstacles(obstacles.filter(x => x.id !== o.id))
                          }
                          aria-label={t.sunCompass.removeObstacleAria(
                            t.sunCompass.kinds[o.kind]
                          )}
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
                    {t.sunCompass.kindLabel}
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
                      {(Object.keys(OBSTACLE_KINDS) as Obstacle["kind"][]).map(
                        value => (
                          <SelectItem key={value} value={value}>
                            {t.sunCompass.kinds[value]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="obstacle-azimuth" className="text-xs">
                    {t.sunCompass.azimuthLabel}
                  </Label>
                  <Input
                    id="obstacle-azimuth"
                    value={newAzimuth}
                    onChange={e => setNewAzimuth(e.target.value)}
                    inputMode="numeric"
                    placeholder={t.sunCompass.azimuthPlaceholder}
                  />
                </div>
                <div>
                  <Label htmlFor="obstacle-height" className="text-xs">
                    {t.sunCompass.heightLabel}
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
                    {t.sunCompass.widthLabel}
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
                  {placeMode
                    ? t.sunCompass.placeByTapActive
                    : t.sunCompass.placeByTap}
                </Button>
                <Button variant="outline" size="sm" onClick={addObstacle}>
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.sunCompass.addNumeric}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.sunCompass.fistTip}
              </p>

              {horizonSun && (
                <div className="mt-4 rounded-lg border border-border p-3">
                  <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                    <Sunrise
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                    {t.sunCompass.horizonTitle}
                  </p>
                  {horizonSun.fullyShaded ? (
                    <p className="text-sm text-muted-foreground">
                      {t.sunCompass.horizonShaded}
                    </p>
                  ) : horizonSun.firstMinutes === null ? (
                    <p className="text-sm text-muted-foreground">
                      {t.sunCompass.horizonNone}
                    </p>
                  ) : (
                    <>
                      <p className="font-mono text-xl font-bold leading-tight">
                        {formatMinutes(horizonSun.firstMinutes)}
                        {horizonSun.lastMinutes !== null &&
                          ` – ${formatMinutes(horizonSun.lastMinutes)}`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.sunCompass.horizonSunny(
                          formatDuration(horizonSun.sunnyMinutes)
                        )}
                        {horizonSun.delayMinutes !== null &&
                          horizonSun.delayMinutes > 0 &&
                          ` · ${t.sunCompass.horizonDelay(
                            formatDuration(horizonSun.delayMinutes)
                          )}`}
                      </p>
                    </>
                  )}
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                    {t.sunCompass.horizonNote}
                  </p>
                </div>
              )}

              {obstacles.length > 0 && (
                <div className="mt-4 rounded-lg bg-accent/50 p-3">
                  <p className="mb-1.5 text-sm font-semibold">
                    {t.sunCompass.shadowTitle}
                  </p>
                  {/* Schattenverlauf (#452): der Tag als Balken samt Summen */}
                  {shade &&
                    shade.dayStartMinutes !== null &&
                    shade.dayEndMinutes !== null && (
                      <div className="mb-2">
                        <div
                          className="flex h-3 w-full overflow-hidden rounded-full"
                          role="img"
                          aria-label={t.sunCompass.shadeBarAria}
                        >
                          {shade.segments.map(segment => (
                            <div
                              key={segment.startMinutes}
                              className={
                                segment.shaded
                                  ? "bg-muted-foreground/40"
                                  : "bg-chart-1"
                              }
                              style={{
                                width: `${
                                  ((segment.endMinutes - segment.startMinutes) /
                                    (shade.dayEndMinutes! -
                                      shade.dayStartMinutes!)) *
                                  100
                                }%`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                          <span>
                            {fmtTime(
                              minutesToDate(
                                selectedDate,
                                shade.dayStartMinutes
                              ),
                              lang
                            )}
                          </span>
                          <span>
                            {t.sunCompass.shadeTotals(
                              formatDuration(shade.sunMinutes),
                              formatDuration(shade.shadeMinutes)
                            )}
                          </span>
                          <span>
                            {fmtTime(
                              minutesToDate(selectedDate, shade.dayEndMinutes),
                              lang
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  {shadowWindows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t.sunCompass.shadowNone}
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {shadowWindows.map((w, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Moon
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-foreground">
                              {t.sunCompass.shadowRange(
                                fmtTime(w.from, lang),
                                fmtTime(w.to, lang)
                              )}
                            </strong>{" "}
                            {t.sunCompass.shadowSuffix}
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
                {t.sunCompass.locationLine} {geo.lat!.toFixed(4)},{" "}
                {geo.lng!.toFixed(4)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={locate}
                  aria-label={t.sunCompass.refreshLocationAria}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-accent/50">
            <CardContent className="pt-6 text-sm leading-relaxed">
              <p className="mb-2 font-semibold">{t.sunCompass.tipsTitle}</p>
              <p className="mb-2 text-muted-foreground">
                <strong className="text-foreground">
                  {t.sunCompass.morningShadeTitle}
                </strong>{" "}
                {t.sunCompass.morningShadeText(fmtTime(sunTimes.sunrise, lang))}
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">
                  {t.sunCompass.solarTitle}
                </strong>{" "}
                {t.sunCompass.solarText1(
                  Math.round(
                    getSunPosition(sunTimes.solarNoon, geo.lat!, geo.lng!)
                      .altitude
                  )
                )}{" "}
                <a
                  href="/energie"
                  className="font-medium text-primary hover:underline"
                >
                  {t.sunCompass.solarLink}
                </a>{" "}
                {t.sunCompass.solarText2}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {wakeLock.active && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t.common.screenAwake}
        </p>
      )}
    </div>
  );
}
