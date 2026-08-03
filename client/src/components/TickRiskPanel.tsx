/**
 * Zecken-Risiko (#224): zeigt für einen Ort die behördliche FSME-Einstufung
 * und die saisonale Zecken-Aktivität nach Monat und Höhenlage, dazu die
 * Verhaltens-Tipps. Bewusst als eigenes Bauteil, weil derselbe Kasten an zwei
 * Stellen steht: im Platz-Dossier (mit Koordinaten und Höhe) und beim
 * Zeckenstich-Merker im Erste-Hilfe-Guide (ohne Ort, nur nach Monat).
 *
 * Formulierung durchgehend als Orientierungshilfe – die Einstufung ist eine
 * Gebiets-Angabe des BAG, keine Aussage über die eigene Gesundheit.
 */
import { Bug } from "lucide-react";
import { assessTickRisk, TICK_ALTITUDE_LIMIT_M } from "@shared/tickRisk";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/** Farbliche Abstufung der Aktivität – gleiche Palette wie die Warnstufen. */
const ACTIVITY_STYLES: Record<string, string> = {
  none: "bg-muted text-muted-foreground",
  low: "bg-chart-2/20 text-foreground",
  moderate: "bg-chart-4/20 text-foreground",
  high: "bg-destructive/10 text-destructive",
};

export default function TickRiskPanel({
  latitude,
  longitude,
  elevationM,
  className,
}: {
  latitude?: number | null;
  longitude?: number | null;
  elevationM?: number | null;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tr = t.tickRisk;
  const now = new Date();
  const month = now.getMonth() + 1;
  const hasLocation = latitude != null && longitude != null;
  const risk = assessTickRisk({ month, elevationM, latitude, longitude });
  const monthName = now.toLocaleDateString(LOCALE_TAGS[lang], {
    month: "long",
  });

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tr.sectionAria}
    >
      <div className="mb-2 flex items-center gap-2">
        <Bug className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="font-semibold">{tr.title}</h3>
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium",
            ACTIVITY_STYLES[risk.activity]
          )}
        >
          {tr.activity[risk.activity]}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        {tr.activityLine(monthName)}
      </p>

      {risk.aboveTickLine && (
        <p className="mt-1 text-sm text-muted-foreground">
          {tr.aboveTickLine(TICK_ALTITUDE_LIMIT_M)}
        </p>
      )}

      <p className="mt-2 text-sm">
        {!hasLocation
          ? tr.switzerlandGeneral
          : risk.status === "risk"
            ? tr.inRiskArea
            : risk.status === "no-risk" && risk.region
              ? tr.outsideRiskArea(pick(risk.region.name, lang))
              : tr.outsideSwitzerland}
      </p>

      {risk.relevant && (
        <>
          <p className="mt-3 text-sm font-medium">{tr.tipsTitle}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {tr.tips.map(tip => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{tr.sourceNote}</p>
    </section>
  );
}
