/**
 * Wetter-Logik: WMO-Codes, Camping-Warnstufen und Unwetter-Erkennung
 * aus Open-Meteo-Vorhersagedaten. Reine Funktionen – von Client und Tests genutzt.
 */

export interface HourlyWeather {
  time: string;
  temperatureC: number;
  apparentC: number;
  precipitationMm: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  weatherCode: number;
  cape: number;
  cloudCover: number;
}

export interface DailyWeather {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationSumMm: number;
  precipitationProbabilityMax: number;
  windGustsMaxKmh: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
}

export type AlertSeverity = "info" | "warnung" | "gefahr";

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  /** Zeitfenster der Warnung (lokale ISO-Zeit der ersten betroffenen Stunde) */
  startTime: string;
  advice: string;
}

/** WMO-Wettercode in deutschen Text und Icon-Schlüssel übersetzen */
export function describeWeatherCode(code: number): {
  label: string;
  icon: string;
} {
  if (code === 0) return { label: "Klarer Himmel", icon: "sun" };
  if (code === 1) return { label: "Überwiegend klar", icon: "sun" };
  if (code === 2) return { label: "Teilweise bewölkt", icon: "cloud-sun" };
  if (code === 3) return { label: "Bedeckt", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Nebel", icon: "fog" };
  if (code >= 51 && code <= 57)
    return { label: "Nieselregen", icon: "drizzle" };
  if (code >= 61 && code <= 65) return { label: "Regen", icon: "rain" };
  if (code === 66 || code === 67)
    return { label: "Gefrierender Regen", icon: "rain" };
  if (code >= 71 && code <= 77) return { label: "Schneefall", icon: "snow" };
  if (code >= 80 && code <= 82) return { label: "Regenschauer", icon: "rain" };
  if (code === 85 || code === 86)
    return { label: "Schneeschauer", icon: "snow" };
  if (code === 95) return { label: "Gewitter", icon: "storm" };
  if (code === 96 || code === 99)
    return { label: "Gewitter mit Hagel", icon: "storm" };
  return { label: "Unbekannt", icon: "cloud" };
}

/**
 * Unwetter-Erkennung für die nächsten 48 h – speziell auf Zelt-Camping ausgelegt.
 * Schwellenwerte orientieren sich an MeteoSchweiz-Warnstufen:
 * - Windböen: ab 60 km/h Warnung (Zeltstangen), ab 90 km/h Gefahr
 * - Starkregen: ab 6 mm/h Warnung, ab 15 mm/h Gefahr
 * - Gewitter: WMO 95/96/99 oder CAPE > 1500 J/kg
 * - Hitze: gefühlte Temperatur ab 33 °C
 * - Frost: unter 0 °C
 */
export function detectAlerts(hours: HourlyWeather[]): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const next48 = hours.slice(0, 48);

  const gustHour = next48.find(h => h.windGustsKmh >= 90);
  const windHour = next48.find(h => h.windGustsKmh >= 60);
  if (gustHour) {
    alerts.push({
      id: "sturm",
      severity: "gefahr",
      title: "Sturmböen erwartet",
      description: `Böen bis ${Math.round(Math.max(...next48.map(h => h.windGustsKmh)))} km/h ab ${formatHour(gustHour.time)}.`,
      startTime: gustHour.time,
      advice:
        "Zelt sturmfest machen: alle Abspannleinen setzen, Heringe tief einschlagen, Tarp abbauen. Bei Sturm nicht unter Bäumen aufhalten.",
    });
  } else if (windHour) {
    alerts.push({
      id: "wind",
      severity: "warnung",
      title: "Starker Wind",
      description: `Böen bis ${Math.round(Math.max(...next48.map(h => h.windGustsKmh)))} km/h ab ${formatHour(windHour.time)}.`,
      startTime: windHour.time,
      advice:
        "Abspannleinen nachspannen, lose Gegenstände (Stühle, Tisch) sichern, Markise oder Tarp prüfen.",
    });
  }

  const heavyRain = next48.find(h => h.precipitationMm >= 15);
  const rain = next48.find(h => h.precipitationMm >= 6);
  if (heavyRain) {
    alerts.push({
      id: "starkregen",
      severity: "gefahr",
      title: "Starkregen erwartet",
      description: `Bis ${Math.max(...next48.map(h => h.precipitationMm)).toFixed(0)} mm Regen pro Stunde ab ${formatHour(heavyRain.time)}.`,
      startTime: heavyRain.time,
      advice:
        "Zeltgraben prüfen, nicht in Mulden oder an Bachläufen campieren – Gefahr von Überflutung. Ausrüstung wasserdicht verpacken.",
    });
  } else if (rain) {
    alerts.push({
      id: "regen",
      severity: "warnung",
      title: "Kräftiger Regen",
      description: `Bis ${Math.max(...next48.map(h => h.precipitationMm)).toFixed(1)} mm pro Stunde ab ${formatHour(rain.time)}.`,
      startTime: rain.time,
      advice:
        "Regensachen bereitlegen, Zeltboden-Wanne kontrollieren und empfindliche Ausrüstung ins Zeltinnere räumen.",
    });
  }

  const thunderHour = next48.find(
    h => h.weatherCode === 95 || h.weatherCode === 96 || h.weatherCode === 99
  );
  const capeHour = next48.find(h => h.cape > 1500);
  if (thunderHour) {
    const hail = next48.some(h => h.weatherCode === 96 || h.weatherCode === 99);
    alerts.push({
      id: "gewitter",
      severity: "gefahr",
      title: hail ? "Gewitter mit Hagel" : "Gewitter erwartet",
      description: `Gewitter ab ${formatHour(thunderHour.time)}${hail ? ", örtlich mit Hagel" : ""}.`,
      startTime: thunderHour.time,
      advice:
        "Rechtzeitig Schutz suchen (Auto oder festes Gebäude, nicht das Zelt). Abstand zu einzelnen Bäumen und Gewässern halten.",
    });
  } else if (capeHour) {
    alerts.push({
      id: "gewitterneigung",
      severity: "warnung",
      title: "Erhöhte Gewitterneigung",
      description: `Labile Luftschichtung ab ${formatHour(capeHour.time)} – lokale Gewitter möglich.`,
      startTime: capeHour.time,
      advice:
        "Himmel im Auge behalten (Quellwolken), Wetter-Update vor dem Abend prüfen und Camp gewittersicher einrichten.",
    });
  }

  const heatHour = next48.find(h => h.apparentC >= 33);
  if (heatHour) {
    alerts.push({
      id: "hitze",
      severity: "warnung",
      title: "Grosse Hitze",
      description: `Gefühlte Temperaturen bis ${Math.round(Math.max(...next48.map(h => h.apparentC)))} °C.`,
      startTime: heatHour.time,
      advice:
        "Mehr Wasser einplanen (Trinkwasser-Rechner nutzen), Zelt in den Schatten stellen, Mittagshitze meiden.",
    });
  }

  const frostHour = next48.find(h => h.temperatureC <= 0);
  if (frostHour) {
    alerts.push({
      id: "frost",
      severity: "info",
      title: "Frost in der Nacht",
      description: `Temperaturen bis ${Math.round(Math.min(...next48.map(h => h.temperatureC)))} °C ab ${formatHour(frostHour.time)}.`,
      startTime: frostHour.time,
      advice:
        "Warmen Schlafsack (Komfortbereich prüfen), Isomatte mit gutem R-Wert und Mütze für die Nacht bereitlegen.",
    });
  }

  const severityOrder: Record<AlertSeverity, number> = {
    gefahr: 0,
    warnung: 1,
    info: 2,
  };
  return alerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

function formatHour(isoTime: string): string {
  const d = new Date(isoTime);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today.getTime() + 86400000);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const hh = `${d.getHours()}:00 Uhr`;
  if (isToday) return `heute ${hh}`;
  if (isTomorrow) return `morgen ${hh}`;
  return `${d.toLocaleDateString("de-CH", { weekday: "short" })} ${hh}`;
}
