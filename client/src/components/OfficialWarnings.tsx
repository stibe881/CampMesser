/**
 * Amtliche Unwetterwarnungen von MeteoSchweiz (über MeteoAlarm).
 *
 * WARUM ZUSÄTZLICH ZU DEN EIGENEN WARNUNGEN: Die App rechnet ihre
 * Warnungen selbst aus der Prognose – Wind am Zelt, Hitze, Starkregen,
 * mit Schwellen, die man im Profil verstellen kann. Dafür gibt es keine
 * amtliche Warnung: MeteoSchweiz warnt nicht, weil dein Vorzelt bei
 * 60 km/h Mühe hat. Umgekehrt sieht die Prognose ein Gewitter nicht so
 * scharf wie ein Meteorologe mit dem Radar. Beides zusammen ist besser
 * als eines allein.
 *
 * SIE STEHEN ZUOBERST, weil sie den Ton angeben: Wenn MeteoSchweiz eine
 * Warnung ausgibt, ist das die Nachricht – der selbst gerechnete
 * Windwert daneben ist die Ergänzung.
 *
 * QUELLENANGABE IST PFLICHT und steht deshalb fest eingebaut unter der
 * Liste, nicht als Zusatz, den man weglassen kann.
 */
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { LOCALE_TAGS } from "@shared/i18n";
import { ATTRIBUTION, eventLabel, severityToAlert } from "@shared/meteoAlarm";

const styles = {
  gefahr: "border-destructive/50 bg-destructive/10 text-destructive",
  warnung:
    "border-amber-600/40 bg-amber-500/15 text-amber-900 dark:text-amber-200",
  info: "border-primary/40 bg-primary/10 text-primary",
} as const;

export default function OfficialWarnings({
  latitude,
  longitude,
  className,
}: {
  latitude: number;
  longitude: number;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tw = t.officialWarnings;
  const query = trpc.warnings.official.useQuery(
    { latitude, longitude },
    {
      // Amtliche Warnungen ändern sich nicht im Minutentakt; der Server
      // hält den Feed ohnehin zwischengespeichert
      staleTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  const warnings = query.data ?? [];
  // Ohne Warnung KEIN Kasten: «Zurzeit keine amtliche Warnung» wäre eine
  // Zeile, die jeden Tag dasteht und nie etwas bedeutet. Der Hinweis auf
  // die Quelle gehört zu den Warnungen, nicht auf eine leere Seite.
  if (warnings.length === 0) return null;

  const locale = LOCALE_TAGS[lang];

  return (
    <section
      className={cn("space-y-2.5", className)}
      aria-label={tw.sectionAria}
    >
      {warnings.map(warning => {
        const severity = severityToAlert(warning.severity);
        const until = Date.parse(warning.expires);
        return (
          <div
            key={warning.id}
            className={cn("rounded-xl border px-4 py-3", styles[severity])}
            role={severity === "gefahr" ? "alert" : undefined}
          >
            <p className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {eventLabel(warning.event, lang)}
              <span className="ml-auto rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                {tw.badge}
              </span>
            </p>
            <p className="mt-1 text-sm">
              {tw.issuedFor(ATTRIBUTION.issuer, warning.areaDesc)}
            </p>
            {Number.isFinite(until) && (
              <p className="mt-1.5 text-xs opacity-90">
                {tw.until(
                  new Date(until).toLocaleString(locale, {
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                )}
              </p>
            )}
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        {tw.source(ATTRIBUTION.issuer, ATTRIBUTION.source)}
      </p>
    </section>
  );
}
