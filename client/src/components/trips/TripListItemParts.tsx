/**
 * Gemeinsame Bausteine der Reise-Karten (#554, aus Trips.tsx herausgelöst).
 *
 * DAS PROBLEM: Die Seite renderte zwei fast wortgleiche Karten – geplante
 * und vergangene Aufenthalte. Meta-Zeile, Aktions-Spalte und der
 * LazySection-Stapel der Detailseite standen doppelt da; wer eine
 * Kleinigkeit nachzog, musste an zwei Stellen dasselbe tippen (zuletzt
 * bei den Etappen #536 wieder).
 *
 * DIE ANTWORT: Die drei identischen bzw. nur in VARIANTEN verschiedenen
 * Blöcke leben hier einmal. Was sich echt unterscheidet, steuert die
 * `phase` («planned» vor der Reise, «past» ab Anreise) bzw. einzelne
 * Props – keine Kopien mehr.
 */
import { Suspense, lazy } from "react";
import { Link } from "wouter";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  CopyPlus,
  LogOut,
  MapPin,
  Moon,
  Pencil,
  Printer,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ConfirmDialog";
import { useT } from "@/i18n";
import LazySection from "@/components/LazySection";
import TripJournal from "@/components/trips/TripJournal";
import TripBoard from "@/components/trips/TripBoard";
import { TripPhotos } from "@/components/trips/TripWidgets";
import TripDatePoll from "@/components/TripDatePoll";
import TripGuestbook from "@/components/TripGuestbook";
import TripHistory from "@/components/TripHistory";
import TripReservation from "@/components/TripReservation";
import NextTimeReminder from "@/components/trips/NextTimeReminder";
import TripMoreSections from "@/components/trips/TripMoreSections";
import TripOfflinePrep from "@/components/trips/TripOfflinePrep";
import TripReview from "@/components/trips/TripReview";
import TripStops from "@/components/trips/TripStops";

const TripExpenses = lazy(() => import("@/components/trips/TripExpenses"));
const TripCollage = lazy(() => import("@/components/trips/TripCollage"));

/** Was die Bausteine von einer Reise wissen müssen – strukturell, kein DB-Typ. */
export interface TripListTrip {
  id: number;
  role?: string | null;
  shared?: boolean | null;
  ownerName?: string | null;
  spotId: number | null;
  packListId: number | null;
  coverPhotoId?: number | null;
  reservationFileName?: string | null;
  budgetRappen: number | null;
  eurRateX10000: number | null;
  title: string | null;
  notes?: string | null;
  startDate: string;
  endDate: string;
  arrivalTime: string | null;
  departureTime: string | null;
}

