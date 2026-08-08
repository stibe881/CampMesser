/**
 * Platz-Vergleich (#440): zwei Zeltplatz-Favoriten nebeneinander – die
 * Entscheidungshilfe «Thun oder Interlaken?» vor dem Buchen.
 *
 * Abgrenzung zu Bestehendem: die Statistik vergleicht die KOSTEN aller
 * Plätze (#243), SpotRatingCompare ordnet nach Bewertungs-Kriterien
 * (#278). Hier stehen genau zwei Kandidaten Kopf an Kopf, mit allem,
 * was die Wahl entscheidet: Preis pro Nacht, Distanz von zuhause, Höhe,
 * Eigenschaften und die eigene Bewertung. Wer bei einer Zeile vorne
 * liegt, rechnet shared/spotCompare.ts aus.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Scale } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { formatElevation } from "@/lib/elevation";
import { formatChf } from "@/lib/money";
import { cn } from "@/lib/utils";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { distanceMeters } from "@shared/geo";
import {
  attributeCompareRows,
  compareAdvantage,
  type CompareAdvantage,
} from "@shared/spotCompare";
import { nightlyRappen } from "@shared/spotCosts";
import { parseSpotAttributes } from "@shared/spotAttributes";
import { overallRating, ratedCount } from "@shared/spotRatings";

export interface CompareSpotLike {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevationM: number | null;
  attributesJson: string | null;
  pricePerNightRappen: number | null;
  extraPerNightRappen: number | null;
  ratingSanitary: number | null;
  ratingQuiet: number | null;
  ratingShade: number | null;
  ratingKids: number | null;
}

function ratingsOf(spot: CompareSpotLike) {
  return {
    sanitary: spot.ratingSanitary,
    quiet: spot.ratingQuiet,
    shade: spot.ratingShade,
    kids: spot.ratingKids,
  };
}

/** Gewinner-Zelle hervorheben; bei tie/none bleiben beide neutral. */
function cellClass(advantage: CompareAdvantage, side: "a" | "b"): string {
  return advantage === side ? "font-semibold text-primary" : "";
}

export default function SpotCompare({
  spots,
  home,
  className,
}: {
  spots: CompareSpotLike[];
  home: { latitude: number; longitude: number } | null;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tc = t.spotCompare;
  const [aId, setAId] = useState<number | null>(null);
  const [bId, setBId] = useState<number | null>(null);

  const sorted = useMemo(
    () =>
      spots
        .slice()
        .sort((x, y) => x.name.localeCompare(y.name, LOCALE_TAGS[lang])),
    [spots, lang]
  );

  if (spots.length < 2) return null;

  const spotA = sorted.find(s => s.id === aId) ?? null;
  const spotB = sorted.find(s => s.id === bId) ?? null;

  const decimalSeparator = lang === "en" ? "." : ",";
  const dash = tc.none;

  const select = (
    id: string,
    label: string,
    value: number | null,
    other: number | null,
    onChange: (next: number | null) => void
  ) => (
    <div className="min-w-0 flex-1">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        value={value ?? ""}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{tc.choose}</option>
        {sorted
          .filter(s => s.id !== other)
          .map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
      </select>
    </div>
  );

  let table: ReactNode = null;
  if (spotA && spotB) {
    const priceA = nightlyRappen(spotA);
    const priceB = nightlyRappen(spotB);
    const priceAdv = compareAdvantage(priceA, priceB, "lower");
    const km = (spot: CompareSpotLike) =>
      home
        ? Math.round(
            distanceMeters(
              home.latitude,
              home.longitude,
              spot.latitude,
              spot.longitude
            ) / 1000
          )
        : null;
    const kmA = km(spotA);
    const kmB = km(spotB);
    const distanceAdv = compareAdvantage(kmA, kmB, "lower");
    const ratingsA = ratingsOf(spotA);
    const ratingsB = ratingsOf(spotB);
    const overallA = overallRating(ratingsA);
    const overallB = overallRating(ratingsB);
    const ratingAdv = compareAdvantage(overallA, overallB, "higher");
    const attrRows = attributeCompareRows(
      parseSpotAttributes(spotA.attributesJson),
      parseSpotAttributes(spotB.attributesJson)
    );

    const money = (rappen: number | null) =>
      rappen === null ? dash : `CHF ${formatChf(rappen, lang)}`;
    const distance = (value: number | null) =>
      value === null ? dash : `${value.toLocaleString(LOCALE_TAGS[lang])} km`;
    const elevation = (spot: CompareSpotLike) =>
      spot.elevationM === null
        ? dash
        : t.spots.elevation(formatElevation(spot.elevationM, lang));
    const rating = (
      overall: number | null,
      ratings: ReturnType<typeof ratingsOf>
    ) =>
      overall === null
        ? dash
        : tc.ratingValue(
            overall.toFixed(1).replace(".", decimalSeparator),
            ratedCount(ratings)
          );

    const rows: {
      key: string;
      label: string;
      a: string;
      b: string;
      advantage: CompareAdvantage;
    }[] = [
      {
        key: "price",
        label: tc.price,
        a: money(priceA),
        b: money(priceB),
        advantage: priceAdv,
      },
      ...(home
        ? [
            {
              key: "distance",
              label: tc.distance,
              a: distance(kmA),
              b: distance(kmB),
              advantage: distanceAdv,
            },
          ]
        : []),
      {
        key: "elevation",
        label: tc.elevation,
        a: elevation(spotA),
        b: elevation(spotB),
        // Höhenlage ist Geschmackssache – hier gewinnt niemand
        advantage: "none" as const,
      },
      {
        key: "rating",
        label: tc.rating,
        a: rating(overallA, ratingsA),
        b: rating(overallB, ratingsB),
        advantage: ratingAdv,
      },
      ...attrRows.map(row => ({
        key: `attr-${row.def.key}`,
        label: pick(row.def.label, lang),
        a: row.a ? pick(row.a.label, lang) : dash,
        b: row.b ? pick(row.b.label, lang) : dash,
        advantage: "none" as const,
      })),
    ];

    table = (
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[22rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-1.5 pr-2 font-medium sr-only">
                {tc.rowHeader}
              </th>
              <th scope="col" className="max-w-40 truncate py-1.5 pr-2">
                {spotA.name}
              </th>
              <th scope="col" className="max-w-40 truncate py-1.5">
                {spotB.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="border-b border-border/60">
                <th
                  scope="row"
                  className="py-1.5 pr-2 text-left font-normal text-muted-foreground"
                >
                  {row.label}
                </th>
                <td
                  className={cn("py-1.5 pr-2", cellClass(row.advantage, "a"))}
                >
                  {row.a}
                </td>
                <td className={cn("py-1.5", cellClass(row.advantage, "b"))}>
                  {row.b}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tc.title}
    >
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
        <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
        {tc.title}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{tc.hint}</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        {select("spot-compare-a", tc.spotA, aId, bId, setAId)}
        {select("spot-compare-b", tc.spotB, bId, aId, setBId)}
      </div>
      {table ?? (
        <p className="mt-3 text-sm text-muted-foreground">{tc.pickBoth}</p>
      )}
    </section>
  );
}
