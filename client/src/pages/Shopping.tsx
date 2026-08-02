import { useEffect, useMemo, useState } from "react";
import {
  GripVertical,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Share2,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import QRCode from "qrcode";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { usePointerDrag } from "@/lib/usePointerDrag";
import { cn } from "@/lib/utils";
import { pick } from "@shared/i18n";
import {
  isShoppingCategory,
  SHOPPING_CATEGORIES,
  SHOPPING_CATEGORY_LABELS,
  type ShoppingCategory,
} from "@shared/shopping";

/** Select-Wert für «Ohne Kategorie» (Radix erlaubt keinen leeren String). */
const NO_CATEGORY = "none" as const;

/**
 * Einkaufsliste: schnelles Erfassen, Abhaken und Aufräumen. Offene Einträge
 * stehen nach Laden-Kategorien gruppiert oben (Reihenfolge des Katalogs,
 * «Ohne Kategorie» zuletzt) und lassen sich per Griff innerhalb der Gruppe
 * umsortieren; erledigte stehen durchgestrichen darunter. Zutaten kommen
 * wahlweise direkt aus dem Rezeptbuch (shopping.addMany).
 */
export default function ShoppingPage() {
  const { isAuthenticated, loading } = useAuth();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const query = trpc.shopping.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [newCategory, setNewCategory] = useState<string>(NO_CATEGORY);
  /** Teil-Link, der gerade im Dialog gezeigt wird (null = Dialog zu). */
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareQr, setShareQr] = useState<string | null>(null);

  // QR-Code zum Teil-Link erzeugen (Muster PackLists): einfach abscannen lassen
  useEffect(() => {
    if (!shareUrl) {
      setShareQr(null);
      return;
    }
    QRCode.toDataURL(shareUrl, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setShareQr)
      .catch(() => setShareQr(null));
  }, [shareUrl]);

  const shareMutation = trpc.shopping.share.useMutation({
    onError: () => toast.error(t.shopping.shareFailed),
  });

  /** Teil-Link erzeugen (idempotent), Dialog öffnen, Link kopieren. */
  const openShare = () => {
    shareMutation.mutate(undefined, {
      onSuccess: async ({ token }) => {
        const url = `${window.location.origin}/einkaufsliste/${token}`;
        setShareUrl(url);
        try {
          await navigator.clipboard.writeText(url);
          toast.success(t.shopping.shareCopied);
        } catch {
          // Zwischenablage blockiert – der Link steht im Dialog
        }
      },
    });
  };

  const unshareMutation = trpc.shopping.unshare.useMutation({
    onSuccess: () => {
      setShareUrl(null);
      toast.success(t.shopping.unshared);
    },
    onError: () => toast.error(t.shopping.unshareFailed),
  });

  const invalidate = () => utils.shopping.list.invalidate();
  const addMutation = trpc.shopping.add.useMutation({
    onSuccess: (result, variables) => {
      invalidate();
      // Duplikat-Schutz des Servers: steht der Name schon unabgehakt auf der
      // Liste, wird nichts angelegt – die mitgeschickte Menge wäre sonst
      // stillschweigend weg, deshalb ein Info-Toast statt Stille.
      if (!result.added) toast.info(t.shopping.alreadyOnList(variables.name));
      setName("");
      setQuantity("");
    },
    onError: () => toast.error(t.shopping.addFailed),
  });
  const updateMutation = trpc.shopping.updateItem.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.shopping.detailsFailed),
  });
  const toggleMutation = trpc.shopping.toggle.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.actionFailed),
  });
  const removeMutation = trpc.shopping.remove.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.deleteFailed),
  });
  const removeCheckedMutation = trpc.shopping.removeChecked.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.deleteFailed),
  });
  const clearMutation = trpc.shopping.clear.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.deleteFailed),
  });
  const setCategoryMutation = trpc.shopping.setCategory.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.shopping.categoryChangeFailed),
  });
  const reorderMutation = trpc.shopping.reorder.useMutation({
    onMutate: async input => {
      await utils.shopping.list.cancel();
      const prev = utils.shopping.list.getData();
      // Optimistisch: Einträge sofort in der neuen Reihenfolge zeigen
      utils.shopping.list.setData(undefined, old => {
        if (!old) return old;
        const byId = new Map(old.map(i => [i.id, i]));
        const ordered = input.itemIds
          .map(id => byId.get(id))
          .filter((i): i is NonNullable<typeof i> => i !== undefined);
        const rest = old.filter(i => !input.itemIds.includes(i.id));
        return [...ordered, ...rest];
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.shopping.list.setData(undefined, ctx.prev);
      toast.error(t.shopping.reorderFailed);
    },
    onSettled: invalidate,
  });

  const items = useMemo(() => query.data ?? [], [query.data]);
  const openItems = useMemo(() => items.filter(i => !i.checked), [items]);
  const doneItems = useMemo(() => items.filter(i => i.checked), [items]);

  /** Offene Einträge nach Kategorie gruppiert – Katalog-Reihenfolge, ohne Kategorie zuletzt. */
  const grouped = useMemo(() => {
    const groups: {
      key: ShoppingCategory | null;
      items: typeof openItems;
    }[] = [];
    SHOPPING_CATEGORIES.forEach(cat => {
      const catItems = openItems.filter(i => i.category === cat);
      if (catItems.length > 0) groups.push({ key: cat, items: catItems });
    });
    const uncategorized = openItems.filter(
      i => !isShoppingCategory(i.category)
    );
    if (uncategorized.length > 0)
      groups.push({ key: null, items: uncategorized });
    return groups;
  }, [openItems]);

  /** Anzeige-Label einer Gruppe (null = «Ohne Kategorie»). */
  const groupLabel = (key: ShoppingCategory | null) =>
    key === null
      ? t.shopping.noCategory
      : pick(SHOPPING_CATEGORY_LABELS[key], lang);

  /** Eintrag innerhalb seiner Gruppe verschieben und Gesamt-Reihenfolge speichern. */
  const moveItem = (group: string, fromIdStr: string, toIdStr: string) => {
    const fromId = Number(fromIdStr);
    const toId = Number(toIdStr);
    const flat: number[] = [];
    for (const g of grouped) {
      const ids = g.items.map(i => i.id);
      if ((g.key ?? NO_CATEGORY) === group) {
        const fromIdx = ids.indexOf(fromId);
        const toIdx = ids.indexOf(toId);
        if (fromIdx !== -1 && toIdx !== -1) {
          ids.splice(toIdx, 0, ...ids.splice(fromIdx, 1));
        }
      }
      flat.push(...ids);
    }
    // Erledigte behalten ihre Plätze am Ende der Gesamt-Reihenfolge
    flat.push(...doneItems.map(i => i.id));
    if (flat.length > 0) reorderMutation.mutate({ itemIds: flat });
  };

  // Geteilte Pointer-Drag-Logik (Maus + Touch) – gleiches Muster wie Packlisten
  const drag = usePointerDrag({
    onDrop: moveItem,
    handleSelector: "[data-drag-handle]",
  });

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addMutation.mutate({
      name: trimmed.slice(0, 160),
      category:
        newCategory === NO_CATEGORY ? null : (newCategory as ShoppingCategory),
      quantity: quantity.trim().slice(0, 40) || null,
    });
  };

  if (loading) {
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
          title={t.shopping.title}
          subtitle={t.shopping.subtitleLoggedOut}
        />
        <LoginPrompt feature={t.shopping.loginFeature} />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={t.shopping.title} subtitle={t.shopping.subtitle} />

      {/* Schnelles Hinzufügen mit optionaler Kategorie */}
      <form
        className="mb-6 flex flex-wrap gap-2"
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          className="min-w-40 flex-1"
          value={name}
          maxLength={160}
          placeholder={t.shopping.addPlaceholder}
          aria-label={t.shopping.addNameAria}
          onChange={e => setName(e.target.value)}
        />
        <Input
          className="w-24"
          value={quantity}
          maxLength={40}
          placeholder={t.shopping.quantityPlaceholder}
          aria-label={t.shopping.addQuantityAria}
          onChange={e => setQuantity(e.target.value)}
        />
        <Select value={newCategory} onValueChange={setNewCategory}>
          <SelectTrigger
            className="w-40"
            aria-label={t.shopping.addCategoryAria}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CATEGORY}>{t.shopping.noCategory}</SelectItem>
            {SHOPPING_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>
                {pick(SHOPPING_CATEGORY_LABELS[cat], lang)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          disabled={!name.trim() || addMutation.isPending}
          aria-label={t.shopping.addNameAria}
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.shopping.addButton}
        </Button>
      </form>

      {query.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <ShoppingCart
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="font-medium">{t.shopping.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.shopping.emptyText}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Offene Einträge, nach Laden-Kategorien gruppiert */}
          <section>
            <h2 className="mb-2 flex items-center justify-between gap-2 font-serif text-base font-semibold">
              {t.shopping.openTitle}
              <span className="flex items-center gap-2">
                <span className="font-sans text-xs font-normal text-muted-foreground">
                  {t.shopping.openCount(openItems.length)}
                </span>
                {openItems.length > 0 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/einkauf/drucken">
                      <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      {t.shopping.printButton}
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={shareMutation.isPending}
                  onClick={openShare}
                  aria-label={t.shopping.shareAria}
                >
                  <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.shopping.shareButton}
                </Button>
              </span>
            </h2>
            {openItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                {t.shopping.emptyText}
              </p>
            ) : (
              <div className="space-y-4">
                {grouped.map(group => {
                  const groupId = group.key ?? NO_CATEGORY;
                  return (
                    <div key={groupId}>
                      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {groupLabel(group.key)}
                      </h3>
                      <ul
                        className={cn(
                          "overflow-hidden rounded-xl border border-border",
                          drag.dragId !== null && "select-none"
                        )}
                      >
                        {group.items.map(item => (
                          <li
                            key={item.id}
                            {...drag.dragProps(groupId, String(item.id))}
                            className={cn(
                              "flex items-center gap-2 border-b border-border/60 bg-card px-3 py-2.5 transition-colors last:border-0",
                              drag.dragId === String(item.id) &&
                                "border-primary opacity-60",
                              drag.dragOverId === String(item.id) &&
                                drag.dragId !== String(item.id) &&
                                "bg-accent"
                            )}
                          >
                            <button
                              type="button"
                              data-drag-handle
                              aria-label={t.shopping.reorderAria(item.name)}
                              className="-ml-1 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 hover:text-foreground active:cursor-grabbing"
                            >
                              <GripVertical
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </button>
                            <Checkbox
                              checked={false}
                              onCheckedChange={() =>
                                toggleMutation.mutate({
                                  id: item.id,
                                  checked: true,
                                })
                              }
                              aria-label={t.shopping.itemCheckAria(item.name)}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="break-words text-sm">
                                {item.name}
                                {item.quantity && (
                                  <span className="ml-2 inline-block rounded bg-muted px-1.5 py-0.5 align-middle text-xs font-medium text-muted-foreground">
                                    {item.quantity}
                                  </span>
                                )}
                              </span>
                              {item.note && (
                                <p className="break-words text-xs text-muted-foreground">
                                  {item.note}
                                </p>
                              )}
                            </div>
                            <ItemDetailsPopover
                              item={item}
                              saving={updateMutation.isPending}
                              onSave={data => updateMutation.mutateAsync(data)}
                            />
                            <Select
                              value={
                                isShoppingCategory(item.category)
                                  ? item.category
                                  : NO_CATEGORY
                              }
                              onValueChange={value =>
                                setCategoryMutation.mutate({
                                  id: item.id,
                                  category:
                                    value === NO_CATEGORY
                                      ? null
                                      : (value as ShoppingCategory),
                                })
                              }
                            >
                              <SelectTrigger
                                className="h-7 w-auto max-w-32 shrink-0 gap-1 border-0 bg-transparent px-1.5 text-xs text-muted-foreground shadow-none hover:text-foreground"
                                aria-label={t.shopping.itemCategoryAria(
                                  item.name
                                )}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent align="end">
                                <SelectItem value={NO_CATEGORY}>
                                  {t.shopping.noCategory}
                                </SelectItem>
                                {SHOPPING_CATEGORIES.map(cat => (
                                  <SelectItem key={cat} value={cat}>
                                    {pick(SHOPPING_CATEGORY_LABELS[cat], lang)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                              onClick={() =>
                                removeMutation.mutate({ id: item.id })
                              }
                              aria-label={t.shopping.removeAria(item.name)}
                            >
                              <Trash2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Erledigte Einträge */}
          {doneItems.length > 0 && (
            <section>
              <h2 className="mb-2 font-serif text-base font-semibold text-muted-foreground">
                {t.shopping.doneTitle}
              </h2>
              <ul className="overflow-hidden rounded-xl border border-border">
                {doneItems.map(item => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-2.5 last:border-0"
                  >
                    <Checkbox
                      checked
                      onCheckedChange={() =>
                        toggleMutation.mutate({ id: item.id, checked: false })
                      }
                      aria-label={t.shopping.itemUncheckAria(item.name)}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="break-words text-sm text-muted-foreground line-through">
                        {item.name}
                        {item.quantity && (
                          <span className="ml-2 inline-block rounded bg-muted px-1.5 py-0.5 align-middle text-xs font-medium no-underline">
                            {item.quantity}
                          </span>
                        )}
                      </span>
                      {item.note && (
                        <p className="break-words text-xs text-muted-foreground/70">
                          {item.note}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                      onClick={() => removeMutation.mutate({ id: item.id })}
                      aria-label={t.shopping.removeAria(item.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={removeCheckedMutation.isPending}
                  onClick={() => removeCheckedMutation.mutate()}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.shopping.removeChecked}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={clearMutation.isPending}
                  onClick={() => {
                    if (confirm(t.shopping.clearConfirm)) {
                      clearMutation.mutate();
                    }
                  }}
                >
                  {t.shopping.clearAll}
                </Button>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Teil-Link der Einkaufsliste: Link + QR-Code, Teilen beenden */}
      <Dialog
        open={shareUrl !== null}
        onOpenChange={open => !open && setShareUrl(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.shopping.shareTitle}</DialogTitle>
            <DialogDescription>{t.shopping.shareDescription}</DialogDescription>
          </DialogHeader>
          {shareUrl && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <Link2
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <code className="min-w-0 flex-1 truncate text-xs">
                  {shareUrl}
                </code>
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
              {shareQr && (
                <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                  {/* Weisser Rahmen, damit der Code auch im Dark Mode scannbar bleibt */}
                  <div className="shrink-0 rounded-md bg-white p-2 shadow-sm">
                    <img
                      src={shareQr}
                      alt={t.shopping.shareQrAlt}
                      className="h-36 w-36"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <QrCode
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      {t.shopping.shareQrTitle}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.shopping.shareQrText}
                    </p>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={unshareMutation.isPending}
                onClick={() => unshareMutation.mutate()}
              >
                {t.shopping.unshareButton}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Popover zum nachträglichen Bearbeiten von Menge und Notiz eines Eintrags.
 * Leere Felder entfernen den jeweiligen Wert wieder (Server: "" → null).
 */
function ItemDetailsPopover({
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
