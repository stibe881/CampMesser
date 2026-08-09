import { useEffect, useState } from "react";
import { fmtLong } from "@/lib/dateFormat";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { LATEST_CHANGELOG_ID, type ChangelogBlock } from "@/data/changelogMeta";
import {
  blocksToShowOnStartup,
  hasExistingAppData,
  loadLastSeenId,
  loadStorageKeys,
  storeLastSeenId,
} from "@/lib/whatsNew";
import { isQuietRoute } from "@/components/QuickActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * «Was ist neu»: zeigt Changelog-Blöcke als Dialog. Zwei Verwendungen:
 * - Start-Dialog (Default-Export, im AppShell): erscheint beim App-Start
 *   EINMAL, wenn seit dem letzten Besuch neue Blöcke dazugekommen sind.
 * - Profil («Was ist neu»-Eintrag): derselbe Dialog mit ALLEN Blöcken,
 *   unabhängig vom Gesehen-Marker.
 *
 * Zusammenspiel mit dem UpdatePrompt: Nach dem Klick auf «Aktualisieren»
 * lädt die Seite neu – der Start-Dialog zeigt die neuen Einträge dann
 * automatisch. Es braucht dafür keinen Extra-Code.
 */

/** Kurz warten, damit die Startseite zuerst sichtbar wird. */
const STARTUP_DELAY_MS = 1500;

interface WhatsNewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: ChangelogBlock[];
  /** Einleitungssatz unter dem Titel (Start- vs. Profil-Kontext). */
  intro: string;
  /**
   * Bietet «Ältere anzeigen» an (#535): holt das Changelog-Archiv erst auf
   * Klick – die App-Geschichte wiegt ein Vielfaches des aktuellen Teils.
   * Nur der Profil-Dialog setzt das; der Start-Dialog zeigt Ungesehenes.
   */
  withArchive?: boolean;
}

/** Präsentation: Blöcke mit Datum und Aufzählung, «Verstanden» schliesst. */
export function WhatsNewDialog({
  open,
  onOpenChange,
  blocks,
  intro,
  withArchive = false,
}: WhatsNewDialogProps) {
  const { lang, t } = useI18n();
  /** Archiv-Blöcke, sobald geholt; null = noch nicht geladen. */
  const [olderBlocks, setOlderBlocks] = useState<ChangelogBlock[] | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadOlder = () => {
    setLoadingOlder(true);
    void import("@/data/changelogArchive")
      .then(({ changelogArchive }) => setOlderBlocks(changelogArchive))
      .catch(() => {
        /* Offline und nicht im Cache: der Knopf bleibt einfach stehen */
      })
      .finally(() => setLoadingOlder(false));
  };
  const shownBlocks = olderBlocks ? [...blocks, ...olderBlocks] : blocks;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.whatsNew.title}
          </DialogTitle>
          <DialogDescription>{intro}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {shownBlocks.map(block => (
            <section key={block.id}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {fmtLong(new Date(block.date), lang)}
              </h3>
              <ul className="mt-1.5 grid gap-1.5">
                {block.entries.map((entry, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <span
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70"
                      aria-hidden="true"
                    />
                    {pick(entry, lang)}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {withArchive && olderBlocks === null && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loadingOlder}
              onClick={loadOlder}
            >
              {t.whatsNew.showOlder}
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t.whatsNew.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Start-Logik (im AppShell eingebunden): prüft beim App-Start EINMAL den
 * Gesehen-Marker. Echter Erstbesuch (kein Marker UND keine App-Daten) → nichts
 * zeigen, nur Marker setzen, damit Neuinstallationen nicht mit alter Historie
 * begrüsst werden. Bestehende Installationen ohne Marker (erster Start nach
 * dem Update, das diese Funktion mitbringt) sehen den neuesten Block. Sonst
 * erscheinen die ungesehenen Blöcke kurz verzögert – ausser auf ruhigen
 * Druck-/Teil-Routen (Ausblendeliste der Schnellaktionen).
 *
 * Die Changelog-Texte werden dabei ERST GEHOLT, wenn wirklich etwas zu zeigen
 * ist: Ob es etwas Neues gibt, beantwortet der Vergleich mit der Id aus
 * `changelogMeta.ts` – im Normalfall (nichts Neues) bleiben die 283 kB
 * ungeladen.
 */
export default function WhatsNewStartup() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [blocks, setBlocks] = useState<ChangelogBlock[]>([]);

  useEffect(() => {
    const lastSeen = loadLastSeenId();
    if (lastSeen === LATEST_CHANGELOG_ID) return; // nichts Neues
    const existing = hasExistingAppData(loadStorageKeys());
    if (lastSeen === null && !existing) {
      // Echter Erstbesuch: nur den Marker setzen, damit die Historie beim
      // nächsten Start nicht nachträglich auftaucht.
      storeLastSeenId(LATEST_CHANGELOG_ID);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      // Ruhige Lese-Ansichten (Druck/Teil-Links) nicht unterbrechen –
      // der Marker bleibt, der Hinweis kommt beim nächsten Start wieder.
      if (isQuietRoute(window.location.pathname)) return;
      void import("@/data/changelog")
        .then(({ changelog }) => {
          if (cancelled) return;
          const unseen = blocksToShowOnStartup(changelog, lastSeen, existing);
          if (unseen.length === 0) return;
          setBlocks(unseen);
          setOpen(true);
        })
        .catch(() => {
          /* Offline und noch nicht im Cache: dann eben beim nächsten Start */
        });
    }, STARTUP_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Jedes Schliessen (Verstanden, X, Escape) gilt als gesehen –
      // niemand soll denselben Hinweis zweimal wegklicken müssen.
      storeLastSeenId(LATEST_CHANGELOG_ID);
    }
  };

  if (blocks.length === 0) return null;

  return (
    <WhatsNewDialog
      open={open}
      onOpenChange={handleOpenChange}
      blocks={blocks}
      intro={t.whatsNew.startIntro}
    />
  );
}
