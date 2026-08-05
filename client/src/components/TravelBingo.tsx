/**
 * Reise-Bingo für die Autofahrt (#240).
 *
 * Ein Abschnitt im Familien-Modus, kein eigenes Modul: Das Bingo gehört zu
 * Schnitzeljagd und Quiz, und es läuft wie die beiden komplett offline.
 * Der Fortschritt liegt in localStorage (lib/travelBingoStore.ts), die
 * Mischung und die Bingo-Prüfung in shared/travelBingo.ts – gespeichert
 * wird nur der Seed, die Motive ergeben sich daraus jedes Mal neu.
 *
 * Mehrere Karten parallel sind der Normalfall, nicht die Ausnahme: Zwei
 * Kinder auf dem Rücksitz wollen zwei verschiedene Karten, und genau dafür
 * bekommt jede Karte einen eigenen Seed und einen eigenen Namen.
 */
import { useEffect, useRef, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  Grid3x3,
  PartyPopper,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { pick } from "@shared/i18n";
import {
  BINGO_SIZES,
  MAX_BINGO_CARDS,
  MAX_BINGO_NAME_LENGTH,
  bingoCells,
  completedLines,
  createBingoCard,
  drawBingoCard,
  foundCount,
  isFullCard,
  newBingoSeed,
  type BingoCard,
  type BingoSize,
} from "@shared/travelBingo";
import { bingoMotifById, bingoMotifIds } from "@/data/travelBingo";
import { useI18n } from "@/i18n";
import { hapticCelebrate, hapticTick } from "@/lib/haptics";
import { loadBingoCards, storeBingoCards } from "@/lib/travelBingoStore";
import { cn } from "@/lib/utils";

/** Kleiner Feier-Effekt ohne Bibliothek: hüpfende Emoji über dem Banner. */
const CONFETTI = ["🎉", "⭐", "🚗", "🎊", "🏁"];

export default function TravelBingo() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const tb = t.travelBingo;
  const [cards, setCards] = useState<BingoCard[]>(() => loadBingoCards());
  const [newName, setNewName] = useState("");
  const [newSize, setNewSize] = useState<BingoSize>(4);

  // Jede Änderung sofort sichern – auf der Autobahn kann die App jederzeit
  // im Hintergrund weggeräumt werden.
  useEffect(() => {
    storeBingoCards(cards);
  }, [cards]);

  /**
   * Wie viele volle Linien hatte die Karte beim letzten Klick? Nur eine
   * NEUE Linie wird gefeiert – sonst jubelt die App bei jedem weiteren
   * Feld derselben Reihe noch einmal.
   */
  const lineCountRef = useRef<Record<string, number>>({});

  const updateCard = (id: string, patch: Partial<BingoCard>) =>
    setCards(prev =>
      prev.map(card => (card.id === id ? { ...card, ...patch } : card))
    );

  const addCard = () => {
    if (cards.length >= MAX_BINGO_CARDS) {
      toast.error(tb.maxCardsReached(MAX_BINGO_CARDS));
      return;
    }
    setCards(prev => [...prev, createBingoCard(newName, newSize)]);
    setNewName("");
  };

  /** Feld antippen: umschalten, dann prüfen, ob dadurch eine Linie voll wurde. */
  const toggleCell = (card: BingoCard, index: number, name: string) => {
    const found = card.found.map((value, i) => (i === index ? !value : value));
    updateCard(card.id, { found });
    if (!found[index]) {
      // Zurücknehmen: kein Jubel, aber der Zähler muss zurück
      lineCountRef.current[card.id] = completedLines(found, card.size).length;
      return;
    }
    hapticTick();
    const lines = completedLines(found, card.size).length;
    const before = lineCountRef.current[card.id] ?? 0;
    lineCountRef.current[card.id] = lines;
    if (lines > before) {
      hapticCelebrate();
      toast.success(
        isFullCard(found, card.size)
          ? tb.fullCardToast(name)
          : tb.bingoToast(name)
      );
    }
  };

  return (
    <section className="mb-8">
      <h2 className="mb-1 font-serif text-xl font-semibold">{tb.title}</h2>
      <p className="mb-3 text-sm text-muted-foreground">{tb.subtitle}</p>

      {cards.length === 0 && (
        <p className="mb-3 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          {tb.empty}
        </p>
      )}

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        {cards.map((card, cardIndex) => {
          const motifs = drawBingoCard(bingoMotifIds, card.size, card.seed);
          const name = card.name.trim() || tb.cardFallbackName(cardIndex + 1);
          const cells = card.size * card.size;
          const done = foundCount(card.found);
          const lines = completedLines(card.found, card.size);
          const winning = bingoCells(card.found, card.size);
          const full = isFullCard(card.found, card.size);
          return (
            <div
              key={card.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <Input
                  value={card.name}
                  maxLength={MAX_BINGO_NAME_LENGTH}
                  placeholder={tb.namePlaceholder}
                  aria-label={tb.nameAria(name)}
                  onChange={e => updateCard(card.id, { name: e.target.value })}
                  className="h-9 max-w-44 font-semibold"
                />
                <span className="text-xs text-muted-foreground">
                  {tb.sizeBadge(card.size)}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    if (await ask({ title: tb.removeConfirm(name) })) {
                      delete lineCountRef.current[card.id];
                      setCards(prev => prev.filter(c => c.id !== card.id));
                    }
                  }}
                  aria-label={tb.removeAria(name)}
                  className="ml-auto shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${card.size}, minmax(0, 1fr))`,
                }}
              >
                {motifs.map((motifId, index) => {
                  const motif = bingoMotifById(motifId);
                  const label = motif ? pick(motif.label, lang) : motifId;
                  const isFound = card.found[index] === true;
                  return (
                    <button
                      key={`${card.id}-${index}`}
                      type="button"
                      onClick={() => toggleCell(card, index, name)}
                      aria-pressed={isFound}
                      aria-label={
                        isFound ? tb.cellFoundAria(label) : tb.cellAria(label)
                      }
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border p-1 text-center transition-all active:scale-[0.97]",
                        isFound
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border bg-background hover:border-primary/40",
                        winning.includes(index) && "ring-2 ring-primary"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xl leading-none",
                          isFound && "opacity-60"
                        )}
                        aria-hidden="true"
                      >
                        {motif?.emoji ?? "❓"}
                      </span>
                      <span
                        className={cn(
                          "line-clamp-2 text-[0.6rem] leading-tight",
                          isFound ? "font-semibold" : "text-muted-foreground"
                        )}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                <Progress
                  value={(done / cells) * 100}
                  aria-label={tb.progressAria(name)}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {tb.foundCount(done, cells)}
                </p>
              </div>

              {lines.length > 0 && (
                <div className="mt-3 flex items-center gap-3 rounded-lg bg-accent p-3">
                  <PartyPopper
                    className="h-5 w-5 shrink-0 text-primary motion-safe:animate-bounce"
                    aria-hidden="true"
                  />
                  <p className="min-w-0 flex-1 font-serif text-sm font-bold">
                    {full ? tb.fullCardBanner : tb.bingoBanner(lines.length)}
                  </p>
                  <span className="flex shrink-0 gap-0.5" aria-hidden="true">
                    {CONFETTI.map((piece, i) => (
                      <span
                        key={piece}
                        className="text-sm motion-safe:animate-bounce"
                        style={{ animationDelay: `${i * 120}ms` }}
                      >
                        {piece}
                      </span>
                    ))}
                  </span>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={tb.newCardAria(name)}
                  onClick={() => {
                    lineCountRef.current[card.id] = 0;
                    updateCard(card.id, {
                      seed: newBingoSeed(),
                      found: new Array(cells).fill(false),
                    });
                  }}
                >
                  <Shuffle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {tb.newCard}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={tb.resetAria(name)}
                  onClick={() => {
                    lineCountRef.current[card.id] = 0;
                    updateCard(card.id, {
                      found: new Array(cells).fill(false),
                    });
                  }}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {tb.reset}
                </Button>
                {/* Grössenwechsel würfelt die Karte neu – 9 und 16 Felder
                    lassen sich nicht ineinander überführen. */}
                {BINGO_SIZES.filter(size => size !== card.size).map(size => (
                  <Button
                    key={size}
                    variant="ghost"
                    size="sm"
                    aria-label={tb.switchSizeAria(name, size)}
                    onClick={() => {
                      lineCountRef.current[card.id] = 0;
                      updateCard(card.id, {
                        size,
                        seed: newBingoSeed(),
                        found: new Array(size * size).fill(false),
                      });
                    }}
                  >
                    <Grid3x3 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {tb.switchSize(size)}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Neue Karte anlegen */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-primary/50 p-3">
        <Input
          value={newName}
          maxLength={MAX_BINGO_NAME_LENGTH}
          placeholder={tb.namePlaceholder}
          aria-label={tb.newNameAria}
          onChange={e => setNewName(e.target.value)}
          className="h-9 max-w-44"
        />
        <div className="flex gap-1.5">
          {BINGO_SIZES.map(size => (
            <Button
              key={size}
              type="button"
              size="sm"
              variant={size === newSize ? "default" : "outline"}
              aria-pressed={size === newSize}
              onClick={() => setNewSize(size)}
            >
              {tb.sizeOption(size)}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={addCard}
          disabled={cards.length >= MAX_BINGO_CARDS}
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {tb.addCard}
        </Button>
        <p className="w-full text-xs text-muted-foreground">{tb.howTo}</p>
      </div>
    </section>
  );
}
