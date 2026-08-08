/**
 * «Auf dieser Höhe dauert es länger» (#385).
 *
 * DER KLASSIKER, an dem das Nachtessen scheitert: Auf 2000 m siedet
 * Wasser bei rund 93 °C. Wer sich ans Rezept hält, isst harte Teigwaren
 * und sucht den Fehler beim Kocher.
 *
 * ERSCHEINT NUR, WENN ES ETWAS ZU SAGEN GIBT – also nur, wenn ein
 * Aufenthalt läuft, sein Platz eine erfasste Höhe hat und die über der
 * Schwelle liegt. Ein Hinweis, der im Flachland bei jedem Rezept steht,
 * ist Lärm, und Lärm blendet man aus.
 *
 * SAGT AUSDRÜCKLICH «RICHTWERT». Der Siedepunkt ist Physik, die
 * Verlängerung der Garzeit ist Erfahrung – sie hängt an Stückgrösse,
 * Deckel und Topf. Eine Minutenzahl, die so tut, als wäre sie gemessen,
 * wäre eine Lüge mit Nachkommastelle.
 */
import { ChefHat } from "lucide-react";
import { useT } from "@/i18n";
import { useStayElevation } from "@/lib/useStayElevation";
import {
  adjustedMinutes,
  altitudeLevel,
  boilingPointC,
} from "@shared/altitudeCooking";

export default function AltitudeCookingNote({
  minutes,
}: {
  /** Angegebene Zubereitungszeit des Rezepts. */
  minutes: number;
}) {
  const t = useT();
  const ac = t.altitudeCooking;
  const { elevationM, spotName } = useStayElevation();
  const level = altitudeLevel(elevationM);

  if (level === "none" || elevationM === null) return null;
  const adjusted = adjustedMinutes(minutes, elevationM);
  // Rundet die Anpassung auf dieselbe Minute, gibt es nichts zu melden.
  if (adjusted <= Math.round(minutes)) return null;

  return (
    <p className="mt-3 flex items-start gap-2 rounded-lg bg-accent px-3 py-2 text-xs leading-snug">
      <ChefHat
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
        aria-hidden="true"
      />
      <span>
        <span className="font-medium">
          {ac.headline(elevationM, boilingPointC(elevationM))}
        </span>{" "}
        {ac.estimate(Math.round(minutes), adjusted)}{" "}
        {level === "strong" && ac.pressureCooker}
        <span className="block text-muted-foreground">
          {spotName ? ac.source(spotName) : ac.guide}
        </span>
      </span>
    </p>
  );
}
