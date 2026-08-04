/**
 * Lagerfeuer-Liederbuch (#269): Texte mit Akkorden, gedacht fürs Singen
 * im Dunkeln.
 *
 * Zwei Dinge unterscheiden die Ansicht von einer Textdatei: Der
 * Rotlicht-Modus (derselbe wie beim Sternengucken) hält die Augen
 * dunkeladaptiert, und die Transponier-Knöpfe verschieben alle Akkorde
 * gemeinsam – wer tiefer singt, muss nicht rechnen.
 *
 * Die Schrift ist bewusst gross und die Zeilen bleiben in der Reihenfolge
 * des Liedes stehen; ein Akkord steht über der Silbe, an der gegriffen
 * wird.
 */
import { useState } from "react";
import { Flame, Minus, Moon, Music, Plus, WifiOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import RedLightMode from "@/components/RedLightMode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { songs } from "@/data/songs";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { pick } from "@shared/i18n";
import {
  MAX_TRANSPOSE,
  MIN_TRANSPOSE,
  parseChordLine,
  songChords,
  transposeChord,
  transposeLabel,
  transposeLine,
  type Song,
} from "@shared/songs";

/** Eine Liedzeile: Akkorde über den Silben, an denen gegriffen wird. */
function ChordLine({ line, steps }: { line: string; steps: number }) {
  const segments = parseChordLine(transposeLine(line, steps));
  return (
    <p className="flex flex-wrap items-end">
      {segments.map((segment, i) => (
        <span key={i} className="flex flex-col">
          <span className="h-5 text-xs font-bold text-primary">
            {segment.chord ?? " "}
          </span>
          <span className="whitespace-pre-wrap text-base leading-relaxed">
            {segment.text}
          </span>
        </span>
      ))}
    </p>
  );
}

function SongSheet({ song, steps }: { song: Song; steps: number }) {
  return (
    <div className="space-y-5">
      {song.verses.map((verse, index) => (
        <div key={index}>
          {song.verses.length > 1 && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {index + 1}
            </p>
          )}
          {verse.map((line, i) => (
            <ChordLine key={i} line={line} steps={steps} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function SongbookPage() {
  const { lang, t } = useI18n();
  const ts = t.songbook;
  const [openId, setOpenId] = useState<string | null>(null);
  const [steps, setSteps] = useState(0);
  const [redLight, setRedLight] = useState(false);

  const open = songs.find(s => s.id === openId) ?? null;

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={ts.title} subtitle={ts.subtitle} />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {ts.offlineNote}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setRedLight(true)}>
          <Moon className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {ts.redLight}
        </Button>
        {open && (
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label={ts.transposeAria}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSteps(s => Math.max(MIN_TRANSPOSE, s - 1))}
              aria-label={ts.transposeDownAria}
              disabled={steps <= MIN_TRANSPOSE}
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="min-w-14 text-center text-sm tabular-nums">
              {ts.transposeLabel(transposeLabel(steps))}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSteps(s => Math.min(MAX_TRANSPOSE, s + 1))}
              aria-label={ts.transposeUpAria}
              disabled={steps >= MAX_TRANSPOSE}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {songs.map(song => {
          const isOpen = open?.id === song.id;
          return (
            <article
              key={song.id}
              className={cn(
                "rounded-xl border bg-card p-4 transition-colors",
                isOpen ? "border-primary/50" : "border-border"
              )}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenId(isOpen ? null : song.id);
                  setSteps(0);
                }}
                className="flex w-full items-center gap-3 text-left"
                aria-expanded={isOpen}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  {isOpen ? (
                    <Flame className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Music className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{song.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {pick(song.origin, lang)}
                  </span>
                </span>
              </button>

              {isOpen && (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {songChords(song).map(chord => (
                      <Badge key={chord} variant="secondary">
                        {transposeChord(chord, steps)}
                      </Badge>
                    ))}
                  </div>
                  <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    {pick(song.note, lang)}
                  </p>
                  <SongSheet song={song} steps={steps} />
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="mt-6 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        {ts.copyrightNote}
      </p>

      {redLight && <RedLightMode onExit={() => setRedLight(false)} />}
    </div>
  );
}
