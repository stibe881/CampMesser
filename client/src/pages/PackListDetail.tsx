import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import {
  BookmarkPlus,
  GripVertical,
  Link2,
  Loader2,
  Package,
  Plus,
  Printer,
  QrCode,
  Scale,
  Share2,
  Trash2,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { usePointerDrag } from "@/lib/usePointerDrag";
import { familyAddOns } from "@shared/packTemplates";
import { computePackWeight, formatGrams } from "@shared/packWeight";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { cn } from "@/lib/utils";

/** Filter-Sonderwert: Einträge ohne Personen-Zuordnung. */
const FILTER_UNASSIGNED = "__unassigned__";

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
  /** null = alle anzeigen, FILTER_UNASSIGNED = ohne Zuordnung, sonst Personenname. */
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  /** Eintrag, dessen Personen-Zuordnung gerade bearbeitet wird. */
  const [assignItemId, setAssignItemId] = useState<number | null>(null);
  const [assignDraft, setAssignDraft] = useState("");
  /** Dialog «Als Vorlage speichern» mit Namensfeld. */
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

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

  const saveTemplateMutation = trpc.packing.saveAsTemplate.useMutation({
    onSuccess: () => {
      utils.packing.listTemplates.invalidate();
      setTemplateDialogOpen(false);
      toast.success(t.packListDetail.templateSaved);
    },
    onError: () => toast.error(t.packListDetail.templateSaveFailed),
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

  const assignMutation = trpc.packing.updateItem.useMutation({
    onMutate: async input => {
      await utils.packing.items.cancel({ listId });
      const prev = utils.packing.items.getData({ listId });
      utils.packing.items.setData({ listId }, old =>
        old
          ? {
              ...old,
              items: old.items.map(i =>
                i.id === input.id ? { ...i, assignee: input.assignee } : i
              ),
            }
          : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.packing.items.setData({ listId }, ctx.prev);
      toast.error(t.packListDetail.assignFailed);
    },
  });

  const assignPerson = (itemId: number, assignee: string | null) => {
    assignMutation.mutate({ id: itemId, assignee });
    setAssignItemId(null);
    setAssignDraft("");
  };

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

  // Alle bereits vergebenen Personennamen – für Filter-Chips und Vorschläge
  const assigneeNames = useMemo(() => {
    const names: string[] = [];
    for (const item of query.data?.items ?? []) {
      const name = item.assignee?.trim();
      if (name && !names.includes(name)) names.push(name);
    }
    return names.sort((a, b) => a.localeCompare(b, LOCALE_TAGS[lang]));
  }, [query.data?.items, lang]);

  // Aktiven Filter zurücksetzen, wenn die letzte Zuordnung dieser Person wegfällt
  useEffect(() => {
    if (
      personFilter !== null &&
      personFilter !== FILTER_UNASSIGNED &&
      !assigneeNames.includes(personFilter)
    ) {
      setPersonFilter(null);
    }
  }, [personFilter, assigneeNames]);

  const matchesPersonFilter = (assignee: string | null) =>
    personFilter === null ||
    (personFilter === FILTER_UNASSIGNED
      ? !assignee
      : (assignee ?? "").trim() === personFilter);

  const generalCategory = t.packListDetail.generalCategory;
  const grouped = useMemo(() => {
    const items = (query.data?.items ?? []).filter(i =>
      matchesPersonFilter(i.assignee)
    );
    const map = new Map<string, (typeof items)[number][]>();
    for (const item of items) {
      const key = item.category || generalCategory;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.items, generalCategory, personFilter]);

  // Bei aktivem Personen-Filter ist die Liste unvollständig – Sortieren deaktiviert
  const filterActive = personFilter !== null;

  const reorderMutation = trpc.packing.reorderItems.useMutation({
    onMutate: async input => {
      await utils.packing.items.cancel({ listId });
      const prev = utils.packing.items.getData({ listId });
      // Optimistisch: Einträge sofort in der neuen Reihenfolge zeigen
      utils.packing.items.setData({ listId }, old => {
        if (!old) return old;
        const byId = new Map(old.items.map(i => [i.id, i]));
        const included = new Set(input.itemIds);
        const next = input.itemIds
          .map((id, idx) => {
            const item = byId.get(id);
            return item ? { ...item, sortOrder: idx } : null;
          })
          .filter((i): i is NonNullable<typeof i> => i !== null);
        return {
          ...old,
          items: [...next, ...old.items.filter(i => !included.has(i.id))],
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.packing.items.setData({ listId }, ctx.prev);
      toast.error(t.packListDetail.reorderFailed);
    },
  });

  /** Eintrag innerhalb seiner Kategorie verschieben und Gesamt-Reihenfolge speichern. */
  const moveItem = (category: string, fromIdStr: string, toIdStr: string) => {
    const fromId = Number(fromIdStr);
    const toId = Number(toIdStr);
    const flat: number[] = [];
    for (const [cat, catItems] of grouped) {
      const ids = catItems.map(i => i.id);
      if (cat === category) {
        const fromIdx = ids.indexOf(fromId);
        const toIdx = ids.indexOf(toId);
        if (fromIdx !== -1 && toIdx !== -1) {
          ids.splice(toIdx, 0, ...ids.splice(fromIdx, 1));
        }
      }
      flat.push(...ids);
    }
    if (flat.length > 0) reorderMutation.mutate({ listId, itemIds: flat });
  };

  // Geteilte Pointer-Drag-Logik (Maus + Touch) – gleiche wie beim Kachel-Sortieren
  const drag = usePointerDrag({
    onDrop: moveItem,
    handleSelector: "[data-drag-handle]",
    disabled: filterActive,
  });

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
  const filteredItems = items.filter(i => matchesPersonFilter(i.assignee));
  const filteredChecked = filteredItems.filter(i => i.checked).length;
  const filteredProgress =
    filteredItems.length > 0
      ? (filteredChecked / filteredItems.length) * 100
      : 0;

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
          value={filterActive ? filteredProgress : progress}
          aria-label={
            filterActive
              ? t.packListDetail.filterProgressAria(
                  Math.round(filteredProgress)
                )
              : t.packListDetail.progressAria(Math.round(progress))
          }
        />
        {filterActive && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t.packListDetail.filteredCount(
              filteredChecked,
              filteredItems.length
            )}{" "}
            · {t.packListDetail.totalCount(checkedCount, items.length)}
          </p>
        )}
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

      {/* Liste teilen & drucken */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
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
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/packlisten/${listId}/drucken${
                personFilter && personFilter !== FILTER_UNASSIGNED
                  ? `?person=${encodeURIComponent(personFilter)}`
                  : ""
              }`}
            >
              <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.packListDetail.printButton}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={items.length === 0}
            onClick={() => {
              setTemplateName(query.data?.list?.name ?? "");
              setTemplateDialogOpen(true);
            }}
            aria-label={t.packListDetail.saveTemplateAria(query.data.list.name)}
          >
            <BookmarkPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.packListDetail.saveTemplateButton}
          </Button>
        </div>
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

      {/* Personen-Filter: Wer packt was? */}
      {assigneeNames.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.packListDetail.filterTitle}
          </p>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={t.packListDetail.filterGroupAria}
          >
            {[
              { value: null, label: t.packListDetail.filterAll },
              ...assigneeNames.map(name => ({ value: name, label: name })),
              {
                value: FILTER_UNASSIGNED,
                label: t.packListDetail.filterUnassigned,
              },
            ].map(chip => (
              <button
                key={chip.value ?? "__all__"}
                type="button"
                aria-pressed={personFilter === chip.value}
                onClick={() => setPersonFilter(chip.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  personFilter === chip.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gruppierte Einträge */}
      {grouped.map(([category, categoryItems]) => (
        <div key={category} className="mb-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {category}
          </h2>
          <ul
            className={cn("space-y-1.5", drag.dragId !== null && "select-none")}
          >
            {categoryItems.map(item => (
              <li
                key={item.id}
                {...drag.dragProps(category, String(item.id))}
                className={cn(
                  "group flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 transition-colors",
                  item.checked && "bg-muted/60",
                  drag.dragId === String(item.id) &&
                    "border-primary opacity-60",
                  drag.dragOverId === String(item.id) &&
                    drag.dragId !== String(item.id) &&
                    "border-primary bg-accent/40"
                )}
              >
                <button
                  type="button"
                  data-drag-handle
                  disabled={filterActive}
                  title={
                    filterActive
                      ? t.packListDetail.reorderDisabledTitle
                      : undefined
                  }
                  aria-label={t.packListDetail.reorderAria(item.name)}
                  className={cn(
                    "-ml-1.5 shrink-0 touch-none rounded p-0.5 text-muted-foreground/50",
                    filterActive
                      ? "cursor-not-allowed opacity-40"
                      : "cursor-grab hover:text-foreground active:cursor-grabbing"
                  )}
                >
                  <GripVertical className="h-4 w-4" aria-hidden="true" />
                </button>
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
                {item.assignee && (
                  <span className="inline-flex max-w-32 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    <UserRound
                      className="h-3 w-3 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.assignee}</span>
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
                  onClick={() => {
                    if (assignItemId === item.id) {
                      setAssignItemId(null);
                    } else {
                      setAssignItemId(item.id);
                      setAssignDraft(item.assignee ?? "");
                    }
                  }}
                  aria-label={t.packListDetail.assignButtonAria(item.name)}
                  aria-expanded={assignItemId === item.id}
                >
                  <UserRoundPlus className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                  onClick={() => deleteMutation.mutate({ id: item.id })}
                  aria-label={t.packListDetail.deleteItemAria(item.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                {assignItemId === item.id && (
                  <form
                    className="flex w-full flex-wrap items-center gap-2 border-t border-border pt-2"
                    onSubmit={e => {
                      e.preventDefault();
                      const name = assignDraft.trim().slice(0, 80);
                      if (name) assignPerson(item.id, name);
                    }}
                  >
                    <Input
                      value={assignDraft}
                      onChange={e => setAssignDraft(e.target.value)}
                      placeholder={t.packListDetail.assignPlaceholder}
                      aria-label={t.packListDetail.assignInputAria(item.name)}
                      maxLength={80}
                      autoFocus
                      className="h-8 w-36 text-sm"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8"
                      disabled={!assignDraft.trim()}
                    >
                      {t.packListDetail.assignSave}
                    </Button>
                    {item.assignee && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => assignPerson(item.id, null)}
                      >
                        {t.packListDetail.assignRemove}
                      </Button>
                    )}
                    {assigneeNames
                      .filter(name => name !== item.assignee)
                      .map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => assignPerson(item.id, name)}
                          className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                          aria-label={t.packListDetail.assignSuggestionAria(
                            name,
                            item.name
                          )}
                        >
                          {name}
                        </button>
                      ))}
                  </form>
                )}
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

      {items.length > 0 && filterActive && filteredItems.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          {t.packListDetail.filterEmpty}
        </p>
      )}

      {/* Dialog «Als Vorlage speichern» */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.packListDetail.saveTemplateTitle}</DialogTitle>
            <DialogDescription>
              {t.packListDetail.saveTemplateDescription}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              const name = templateName.trim().slice(0, 120);
              if (!name) return;
              saveTemplateMutation.mutate({ listId, name });
            }}
          >
            <Label htmlFor="template-name">
              {t.packListDetail.templateNameLabel}
            </Label>
            <Input
              id="template-name"
              className="mt-1.5"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              maxLength={120}
              autoFocus
            />
            <Button
              type="submit"
              className="mt-4 w-full"
              disabled={saveTemplateMutation.isPending || !templateName.trim()}
            >
              {saveTemplateMutation.isPending && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t.packListDetail.saveTemplateConfirm}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
