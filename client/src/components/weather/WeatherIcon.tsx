/**
 * Wetter-Icon zur Open-Meteo-Codenummer (#438, aus Weather.tsx
 * herausgelöst). Die Zuordnung Code → Symbol steht in shared/weather.ts.
 */
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
} from "lucide-react";
import { describeWeatherCode } from "@shared/weather";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudLightning,
};

export default function WeatherIcon({
  code,
  className,
}: {
  code: number;
  className?: string;
}) {
  const { icon } = describeWeatherCode(code);
  const Icon = icons[icon] ?? Cloud;
  return <Icon className={className} aria-hidden="true" />;
}
