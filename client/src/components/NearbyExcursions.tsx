/**
 * Ausflüge in der Nähe (#271): die nächstgelegenen Ausflugsziele aus der
 * eigenen Ausflugfinder-App – im Platz-Dossier die Antwort auf «was kann man
 * hier in der Nähe unternehmen?».
 *
 * Zwei Dinge bestimmen den Aufbau:
 *
 * 1. Der Abschnitt LÄDT ERST BEIM AUFKLAPPEN. Das Dossier holt bereits Wetter,
 *    Wasserwerte und Höhe – auf Supabase soll es nicht auch noch warten.
 *    Die billige Frage «ist die Anbindung überhaupt eingerichtet?»
 *    (`excursions.status`) fasst die Quelle nicht an und entscheidet, ob der
 *    Abschnitt überhaupt erscheint. Ohne Einrichtung: gar nichts, kein
 *    Fehlerkasten.
 * 2. Die Inhalte der Ziele sind Nutzerdaten aus der anderen App und deshalb
 *    einsprachig Deutsch. Übersetzt sind nur die Beschriftungen rundherum.
 *    Die Quellenzeile «Aus deiner Ausflugfinder-App» steht bewusst dabei.
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ChevronDown,
  ExternalLink,
  FerrisWheel,
  Info,
  MapPin,
  Navigation,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { directionsUrl } from "@/lib/directions";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { formatDistance } from "@shared/geo";
import {
  costLevelSymbols,
  nearestExcursions,
  type Excursion,
} from "@shared/excursions";
import { cn } from "@/lib/utils";

/** So viele Ziele zeigt das Dossier – mehr wird zur Liste statt zum Tipp. */
const NEARBY_LIMIT = 8;

/** Kostenstufe als «CHF»-Zeichen bzw. «gratis»; ohne Angabe steht nichts da. */
function CostBadge({ level }: { level: number | null }) {
  const { t } = useI18n();
  const symbols = costLevelSymbols(level);
  if (symbols === null || level === null) return null;
  return (
    <span
      className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
      aria-label={t.excursions.costAria(level)}
    >
      {symbols === "" ? t.excursions.costFree : symbols}
    </span>
  );
}

