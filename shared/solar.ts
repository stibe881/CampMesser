/**
 * Solarpanel-Ausrichtungshilfe: berechnet aus der Sonnenbahn eines Tages und
 * dem Hindernis-Profil des Sonnen-Kompasses die optimale feste Ausrichtung
 * (Azimut) und Neigung eines Panels. Reine Logik – offline und testbar.
 */
// Die Sonnenberechnung liegt im Client-Code, ist aber reine Logik ohne DOM.
import { getSunPosition } from "../client/src/lib/sun";
import { type Language } from "./i18n";
import { isBlocked, type ObstacleShape } from "./obstacles";

export interface SolarAlignment {
  /** Optimale Panel-Ausrichtung in Grad (0 = Nord, 90 = Ost, 180 = Süd) */
  azimuth: number;
  /** Optimale Neigung gegenüber der Horizontalen in Grad (0 = flach, 90 = senkrecht) */
  tilt: number;
  /** Mehrertrag gegenüber flach liegendem Panel in Prozent */
  gainVsFlatPercent: number;
  /** Stunden mit direkter (unverschatteter) Sonne an diesem Tag */
  usableSunHours: number;
  /** Durch Hindernisse verschattete Sonnenstunden */
  shadedHours: number;
  /** Erste bzw. letzte direkte Sonne des Tages (null = keine) */
  firstSun: Date | null;
  lastSun: Date | null;
}

const rad = Math.PI / 180;
const SAMPLE_MINUTES = 10;

/**
 * Relative Direktstrahlung der Sonne bei gegebener Höhe: Luftmasse nach
 * Kasten/Meinel (I ≈ 0.7^(AM^0.678)). Absolutwerte sind egal – es geht nur
 * um die Gewichtung der Tagesstunden untereinander.
 */
function relativeIrradiance(altitudeDeg: number): number {
  if (altitudeDeg <= 0) return 0;
  const airMass = 1 / Math.sin(altitudeDeg * rad);
  return Math.pow(0.7, Math.pow(airMass, 0.678));
}

/** Einstrahlungs-Anteil auf ein geneigtes Panel (cos des Einfallswinkels, min. 0). */
function incidenceFactor(
  sunAzimuth: number,
  sunAltitude: number,
  panelAzimuth: number,
  panelTilt: number
): number {
  const cosIncidence =
    Math.sin(sunAltitude * rad) * Math.cos(panelTilt * rad) +
    Math.cos(sunAltitude * rad) *
      Math.sin(panelTilt * rad) *
      Math.cos((sunAzimuth - panelAzimuth) * rad);
  return Math.max(0, cosIncidence);
}

/**
 * Optimale feste Panel-Ausrichtung für einen Tag bestimmen (Rastersuche über
 * Azimut und Neigung, gewichtet mit der Direktstrahlung der unverschatteten
 * Sonnenstunden). Gibt null zurück, wenn die Sonne den Standort an diesem Tag
 * nie direkt erreicht (Polarnacht oder vollständige Verschattung).
 */
export function computeSolarAlignment(
  date: Date,
  lat: number,
  lng: number,
  obstacles: ObstacleShape[] = []
): SolarAlignment | null {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  // Sonnenbahn abtasten: nur unverschattete Stunden zählen für die Ausrichtung
  const samples: { azimuth: number; altitude: number; irradiance: number }[] =
    [];
  let shadedMinutes = 0;
  let firstSun: Date | null = null;
  let lastSun: Date | null = null;
  for (let m = 0; m < 1440; m += SAMPLE_MINUTES) {
    const t = new Date(dayStart.getTime() + m * 60000);
    const pos = getSunPosition(t, lat, lng);
    if (pos.altitude <= 0) continue;
    if (isBlocked(pos.azimuth, pos.altitude, obstacles)) {
      shadedMinutes += SAMPLE_MINUTES;
      continue;
    }
    samples.push({
      azimuth: pos.azimuth,
      altitude: pos.altitude,
      irradiance: relativeIrradiance(pos.altitude),
    });
    if (!firstSun) firstSun = t;
    lastSun = t;
  }
  if (samples.length === 0) return null;

  // Rastersuche über alle Ausrichtungen: 5°-Schritte reichen für die Praxis
  let bestAzimuth = 180;
  let bestTilt = 0;
  let bestYield = -1;
  for (let az = 0; az < 360; az += 5) {
    for (let tilt = 0; tilt <= 90; tilt += 5) {
      let sum = 0;
      for (const s of samples) {
        sum += s.irradiance * incidenceFactor(s.azimuth, s.altitude, az, tilt);
      }
      if (sum > bestYield) {
        bestYield = sum;
        bestAzimuth = az;
        bestTilt = tilt;
      }
    }
  }

  // Vergleichswert: flach liegendes Panel (Neigung 0, Ausrichtung egal)
  let flatYield = 0;
  for (const s of samples) {
    flatYield += s.irradiance * incidenceFactor(s.azimuth, s.altitude, 0, 0);
  }
  const gainVsFlatPercent =
    flatYield > 0
      ? Math.max(0, Math.round((bestYield / flatYield - 1) * 100))
      : 0;

  return {
    azimuth: bestAzimuth,
    tilt: bestTilt,
    gainVsFlatPercent,
    usableSunHours:
      Math.round(((samples.length * SAMPLE_MINUTES) / 60) * 10) / 10,
    shadedHours: Math.round((shadedMinutes / 60) * 10) / 10,
    firstSun,
    lastSun,
  };
}

/** Himmelsrichtungs-Kürzel je Sprache (DE: O = Ost, FR/IT: E/O, EN: E/W). */
const COMPASS_DIRS: Record<Language, string[]> = {
  de: ["N", "NO", "O", "SO", "S", "SW", "W", "NW"],
  fr: ["N", "NE", "E", "SE", "S", "SO", "O", "NO"],
  it: ["N", "NE", "E", "SE", "S", "SO", "O", "NO"],
  en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
};

/** Himmelsrichtung als Kurztext, z. B. 184° → «S». */
export function compassDirection(
  azimuth: number,
  lang: Language = "de"
): string {
  return COMPASS_DIRS[lang][Math.round(azimuth / 45) % 8];
}
