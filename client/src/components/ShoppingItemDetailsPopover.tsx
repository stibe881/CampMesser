import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useI18n } from "@/i18n";

/**
 * Popover zum nachträglichen Bearbeiten von Menge und Notiz eines
 * Einkaufslisten-Eintrags (persönliche UND Reise-Liste). Leere Felder
 * entfernen den jeweiligen Wert wieder (Server: "" → null).
 */
export default function ShoppingItemDetailsPopover({
  item,
  saving,
  onSave,
}: {
  item: {
    id: number;
    name: string;
    quantity: string | null;
    note: string | null;
  };
  saving: boolean;
  onSave: (data: {
    id: number;
    quantity: string;
    note: string;
  }) => Promise<unknown>;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  /** Beim Öffnen die Felder mit dem aktuellen Stand des Eintrags füllen. */
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setQuantity(item.quantity ?? "");
      setNote(item.note ?? "");
    }
    setOpen(next);
  };

  const save = async () => {
    try {
      await onSave({
        id: item.id,
        quantity: quantity.trim().slice(0, 40),
        note: note.trim().slice(0, 160),
      });
      setOpen(false);
    } catch {
      // Fehler-Toast kommt aus der Mutation – Popover bleibt offen
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-foreground"
          aria-label={t.shopping.detailsAria(item.name)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <form
          className="space-y-3"
          onSubmit={e => {
            e.preventDefault();
            void save();
          }}
        >
          <p className="text-sm font-semibold">{t.shopping.detailsTitle}</p>
          <div className="space-y-1.5">
            <Label htmlFor={`shopping-qty-${item.id}`}>
              {t.shopping.detailsQuantityLabel}
            </Label>
            <Input
              id={`shopping-qty-${item.id}`}
              value={quantity}
              maxLength={40}
              placeholder={t.shopping.detailsQuantityPlaceholder}
              onChange={e => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`shopping-note-${item.id}`}>
              {t.shopping.detailsNoteLabel}
            </Label>
            <Input
              id={`shopping-note-${item.id}`}
              value={note}
              maxLength={160}
              placeholder={t.shopping.detailsNotePlaceholder}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={saving}>
            {t.common.save}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