/** Ein Ziel in der Liste – Details klappen auf Wunsch darunter auf. */
function ExcursionItem({
  excursion,
  distanceM,
}: {
  excursion: Excursion;
  distanceM: number;
}) {
  const { lang, t } = useI18n();
  const te = t.excursions;
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-lg border border-border/70 bg-background p-3">
      <div className="flex gap-3">
        {excursion.photoUrl && (
          <img
            src={excursion.photoUrl}
            alt={te.photoAlt(excursion.name)}
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-md object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium">{excursion.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{te.distanceAway(formatDistance(distanceM, lang))}</span>
            {excursion.region && <span>· {excursion.region}</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {excursion.categories.map(category => (
              <span
                key={category}
                className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs"
              >
                {category}
              </span>
            ))}
            <CostBadge level={excursion.costLevel} />
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
          {open ? te.detailsHide : te.detailsShow}
        </button>
        <a
          href={directionsUrl(excursion.latitude, excursion.longitude)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={te.navAria(excursion.name)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          {te.navButton}
        </a>
        {/* Auf der Karte: der Pin wird dort angesteuert und sein Popup geöffnet */}
        <Link
          href={`/karte?ausflug=${encodeURIComponent(excursion.id)}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {te.mapLink}
        </Link>
      </div>

      {open && (
        <div className="mt-2 space-y-2 border-t border-border/60 pt-2 text-sm">
          {excursion.description && (
            <p className="whitespace-pre-line text-muted-foreground">
              {excursion.description}
            </p>
          )}
          {excursion.niceToKnow && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {te.niceToKnowLabel}:{" "}
              </span>
              {excursion.niceToKnow}
            </p>
          )}
          {excursion.openingHours && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {te.openingHoursLabel}:{" "}
              </span>
              {excursion.openingHours}
            </p>
          )}
          {excursion.address && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {te.addressLabel}:{" "}
              </span>
              {excursion.address}
            </p>
          )}
          {excursion.parking && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {te.parkingLabel}:{" "}
              </span>
              {excursion.parking}
              {excursion.parkingFree !== null &&
                ` (${excursion.parkingFree ? te.parkingFree : te.parkingPaid})`}
            </p>
          )}
          {(excursion.lengthKm !== null || excursion.tourShape) && (
            <p className="text-muted-foreground">
              {excursion.lengthKm !== null && (
                <>
                  <span className="font-medium text-foreground">
                    {te.lengthLabel}:{" "}
                  </span>
                  {te.lengthKm(
                    excursion.lengthKm.toLocaleString(LOCALE_TAGS[lang], {
                      maximumFractionDigits: 1,
                    })
                  )}
                </>
              )}
              {excursion.lengthKm !== null && excursion.tourShape && " · "}
              {excursion.tourShape === "loop" && te.tourLoop}
              {excursion.tourShape === "aToB" && te.tourAToB}
            </p>
          )}
          {excursion.ageAdvice && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {te.ageLabel}:{" "}
              </span>
              {excursion.ageAdvice}
            </p>
          )}
          {excursion.suitableForBabies && (
            <p className="text-muted-foreground">{te.babiesOk}</p>
          )}
          {excursion.seasons.length > 0 && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {te.seasonsLabel}:{" "}
              </span>
              {excursion.seasons.map(key => te.season[key]).join(", ")}
            </p>
          )}
          {excursion.websiteUrl && (
            <a
              href={excursion.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {te.websiteLink}
            </a>
          )}
        </div>
      )}
    </li>
  );
}

export default function NearbyExcursions({
  latitude,
  longitude,
  placeName,
  className,
}: {
  latitude: number;
  longitude: number;
  placeName?: string | null;
  className?: string;
}) {
  const { t } = useI18n();
  const te = t.excursions;
  const [open, setOpen] = useState(false);

  // Billige Frage ohne Zugriff auf die Quelle: gibt es das Feature hier?
  const { data: status } = trpc.excursions.status.useQuery();
  // Der eigentliche Abruf startet erst, wenn der Abschnitt aufgeklappt wird.
  const { data, isLoading, isError } = trpc.excursions.list.useQuery(
    undefined,
    {
      enabled: open && status?.configured === true,
      staleTime: 10 * 60 * 1000,
    }
  );

  const nearest = useMemo(
    () =>
      nearestExcursions(
        data?.excursions ?? [],
        latitude,
        longitude,
        NEARBY_LIMIT
      ),
    [data, latitude, longitude]
  );

  // Nicht eingerichtet heisst: das Feature gibt es hier nicht – kein Kasten,
  // keine Fehlermeldung, keine leere Liste.
  if (!status?.configured) return null;

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={te.sectionAria}
    >
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls="nearby-excursions"
        className="flex w-full items-center gap-2 text-left"
      >
        <FerrisWheel className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-serif text-lg font-semibold">{te.title}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <p className="mt-1 text-sm text-muted-foreground">
        {placeName ? te.subtitleAtPlace(placeName) : te.subtitle}
      </p>

      {open && (
        <div id="nearby-excursions">
          {isLoading && (
            <div className="mt-3 space-y-2" aria-busy="true">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          )}
          {isError && (
            <p className="mt-3 text-sm text-muted-foreground">
              {te.loadFailed}
            </p>
          )}
          {!isLoading && !isError && nearest.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">{te.empty}</p>
          )}
          {nearest.length > 0 && (
            <>
              <p className="mt-3 text-sm font-medium">
                {te.resultCount(nearest.length)}
              </p>
              <ul className="mt-2 space-y-3">
                {nearest.map(entry => (
                  <ExcursionItem
                    key={entry.excursion.id}
                    excursion={entry.excursion}
                    distanceM={entry.distanceM}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{te.source}</p>
    </section>
  );
}
