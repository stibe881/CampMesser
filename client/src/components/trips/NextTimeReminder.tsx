/**
 * Der «Beim nächsten Mal»-Zettel taucht beim Planen wieder auf (#396).
 *
 * DER GANZE WITZ DES MERKERS ist dieser Moment: Die Notiz vom letzten
 * Sommer («Kabeltrommel 25 m») nützt nichts im Dossier, wenn niemand
 * das Dossier aufschlägt – sie muss dort stehen, wo die nächste Reise
 * an denselben Platz geplant wird. Ohne Notizen erscheint nichts.
 */
import { StickyNote } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { parseNextTimeNotes } from "@shared/nextTime";

export default function NextTimeReminder({ spotId }: { spotId: number }) {
  const { t } = useI18n();
  const nt = t.nextTime;

  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });
  const spot = (spotsQuery.data ?? []).find(s => s.id === spotId);
  const notes = parseNextTimeNotes(spot?.nextTimeJson ?? null);
  if (!spot || notes.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/40 bg-accent/40 px-3 py-2">
      <p className="flex items-center gap-2 text-sm font-medium">
        <StickyNote
          className="h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        {nt.reminderTitle(spot.name)}
      </p>
      <ul className="mt-1.5 space-y-1">
        {notes.map((note, index) => (
          <li key={`${index}-${note}`} className="flex gap-2 text-sm">
            <span aria-hidden="true">•</span>
            <span className="min-w-0">{note}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`/zeltplaetze/${spot.id}`}
        className="mt-1.5 inline-flex text-xs font-medium text-primary hover:underline"
      >
        {nt.reminderLink}
      </Link>
    </div>
  );
}
