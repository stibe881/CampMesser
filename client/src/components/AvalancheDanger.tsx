/**
 * Lawinengefahr-Zeile (#471, Euregio-Ausbau #490) für die Heute-Ansicht
 * bei Wintersport-Reisen: Warnstufe der Warnregion, in der die
 * Reise-Koordinaten liegen. Abgedeckt sind die Schweiz (SLF) und
 * Tirol/Südtirol/Trentino (avalanche.report) – ausserhalb (und ohne
 * Bulletin-Treffer) bleibt die Zeile weg, statt mit fremden Skalen zu
 * raten. Die Quellzeile nennt, wessen Bulletin gerade spricht.
 */
import { useEffect, useState } from "react";
import { Mountain } from "lucide-react";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";
import {
  AVALANCHE_LEVEL_LABELS,
  euregioRegionsAt,
  inSwitzerland,
} from "@shared/avalanche";
import {
  loadAvalancheDanger,
  type AvalancheDangerResult,
} from "@/lib/avalanche";

export default function AvalancheDanger({
  latitude,
  longitude,
  className,
}: {
  latitude: number;
  longitude: number;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const [danger, setDanger] = useState<AvalancheDangerResult | null>(null);

  useEffect(() => {
    if (
      !inSwitzerland(latitude, longitude) &&
      euregioRegionsAt(latitude, longitude).length === 0
    ) {
      setDanger(null);
      return;
    }
    let cancelled = false;
    void loadAvalancheDanger(latitude, longitude).then(result => {
      if (!cancelled) setDanger(result);
    });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  const label =
    danger != null ? AVALANCHE_LEVEL_LABELS[danger.level] : undefined;
  if (danger == null || !label) return null;

  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Mountain className="h-4 w-4 text-primary" aria-hidden="true" />
        {t.avalanche.line(danger.level, pick(label, lang))}
      </p>
      <p className="text-xs text-muted-foreground">
        {danger.source === "slf" ? t.avalanche.note : t.avalanche.noteEuregio}
      </p>
    </div>
  );
}
