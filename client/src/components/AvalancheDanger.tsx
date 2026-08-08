/**
 * Lawinengefahr-Zeile (#471) für die Heute-Ansicht bei Wintersport-
 * Reisen: Warnstufe der SLF-Warnregion, in der die Reise-Koordinaten
 * liegen. Nur Schweiz – ausserhalb (und ohne Bulletin-Treffer) bleibt
 * die Zeile weg, statt mit fremden Skalen zu raten.
 */
import { useEffect, useState } from "react";
import { Mountain } from "lucide-react";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";
import { AVALANCHE_LEVEL_LABELS, inSwitzerland } from "@shared/avalanche";
import { loadAvalancheDanger } from "@/lib/avalanche";

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
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!inSwitzerland(latitude, longitude)) {
      setLevel(null);
      return;
    }
    let cancelled = false;
    void loadAvalancheDanger(latitude, longitude).then(result => {
      if (!cancelled) setLevel(result?.level ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  const label = level != null ? AVALANCHE_LEVEL_LABELS[level] : undefined;
  if (level == null || !label) return null;

  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Mountain className="h-4 w-4 text-primary" aria-hidden="true" />
        {t.avalanche.line(level, pick(label, lang))}
      </p>
      <p className="text-xs text-muted-foreground">{t.avalanche.note}</p>
    </div>
  );
}
