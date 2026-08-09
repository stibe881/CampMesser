/**
 * Reisepass (#292): für jeden besuchten Platz ein Stempel – je Person
 * ein eigener Pass (Nutzerwunsch 04.08.2026).
 *
 * Die Stempel entstehen aus den eingetragenen Reisen – nichts wird
 * doppelt erfasst. Jeder Platz bekommt ein Aussehen, das aus seinem
 * NAMEN gerechnet ist: dieselbe Form, dieselbe Farbe, dieselbe
 * Schräglage, auf jedem Gerät und nach jedem Neuladen.
 *
 * DIE PERSONEN SIND DIE AUS DEM FAMILIEN-MODUS. Wer dort schon
 * Kinder-Profile angelegt hat, legt sie nicht ein zweites Mal an; wer
 * noch keine hat, kann sie hier anlegen und findet sie dann auch bei den
 * Abzeichen wieder. Zwei Personenlisten in derselben App wären eine zu
 * viel.
 *
 * WER WAR DABEI wird bei der REISE erfasst (Reise-Formular, Abschnitt
 * «Wer ist dabei?») – der Pass leitet alles nur noch ab; gespeichert
 * wird die Abwesenheit (Begründung in shared/passport.ts). Der
 * FAMILIEN-Pass ist streng (Nutzer-Entscheid 09.08.2026): Er stempelt
 * nur Reisen, bei denen die ganze Familie dabei war – und wer zur
 * Familie zählt, steht als Schalter bei der jeweiligen Person.
 *
 * Der Pass ist zum Herzeigen gedacht, deshalb ist er auch druckbar.
 */
import { useMemo, useState } from "react";
import { fmtPlain } from "@/lib/dateFormat";
import { Check, Plus, Stamp, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { printNeedsBrowserTab } from "@/lib/standalone";
import PrintButton from "@/components/PrintButton";
import { cn } from "@/lib/utils";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import {
  passportSummary,
  tripsForFamily,
  tripsForTraveller,
  type PassportStamp,
  type PassportTrip,
} from "@shared/passport";

/** Ein Stempel als SVG – Form und Farbe kommen aus dem Platznamen. */
function StampMark({ stamp, label }: { stamp: PassportStamp; label: string }) {
  const { shape, color, tiltDeg } = stamp;
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-20 w-20"
      style={{ transform: `rotate(${tiltDeg}deg)` }}
      role="img"
      aria-label={label}
    >
      {shape === "kreis" && (
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="5"
        />
      )}
      {shape === "raute" && (
        <path
          d="M50 6 L94 50 L50 94 L6 50 Z"
          fill="none"
          stroke={color}
          strokeWidth="5"
        />
      )}
      {shape === "wappen" && (
        <path
          d="M14 14 H86 V58 Q86 84 50 94 Q14 84 14 58 Z"
          fill="none"
          stroke={color}
          strokeWidth="5"
        />
      )}
      {shape === "zackenrad" && (
        <>
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray="7 5"
          />
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
        </>
      )}
      <text
        x="50"
        y="47"
        textAnchor="middle"
        fontSize="19"
        fontWeight="700"
        fill={color}
      >
        {stamp.visits}×
      </text>
      <text x="50" y="66" textAnchor="middle" fontSize="12" fill={color}>
        {stamp.firstVisit.slice(0, 4)}
      </text>
    </svg>
  );
}

