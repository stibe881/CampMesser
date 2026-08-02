/**
 * Namensfeld der Einkaufsliste mit Autocomplete: Vorschläge aus dem lokalen
 * Einkaufs-Verlauf und den vorhandenen Listen-Einträgen als eigenes Dropdown
 * (role=combobox/listbox mit aria-activedescendant statt <datalist> – so sind
 * Tastatur-Navigation und Screenreader-Ansagen in allen Browsern konsistent).
 * Die Übernahme eines Vorschlags setzt auch gemerkte Kategorie/Menge (onPick).
 * Genutzt von Shopping.tsx und TripShopping.tsx.
 */
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { pick } from "@shared/i18n";
import { isShoppingCategory, SHOPPING_CATEGORY_LABELS } from "@shared/shopping";
import type { ShoppingHistoryEntry } from "@/lib/shoppingHistory";

export default function ShoppingNameAutocomplete({
  value,
  onChange,
  onPick,
  suggestions,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Vorschlag übernommen – Aufrufer setzt Name, Kategorie und Menge. */
  onPick: (entry: ShoppingHistoryEntry) => void;
  suggestions: ShoppingHistoryEntry[];
  placeholder: string;
  ariaLabel: string;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Blur durch Klick auf einen Vorschlag darf das Dropdown nicht vorzeitig
  // schliessen – mousedown auf der Liste setzt diesen Guard.
  const pickingRef = useRef(false);

  // Neue Vorschläge (anderes Getipptes) → Hervorhebung zurücksetzen
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  const visible = open && value.trim().length > 0 && suggestions.length > 0;

  const pickEntry = (entry: ShoppingHistoryEntry) => {
    onPick(entry);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!visible) {
      if (e.key === "ArrowDown" && suggestions.length > 0) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      // Enter ohne Auswahl reicht das Formular normal ein
      e.preventDefault();
      pickEntry(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  /** Anzeige-Label der gemerkten Kategorie (nur bekannte Schlüssel). */
  const categoryLabel = (entry: ShoppingHistoryEntry): string | null =>
    isShoppingCategory(entry.category)
      ? pick(SHOPPING_CATEGORY_LABELS[entry.category], lang)
      : null;

  return (
    <div className={cn("relative", className)}>
      <Input
        value={value}
        maxLength={160}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={visible}
        aria-controls={visible ? listId : undefined}
        aria-activedescendant={
          visible && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        autoComplete="off"
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (!pickingRef.current) setOpen(false);
        }}
        onKeyDown={onKeyDown}
      />
      {visible && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t.shopping.suggestionsAria}
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-popover py-1 shadow-md"
          onMouseDown={() => {
            pickingRef.current = true;
          }}
          onMouseUp={() => {
            pickingRef.current = false;
          }}
        >
          {suggestions.map((entry, idx) => {
            const cat = categoryLabel(entry);
            return (
              <li
                key={entry.name.toLowerCase()}
                id={`${listId}-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
                  idx === activeIndex ? "bg-accent" : "hover:bg-accent/60"
                )}
                onMouseMove={() => setActiveIndex(idx)}
                onClick={() => pickEntry(entry)}
              >
                <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                {entry.quantity && (
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {entry.quantity}
                  </span>
                )}
                {cat && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {cat}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
