/**
 * Kompakte Wetterdaten fürs Platz-Dossier (eigene und geteilte Ansicht):
 * 3 Tage Vorschau plus Unwetterwarnungen aus 48 Stunden.
 */
import {
  detectAlerts,
  type HourlyWeather,
  type WeatherAlert,
} from "@shared/weather";

export interface DossierWeather {
  daily: {
    date: string;
    tempMaxC: number;
    tempMinC: number;
    precipProbability: number;
    weatherCode: number;
  }[];
  alerts: WeatherAlert[];
}

export async function fetchDossierWeather(
  lat: number,
  lon: number
): Promise<DossierWeather> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone: "auto",
    forecast_days: "3",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    hourly:
      "temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,weather_code,cape,cloud_cover",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );
  if (!res.ok) throw new Error("Wetterdienst nicht erreichbar");
  const json = await res.json();
  const hourly: HourlyWeather[] = (json.hourly.time as string[]).map(
    (time: string, i: number) => ({
      time,
      temperatureC: json.hourly.temperature_2m[i],
      apparentC: json.hourly.apparent_temperature[i],
      precipitationMm: json.hourly.precipitation[i],
      precipitationProbability: json.hourly.precipitation_probability?.[i] ?? 0,
      windSpeedKmh: json.hourly.wind_speed_10m[i],
      windGustsKmh: json.hourly.wind_gusts_10m[i],
      weatherCode: json.hourly.weather_code[i],
      cape: json.hourly.cape?.[i] ?? 0,
      cloudCover: json.hourly.cloud_cover?.[i] ?? 0,
    })
  );
  return {
    daily: (json.daily.time as string[]).map((date: string, i: number) => ({
      date,
      tempMaxC: json.daily.temperature_2m_max[i],
      tempMinC: json.daily.temperature_2m_min[i],
      precipProbability: json.daily.precipitation_probability_max?.[i] ?? 0,
      weatherCode: json.daily.weather_code[i],
    })),
    alerts: detectAlerts(hourly),
  };
}