export default function PassportPage() {
  const { lang, t } = useI18n();
  const pp = t.passport;
  const { isAuthenticated, loading } = useAuth();
  /** null = Familienpass (alle Reisen). */
  const [personId, setPersonId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const utils = trpc.useUtils();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const peopleQuery = trpc.family.children.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const absencesQuery = trpc.family.passport.absences.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const addPerson = trpc.family.children.add.useMutation({
    onSuccess: () => {
      setNewName("");
      setAdding(false);
      void utils.family.children.list.invalidate();
    },
  });
  const setFamilyMember = trpc.family.children.setFamilyMember.useMutation({
    onSuccess: () => void utils.family.children.list.invalidate(),
  });

  const people = peopleQuery.data ?? [];
  const absences = useMemo(
    () => absencesQuery.data ?? [],
    [absencesQuery.data]
  );

  /**
   * Die Reisen mit Id und Platzname.
   *
   * DER PLATZNAME MUSS HIER GEBILDET WERDEN: Die Reise-Liste liefert
   * `spotName` (verknüpfter Favorit) und `location` (Freitext), aber kein
   * fertiges `placeName`. Ohne diese Zeile bekommt `buildPassport` nur
   * leere Namen – und wirft dann jede Reise weg, weil ein Stempel ohne
   * Ort keiner ist. Genau das war bisher der Fall: Der Pass blieb leer,
   * egal wie viele Reisen eingetragen waren.
   *
   * Reihenfolge nach dem, was auf einem Stempel stehen soll: der Platz
   * vor dem Ort vor dem Reisetitel.
   */
  const trips: PassportTrip[] = useMemo(
    () =>
      (tripsQuery.data ?? []).map(trip => ({
        id: trip.id,
        placeName: trip.spotName || trip.location || trip.title || null,
        startDate: trip.startDate,
        endDate: trip.endDate,
      })),
    [tripsQuery.data]
  );

  /** Ids der Personen, die zum Familien-Pass zählen. */
  const familyIds = useMemo(
    () => people.filter(p => p.familyMember).map(p => p.id),
    [people]
  );
  const travellerTrips = useMemo(
    () =>
      personId === null
        ? tripsForFamily(trips, absences, familyIds)
        : tripsForTraveller(trips, absences, personId),
    [trips, absences, personId, familyIds]
  );
  const summary = useMemo(
    () => passportSummary(travellerTrips),
    [travellerTrips]
  );

  const person = people.find(p => p.id === personId) ?? null;
  const personName = person ? person.name : pp.family;

  if (loading) {
    return (
      <div className="container max-w-2xl py-6">
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }
  if (!isAuthenticated) return <LoginPrompt feature={pp.title} />;

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={pp.title} subtitle={pp.intro} />

      {/* Personen-Auswahl: «Familie» plus je ein Pass pro Person */}
      <div className="print:hidden">
        <p className="text-xs font-medium text-muted-foreground">
          {pp.personLabel}
        </p>
        <div
          className="mt-1.5 flex flex-wrap gap-2"
          role="group"
          aria-label={pp.personGroupAria}
        >
          <button
            type="button"
            onClick={() => setPersonId(null)}
            aria-pressed={personId === null}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
              personId === null
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {pp.family}
          </button>
          {people.map(entry => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setPersonId(entry.id)}
              aria-pressed={personId === entry.id}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                personId === entry.id
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {entry.name}
            </button>
          ))}
          {adding ? (
            <form
              className="flex items-center gap-1.5"
              onSubmit={e => {
                e.preventDefault();
                const name = newName.trim();
                if (name) addPerson.mutate({ name });
              }}
            >
              <Input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={pp.addPersonPlaceholder}
                maxLength={60}
                className="h-8 w-32"
                aria-label={pp.addPersonPlaceholder}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newName.trim() || addPerson.isPending}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{pp.addPersonSave}</span>
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted-foreground hover:border-primary/40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {pp.addPerson}
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {pp.addPersonHint}
        </p>
      </div>

      {/* Deckblatt: Name, Titel, Plätze, Nächte */}
      <div className="mt-4 rounded-xl border-2 border-primary/40 bg-accent/30 p-4 text-center print:border-black">
        <Stamp
          className="mx-auto mb-2 h-8 w-8 text-primary"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-muted-foreground">
          {personName}
        </p>
        <p className="font-serif text-2xl font-bold text-primary">
          {summary.rank ? pick(summary.rank.title, lang) : pp.noRank}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {pp.summary(summary.places, summary.nights)}
        </p>
        {summary.next && (
          <p className="mt-1 text-xs text-muted-foreground">
            {pp.toNext(
              summary.next.missing,
              pick(summary.next.rank.title, lang)
            )}
          </p>
        )}
      </div>

      {tripsQuery.isLoading ? (
        <Skeleton className="mt-6 h-40 w-full rounded-lg" />
      ) : summary.stamps.length === 0 ? (
        /* DREI GRÜNDE für einen leeren Pass, drei Sätze (Nutzermeldung
           07.08.2026): Es gibt gar keine Reisen; die Person ist nirgends
           angehakt; oder die Reisen haben keinen PLATZNAMEN – dann half
           der alte Rat «setz unten die Haken» nicht, denn die Haken
           waren längst gesetzt. */
        <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {trips.length === 0
            ? pp.empty
            : person && travellerTrips.length === 0
              ? pp.personEmpty(person.name)
              : personId === null && travellerTrips.length === 0
                ? pp.familyEmpty
                : pp.noPlaceEmpty}
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {summary.stamps.map(stamp => (
            <li
              key={stamp.place}
              className="flex flex-col items-center rounded-lg border border-border/70 bg-background p-3 text-center"
            >
              <StampMark
                stamp={stamp}
                label={pp.stampAria(stamp.place, stamp.visits)}
              />
              <span className="mt-1 text-sm font-medium">{stamp.place}</span>
              <span className="text-xs text-muted-foreground">
                {fmtPlain(new Date(stamp.firstVisit), lang)}
              </span>
              <span className="text-xs text-muted-foreground">
                {pp.nights(stamp.nights)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {summary.stamps.length > 0 && (
        <>
          <PrintButton
            label={pp.print}
            size="default"
            variant="outline"
            className="mt-6 w-full print:hidden"
          />
          {printNeedsBrowserTab() && (
            <p className="mt-1.5 text-xs text-muted-foreground print:hidden">
              {t.packListPrint.printBrowserHint}
            </p>
          )}
        </>
      )}

      {/* Wer dabei war, steht an der REISE (Formular-Abschnitt «Wer ist
          dabei?») – hier gibt es nur noch den Familien-Schalter der
          gewählten Person und den Wegweiser dorthin. */}
      {person && (
        <section className="mt-8 print:hidden" aria-label={pp.personSection}>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={person.familyMember}
              disabled={setFamilyMember.isPending}
              onChange={() =>
                setFamilyMember.mutate({
                  id: person.id,
                  familyMember: !person.familyMember,
                })
              }
              className="h-4 w-4 shrink-0 accent-primary"
            />
            <span className="min-w-0 flex-1">
              {pp.familyMemberToggle(person.name)}
              <span className="block text-xs text-muted-foreground">
                {pp.familyMemberHint}
              </span>
            </span>
          </label>
        </section>
      )}
      <p className="mt-4 text-xs text-muted-foreground print:hidden">
        {personId === null ? pp.familyStrictHint : pp.editAtTripHint}
      </p>

      <p className="mt-6 text-xs text-muted-foreground print:hidden">
        {pp.note}
      </p>
    </div>
  );
}
