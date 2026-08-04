/**
 * Feuerverbots-Übersicht nach Kanton (#263): Ergänzung zur Waldbrandgefahr
 * am eigenen Standort.
 *
 * Der Abschnitt lädt die amtliche Gefahrenstufe für alle 26 Kantone (Punkt:
 * jeweils der Hauptort) über dieselbe GeoAdmin-Abfrage, die auch den Wert
 * am Standort liefert. Geladen wird erst beim AUFKLAPPEN – 26 Abfragen
 * gehören nicht in jeden Seitenaufruf.
 *
 * Zur Ehrlichkeit: Die Stufe ist eine Einschätzung des Bundes, das
 * Feuerverbot eine Verfügung von Kanton oder Gemeinde. Der Abschnitt sagt
 * das im Klartext und verlinkt fürs Verbindliche auf die offizielle Seite,
 * statt eine Rechtsauskunft zu erfinden, die er nicht geben kann.
 */
import { useCallback, useState } from "react";
import { ChevronDown, ExternalLink, Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";
import {
  banLikely,
  CANTONS,
  FIRE_BAN_PORTAL,
  sortByDanger,
} from "@shared/fireBans";
import {
  FIRE_DANGER_LEVELS,
  fireDangerRequestUrl,
  parseFireDangerResponse,
  type FireDangerLevel,
} from "@shared/fireDanger";
import { wgs84ToLV95 } from "@/lib/sun";
import { cn } from "@/lib/utils";

interface CantonRow {
  code: string;
  name: string;
  capital: string;
  level: number | null;
}

/** Farbe je Stufe – dieselbe Logik wie beim Standort-Wert im Wetter-Modul. */
const LEVEL_STYLES: Record<FireDangerLevel, string> = {
  1: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  2: "bg-lime-500/15 text-lime-700 dark:text-lime-400",
  3: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  4: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  5: "bg-destructive/15 text-destructive",
};

export default function FireBanOverview() {
  const { lang, t } = useI18n();
  const tf = t.fireBans;
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CantonRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      // In Vierergruppen, damit die freie GeoAdmin-Schnittstelle nicht mit
      // 26 gleichzeitigen Abfragen bedient wird.
      const result: CantonRow[] = [];
      for (let i = 0; i < CANTONS.length; i += 4) {
        const batch = CANTONS.slice(i, i + 4);
        const levels = await Promise.all(
          batch.map(async canton => {
            try {
              const lv95 = wgs84ToLV95(canton.latitude, canton.longitude);
              if (!lv95) return null;
              const res = await fetch(
                fireDangerRequestUrl(lv95.east, lv95.north)
              );
              if (!res.ok) return null;
              const info = parseFireDangerResponse(await res.json());
              return info?.level ?? null;
            } catch {
              return null;
            }
          })
        );
        batch.forEach((canton, index) => {
          result.push({
            code: canton.code,
            name: canton.name,
            capital: canton.capital,
            level: levels[index],
          });
        });
      }
      if (result.every(row => row.level === null)) setFailed(true);
      setRows(sortByDanger(result));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && rows === null && !loading) void load();
  };

  return (
    <section aria-label={tf.sectionAria} className="mb-6">
      <div className="rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm"
        >
          <Flame className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-left font-semibold">
            {tf.title}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div className="border-t border-border px-4 py-3">
            <p className="mb-3 text-xs text-muted-foreground">{tf.intro}</p>

            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {tf.loading}
              </p>
            )}

            {!loading && failed && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{tf.loadFailed}</p>
                <Button variant="outline" size="sm" onClick={() => void load()}>
                  {tf.retry}
                </Button>
              </div>
            )}

            {!loading && !failed && rows && (
              <ul className="space-y-1">
                {rows.map(row => (
                  <li
                    key={row.code}
                    className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-b border-border/60 py-1.5 last:border-0"
                  >
                    <span className="w-8 shrink-0 font-mono text-xs font-semibold">
                      {row.code}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {row.name}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {row.capital}
                      </span>
                    </span>
                    {row.level === null ? (
                      <span className="text-xs text-muted-foreground">
                        {tf.unknown}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          LEVEL_STYLES[row.level as FireDangerLevel]
                        )}
                      >
                        {row.level} ·{" "}
                        {pick(
                          FIRE_DANGER_LEVELS[row.level as FireDangerLevel]
                            .title,
                          lang
                        )}
                      </span>
                    )}
                    {banLikely(row.level) && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                        {tf.banLikely}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              {tf.disclaimer}
            </p>
            <a
              href={FIRE_BAN_PORTAL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary underline"
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              {tf.portalLink}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
