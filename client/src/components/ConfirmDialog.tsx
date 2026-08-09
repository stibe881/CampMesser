import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/i18n";

/**
 * «Wirklich löschen?» im Stil der App statt im Stil des Browsers (#317).
 *
 * WAS VORHER WAR: 35 Stellen riefen `window.confirm(...)` auf – Rezepte,
 * Reisen, Familie, Einkauf, Papierkorb, Erste Hilfe, Zelt-Finder, Fotos,
 * Fangbuch, Reise-Bingo. Gleichzeitig lag ein `AlertDialog` im Haus, der
 * genau einmal benutzt wurde (Konto löschen).
 *
 * WARUM DAS MEHR ALS GESCHMACK IST:
 *
 * 1. DIE SPRACHE GEHT VERLOREN. Die Knöpfe des Browser-Dialogs heissen
 *    «OK» und «Abbrechen» in der Sprache des BETRIEBSSYSTEMS, nicht in der
 *    der App. Eine viersprachige App verliert ausgerechnet an der Stelle
 *    die Sprache, an der es unwiderruflich wird.
 *
 * 2. «OK» SAGT NICHT, WAS PASSIERT. Der Browser lässt die Beschriftung
 *    nicht ändern. Hier steht «Löschen» – und rot, damit der gefährliche
 *    Knopf nicht aussieht wie der harmlose.
 *
 * 3. IN DER NATIVEN APP STEHT «meinreisekompass.ch» DARÜBER. Der WebView schreibt
 *    die Herkunft über den Kasten. Es ist die einzige Stelle, an der die
 *    App verrät, dass sie eine Webseite ist – und sie tut es im
 *    unpassendsten Moment.
 *
 * WARUM EIN VERSPRECHEN UND KEIN ZUSTAND JE STELLE: `window.confirm` ist
 * eine Frage mit Antwort in derselben Zeile – genau das macht ihn so
 * bequem. Ein Dialog mit `open`-Zustand und Rückruf zwingt jeden Aufrufer
 * zu drei zusätzlichen Zustandsvariablen; bei 35 Stellen wäre das der
 * sichere Weg zurück zu `confirm`. Deshalb gibt `useConfirm()` ein
 * Promise zurück und der Aufruf bleibt eine Zeile:
 *
 *     const ask = useConfirm();
 *     …
 *     if (!(await ask({ title: t.foo.deleteConfirm }))) return;
 *
 * DER NAME `ask`, NICHT `confirm`: `confirm` gibt es global im Browser.
 * Hiesse der Haken so, würde ein vergessenes `const ask = useConfirm()`
 * NICHT auffallen – TypeScript fände den Namen ja, und der Browser-Dialog
 * käme klammheimlich zurück. Mit `ask` bricht der Übersetzungslauf.
 * `server/confirmDialog.test.ts` wacht zusätzlich über den Rückfall.
 */

export interface ConfirmOptions {
  /** Die Frage selbst – kurz, als Überschrift lesbar. */
  title: string;
  /** Optionaler zweiter Satz mit den Folgen. */
  description?: string;
  /** Beschriftung des bestätigenden Knopfes (Standard: «Löschen»). */
  confirmLabel?: string;
  /**
   * Rot einfärben. Standard ist true: Praktisch jede Bestätigung in dieser
   * App löscht etwas. Wer nur nachfragt, setzt es auf false.
   */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Die Frage stellen. Das Promise löst mit true auf, wenn bestätigt wurde,
 * und mit false bei Abbrechen, Escape oder Klick daneben.
 */
export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) {
    throw new Error("useConfirm braucht den ConfirmProvider (siehe App.tsx)");
  }
  return fn;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  // Der Auflöser des laufenden Promise. Als Ref, damit ein erneutes
  // Zeichnen ihn nicht verliert.
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(next => {
    setOptions(next);
    return new Promise<boolean>(resolve => {
      resolveRef.current = resolve;
    });
  }, []);

  /**
   * Antworten und schliessen. WICHTIG: Der Auflöser wird VOR dem Aufruf
   * geleert. Radix schliesst den Dialog mit einer Animation und meldet
   * `onOpenChange(false)` nach; ohne das Leeren käme die Antwort ein
   * zweites Mal – und ein zweites `resolve` wäre still wirkungslos, was
   * beim Suchen eines Fehlers niemandem hilft.
   */
  const answer = useCallback((value: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setOptions(null);
    resolve?.(value);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={options !== null}
        onOpenChange={open => {
          // Escape, Klick daneben oder Zurück-Geste zählen als Abbrechen.
          if (!open) answer(false);
        }}
      >
        {options && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{options.title}</AlertDialogTitle>
              {options.description && (
                <AlertDialogDescription>
                  {options.description}
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => answer(false)}>
                {t.common.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => answer(true)}
                className={
                  options.destructive === false
                    ? undefined
                    : "bg-destructive text-white hover:bg-destructive/90"
                }
              >
                {options.confirmLabel ?? t.common.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
