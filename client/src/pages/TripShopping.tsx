import { useMemo, useState } from "react";
import {
  ArrowLeft,
  GripVertical,
  Loader2,
  Plus,
  Refrigerator,
  ShoppingBasket,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import ShoppingItemDetailsPopover from "@/components/ShoppingItemDetailsPopover";
import ShoppingNameAutocomplete from "@/components/ShoppingNameAutocomplete";
import StorePurchasesDialog from "@/components/StorePurchasesDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  SHOPPING_CATEGORIES,
  SHOPPING_CATEGORY_LABELS,
  type ShoppingCategory,
} from "@shared/shopping";

/** Select-Wert für «Ohne Kategorie» (Radix erlaubt keinen leeren String). */
const NO_CATEGORY = "none" as const;

/**
 * Gemeinsame Einkaufsliste einer Reise: Owner und Mitreisende teilen sich
 * denselben Stand (Berechtigung serverseitig via canAccessTrip). Aufbau und
 * Bedienung wie die persönliche Einkaufsliste (Shopping.tsx): offene
 * Einträge nach Laden-Kategorien gruppiert und per Griff sortierbar,
 * erledigte durchgestrichen darunter. Bei geteilten Reisen steht am
 * Eintrag zusätzlich «von <Name>».
 */
export default function TripShoppingPage() {
  const params = useParams<{ tripId: string }>();
  const tripId = Number(params.tripId);
  const { lang, t } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const enabled = isAuthenticated && Number.isInteger(tripId) && tripId > 0;
  const query = trpc.tripShopping.listByTrip.useQuery({ tripId }, { enabled });
  const membersQuery = trpc.trips.members.list.useQuery(
    { tripId },
    { enabled: enabled && Boolean(query.data?.trip), retry: false }
  );
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [newCategory, setNewCategory] = useState<string>(NO_CATEGORY);
  /** «Einkäufe einräumen»: abgehakte Einträge in die EIGENE Kühlbox übernehmen. */
  const [putAwayOpen, setPutAwayOpen] = useState(false);

  // Einkaufs-Verlauf für Autocomplete: der persönliche Verlauf (lokal +
  // Geräte-Sync) gilt auch auf der gemeinsamen Reise-Liste.
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

  const invalidate = () => utils.tripShopping.listByTrip.invalidate({ tripId });
  const addMutation = trpc.tripShopping.add.useMutation({
    onSuccess: (result, variables) => {
      invalidate();
      // Duplikat-Schutz des Servers: steht der Name schon unabgehakt auf der
      // Liste, wird nichts angelegt – Info-Toast statt stillem Verwerfen.
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
  const updateMutation = trpc.tripShopping.updateItem.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.shopping.detailsFailed),
  });
  const toggleMutation = trpc.tripShopping.toggle.useMutation({
    onMutate: () => hapticTick(),
    onSuccess: invalidate,
    onError: () => toast.error(t.common.actionFailed),
  });
  const removeMutation = trpc.tripShopping.remove.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.deleteFailed),
  });
  const removeCheckedMutation = trpc.tripShopping.removeChecked.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.deleteFailed),
  });
  const setCategoryMutation = trpc.tripShopping.setCategory.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.shopping.categoryChangeFailed),
  });
  const reorderMutation = trpc.tripShopping.reorder.useMutation({
    onMutate: async input => {
      await utils.tripShopping.listByTrip.cancel({ tripId });
      const prev = utils.tripShopping.listByTrip.getData({ tripId });
      // Optimistisch: Einträge sofort in der neuen Reihenfolge zeigen
      utils.tripShopping.listByTrip.setData({ tripId }, old => {
        if (!old) return old;
        const byId = new Map(old.items.map(i => [i.id, i]));
        const ordered = input.itemIds
          .map(id => byId.get(id))
          .filter((i): i is NonNullable<typeof i> => i !== undefined);
        const rest = old.items.filter(i => !input.itemIds.includes(i.id));
        return { ...old, items: [...ordered, ...rest] };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev)
        utils.tripShopping.listByTrip.setData({ tripId }, ctx.prev);
      toast.error(t.shopping.reorderFailed);
    },
    onSettled: invalidate,
  });

  const trip = query.data?.trip ?? null;
  const items = useMemo(() => query.data?.items ?? [], [query.data]);
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

  /** Mitreisenden-Namen für die «von <Name>»-Anzeige (nur bei geteilten Reisen). */
  const members = membersQuery.data?.members ?? [];
  const isSharedTrip = members.length > 1;
  const memberNameById = useMemo(() => {
    const map = new Map<number, string>();
    members.forEach(m => {
      const label = m.name ?? m.email;
      if (label) map.set(m.userId, label);
    });
    return map;
  }, [members]);
  const creatorLabel = (userId: number) =>
    isSharedTrip ? memberNameById.get(userId) : undefined;

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
    if (flat.length > 0) reorderMutation.mutate({ tripId, itemIds: flat });
  };

  // Geteilte Pointer-Drag-Logik (Maus + Touch) – gleiches Muster wie Shopping
  const drag = usePointerDrag({
    onDrop: moveItem,
    handleSelector: "[data-drag-handle]",
  });

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addMutation.mutate({
      tripId,
      name: trimmed.slice(0, 160),
      category:
        newCategory === NO_CATEGORY ? null : (newCategory as ShoppingCategory),
      quantity: quantity.trim().slice(0, 40) || null,
    });
  };

  if (loading || (enabled && query.isLoading)) {
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
          title={t.tripShopping.title}
          subtitle={t.tripShopping.subtitle}
        />
        <LoginPrompt feature={t.tripShopping.loginFeature} />
      </div>
    );
  }

  // Trip existiert nicht oder ist für dieses Konto nicht zugänglich
  if (!trip) {
    return (
      <div className="container max-w-2xl py-6">
        <PageHeader
          title={t.tripShopping.title}
          subtitle={t.tripShopping.subtitle}
        />
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <UtensilsCrossed
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="font-medium">{t.menuPlan.notFoundTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.menuPlan.notFoundText}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/tagebuch">
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.menuPlan.backToTrips}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const spotName =
    trip.spotId != null
      ? (spotsQuery.data ?? []).find(s => s.id === trip.spotId)?.name
      : undefined;
  const tripName =
    trip.title || spotName || trip.location || t.trips.unknownPlace;

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader
        title={t.tripShopping.title}
        subtitle={t.tripShopping.subtitle}
      />

      {/* Trip-Kopf mit Rückweg zum Menüplan */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          <ShoppingBasket className="h-4 w-4 text-primary" aria-hidden="true" />
          {tripName}
        </span>
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link href={`/menueplan/${tripId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.tripShopping.backToMenuPlan}
          </Link>
        </Button>
      </div>

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

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <ShoppingBasket
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="font-medium">{t.tripShopping.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.tripShopping.emptyText}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Offene Einträge, nach Laden-Kategorien gruppiert */}
          <section>
            <h2 className="mb-2 flex items-center justify-between gap-2 font-serif text-base font-semibold">
              {t.shopping.openTitle}
              <span className="font-sans text-xs font-normal text-muted-foreground">
                {t.shopping.openCount(openItems.length)}
              </span>
            </h2>
            {openItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                {t.tripShopping.emptyText}
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
                        {group.items.map(item => {
                          const by = creatorLabel(item.createdByUserId);
                          return (
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
                                    tripId,
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
                                {(item.note || by) && (
                                  <p className="break-words text-xs text-muted-foreground">
                                    {item.note}
                                    {item.note && by && " · "}
                                    {by && t.tripShopping.byUser(by)}
                                  </p>
                                )}
                              </div>
                              <ShoppingItemDetailsPopover
                                item={item}
                                saving={updateMutation.isPending}
                                onSave={data =>
                                  updateMutation.mutateAsync({
                                    tripId,
                                    ...data,
                                  })
                                }
                              />
                              <Select
                                value={
                                  isShoppingCategory(item.category)
                                    ? item.category
                                    : NO_CATEGORY
                                }
                                onValueChange={value =>
                                  setCategoryMutation.mutate({
                                    tripId,
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
                                      {pick(
                                        SHOPPING_CATEGORY_LABELS[cat],
                                        lang
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                                onClick={() =>
                                  removeMutation.mutate({
                                    tripId,
                                    id: item.id,
                                  })
                                }
                                aria-label={t.shopping.removeAria(item.name)}
                              >
                                <Trash2
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </Button>
                            </li>
                          );
                        })}
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
                {doneItems.map(item => {
                  const by = creatorLabel(item.createdByUserId);
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-2.5 last:border-0"
                    >
                      <Checkbox
                        checked
                        onCheckedChange={() =>
                          toggleMutation.mutate({
                            tripId,
                            id: item.id,
                            checked: false,
                          })
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
                        {(item.note || by) && (
                          <p className="break-words text-xs text-muted-foreground/70">
                            {item.note}
                            {item.note && by && " · "}
                            {by && t.tripShopping.byUser(by)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                        onClick={() =>
                          removeMutation.mutate({ tripId, id: item.id })
                        }
                        aria-label={t.shopping.removeAria(item.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </li>
                  );
                })}
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
                  onClick={() => removeCheckedMutation.mutate({ tripId })}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.shopping.removeChecked}
                </Button>
              </div>
            </section>
          )}
        </div>
      )}

      {/* «Einkäufe einräumen»: Kühlbox ist persönlich – die Einträge landen
          im EIGENEN Kühlbox-Inventar und verschwinden von der Reise-Liste. */}
      <StorePurchasesDialog
        open={putAwayOpen}
        onOpenChange={setPutAwayOpen}
        items={doneItems.map(i => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
        }))}
        removeItem={id => removeMutation.mutateAsync({ tripId, id })}
      />
    </div>
  );
}
