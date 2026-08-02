import { useEffect, useMemo, useState } from "react";
import { Loader2, Refrigerator } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";

/** Abgehakter Einkaufslisten-Eintrag, der eingeräumt werden kann. */
export interface StorePurchaseItem {
  id: number;
  name: string;
  quantity: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Aktuell abgehakte Einträge – beim Öffnen wird ein Schnappschuss gezogen. */
  items: StorePurchaseItem[];
  /**
   * Entfernt einen übernommenen Eintrag von der jeweiligen Einkaufsliste
   * (persönliche Liste bzw. Reise-Liste – der Aufrufer kennt die Mutation).
   */
  removeItem: (id: number) => Promise<unknown>;
}

/**
 * «Einkäufe einräumen»: abgehakte Einkäufe (vorausgewählt, optional mit MHD)
 * in die persönliche Kühlbox übernehmen (food.add mit Name + Menge) und von
 * der Einkaufsliste entfernen. Gleichnamige Lebensmittel dürfen mehrfach in
 * der Kühlbox stehen – bereits vorhandene werden nur gekennzeichnet.
 */
export default function StorePurchasesDialog({
  open,
  onOpenChange,
  items,
  removeItem,
}: Props) {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const today = new Date().toISOString().slice(0, 10);

  // Schnappschuss beim Öffnen: die Liste schrumpft während der Übernahme,
  // der Dialog soll aber stabil bleiben.
  const [snapshot, setSnapshot] = useState<StorePurchaseItem[]>([]);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [expiry, setExpiry] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setSnapshot(items);
    setSelected(new Set(items.map(i => i.id)));
    setExpiry({});
    // Bewusst nur beim Öffnen – Änderungen an items währenddessen ignorieren.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Kühlbox-Bestand für die «bereits in der Kühlbox»-Kennzeichnung
  const foodQuery = trpc.food.list.useQuery(undefined, { enabled: open });
  const existingNames = useMemo(
    () => new Set((foodQuery.data ?? []).map(f => f.name.trim().toLowerCase())),
    [foodQuery.data]
  );

  const addMutation = trpc.food.add.useMutation();

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chosen = snapshot.filter(i => selected.has(i.id));

  /** Auswahl übernehmen: in die Kühlbox legen, dann von der Liste entfernen. */
  const storeChosen = async () => {
    if (chosen.length === 0 || saving) return;
    setSaving(true);
    let stored = 0;
    try {
      for (const item of chosen) {
        await addMutation.mutateAsync({
          name: item.name,
          quantity: item.quantity ?? undefined,
          expiryDate: expiry[item.id] || null,
        });
        await removeItem(item.id);
        stored += 1;
      }
      toast.success(t.shopping.putAwayDone(stored), {
        action: {
          label: t.shopping.putAwayOpenFood,
          onClick: () => navigate("/kuehlbox"),
        },
      });
      onOpenChange(false);
    } catch {
      // Teilweise übernommene Einträge sind bereits von der Liste entfernt –
      // der Rest bleibt stehen und kann erneut eingeräumt werden.
      toast.error(t.shopping.putAwayFailed);
    } finally {
      setSaving(false);
      utils.food.list.invalidate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !saving && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.shopping.putAwayTitle}</DialogTitle>
          <DialogDescription>{t.shopping.putAwayDesc}</DialogDescription>
        </DialogHeader>
        <ul className="grid max-h-[50vh] gap-2 overflow-y-auto">
          {snapshot.map(item => {
            const already = existingNames.has(item.name.trim().toLowerCase());
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2"
              >
                <Checkbox
                  checked={selected.has(item.id)}
                  disabled={saving}
                  onCheckedChange={() => toggle(item.id)}
                  aria-label={t.shopping.putAwayItemAria(item.name)}
                />
                <span className="min-w-0 flex-1 break-words text-sm">
                  {item.name}
                  {item.quantity && (
                    <span className="ml-2 inline-block rounded bg-muted px-1.5 py-0.5 align-middle text-xs font-medium text-muted-foreground">
                      {item.quantity}
                    </span>
                  )}
                  {already && (
                    <span className="ml-2 inline-block rounded-full border border-chart-4/70 bg-chart-4/10 px-2 py-0.5 align-middle text-xs text-muted-foreground">
                      {t.shopping.putAwayAlreadyInFood}
                    </span>
                  )}
                </span>
                <Input
                  type="date"
                  className="h-8 w-36 shrink-0 text-xs"
                  value={expiry[item.id] ?? ""}
                  min={today}
                  disabled={saving}
                  onChange={e =>
                    setExpiry(prev => ({ ...prev, [item.id]: e.target.value }))
                  }
                  aria-label={t.shopping.putAwayExpiryAria(item.name)}
                />
              </li>
            );
          })}
        </ul>
        <Button
          type="button"
          disabled={chosen.length === 0 || saving}
          onClick={storeChosen}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Refrigerator className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {t.shopping.putAwayConfirm(chosen.length)}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
