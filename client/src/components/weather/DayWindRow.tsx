/**
 * Wind-Leiste im Tages-Detail (#174/#438, aus Weather.tsx herausgelöst):
 * alle drei Stunden ein Richtungspfeil plus Böenspitze.
 */
import { Wind } from "lucide-react";
import { useI18n } from "@/i18n";
import { compassDirection } from "@shared/solar";

/** Schrittweite der Wind-Leiste im Tages-Detail: jede dritte Stunde. */
const WIND_ROW_STEP = 3;

/**
 * Pfeil der Windrichtung. Meteorologisch wird die Richtung angegeben, AUS der
 * der Wind kommt – der Pfeil soll aber zeigen, WOHIN er weht: deshalb + 180°.
 * Die Basis-Grafik zeigt nach oben (Norden).
 */
function WindArrow({ deg, className }: { deg: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      style={{ transform: `rotate(${(deg + 180) % 360}deg)` }}
    >
      <path
        d="M12 3 L12 21 M12 3 L7 9.5 M12 3 L17 9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Wind-Leiste unter dem Stunden-Chart des aufgeklappten Tages: alle drei
 * Stunden ein Richtungspfeil plus die Böenspitze in km/h. Für Screenreader
 * steht pro Eintrag ein sr-only-Satz mit ausgeschriebener Himmelsrichtung.
 */
export default function DayWindRow({
  hours,
}: {
  hours: {
    label: string;
    gustsKmh: number;
    windDirectionDeg: number | undefined;
  }[];
}) {
  const { lang, t } = useI18n();
  const picks = hours.filter((_, i) => i % WIND_ROW_STEP === 0);
  if (picks.length === 0) return null;
  return (
    <div className="mt-2">
      <div className="overflow-x-auto">
        <ul
          className="flex min-w-max gap-2.5"
          aria-label={t.weather.windRowAria}
        >
          {picks.map(h => (
            <li
              key={h.label}
              className="flex w-12 shrink-0 flex-col items-center gap-0.5 text-center"
            >
              <span className="text-[10px] text-muted-foreground">
                {h.label}
              </span>
              {typeof h.windDirectionDeg === "number" ? (
                <WindArrow
                  deg={h.windDirectionDeg}
                  className="h-3.5 w-3.5 text-primary"
                />
              ) : (
                <Wind className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              )}
              <span className="text-[11px] font-medium tabular-nums">
                {Math.round(h.gustsKmh)}
              </span>
              <span className="sr-only">
                {typeof h.windDirectionDeg === "number"
                  ? t.weather.windSrHour(
                      h.label,
                      compassDirection(h.windDirectionDeg, lang),
                      Math.round(h.gustsKmh)
                    )
                  : t.weather.windSrHourNoDir(h.label, Math.round(h.gustsKmh))}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t.weather.windRowLegend}
      </p>
    </div>
  );
}
