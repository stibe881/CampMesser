/**
 * Die Lagerfeuer-Ampel (#389): «Können wir heute Feuer machen?»
 *
 * DIE FRAGE STAND IN DREI MODULEN und in keinem als Antwort: Die
 * Waldbrandgefahr wohnt im Wetter (#4), die Verbots-Schwelle in der
 * Kantonsübersicht (#263), die Böen in der Prognose. Hier stehen alle
 * drei in EINER Zeile mit einem Urteil – und mit den Gründen daneben,
 * denn eine Ampel ohne Begründung ist ein Orakel.
 *
 * SIE SAGT «SPRICHT NICHTS DAGEGEN», NIE «ERLAUBT». Was auf der Tafel
 * an der Rezeption steht, kann keine App wissen; die Platzordnung hat
 * das letzte Wort, und das steht wörtlich darunter. Fürs Verbindliche
 * bleibt der Link aufs amtliche Portal.
 *
 * Die Gefahrenstufe holt das Bauteil selbst (GeoAdmin, nur innerhalb
 * der Schweiz – dieselbe Abfrage wie im Wetter-Modul). Die Böen kommen
 * als Prop von der Prognose, die die Seite ohnehin schon hat: ein
 * zweiter Wetterabruf nur für die Ampel wäre Verschwendung.
 */
import { useEffect, useState } from "react";
import { ExternalLink, Flame } from "lucide-react";
import { useI18n } from "@/i18n";
import { FIRE_BAN_PORTAL } from "@shared/fireBans";
import {
  describeFireDanger,
  fireDangerRequestUrl,
  parseFireDangerResponse,
  type FireDangerInfo,
} from "@shared/fireDanger";
import { campfireVerdict, type CampfireState } from "@shared/campfire";
import { wgs84ToLV95 } from "@/lib/sun";
import { cn } from "@/lib/utils";

const STATE_STYLES: Record<CampfireState, string> = {
  ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  caution: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  no: "bg-destructive/15 text-destructive",
  unknown: "bg-muted text-muted-foreground",
};

export default function CampfireLight({
  latitude,
  longitude,
  gustsMaxKmh,
  className,
}: {
  latitude: number;
  longitude: number;
  /** Höchste Böe heute in km/h; null = keine Prognose vorhanden. */
  gustsMaxKmh: number | null;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const cf = t.campfire;
  const [danger, setDanger] = useState<FireDangerInfo | null>(null);

  // Amtliche Gefahrenstufe – nur innerhalb der Schweiz vorhanden.
  // Stilles Scheitern wie im Wetter-Modul: Die Ampel urteilt dann über
  // den Wind allein und SAGT, dass die halbe Rechnung fehlt.
  useEffect(() => {
    setDanger(null);
    const lv95 = wgs84ToLV95(latitude, longitude);
    if (!lv95) return;
    let cancelled = false;
    fetch(fireDangerRequestUrl(lv95.east, lv95.north))
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (!cancelled) setDanger(parseFireDangerResponse(json));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  const verdict = campfireVerdict({
    dangerLevel: danger?.level ?? null,
    gustsMaxKmh,
  });

  // Ohne jede Quelle wäre die Ampel ein leeres Versprechen – dann lieber gar nichts.
  if (verdict.state === "unknown") return null;

  const reasons: string[] = [];
  if (verdict.banLikely && danger)
    reasons.push(cf.reasonBan(describeFireDanger(danger.level, lang).title));
  else if (verdict.elevatedDanger && danger)
    reasons.push(cf.reasonDanger(describeFireDanger(danger.level, lang).title));
  if (verdict.strongWind && gustsMaxKmh !== null)
    reasons.push(cf.reasonStrongWind(gustsMaxKmh));
  else if (verdict.sparkWind && gustsMaxKmh !== null)
    reasons.push(cf.reasonSparkWind(gustsMaxKmh));
  if (!verdict.dangerKnown) reasons.push(cf.reasonNoDanger);

  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2",
        STATE_STYLES[verdict.state],
        className
      )}
      role={verdict.state === "no" ? "alert" : undefined}
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <Flame className="h-4 w-4 shrink-0" aria-hidden="true" />
        {verdict.state === "no" && cf.stateNo}
        {verdict.state === "caution" && cf.stateCaution}
        {verdict.state === "ok" && cf.stateOk}
      </p>
      {reasons.length > 0 && (
        <p className="mt-0.5 text-xs opacity-90">{reasons.join(" ")}</p>
      )}
      <p className="mt-1 text-[11px] leading-snug opacity-75">
        {cf.note}{" "}
        <a
          href={FIRE_BAN_PORTAL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 underline"
        >
          {cf.portal}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}
