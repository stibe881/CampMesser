import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import {
  Link2,
  Loader2,
  Package,
  Plus,
  QrCode,
  Scale,
  Share2,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { familyAddOns } from "@shared/packTemplates";
import { computePackWeight, formatGrams } from "@shared/packWeight";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { cn } from "@/lib/utils";

export default function PackListDetailPage() {
  const params = useParams<{ id: string }>();
  const listId = Number(params.id);
  const { isAuthenticated, loading } = useAuth();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const query = trpc.packing.items.useQuery(
    { listId },
    { enabled: isAuthenticated && !isNaN(listId) }
  );
  const inventoryQuery = trpc.inventory.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

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
    QRCode.toDataURL(shareUrl, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [shareUrl]);

  const shareMutation = trpc.packing.share.useMutation({
    onSuccess: async ({ token }) => {
      const url = `${window.location.origin}/liste/${token}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        toast.success(t.packListDetail.shareCopied);
      } catch {
        toast.success(t.packListDetail.shareCreated);
      }
    },
    onError: () => toast.error(t.packListDetail.shareFailed),
  });

  const toggleMutation = trpc.packing.toggleItem.useMutation({
    onMutate: async input => {
      await utils.packing.items.cancel({ listId });
      const prev = utils.packing.items.getData({ listId });
      utils.packing.items.setData({ listId }, old =>
        old
          ? {
              ...old,
              items: old.items.map(i =>
                i.id === input.id ? { ...i, checked: input.checked } : i
              ),
            }
          : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.packing.items.setData({ listId }, ctx.prev);
      toast.error(t.packListDetail.toggleFailed);
    },
  });

  const addMutation = trpc.packing.addItems.useMutation({
    onSuccess: () => {
      utils.packing.items.invalidate({ listId });
      setNewItem("");
    },
    onError: () => toast.error(t.packListDetail.addFailed),
  });

  const deleteMutation = trpc.packing.deleteItem.useMutation({
    onMutate: async input => {
      await utils.packing.items.cancel({ listId });
      const prev = utils.packing.items.getData({ listId });
      utils.packing.items.setData({ listId }, old =>
        old ? { ...old, items: old.items.filter(i => i.id !== input.id) } : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.packing.items.setData({ listId }, ctx.prev);
      toast.error(t.common.deleteFailed);
    },
  });

  const addAddOn = (addOnId: string) => {
    const addOn = familyAddOns.find(a => a.id === addOnId);
    if (!addOn) return;
    addMutation.mutate(
      {
        listId,
        // Vorlagen-Einträge in der aktuellen Sprache speichern – die Liste
        // selbst bleibt einsprachig.
        items: addOn.items.map(i => ({
          name: pick(i.name, lang),
          category: pick(i.category, lang),
          quantity: i.quantity ?? 1,
        })),
      },
      {
        onSuccess: () =>
          toast.success(t.packListDetail.addOnAdded(pick(addOn.label, lang))),
      }
    );
  };

  const generalCategory = t.packListDetail.generalCategory;
  const grouped = useMemo(() => {
    const items = query.data?.items ?? [];
    const map = new Map<string, (typeof items)[number][]>();
    for (const item of items) {
      const key = item.category || generalCategory;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [query.data?.items, generalCategory]);

  // Gewichts-Bilanz über den Namens-Abgleich mit dem Inventar
  const weight = useMemo(
    () => computePackWeight(query.data?.items ?? [], inventoryQuery.data ?? []),
    [query.data?.items, inventoryQuery.data]
  );

  // Inventar-Gegenstände, die noch nicht auf der Liste stehen (per Name)
  const inventorySuggestions = useMemo(() => {
    const listNames = new Set(
      (query.data?.items ?? []).map(i =>
        i.name.trim().toLowerCase().replace(/\s+/g, " ")
      )
    );
    return (inventoryQuery.data ?? []).filter(
      inv => !listNames.has(inv.name.trim().toLowerCase().replace(/\s+/g, " "))
    );
  }, [query.data?.items, inventoryQuery.data]);

  if (loading || (isAuthenticated && query.isLoading)) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader
          title={t.packListDetail.fallbackTitle}
          backHref="/packlisten"
          backLabel={t.packListDetail.backLabel}
        />
        <LoginPrompt feature={t.packListDetail.loginFeature} />
      </div>
    );
  }

  if (!query.data?.list) {
    return (
      <div className="container py-6">
        <PageHeader
          title={t.packListDetail.notFound}
          backHref="/packlisten"
          backLabel={t.packListDetail.backLabel}
        />
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
        subtitle={t.packListDetail.packedCount(checkedCount, items.length)}
        backHref="/packlisten"
        backLabel={t.packListDetail.backLabel}
      />

      <div className="mb-2">
        <Progress
          value={progress}
          aria-label={t.packListDetail.progressAria(Math.round(progress))}
        />
      </div>

      {/* Gewichts-Bilanz aus dem Inventar-Abgleich */}
      {weight.matchedCount > 0 && (
        <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Scale className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="font-medium text-foreground">
              {formatGrams(weight.totalGrams, lang)}
            </span>
            {t.packListDetail.weightTotal}
          </span>
          <span>
            <span className="font-medium text-foreground">
              {formatGrams(weight.packedGrams, lang)}
            </span>{" "}
            {t.packListDetail.weightPacked}
          </span>
          <span>
            {t.packListDetail.volumeLine(
              weight.totalVolumeLiters.toLocaleString(LOCALE_TAGS[lang])
            )}
          </span>
          <span className="text-xs">
            {t.packListDetail.matchedInfo(
              weight.matchedCount,
              weight.matchedCount + weight.unmatchedCount
            )}
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
          {shareMutation.isPending
            ? t.packListDetail.shareCreating
            : t.packListDetail.shareButton}
        </Button>
        {shareUrl && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Link2
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <code className="min-w-0 flex-1 truncate text-xs">{shareUrl}</code>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  toast.success(t.common.linkCopied);
                } catch {
                  toast.error(t.common.copyFailed);
                }
              }}
            >
              {t.common.copy}
            </button>
          </div>
        )}
        {qrDataUrl && (
          <div className="mt-3 flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            {/* Weisser Rahmen, damit der Code auch im Dark Mode zuverlässig scannbar bleibt */}
            <div className="shrink-0 rounded-md bg-white p-2 shadow-sm">
              <img
                src={qrDataUrl}
                alt={t.packListDetail.qrAlt(query.data.list.name)}
                className="h-36 w-36"
              />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <QrCode className="h-4 w-4 text-primary" aria-hidden="true" />
                {t.packListDetail.qrTitle}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.packListDetail.qrText}
              </p>
            </div>
          </div>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t.packListDetail.shareHint}
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
            items: [
              {
                name: newItem.trim(),
                category:
                  newCategory.trim() || t.packListDetail.defaultCategory,
                quantity: 1,
              },
            ],
          });
        }}
      >
        <Input
          placeholder={t.packListDetail.addPlaceholder}
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          aria-label={t.packListDetail.addNameAria}
        />
        <Input
          placeholder={t.packListDetail.categoryPlaceholder}
          className="hidden w-40 sm:block"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          aria-label={t.packListDetail.categoryAria}
        />
        <Button
          type="submit"
          disabled={addMutation.isPending || !newItem.trim()}
          aria-label={t.packListDetail.addAria}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      {/* Aus dem Inventar übernehmen */}
      {inventorySuggestions.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Package className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.packListDetail.inventoryTitle}
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
                    items: [
                      { name: inv.name, category: inv.category, quantity: 1 },
                    ],
                  })
                }
                className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                aria-label={t.packListDetail.inventoryAddAria(inv.name)}
              >
                + {inv.name}
                {inv.weightGrams > 0 && (
                  <span className="ml-1 opacity-70">
                    ({formatGrams(inv.weightGrams, lang)})
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t.packListDetail.inventoryHint}
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
            aria-label={t.packListDetail.addOnAria(pick(a.label, lang))}
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {pick(a.label, lang)}
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
                  item.checked && "bg-muted/60"
                )}
              >
                <Checkbox
                  id={`item-${item.id}`}
                  checked={item.checked}
                  onCheckedChange={checked =>
                    toggleMutation.mutate({
                      id: item.id,
                      checked: checked === true,
                    })
                  }
                  aria-label={
                    item.checked
                      ? t.packListDetail.markUnpacked(item.name)
                      : t.packListDetail.markPacked(item.name)
                  }
                />
                <label
                  htmlFor={`item-${item.id}`}
                  className={cn(
                    "flex-1 cursor-pointer text-sm",
                    item.checked && "text-muted-foreground line-through"
                  )}
                >
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      × {item.quantity}
                    </span>
                  )}
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                  onClick={() => deleteMutation.mutate({ id: item.id })}
                  aria-label={t.packListDetail.deleteItemAria(item.name)}
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
          {t.packListDetail.emptyList}
        </p>
      )}
    </div>
  );
}
