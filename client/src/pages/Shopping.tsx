import { useEffect, useMemo, useState } from "react";
import { ShareExpiryNote, ShareExpirySelect } from "@/components/ShareExpiry";
import type { ShareExpiryDays } from "@shared/sharing";
import {
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Link2,
  ListChecks,
  Loader2,
  Plus,
  Printer,
  QrCode,
  Refrigerator,
  Share2,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import QRCode from "qrcode";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import ShoppingItemDetailsPopover from "@/components/ShoppingItemDetailsPopover";
import ShoppingNameAutocomplete from "@/components/ShoppingNameAutocomplete";
import StorePurchasesDialog from "@/components/StorePurchasesDialog";
import { useShoppingTarget } from "@/components/ShoppingTargetSelect";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import {
  loadShoppingHistory,
  rememberShoppingEntry,
  sanitizeShoppingHistory,
  saveShoppingHistory,
  shoppingSuggestions,
  type ShoppingHistoryEntry,
} from "@/lib/shoppingHistory";
import { trpc } from "@/lib/trpc";
import { hapticTick } from "@/lib/haptics";
import { usePointerDrag } from "@/lib/usePointerDrag";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { cn } from "@/lib/utils";
import { pick } from "@shared/i18n";
import {
  isShoppingCategory,
  MAX_SHOPPING_LIST_NAME_LENGTH,
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
 *
 * Seit #215 gibt es MEHRERE persönliche Listen: die Chips oben schalten um
 * (die Auswahl merkt sich das Gerät), der Verwalten-Dialog legt Listen an,
 * benennt sie um, sortiert und löscht sie. Teilen, Drucken und «Einräumen»
 * beziehen sich immer auf die aktive Liste.
 */
export default function ShoppingPage() {
  const { isAuthenticated, loading } = useAuth();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  // Aktive Liste (#215): gemerkte Auswahl, sonst die erste Liste
  const target = useShoppingTarget(isAuthenticated);
  const activeListId = target.listId;
  const listInput = { listId: activeListId ?? undefined };
  const query = trpc.shopping.list.useQuery(listInput, {
    enabled: isAuthenticated && activeListId !== null,
  });
  /** Verwalten-Dialog offen? */
  const [manageOpen, setManageOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  /** Zwischenstand der Namensfelder im Verwalten-Dialog (Id → Name). */
  const [nameDrafts, setNameDrafts] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [newCategory, setNewCategory] = useState<string>(NO_CATEGORY);
  /** Teil-Link, der gerade im Dialog gezeigt wird (null = Dialog zu). */
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  /** Im Dialog gewählte Gültigkeit; null = unbegrenzt. */
  const [shareExpiresIn, setShareExpiresIn] = useState<ShareExpiryDays | null>(
    null
  );
  const [shareExpiresAt, setShareExpiresAt] = useState<Date | null>(null);
  const [shareQr, setShareQr] = useState<string | null>(null);
  /** «Einkäufe einräumen»: abgehakte Einträge in die Kühlbox übernehmen. */
  const [putAwayOpen, setPutAwayOpen] = useState(false);

  // Einkaufs-Verlauf für Autocomplete: lokal + Geräte-Sync (Server gewinnt beim Laden)
  const [history, setHistory] = useState<ShoppingHistoryEntry[]>(() =>
    loadShoppingHistory()
  );
  const historySync = useSyncedSetting<ShoppingHistoryEntry[]>(
    "shoppingHistory",
    value => {
      const clean = sanitizeShoppingHistory(value);
      setHistory(clean);
      saveShoppingHistory(clean);
    }
  );
  /** Frisch hinzugefügten Eintrag im Verlauf vermerken (Gerät + Konto). */
  const rememberEntry = (entry: ShoppingHistoryEntry) => {
    const next = rememberShoppingEntry(history, entry);
    setHistory(next);
    saveShoppingHistory(next);
    historySync.push(next);
  };

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

  /** Teil-Link der aktiven Liste erzeugen (idempotent), Dialog öffnen, kopieren. */
  const openShare = (
    // undefined = Gültigkeit unverändert lassen (Dialog nur öffnen)
    expiresInDays?: ShareExpiryDays | null
  ) => {
    shareMutation.mutate(
      expiresInDays === undefined
        ? { listId: activeListId ?? undefined }
        : { listId: activeListId ?? undefined, expiresInDays },
      {
        onSuccess: async ({ token, expiresAt }) => {
          const url = `${window.location.origin}/einkaufsliste/${token}`;
          setShareUrl(url);
          setShareExpiresAt(expiresAt);
          try {
            await navigator.clipboard.writeText(url);
            toast.success(t.shopping.shareCopied);
          } catch {
            // Zwischenablage blockiert – der Link steht im Dialog
          }
        },
      }
    );
  };

  const unshareMutation = trpc.shopping.unshare.useMutation({
    onSuccess: () => {
      setShareUrl(null);
      toast.success(t.shopping.unshared);
    },
    onError: () => toast.error(t.shopping.unshareFailed),
  });

  /** Einträge UND Zähler der Listen neu laden. */
  const invalidate = () => {
    utils.shopping.list.invalidate();
    utils.shopping.lists.invalidate();
  };
  const addMutation = trpc.shopping.add.useMutation({
    onSuccess: (result, variables) => {
      invalidate();
      // Duplikat-Schutz des Servers: steht der Name schon unabgehakt auf der
      // Liste, wird nichts angelegt – die mitgeschickte Menge wäre sonst
      // stillschweigend weg, deshalb ein Info-Toast statt Stille.
      if (!result.added) toast.info(t.shopping.alreadyOnList(variables.name));
      rememberEntry({
        name: variables.name,
        category: variables.category ?? null,
        quantity: variables.quantity ?? null,
      });
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
    onMutate: () => hapticTick(),
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
      await utils.shopping.list.cancel(listInput);
      const prev = utils.shopping.list.getData(listInput);
      // Optimistisch: Einträge sofort in der neuen Reihenfolge zeigen
      utils.shopping.list.setData(listInput, old => {
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
      if (ctx?.prev) utils.shopping.list.setData(listInput, ctx.prev);
      toast.error(t.shopping.reorderFailed);
    },
    onSettled: invalidate,
  });

  // ── Listen verwalten (#215) ──
  /** Nach Listen-Änderungen: Umschalter, Zähler und Einträge neu laden. */
  const invalidateLists = () => {
    utils.shopping.lists.invalidate();
    utils.shopping.list.invalidate();
  };
  const createListMutation = trpc.shopping.createList.useMutation({
    onSuccess: result => {
      invalidateLists();
      target.setListId(result.id);
      setNewListName("");
      toast.success(t.shopping.listCreated(result.name));
    },
    onError: () => toast.error(t.shopping.listCreateFailed),
  });
  const renameListMutation = trpc.shopping.renameList.useMutation({
    onSuccess: () => {
      invalidateLists();
      toast.success(t.shopping.listRenamed);
    },
    onError: () => toast.error(t.shopping.listRenameFailed),
  });
  const deleteListMutation = trpc.shopping.deleteList.useMutation({
    onSuccess: (_result, variables) => {
      invalidateLists();
      // Die aktive Liste ist weg: auf die erste verbleibende umschalten
      if (variables.id === activeListId) {
        const next = target.lists.find(l => l.id !== variables.id);
        if (next) target.setListId(next.id);
      }
      setNameDrafts({});
      toast.success(t.shopping.listDeleted);
    },
    onError: () => toast.error(t.shopping.listDeleteFailed),
  });
  const reorderListsMutation = trpc.shopping.reorderLists.useMutation({
    onSuccess: invalidateLists,
    onError: () => toast.error(t.shopping.listOrderFailed),
  });

  /** Namensfeld einer Liste im Verwalten-Dialog (Entwurf oder gespeichert). */
  const draftName = (list: { id: number; name: string }) =>
    nameDrafts[list.id] ?? list.name;

  /** Liste um eine Position nach oben/unten schieben. */
  const moveList = (index: number, delta: number) => {
    const ids = target.lists.map(l => l.id);
    const to = index + delta;
    if (to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ...ids.splice(index, 1));
    reorderListsMutation.mutate({ listIds: ids });
  };

  const items = useMemo(() => query.data ?? [], [query.data]);
  const openItems = useMemo(() => items.filter(i => !i.checked), [items]);
  const doneItems = useMemo(() => items.filter(i => i.checked), [items]);

  // Autocomplete-Vorschläge: Verlauf (neueste zuerst) vor den Listen-Einträgen
  const suggestions = useMemo(
    () =>
      shoppingSuggestions(name, [
        ...history,
        ...items.map(i => ({
          name: i.name,
          category: i.category,
          quantity: i.quantity,
        })),
      ]),
    [name, history, items]
  );

  /** Vorschlag übernehmen: Name plus gemerkte Kategorie/Menge setzen. */
  const applySuggestion = (entry: ShoppingHistoryEntry) => {
    setName(entry.name);
    setNewCategory(
      isShoppingCategory(entry.category) ? entry.category : NO_CATEGORY
    );
    setQuantity(entry.quantity ?? "");
  };

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
    if (flat.length > 0)
      reorderMutation.mutate({
        listId: activeListId ?? undefined,
        itemIds: flat,
      });
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
      listId: activeListId ?? undefined,
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

      {/* Listen-Umschalter (#215): Chips mit Anzahl offener Einträge */}
      {target.lists.length > 0 && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2"
          role="group"
          aria-label={t.shopping.listsAria}
        >
          {target.lists.map(list => (
            <button
              key={list.id}
              type="button"
              aria-pressed={list.id === activeListId}
              onClick={() => target.setListId(list.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                list.id === activeListId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {list.name}
              <span className="ml-1.5 opacity-70">{list.openCount}</span>
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNameDrafts({});
              setManageOpen(true);
            }}
            aria-label={t.shopping.manageListsAria}
          >
            <ListChecks className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.shopping.manageListsButton}
          </Button>
        </div>
      )}

      {/* Schnelles Hinzufügen mit optionaler Kategorie */}
      <form
        className="mb-6 flex flex-wrap gap-2"
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
      >
        <ShoppingNameAutocomplete
          className="min-w-40 flex-1"
          value={name}
          onChange={setName}
          onPick={applySuggestion}
          suggestions={suggestions}
          placeholder={t.shopping.addPlaceholder}
          ariaLabel={t.shopping.addNameAria}
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

      {query.isLoading || activeListId === null ? (
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
                    <Link
                      href={
                        activeListId === null
                          ? "/einkauf/drucken"
                          : `/einkauf/drucken?liste=${activeListId}`
                      }
                    >
                      <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      {t.shopping.printButton}
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={shareMutation.isPending}
                  onClick={() => openShare()}
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
                            <ShoppingItemDetailsPopover
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
                  onClick={() => setPutAwayOpen(true)}
                >
                  <Refrigerator className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.shopping.putAwayButton}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={removeCheckedMutation.isPending}
                  onClick={() =>
                    removeCheckedMutation.mutate({
                      listId: activeListId ?? undefined,
                    })
                  }
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
                      clearMutation.mutate({
                        listId: activeListId ?? undefined,
                      });
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

      {/* Listen verwalten (#215): anlegen, umbenennen, sortieren, löschen */}
      <Dialog
        open={manageOpen}
        onOpenChange={open => {
          setManageOpen(open);
          if (!open) setNameDrafts({});
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.shopping.manageListsTitle}</DialogTitle>
            <DialogDescription>
              {t.shopping.manageListsDescription}
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex gap-2"
            onSubmit={e => {
              e.preventDefault();
              const trimmed = newListName.trim();
              if (!trimmed) return;
              createListMutation.mutate({
                name: trimmed.slice(0, MAX_SHOPPING_LIST_NAME_LENGTH),
              });
            }}
          >
            <Input
              value={newListName}
              maxLength={MAX_SHOPPING_LIST_NAME_LENGTH}
              placeholder={t.shopping.newListPlaceholder}
              aria-label={t.shopping.newListPlaceholder}
              onChange={e => setNewListName(e.target.value)}
            />
            <Button
              type="submit"
              disabled={!newListName.trim() || createListMutation.isPending}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.shopping.newListButton}
            </Button>
          </form>
          <ul className="space-y-2">
            {target.lists.map((list, index) => (
              <li key={list.id} className="flex items-start gap-1.5">
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveList(index, -1)}
                    aria-label={t.shopping.listMoveUpAria(list.name)}
                    className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={index === target.lists.length - 1}
                    onClick={() => moveList(index, 1)}
                    aria-label={t.shopping.listMoveDownAria(list.name)}
                    className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <Input
                    value={draftName(list)}
                    maxLength={MAX_SHOPPING_LIST_NAME_LENGTH}
                    aria-label={t.shopping.listNameAria(list.name)}
                    onChange={e =>
                      setNameDrafts(prev => ({
                        ...prev,
                        [list.id]: e.target.value,
                      }))
                    }
                  />
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.shopping.listCounts(list.openCount, list.doneCount)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground/70 hover:text-foreground"
                  disabled={
                    !draftName(list).trim() ||
                    draftName(list).trim() === list.name ||
                    renameListMutation.isPending
                  }
                  aria-label={t.shopping.listSaveNameAria(list.name)}
                  onClick={() =>
                    renameListMutation.mutate({
                      id: list.id,
                      name: draftName(list)
                        .trim()
                        .slice(0, MAX_SHOPPING_LIST_NAME_LENGTH),
                    })
                  }
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground/60 hover:text-destructive"
                  disabled={
                    target.lists.length <= 1 || deleteListMutation.isPending
                  }
                  aria-label={t.shopping.listDeleteAria(list.name)}
                  onClick={() => {
                    if (confirm(t.shopping.listDeleteConfirm(list.name))) {
                      deleteListMutation.mutate({ id: list.id });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {t.shopping.listDeleteLastHint}
          </p>
        </DialogContent>
      </Dialog>

      {/* «Einkäufe einräumen»: abgehakte Einträge in die Kühlbox übernehmen */}
      <StorePurchasesDialog
        open={putAwayOpen}
        onOpenChange={setPutAwayOpen}
        items={doneItems.map(i => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
        }))}
        removeItem={id => removeMutation.mutateAsync({ id })}
      />

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
              <div className="space-y-1">
                <ShareExpirySelect
                  value={shareExpiresIn}
                  onChange={days => {
                    setShareExpiresIn(days);
                    openShare(days);
                  }}
                />
                <ShareExpiryNote expiresAt={shareExpiresAt} />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={unshareMutation.isPending}
                onClick={() =>
                  unshareMutation.mutate({ listId: activeListId ?? undefined })
                }
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
