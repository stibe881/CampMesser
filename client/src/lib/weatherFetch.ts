/**
 * Wetter-Abruf der Wetterseite (#438, aus Weather.tsx herausgelöst):
 * EIN Open-Meteo-Abruf liefert 16 Tage, Stunden, 15-Minuten-Regen und
 * den Ist-Zustand. Vergleich und «Deine Plätze» nutzen denselben Abruf.
 */
import type { DailyWeather, HourlyWeather, RainSlot } from "@shared/weather";

export interface WeatherData {
  /** Stunden ab der aktuellen Stunde (für 24-h-Leiste, Regen-Grafik, Warnungen). */
  hourly: HourlyWeather[];
  /** Alle Stunden der ersten 7 Prognosetage (0–24 Uhr, für das Tages-Detail). */
  hourlyAll: HourlyWeather[];
  /** 16 Prognosetage: Tag 1–7 für die Detail-Ansicht, Tag 8+ als Ausblick. */
  daily: DailyWeather[];
  /** 15-Minuten-Regenprognose ab der aktuellen Viertelstunde (~4 h). */
  minutely: RainSlot[];
  current: {
    temperatureC: number;
    apparentC: number;
    weatherCode: number;
    windKmh: number;
  };
  elevation: number;
}

/** HTTP-Fehler des Wetterdienstes – der Status wird im UI übersetzt angezeigt. */
export class WeatherServiceError extends Error {
  constructor(public readonly status: number) {
    super(`weather service error ${status}`);
  }
}

export async function fetchWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone: "auto",
    // 16 Tage für den «Woche 2»-Ausblick. Die Stundendaten kommen dabei
    // ebenfalls für 16 Tage mit – ein serverseitiges Begrenzen per
    // forecast_hours=168 würde die Stunden aber an der AKTUELLEN Stunde
    // statt um Mitternacht starten lassen und so das Tages-Detail (0–24 Uhr)
    // brechen. Deshalb: ein Abruf, und unten werden die Stunden clientseitig
    // auf die ersten 7 Tage beschnitten.
    forecast_days: "16",
    // Regen-Kurzfrist: 15-Minuten-Niederschlag im selben Abruf.
    // forecast_minutely_15 beginnt (anders als forecast_hours) bei der
    // AKTUELLEN Viertelstunde – 16 Slots reichen für den 2-h-Hinweis.
    minutely_15: "precipitation",
    forecast_minutely_15: "16",
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    hourly:
      "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,wind_direction_10m,pressure_msl,weather_code,cape,cloud_cover,freezing_level_height,snow_depth",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,weather_code,sunrise,sunset,uv_index_max",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );
  if (!res.ok) throw new WeatherServiceError(res.status);
  const json = await res.json();

  // Alle Stunden der ersten 7 Prognosetage – das Tages-Detail braucht 0–24 Uhr.
  // Der Ausblick (Tag 8+) kommt bewusst ohne Stunden-Detail aus, deshalb
  // werden die restlichen Stunden gleich verworfen (ISO-Datumsvergleich).
  const lastDetailDate = (json.daily.time as string[])[6] ?? "9999-12-31";
  const hourlyAll: HourlyWeather[] = (json.hourly.time as string[])
    .map((time: string, i: number) => ({
      time,
      temperatureC: json.hourly.temperature_2m[i],
      apparentC: json.hourly.apparent_temperature[i],
      precipitationMm: json.hourly.precipitation[i],
      precipitationProbability: json.hourly.precipitation_probability?.[i] ?? 0,
      windSpeedKmh: json.hourly.wind_speed_10m[i],
      windGustsKmh: json.hourly.wind_gusts_10m[i],
      windDirectionDeg: json.hourly.wind_direction_10m?.[i] ?? undefined,
      pressureHpa: json.hourly.pressure_msl?.[i] ?? undefined,
      weatherCode: json.hourly.weather_code[i],
      cape: json.hourly.cape?.[i] ?? 0,
      cloudCover: json.hourly.cloud_cover?.[i] ?? 0,
      humidityPercent: json.hourly.relative_humidity_2m?.[i] ?? undefined,
      freezingLevelM: json.hourly.freezing_level_height?.[i] ?? undefined,
      snowDepthM: json.hourly.snow_depth?.[i] ?? undefined,
    }))
    .filter(h => h.time.slice(0, 10) <= lastDetailDate);

  // Ab der aktuellen Stunde (lokale API-Zeit ist bereits Ortszeit durch timezone=auto)
  const nowLocalHour = hourlyAll.findIndex(
    h => new Date(h.time).getTime() >= Date.now() - 3600000
  );
  const hourlyFromNow =
    nowLocalHour >= 0 ? hourlyAll.slice(nowLocalHour) : hourlyAll;

  const daily: DailyWeather[] = (json.daily.time as string[]).map(
    (date: string, i: number) => ({
      date,
      tempMaxC: json.daily.temperature_2m_max[i],
      tempMinC: json.daily.temperature_2m_min[i],
      precipitationSumMm: json.daily.precipitation_sum[i],
      precipitationProbabilityMax:
        json.daily.precipitation_probability_max?.[i] ?? 0,
      windGustsMaxKmh: json.daily.wind_gusts_10m_max[i],
      weatherCode: json.daily.weather_code[i],
      sunrise: json.daily.sunrise[i],
      sunset: json.daily.sunset[i],
      uvIndexMax: json.daily.uv_index_max?.[i] ?? 0,
    })
  );

  // 15-Minuten-Slots defensiv lesen – nicht jede Region liefert minutely_15
  const minutely: RainSlot[] = (
    (json.minutely_15?.time as string[] | undefined) ?? []
  ).map((time: string, i: number) => ({
    time,
    precipitationMm: json.minutely_15.precipitation?.[i] ?? 0,
  }));

  return {
    hourly: hourlyFromNow,
    hourlyAll,
    daily,
    minutely,
    current: {
      temperatureC: json.current.temperature_2m,
      apparentC: json.current.apparent_temperature,
      weatherCode: json.current.weather_code,
      windKmh: json.current.wind_speed_10m,
    },
    elevation: json.elevation,
  };
}
