import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { Link2, Loader2, Package, Plus, QrCode, Scale, Share2, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { familyAddOns } from "@shared/packTemplates";
import { computePackWeight, formatGrams } from "@shared/packWeight";
import { cn } from "@/lib/utils";

export default function PackListDetailPage() {
  const params = useParams<{ id: string }>();
  const listId = Number(params.id);
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.packing.items.useQuery({ listId }, { enabled: isAuthenticated && !isNaN(listId) });
  const inventoryQuery = trpc.inventory.list.useQuery(undefined, { enabled: isAuthenticated });

  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // QR-Code zum Teil-Link erzeugen: am Platz einfach abscannen lassen statt Link verschicken
  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(shareUrl, { width: 480, margin: 1, errorCorrectionLevel: "M" })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [shareUrl]);

  const shareMutation = trpc.packing.share.useMutation({
    onSuccess: async ({ token }) => {
      const url = `${window.location.origin}/liste/${token}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Teil-Link kopiert – schick ihn deinen Mitreisenden!");
      } catch {
        toast.success("Teil-Link erstellt – kopiere ihn unten.");
      }
    },
    onError: () => toast.error("Teilen fehlgeschlagen"),
  });

  const toggleMutation = trpc.packing.toggleItem.useMutation({
    onMutate: async input => {
      await utils.packing.items.cancel({ listId });
      const prev = utils.packing.items.getData({ listId });
      utils.packing.items.setData({ listId }, old =>
        old
          ? {
              ...old,
              items: old.items.map(i => (i.id === input.id ? { ...i, checked: input.checked } : i)),
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.packing.items.setData({ listId }, ctx.prev);
      toast.error("Änderung fehlgeschlagen");
    },
  });

  const addMutation = trpc.packing.addItems.useMutation({
    onSuccess: () => {
      utils.packing.items.invalidate({ listId });
      setNewItem("");
    },
    onError: () => toast.error("Eintrag konnte nicht hinzugefügt werden"),
  });

  const deleteMutation = trpc.packing.deleteItem.useMutation({
    onMutate: async input => {
      await utils.packing.items.cancel({ listId });
      const prev = utils.packing.items.getData({ listId });
      utils.packing.items.setData({ listId }, old =>
        old ? { ...old, items: old.items.filter(i => i.id !== input.id) } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.packing.items.setData({ listId }, ctx.prev);
      toast.error("Löschen fehlgeschlagen");
    },
  });

  const addAddOn = (addOnId: string) => {
    const addOn = familyAddOns.find(a => a.id === addOnId);
    if (!addOn) return;
    addMutation.mutate(
      {
        listId,
        items: addOn.items.map(i => ({ name: i.name, category: i.category, quantity: i.quantity ?? 1 })),
      },
      { onSuccess: () => toast.success(`«${addOn.label}» hinzugefügt`) },
    );
  };

  const grouped = useMemo(() => {
    const items = query.data?.items ?? [];
    const map = new Map<string, (typeof items)[number][]>();
    for (const item of items) {
      const key = item.category || "Allgemein";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [query.data?.items]);

  // Gewichts-Bilanz über den Namens-Abgleich mit dem Inventar
  const weight = useMemo(
    () => computePackWeight(query.data?.items ?? [], inventoryQuery.data ?? []),
    [query.data?.items, inventoryQuery.data],
  );

  // Inventar-Gegenstände, die noch nicht auf der Liste stehen (per Name)
  const inventorySuggestions = useMemo(() => {
    const listNames = new Set(
      (query.data?.items ?? []).map(i => i.name.trim().toLowerCase().replace(/\s+/g, " ")),
    );
    return (inventoryQuery.data ?? []).filter(
      inv => !listNames.has(inv.name.trim().toLowerCase().replace(/\s+/g, " ")),
    );
  }, [query.data?.items, inventoryQuery.data]);

  if (loading || (isAuthenticated && query.isLoading)) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Lädt" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader title="Packliste" backHref="/packlisten" backLabel="Packlisten" />
        <LoginPrompt feature="deine Packlisten" />
      </div>
    );
  }

  if (!query.data?.list) {
    return (
      <div className="container py-6">
        <PageHeader title="Packliste nicht gefunden" backHref="/packlisten" backLabel="Packlisten" />
      </div>
    );
  }

  const items = query.data.items;
  const checkedCount = items.filter(i => i.checked).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title={query.data.list.name}
        subtitle={`${checkedCount} von ${items.length} Einträgen gepackt`}
        backHref="/packlisten"
        backLabel="Packlisten"
      />

      <div className="mb-2">
        <Progress value={progress} aria-label={`Fortschritt: ${Math.round(progress)} Prozent gepackt`} />
      </div>

      {/* Gewichts-Bilanz aus dem Inventar-Abgleich */}
      {weight.matchedCount > 0 && (
        <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Scale className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="font-medium text-foreground">{formatGrams(weight.totalGrams)}</span>
            gesamt
          </span>
          <span>
            <span className="font-medium text-foreground">{formatGrams(weight.packedGrams)}</span>{" "}
            gepackt
          </span>
          <span>{weight.totalVolumeLiters.toLocaleString("de-CH")} l Volumen</span>
          <span className="text-xs">
            ({weight.matchedCount} von {weight.matchedCount + weight.unmatchedCount} Einträgen im
            Inventar gefunden)
          </span>
        </p>
      )}
      {weight.matchedCount === 0 && <div className="mb-4" />}

      {/* Liste teilen */}
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => shareMutation.mutate({ listId })}
          disabled={shareMutation.isPending}
        >
          <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {shareMutation.isPending ? "Link wird erstellt …" : "Liste per Link teilen"}
        </Button>
        {shareUrl && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Link2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <code className="min-w-0 flex-1 truncate text-xs">{shareUrl}</code>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  toast.success("Link kopiert");
                } catch {
                  toast.error("Kopieren nicht möglich – bitte manuell markieren");
                }
              }}
            >
              Kopieren
            </button>
          </div>
        )}
        {qrDataUrl && (
          <div className="mt-3 flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            {/* Weisser Rahmen, damit der Code auch im Dark Mode zuverlässig scannbar bleibt */}
            <div className="shrink-0 rounded-md bg-white p-2 shadow-sm">
              <img
                src={qrDataUrl}
                alt={`QR-Code zum Teil-Link der Liste ${query.data.list.name}`}
                className="h-36 w-36"
              />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <QrCode className="h-4 w-4 text-primary" aria-hidden="true" />
                Direkt am Platz übergeben
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Lass deine Mitreisenden den Code mit der Handy-Kamera scannen – die Liste öffnet
                sich sofort, ganz ohne Tippen oder Anmeldung.
              </p>
            </div>
          </div>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          Wer den Link hat, kann die Liste sehen und mit dir gemeinsam abhaken – ganz ohne Anmeldung.
        </p>
      </div>

      {/* Neuen Eintrag hinzufügen */}
      <form
        className="mb-6 flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          if (!newItem.trim()) return;
          addMutation.mutate({
            listId,
            items: [{ name: newItem.trim(), category: newCategory.trim() || "Eigene", quantity: 1 }],
          });
        }}
      >
        <Input
          placeholder="Eintrag hinzufügen …"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          aria-label="Name des neuen Eintrags"
        />
        <Input
          placeholder="Kategorie"
          className="hidden w-40 sm:block"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          aria-label="Kategorie des neuen Eintrags"
        />
        <Button type="submit" disabled={addMutation.isPending || !newItem.trim()} aria-label="Eintrag hinzufügen">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      {/* Aus dem Inventar übernehmen */}
      {inventorySuggestions.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Package className="h-4 w-4 text-primary" aria-hidden="true" />
            Aus deinem Inventar übernehmen
          </p>
          <div className="flex flex-wrap gap-1.5">
            {inventorySuggestions.slice(0, 20).map(inv => (
              <button
                key={inv.id}
                type="button"
                disabled={addMutation.isPending}
                onClick={() =>
                  addMutation.mutate({
                    listId,
                    items: [{ name: inv.name, category: inv.category, quantity: 1 }],
                  })
                }
                className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                aria-label={`${inv.name} aus dem Inventar zur Liste hinzufügen`}
              >
                + {inv.name}
                {inv.weightGrams > 0 && (
                  <span className="ml-1 opacity-70">({formatGrams(inv.weightGrams)})</span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Einträge mit Inventar-Treffer zählen automatisch zur Gewichts-Bilanz oben.
          </p>
        </div>
      )}

      {/* Familien-Add-ons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {familyAddOns.map(a => (
          <Button
            key={a.id}
            variant="outline"
            size="sm"
            onClick={() => addAddOn(a.id)}
            disabled={addMutation.isPending}
            aria-label={`Paket ${a.label} zur Liste hinzufügen`}
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {a.label}
          </Button>
        ))}
      </div>

      {/* Gruppierte Einträge */}
      {grouped.map(([category, categoryItems]) => (
        <div key={category} className="mb-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {category}
          </h2>
          <ul className="space-y-1.5">
            {categoryItems.map(item => (
              <li
                key={item.id}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 transition-colors",
                  item.checked && "bg-muted/60",
                )}
              >
                <Checkbox
                  id={`item-${item.id}`}
                  checked={item.checked}
                  onCheckedChange={checked =>
                    toggleMutation.mutate({ id: item.id, checked: checked === true })
                  }
                  aria-label={`${item.name} ${item.checked ? "als ungepackt" : "als gepackt"} markieren`}
                />
                <label
                  htmlFor={`item-${item.id}`}
                  className={cn(
                    "flex-1 cursor-pointer text-sm",
                    item.checked && "text-muted-foreground line-through",
                  )}
                >
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">× {item.quantity}</span>
                  )}
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                  onClick={() => deleteMutation.mutate({ id: item.id })}
                  aria-label={`${item.name} löschen`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {items.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          Diese Liste ist noch leer – füge oben deinen ersten Eintrag hinzu.
        </p>
      )}
    </div>
  );
}
