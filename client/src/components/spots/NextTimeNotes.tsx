/**
 * «Beim nächsten Mal»-Merker am Platz (#396, Nutzerwunsch 07.08.2026).
 *
 * Der Zettel am Kühlschrank, nur dass er nicht verloren geht: kurze
 * Zeilen («Kabeltrommel 25 m», «Parzelle 12 meiden»), die beim Planen
 * der nächsten Reise an diesen Platz von selbst wieder auftauchen.
 * Erledigtes löscht man – einen Haken-Zustand gibt es absichtlich
 * nicht, die Begründung steht in shared/nextTime.ts.
 */
import { useState } from "react";
import { Plus, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import {
  MAX_NEXT_TIME_NOTES,
  NEXT_TIME_NOTE_MAX_LENGTH,
  parseNextTimeNotes,
  serializeNextTimeNotes,
} from "@shared/nextTime";

export default function NextTimeNotes({
  spotId,
  nextTimeJson,
  className,
}: {
  spotId: number;
  nextTimeJson: string | null;
  className?: string;
}) {
  const { t } = useI18n();
  const nt = t.nextTime;
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState("");

  const notes = parseNextTimeNotes(nextTimeJson);

  const updateMutation = trpc.spots.update.useMutation({
    onSuccess: () => void utils.spots.list.invalidate(),
    onError: () => toast.error(t.common.saveFailed),
  });

  const save = (next: string[]) =>
    updateMutation.mutate({
      id: spotId,
      nextTimeJson: serializeNextTimeNotes(next),
    });

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    save([...notes, text]);
    setDraft("");
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <StickyNote className="h-4 w-4 text-primary" aria-hidden="true" />
          {nt.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{nt.empty}</p>
        ) : (
          <ul className="space-y-1.5">
            {notes.map((note, index) => (
              <li key={`${index}-${note}`} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 text-sm">{note}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                  disabled={updateMutation.isPending}
                  onClick={() => save(notes.filter((_, i) => i !== index))}
                  aria-label={nt.removeAria(note)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {notes.length < MAX_NEXT_TIME_NOTES && (
          <form
            className="mt-3 flex items-center gap-2"
            onSubmit={event => {
              event.preventDefault();
              add();
            }}
          >
            <Input
              value={draft}
              maxLength={NEXT_TIME_NOTE_MAX_LENGTH}
              placeholder={nt.placeholder}
              aria-label={nt.placeholder}
              onChange={e => setDraft(e.target.value)}
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!draft.trim() || updateMutation.isPending}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {nt.add}
            </Button>
          </form>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{nt.hint}</p>
      </CardContent>
    </Card>
  );
}
