import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import {
  loadActiveShoppingListId,
  resolveActiveShoppingListId,
  saveActiveShoppingListId,
} from "@/lib/activeShoppingList";

/** Eine persönliche Einkaufsliste samt Zählern (Server-Antwort shopping.lists). */
export interface ShoppingListSummary {
  id: number;
  name: string;
  position: number;
  openCount: number;
  doneCount: number;
}

export interface ShoppingTarget {
  /** Alle Listen des Kontos (leer, solange nichts geladen ist). */
  lists: ShoppingListSummary[];
  /** Aktive bzw. zuletzt genutzte Liste; null = noch nichts geladen. */
  listId: number | null;
  /** Liste wechseln – wird als «zuletzt genutzt» gemerkt. */
  setListId: (id: number) => void;
}

/**
 * Zuletzt genutzte Einkaufsliste als Ziel für Übernahme-Flows (#215):
 * lädt die Listen des Kontos und hält die gemerkte Auswahl gültig (fällt auf
 * die erste Liste zurück, wenn die gemerkte gelöscht wurde).
 */
export function useShoppingTarget(enabled = true): ShoppingTarget {
  const { isAuthenticated } = useAuth();
  const { lang } = useI18n();
  const query = trpc.shopping.lists.useQuery(
    { lang },
    { enabled: enabled && isAuthenticated }
  );
  const lists = query.data ?? [];
  const [remembered, setRemembered] = useState<number | null>(() =>
    loadActiveShoppingListId()
  );
  const listId = resolveActiveShoppingListId(lists, remembered);
  // Gelöschte oder unbekannte Liste: Erinnerung auf die tatsächliche Auswahl
  // nachziehen, damit alle Flows dieselbe Ziel-Liste sehen.
  useEffect(() => {
    if (listId !== null && listId !== remembered) {
      setRemembered(listId);
      saveActiveShoppingListId(listId);
    }
  }, [listId, remembered]);
  return {
    lists,
    listId,
    setListId: (id: number) => {
      setRemembered(id);
      saveActiveShoppingListId(id);
    },
  };
}

interface Props {
  target: ShoppingTarget;
  className?: string;
}

/**
 * Kleine Ziel-Listen-Auswahl für Übernahme-Flows. Existiert nur EINE Liste,
 * rendert die Komponente nichts – dann wird ohne Nachfrage übernommen.
 */
export default function ShoppingTargetSelect({ target, className }: Props) {
  const { t } = useI18n();
  if (target.lists.length <= 1 || target.listId === null) return null;
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {t.shopping.targetListLabel}
      </label>
      <Select
        value={String(target.listId)}
        onValueChange={value => target.setListId(Number(value))}
      >
        <SelectTrigger
          className="h-8 w-full text-xs"
          aria-label={t.shopping.targetListAria}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {target.lists.map(list => (
            <SelectItem key={list.id} value={String(list.id)}>
              {list.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
