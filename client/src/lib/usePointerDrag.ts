import { useRef, useState } from "react";

/**
 * Wiederverwendbare Pointer-Events-Drag-Logik zum Umsortieren von Elementen
 * innerhalb einer Gruppe (mobiletauglich, bewusst kein HTML5-Drag-and-drop).
 *
 * Die ziehbaren Elemente bekommen die Props aus `dragProps(group, id)`
 * (Datenattribute + Pointer-Handler). Das Ziel unter dem Zeiger wird über
 * `document.elementFromPoint` ermittelt – dank Pointer-Capture funktioniert
 * das für Maus und Touch gleichermassen. Beim Loslassen über einem anderen
 * Element derselben Gruppe wird `onDrop(group, fromId, toId)` gerufen.
 */
export interface UsePointerDragOptions<G extends string> {
  /** Wird beim Fallenlassen über einem anderen Element derselben Gruppe gerufen. */
  onDrop: (group: G, fromId: string, toId: string) => void;
  /**
   * Optionaler CSS-Selektor eines Griffs: Ziehen startet nur, wenn der
   * Pointer-Down innerhalb eines passenden Elements beginnt (z. B. Griff-Icon).
   * Ohne Selektor startet das Ziehen überall auf dem Element – ausser auf
   * Buttons, damit deren Klicks nicht als Ziehen gewertet werden.
   */
  handleSelector?: string;
  /** Ziehen komplett deaktivieren (z. B. während eines aktiven Filters). */
  disabled?: boolean;
}

export function usePointerDrag<G extends string = string>(
  options: UsePointerDragOptions<G>
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragInfo = useRef<{ from: string; group: G } | null>(null);
  const dragOverRef = useRef<string | null>(null);

  /** Element unter dem Zeiger ermitteln (funktioniert für Maus und Touch). */
  const itemUnderPointer = (
    x: number,
    y: number,
    group: string
  ): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const item = el?.closest<HTMLElement>("[data-drag-path]");
    if (!item || item.dataset.dragGroup !== group) return null;
    return item.dataset.dragPath ?? null;
  };

  /** Zieh-Zustand zurücksetzen. */
  const endDrag = () => {
    dragInfo.current = null;
    dragOverRef.current = null;
    setDragId(null);
    setDragOverId(null);
  };

  /** Props für ein ziehbares Element: Datenattribute + Pointer-Handler. */
  const dragProps = (group: G, id: string) => ({
    "data-drag-path": id,
    "data-drag-group": group,
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (options.disabled) return;
      const target = e.target as HTMLElement;
      if (options.handleSelector) {
        // Mit Griff: Ziehen startet nur am Griff selbst
        if (!target.closest(options.handleSelector)) return;
      } else if (target.closest("button")) {
        // Ohne Griff: Klicks auf Buttons (z. B. Pfeile) nicht als Ziehen werten
        return;
      }
      dragInfo.current = { from: id, group };
      dragOverRef.current = null;
      setDragId(id);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (!dragInfo.current) return;
      const over = itemUnderPointer(e.clientX, e.clientY, group);
      if (over !== dragOverRef.current) {
        dragOverRef.current = over;
        setDragOverId(over);
      }
    },
    onPointerUp: () => {
      const info = dragInfo.current;
      const over = dragOverRef.current;
      if (info && over && over !== info.from) {
        options.onDrop(info.group, info.from, over);
      }
      endDrag();
    },
    onPointerCancel: endDrag,
  });

  return { dragId, dragOverId, dragProps };
}
