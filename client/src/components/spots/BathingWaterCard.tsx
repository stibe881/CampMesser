/**
 * Badestellen-Info im Platz-Dossier (#223/#439, aus SpotDetail.tsx
 * herausgelöst): Wassertemperatur, Abfluss und Pegel der nächsten
 * BAFU-Messstelle bzw. Meerwasser-Temperatur der Marine-API.
 */
import { Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { bathingComfort, waveLevel } from "@shared/bathingWater";
import { formatDistance } from "@shared/geo";
import { compassDirection } from "@shared/solar";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";

/**
 * Badestellen-Info (#223): Wassertemperatur am Platz plus, wo vorhanden,
 * Abfluss und Pegel. In der Schweiz aus den offenen Hydrodaten der
 * nächstgelegenen BAFU-Messstelle, sonst aus der Meerwasser-Temperatur der
 * Marine-API. Liegt der Platz nicht am Wasser, bleibt die Karte ganz weg –
 * eine leere Karte «Wasser» wäre auf dem Berg nur Ballast.
 */
export default function BathingWaterCard({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const { lang, t } = useI18n();
  const query = trpc.water.nearby.useQuery(
    { latitude, longitude },
    { staleTime: 10 * 60 * 1000 }
  );
  const tw = t.bathingWater;

  if (query.isPending) {
    return (
      <Card className="mb-4">
        <CardContent className="py-4">
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }
  const data = query.data;
  if (!data || data.source === "none") return null;

  const temperatureC =
    data.source === "station"
      ? data.reading.temperatureC
      : (data.marine?.temperatureC ?? null);
  const trend =
    data.source === "station"
      ? data.reading.trend
      : (data.marine?.trend ?? "unknown");
  const measuredAtMs =
    data.source === "station"
      ? data.reading.measuredAtMs
      : (data.marine?.measuredAtMs ?? null);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Waves className="h-4 w-4 text-primary" aria-hidden="true" />
          {tw.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          {data.source === "station"
            ? tw.stationLine(
                data.station.waterBody,
                data.station.name,
                formatDistance(data.station.distanceM, lang)
              )
            : tw.marineLine}
        </p>

        {temperatureC !== null ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-3xl font-semibold text-primary">
              {temperatureC.toFixed(1)}°C
            </p>
            <p className="text-sm font-medium">
              {tw.comfort[bathingComfort(temperatureC)]}
            </p>
            {trend !== "unknown" && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                {tw.trend[trend]}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{tw.noTemperature}</p>
        )}

        {/* Wellen fürs Meer (#451) – nur an der Küste vorhanden */}
        {data.source === "marine" && data.marine?.waveHeightM != null && (
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-sm">
              <span className="font-semibold">
                {tw.waveHeight(data.marine.waveHeightM.toFixed(1))}
              </span>
              {data.marine.waveDirectionDeg != null &&
                ` · ${tw.waveFrom(
                  compassDirection(data.marine.waveDirectionDeg, lang)
                )}`}
            </p>
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              {tw.waveLevels[waveLevel(data.marine.waveHeightM)]}
            </span>
          </div>
        )}

        {/* Gezeiten (#462): nächstes Hoch-/Niedrigwasser aus dem
            stündlichen Meeresspiegel – ohne nennenswerten Tidenhub
            (Mittelmeer) bleibt die Zeile weg, «Hochwasser um 14 Uhr»
            wäre dort keine Information. Stundengenau, mehr gibt die
            Reihe nicht her. */}
        {data.source === "marine" && (data.marine?.tides.length ?? 0) > 0 && (
          <p className="mt-2 text-sm">
            <span className="font-medium">{tw.tideTitle}</span>{" "}
            {(data.marine?.tides ?? [])
              .map(tide =>
                (tide.kind === "high" ? tw.tideHigh : tw.tideLow)(
                  new Date(tide.timeMs).toLocaleTimeString(LOCALE_TAGS[lang], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                )
              )
              .join(" · ")}
          </p>
        )}

        {data.source === "station" &&
          (data.reading.flowM3s !== null ||
            data.reading.levelMasl !== null) && (
            <dl className="mt-3 space-y-1 text-sm">
              {data.reading.flowM3s !== null && (
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <dt className="w-32 shrink-0 text-muted-foreground">
                    {tw.flowLabel}
                  </dt>
                  <dd>{tw.flowValue(data.reading.flowM3s.toFixed(1))}</dd>
                </div>
              )}
              {data.reading.levelMasl !== null && (
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <dt className="w-32 shrink-0 text-muted-foreground">
                    {tw.levelLabel}
                  </dt>
                  <dd>{tw.levelValue(data.reading.levelMasl.toFixed(2))}</dd>
                </div>
              )}
            </dl>
          )}

        {measuredAtMs !== null && (
          <p className="mt-3 text-xs text-muted-foreground">
            {tw.measuredAt(
              new Date(measuredAtMs).toLocaleString(LOCALE_TAGS[lang], {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            )}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {data.source === "station" ? tw.sourceStation : tw.sourceMarine}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{tw.safetyNote}</p>
      </CardContent>
    </Card>
  );
}
