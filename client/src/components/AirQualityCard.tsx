/**
 * Luftqualität am Wetter-Ort (#565): der europäische Luftqualitätsindex
 * (EAQI) von Open-Meteo als Ampel, dazu Feinstaub (PM2.5) und Ozon –
 * die Ergänzung zu UV-Index und Pollenflug (#53/#208).
 *
 * OHNE DATEN KEINE KARTE: Ist der Dienst nicht erreichbar oder liefert
 * er nichts, verschwindet die Karte, statt eine leere Ampel zu zeigen.
 */
import { useEffect, useState } from "react";
import { Wind } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import {
  AIR_QUALITY_COLORS,
  airQualityLabel,
  airQualityLevel,
} from "@shared/airQuality";

interface AirQualityData {
  aqi: number;
  pm25: number | null;
  ozone: number | null;
}

export default function AirQualityCard({
  latitude,
  longitude,
  className,
}: {
  latitude: number;
  longitude: number;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const [data, setData] = useState<AirQualityData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: "european_aqi,pm2_5,ozone",
    });
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`)
      .then(res => (res.ok ? res.json() : null))
      .then(
        (
          json: {
            current?: {
              european_aqi?: number;
              pm2_5?: number;
              ozone?: number;
            };
          } | null
        ) => {
          if (cancelled) return;
          const aqi = json?.current?.european_aqi;
          if (typeof aqi !== "number") return;
          setData({
            aqi,
            pm25:
              typeof json?.current?.pm2_5 === "number"
                ? json.current.pm2_5
                : null,
            ozone:
              typeof json?.current?.ozone === "number"
                ? json.current.ozone
                : null,
          });
        }
      )
      .catch(() => {
        // Dienst nicht erreichbar – die Karte bleibt weg
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  if (!data) return null;
  const level = airQualityLevel(data.aqi);
  return (
    <Card className={className}>
      <CardContent className="py-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Wind className="h-4 w-4 text-primary" aria-hidden="true" />
          {t.airQuality.title}
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: AIR_QUALITY_COLORS[level] }}
            aria-hidden="true"
          />
          <span className="font-medium">
            {airQualityLabel(level, lang)} · {t.airQuality.index}{" "}
            {Math.round(data.aqi)}
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {[
            data.pm25 !== null
              ? `${t.airQuality.pm25}: ${Math.round(data.pm25)} µg/m³`
              : null,
            data.ozone !== null
              ? `${t.airQuality.ozone}: ${Math.round(data.ozone)} µg/m³`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t.airQuality.source}
        </p>
      </CardContent>
    </Card>
  );
}