/** Meta-Zeile: Mit-wem, Ort (als Dossier-Link), Zeitraum, Zeiten, Nächte. */
export function TripMetaLine({
  trip,
  dossierId,
  place,
  range,
  nights,
}: {
  trip: TripListTrip;
  /** Verknüpfter Zeltplatz-Favorit; null = kein Dossier-Link. */
  dossierId: number | null;
  place: string;
  range: string;
  nights: number;
}) {
  const t = useT();
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {trip.role === "member" && trip.ownerName && (
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" aria-hidden="true" />
          {t.trips.sharedWith(trip.ownerName)}
        </span>
      )}
      {/* Ort als Weg ins Dossier: Wer den Aufenthalt anschaut, will von
          dort zum Platz – ohne Link muss man über die Liste suchen. */}
      {(trip.title || dossierId != null) &&
        (dossierId != null ? (
          <Link
            href={`/zeltplaetze/${dossierId}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
            aria-label={t.trips.dossierAria(place)}
          >
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {place}
          </Link>
        ) : (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {place}
          </span>
        ))}
      <span className="flex items-center gap-1">
        <CalendarDays className="h-3 w-3" aria-hidden="true" />
        {range}
      </span>
      {(trip.arrivalTime || trip.departureTime) && (
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {t.trips.timesLine(trip.arrivalTime, trip.departureTime)}
        </span>
      )}
      <span className="flex items-center gap-1">
        <Moon className="h-3 w-3" aria-hidden="true" />
        {t.trips.nightsCount(nights)}
      </span>
    </p>
  );
}

/**
 * Aktions-Spalte rechts an der Karte: Bearbeiten und Duplizieren immer;
 * Drucken und Kalender-Export nur rückblickend (`phase: "past"`);
 * Mitreisende/Teilen/Löschen nur für die Besitzerin/den Besitzer,
 * Mitglieder bekommen stattdessen «Reise verlassen».
 */
export function TripActionColumn({
  trip,
  name,
  phase,
  onEdit,
  onDuplicate,
  onMembers,
  onHub,
  onRemove,
  onIcs,
  onLeave,
  leavePending,
}: {
  trip: TripListTrip;
  name: string;
  phase: "planned" | "past";
  onEdit: () => void;
  onDuplicate: () => void;
  onMembers: () => void;
  onHub: () => void;
  onRemove: () => void;
  /** Kalender-Export (#244) – nur in der «past»-Spalte sichtbar. */
  onIcs: () => void;
  onLeave: () => void;
  leavePending: boolean;
}) {
  const t = useT();
  const ask = useConfirm();
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
        onClick={onEdit}
        aria-label={t.trips.editEntryAria(name)}
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      {phase === "past" && (
        <>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
          >
            <Link
              href={`/tagebuch/${trip.id}/drucken`}
              aria-label={t.trips.printEntryAria(name)}
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
            onClick={onIcs}
            aria-label={t.trips.icsAria(name)}
            title={t.trips.icsButton}
          >
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
        onClick={onDuplicate}
        aria-label={t.trips.duplicateAria(name)}
        title={t.trips.duplicateDialogTitle}
      >
        <CopyPlus className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      {trip.role === "owner" ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
            onClick={onMembers}
            aria-label={t.trips.membersAria(name)}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
            onClick={onHub}
            aria-label={t.trips.hubShareAria(name)}
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
            onClick={onRemove}
            aria-label={
              phase === "planned"
                ? t.trips.deletePlannedAria(name)
                : t.trips.deleteEntryAria(name)
            }
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
          disabled={leavePending}
          onClick={async () => {
            if (
              await ask({
                title: t.trips.leaveConfirm(name),
                confirmLabel: t.common.confirmLeave,
              })
            ) {
              onLeave();
            }
          }}
          aria-label={t.trips.leaveTripAria(name)}
          title={t.trips.leaveTrip}
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

/**
 * Die Abschnitte der Detailseite (#310): Journal, Reisekasse, Pinnwand,
 * Fotos, Collage, Etappen und der «Mehr»-Schalter (#357).
 *
 * NUR AUF DER DETAILSEITE (#359): In der Liste stapelte jede Reise hier
 * acht graue Balken übereinander – die Liste ist wieder eine Liste, die
 * Abschnitte erscheinen erst, wenn `/tagebuch/<id>` sie anfordert.
 * ABSCHNITTE ERST BEIM SCROLLEN (#347): einige holen sofort Daten,
 * deshalb steckt der Stapel in einer LazySection.
 *
 * Die `phase` steuert die Unterschiede: geplant zeigt Termin-Finder,
 * «Beim nächsten Mal» und Offline-Paket, rückblickend den Rückblick –
 * alles andere ist für beide gleich.
 */
export function TripDetailSections({
  trip,
  name,
  today,
  phase,
  openReview = false,
}: {
  trip: TripListTrip;
  name: string;
  today: string;
  phase: "planned" | "past";
  /**
   * Sprung zum Rückblick (?rueckblick=1): «Mehr»-Schalter und Rückblick
   * öffnen sich von selbst – der Link der Heimkehr-Karte landet direkt
   * dort, wo man ausfüllen soll.
   */
  openReview?: boolean;
}) {
  const shared = Boolean(trip.shared) || trip.role === "member";
  return (
    <LazySection minHeight={320}>
      <Suspense fallback={null}>
        {/* Reise-Tagebuch (#192): erst ab dem ersten Reisetag */}
        {(phase === "past" || trip.startDate <= today) && (
          <TripJournal
            tripId={trip.id}
            tripName={name}
            startDate={trip.startDate}
            endDate={trip.endDate}
            shared={shared}
          />
        )}
        {/* Reisekasse (#219): auch schon vor der Anreise – Platzmiete
            und Sprit fallen oft vorher an */}
        <TripExpenses
          tripId={trip.id}
          tripName={name}
          defaultDay={today > trip.endDate ? trip.endDate : today}
          shared={shared}
          budgetRappen={trip.budgetRappen}
          eurRateX10000={trip.eurRateX10000}
          spotId={trip.spotId}
          startDate={trip.startDate}
          endDate={trip.endDate}
        />
        {/* Termin-Finder (#253): nur bei gemeinsamen Reisen und nur,
            solange die Reise noch bevorsteht */}
        {phase === "planned" && shared && trip.startDate > today && (
          <TripDatePoll tripId={trip.id} tripName={name} />
        )}
        {/* Pinnwand (#245, für jede Reise seit #344) */}
        <TripBoard tripId={trip.id} tripName={name} shared={shared} />
        <TripPhotos
          tripId={trip.id}
          tripName={name}
          coverPhotoId={trip.coverPhotoId ?? null}
        />
        {/* Foto-Collage (#226) */}
        <TripCollage
          tripId={trip.id}
          tripName={name}
          startDate={trip.startDate}
          endDate={trip.endDate}
        />
        {/* «Beim nächsten Mal» (#396): die Notiz vom letzten Aufenthalt
            gehört GENAU hierher – beim Planen der nächsten Reise */}
        {phase === "planned" && trip.spotId != null && (
          <NextTimeReminder spotId={trip.spotId} />
        )}
        {/* Etappen (#536): beim Planen direkt sichtbar, rückblickend
            hinter dem «Mehr»-Schalter */}
        {phase === "planned" && (
          <TripStops
            tripId={trip.id}
            tripName={name}
            startDate={trip.startDate}
            endDate={trip.endDate}
          />
        )}
        {/* Seltenes hinter einen Schalter (#357) */}
        <TripMoreSections
          count={phase === "planned" ? 4 : 5}
          initialOpen={openReview && phase === "past"}
        >
          {phase === "past" && (
            <TripStops
              tripId={trip.id}
              tripName={name}
              startDate={trip.startDate}
              endDate={trip.endDate}
            />
          )}
          {/* Für unterwegs vorbereiten (#387): vor der Abfahrt, nicht
              im Funkloch */}
          {phase === "planned" && (
            <TripOfflinePrep
              tripId={trip.id}
              spotId={trip.spotId}
              packListId={trip.packListId}
            />
          )}
          {/* Rückblick (#381): erst nach der Reise weiss man, was
              gefehlt hat */}
          {phase === "past" && (
            <TripReview
              tripId={trip.id}
              packListId={trip.packListId}
              tripName={name}
              initialOpen={openReview}
            />
          )}
          {/* Änderungsverlauf (#296): nur bei gemeinsamen Reisen */}
          {shared && <TripHistory tripId={trip.id} tripName={name} />}
          {/* Gästebuch (#254) */}
          <TripGuestbook tripId={trip.id} tripName={name} />
          {/* Buchungsbestätigung (#279): nur bei eigenen Reisen */}
          {trip.role !== "member" && (
            <TripReservation
              tripId={trip.id}
              fileName={trip.reservationFileName ?? null}
              className="mt-2"
            />
          )}
        </TripMoreSections>
      </Suspense>
    </LazySection>
  );
}
