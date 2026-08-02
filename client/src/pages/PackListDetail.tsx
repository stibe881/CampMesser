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
  RotateCcw,
  Scale,
  Share2,
  Tag,
  Trash2,
  UserRound,
  UserRoundPlus,
  Users,
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
import { hapticTick } from "@/lib/haptics";
import { usePointerDrag } from "@/lib/usePointerDrag";
import { familyAddOns } from "@shared/packTemplates";
import { MAX_PERSONS, parsePersons } from "@shared/packPersons";
import {
  computePackWeight,
  formatGrams,
  weightBudgetStatus,
} from "@shared/packWeight";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { cn } from "@/lib/utils";

/** Bereichs-Schlüssel für Einträge ohne Personen-Zuordnung («Allgemein»). */
const SECTION_GENERAL = "__general__";

/** Select-Sonderwert: «Neue Kategorie …» öffnet ein Inline-Namensfeld. */
const CATEGORY_NEW = "__new-category__";

/** Initialen (max. 2 Buchstaben) fürs «Zuletzt geändert von»-Badge. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join("") || "?"
  );
}

/**
 * Kategorie-Auswahl für Einträge: alle in der Liste vorhandenen Kategorien
 * plus «Neue Kategorie …», die ein Inline-Namensfeld öffnet.
 */
function CategorySelect({
  categories,
  choice,
  onChoiceChange,
  newName,
  onNewNameChange,
  selectAria,
  className,
}: {
  categories: string[];
  choice: string;
  onChoiceChange: (value: string) => void;
  newName: string;
  onNewNameChange: (value: string) => void;
  selectAria: string;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <>
      <Select value={choice} onValueChange={onChoiceChange}>
        <SelectTrigger
          className={cn("w-40", className)}
          aria-label={selectAria}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map(cat => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
          <SelectItem value={CATEGORY_NEW}>
            {t.packListDetail.newCategoryOption}
          </SelectItem>
        </SelectContent>
      </Select>
      {choice === CATEGORY_NEW && (
        <Input
          value={newName}
          onChange={e => onNewNameChange(e.target.value)}
          placeholder={t.packListDetail.newCategoryPlaceholder}
          aria-label={t.packListDetail.newCategoryAria}
          maxLength={80}
          className={cn("w-40", className)}
        />
      )}
    </>
  );
}

/**
 * «Artikel hinzufügen»-Formular eines Bereichs: legt neue Einträge direkt in
 * dem Bereich (assignee) an, mit Kategorie-Auswahl inkl. «Neue Kategorie …».
 */
function SectionAddForm({
  listId,
  assignee,
  categories,
  sectionLabel,
}: {
  listId: number;
  /** null = Bereich «Allgemein». */
  assignee: string | null;
  categories: string[];
  sectionLabel: string;
}) {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [catChoice, setCatChoice] = useState("");
  const [catName, setCatName] = useState("");

  const addMutation = trpc.packing.addItems.useMutation({
    onSuccess: () => {
      utils.packing.items.invalidate({ listId });
      setName("");
      setCatName("");
    },
    onError: () => toast.error(t.packListDetail.addFailed),
  });

  // Gültige Auswahl: Nutzerwahl, sonst erste Kategorie der Liste
  const effectiveChoice =
    catChoice === CATEGORY_NEW || categories.includes(catChoice)
      ? catChoice
      : (categories[0] ?? CATEGORY_NEW);

  return (
    <form
      className="mt-3 flex flex-wrap gap-2"
      onSubmit={e => {
        e.preventDefault();
        if (!name.trim()) return;
        addMutation.mutate({
          listId,
          items: [
            {
              name: name.trim(),
              category:
                effectiveChoice === CATEGORY_NEW
                  ? catName.trim().slice(0, 80) ||
                    t.packListDetail.defaultCategory
                  : effectiveChoice,
              quantity: 1,
              assignee,
            },
          ],
        });
      }}
    >
      <Input
        placeholder={t.packListDetail.addPlaceholder}
        className="min-w-40 flex-1"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={160}
        aria-label={t.packListDetail.sectionAddNameAria(sectionLabel)}
      />
      <CategorySelect
        categories={categories}
        choice={effectiveChoice}
        onChoiceChange={setCatChoice}
        newName={catName}
        onNewNameChange={setCatName}
        selectAria={t.packListDetail.categoryAria}
      />
      <Button
        type="submit"
        disabled={addMutation.isPending || !name.trim()}
        aria-label={t.packListDetail.sectionAddAria(sectionLabel)}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  );
}

export default function PackListDetailPage() {
  const params = useParams<{ id: string }>();
  const listId = Number(params.id);
  const { user, isAuthenticated, loading } = useAuth();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const query = trpc.packing.items.useQuery(
    { listId },
    { enabled: isAuthenticated && !isNaN(listId) }
  );
  const inventoryQuery = trpc.inventory.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  /** Eintrag, dessen Kategorie gerade bearbeitet wird. */
  const [editCatItemId, setEditCatItemId] = useState<number | null>(null);
  const [editCatChoice, setEditCatChoice] = useState<string>(CATEGORY_NEW);
  const [editCatName, setEditCatName] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  /** Eintrag, dessen Personen-Zuordnung gerade bearbeitet wird. */
  const [assignItemId, setAssignItemId] = useState<number | null>(null);
  const [assignDraft, setAssignDraft] = useState("");
  /** Dialog «Personen verwalten» mit Namensfeld. */
  const [personsDialogOpen, setPersonsDialogOpen] = useState(false);
  const [personDraft, setPersonDraft] = useState("");
  /** Dialog «Als Vorlage speichern» mit Namensfeld. */
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  /** Dialog «Gewichts-Budget» mit kg-Eingabe. */
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState("");

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
      hapticTick();
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

  // Alle Haken lösen – optimistisch, damit die Liste sofort «frisch» aussieht
  const uncheckAllMutation = trpc.packing.uncheckAll.useMutation({
    onMutate: async () => {
      await utils.packing.items.cancel({ listId });
      const prev = utils.packing.items.getData({ listId });
      utils.packing.items.setData({ listId }, old =>
        old
          ? { ...old, items: old.items.map(i => ({ ...i, checked: false })) }
          : old
      );
      return { prev };
    },
    onSuccess: () => toast.success(t.packListDetail.uncheckAllDone),
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.packing.items.setData({ listId }, ctx.prev);
      toast.error(t.packListDetail.uncheckAllFailed);
    },
  });

  const updateItemMutation = trpc.packing.updateItem.useMutation({
    onMutate: async input => {
      await utils.packing.items.cancel({ listId });
      const prev = utils.packing.items.getData({ listId });
      utils.packing.items.setData({ listId }, old =>
        old
          ? {
              ...old,
              items: old.items.map(i =>
                i.id === input.id
                  ? {
                      ...i,
                      ...(input.assignee !== undefined
                        ? { assignee: input.assignee }
                        : {}),
                      ...(input.category !== undefined
                        ? { category: input.category }
                        : {}),
                    }
                  : i
              ),
            }
          : old
      );
      return { prev };
    },
    onError: (_e, vars, ctx) => {
      if (ctx?.prev) utils.packing.items.setData({ listId }, ctx.prev);
      toast.error(
        vars.category !== undefined
          ? t.packListDetail.categoryUpdateFailed
          : t.packListDetail.assignFailed
      );
    },
  });

  const assignPerson = (itemId: number, assignee: string | null) => {
    updateItemMutation.mutate({ id: itemId, assignee });
    setAssignItemId(null);
    setAssignDraft("");
  };

  // Personen-Bereiche speichern (Dialog «Personen verwalten»)
  const setPersonsMutation = trpc.packing.setPersons.useMutation({
    onSuccess: () => {
      utils.packing.items.invalidate({ listId });
      setPersonDraft("");
    },
    onError: () => toast.error(t.packListDetail.personsSaveFailed),
  });

  const addMutation = trpc.packing.addItems.useMutation({
    onSuccess: () => utils.packing.items.invalidate({ listId }),
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

  // Alle vorhandenen Kategorien der Liste (in Reihenfolge des Auftretens)
  const categories = useMemo(() => {
    const cats: string[] = [];
    for (const item of query.data?.items ?? []) {
      const cat = item.category.trim();
      if (cat && !cats.includes(cat)) cats.push(cat);
    }
    return cats;
  }, [query.data?.items]);

  // Personen-Bereiche der Liste (aus personsJson)
  const persons = useMemo(
    () => parsePersons(query.data?.list?.personsJson),
    [query.data?.list?.personsJson]
  );

  // Abwärtskompatibilität: Personen, die nur noch über das assignee-Feld an
  // Einträgen hängen, erscheinen ebenfalls als eigener Bereich.
  const extraAssignees = useMemo(() => {
    const extras: string[] = [];
    for (const item of query.data?.items ?? []) {
      const name = item.assignee?.trim();
      if (name && !persons.includes(name) && !extras.includes(name))
        extras.push(name);
    }
    return extras.sort((a, b) => a.localeCompare(b, LOCALE_TAGS[lang]));
  }, [query.data?.items, persons, lang]);

  // Vorschläge fürs Zuweisen: verwaltete Personen zuerst, dann Alt-Zuordnungen
  const suggestionNames = useMemo(
    () => [...persons, ...extraAssignees],
    [persons, extraAssignees]
  );

  const generalCategory = t.packListDetail.generalCategory;

  // «Zuletzt geändert von …»: nur bei Listen an GEMEINSAMEN Reisen und nur
  // für Änderungen ANDERER (die eigenen sind nicht spannend) – private
  // Listen bleiben komplett unverändert.
  const isSharedTripList = query.data?.sharedTrip === true;
  const editorLabel = (item: {
    updatedByUserId: number | null;
    updatedByName: string | null;
  }): string | null =>
    isSharedTripList &&
    item.updatedByName &&
    item.updatedByUserId != null &&
    item.updatedByUserId !== user?.id
      ? item.updatedByName
      : null;
  /** Zeitpunkt der letzten Änderung fürs title-Tooltip. */
  const formatEditedAt = (value: Date | string) =>
    new Date(value).toLocaleString(LOCALE_TAGS[lang], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  /**
   * Primäre Gliederung nach Person: zuoberst «Allgemein» (assignee null),
   * darunter ein Bereich pro Person – innerhalb nach Kategorie gruppiert.
   */
  const sections = useMemo(() => {
    const items = query.data?.items ?? [];
    const defs: (string | null)[] = [null, ...persons, ...extraAssignees];
    return defs.map(person => {
      const sectionItems = items.filter(i =>
        person === null
          ? !i.assignee?.trim()
          : (i.assignee ?? "").trim() === person
      );
      const map = new Map<string, typeof sectionItems>();
      for (const item of sectionItems) {
        const key = item.category || generalCategory;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
      }
      return {
        person,
        key: person ?? SECTION_GENERAL,
        items: sectionItems,
        groups: Array.from(map.entries()),
      };
    });
  }, [query.data?.items, persons, extraAssignees, generalCategory]);

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

  /**
   * Eintrag innerhalb seiner Kategorie (im selben Bereich) verschieben und
   * die Gesamt-Reihenfolge speichern. Die Drag-Gruppe ist JSON-codiert
   * [Bereichs-Schlüssel, Kategorie], damit gleiche Kategorien in
   * verschiedenen Bereichen getrennt bleiben.
   */
  const moveItem = (group: string, fromIdStr: string, toIdStr: string) => {
    let sectionKey = "";
    let category = "";
    try {
      [sectionKey, category] = JSON.parse(group) as [string, string];
    } catch {
      return;
    }
    const fromId = Number(fromIdStr);
    const toId = Number(toIdStr);
    const flat: number[] = [];
    for (const section of sections) {
      for (const [cat, catItems] of section.groups) {
        const ids = catItems.map(i => i.id);
        if (section.key === sectionKey && cat === category) {
          const fromIdx = ids.indexOf(fromId);
          const toIdx = ids.indexOf(toId);
          if (fromIdx !== -1 && toIdx !== -1) {
            ids.splice(toIdx, 0, ...ids.splice(fromIdx, 1));
          }
        }
        flat.push(...ids);
      }
    }
    if (flat.length > 0) reorderMutation.mutate({ listId, itemIds: flat });
  };

  // Geteilte Pointer-Drag-Logik (Maus + Touch) – gleiche wie beim Kachel-Sortieren
  const drag = usePointerDrag({
    onDrop: moveItem,
    handleSelector: "[data-drag-handle]",
  });

  // Gewichts-Bilanz über den Namens-Abgleich mit dem Inventar
  const weight = useMemo(
    () => computePackWeight(query.data?.items ?? [], inventoryQuery.data ?? []),
    [query.data?.items, inventoryQuery.data]
  );

  const budgetMutation = trpc.packing.setWeightBudget.useMutation({
    onSuccess: (_data, vars) => {
      utils.packing.items.invalidate({ listId });
      // Budget-Badge in der Listen-Übersicht aktuell halten
      utils.packing.lists.invalidate();
      setBudgetDialogOpen(false);
      toast.success(
        vars.grams === null
          ? t.packListDetail.budgetRemoved
          : t.packListDetail.budgetSaved
      );
    },
    onError: () => toast.error(t.packListDetail.budgetSaveFailed),
  });

  /** kg-Eingabe («12,5» oder «12.5») in Gramm umrechnen; null bei ungültig. */
  const parseKgToGrams = (raw: string): number | null => {
    const value = Number.parseFloat(raw.trim().replace(",", "."));
    if (!Number.isFinite(value)) return null;
    const grams = Math.round(value * 1000);
    return grams >= 100 && grams <= 500000 ? grams : null;
  };

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
  const budgetGrams = query.data.list.weightBudgetGrams ?? null;
  const budget =
    budgetGrams !== null
      ? weightBudgetStatus(weight.totalGrams, budgetGrams)
      : null;
  /** Budget-Dialog öffnen, Eingabefeld mit dem aktuellen Budget (kg) vorbefüllen. */
  const openBudgetDialog = () => {
    const kg = budgetGrams !== null ? (budgetGrams / 1000).toString() : "";
    setBudgetDraft(lang === "en" ? kg : kg.replace(".", ","));
    setBudgetDialogOpen(true);
  };
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

      {/* Gewichts-Bilanz aus dem Inventar-Abgleich + Gewichts-Budget */}
      {(weight.matchedCount > 0 || budget !== null) && (
        <div className="mb-6 space-y-2.5">
          {weight.matchedCount > 0 && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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
          {budget !== null && budgetGrams !== null ? (
            <div className="space-y-1.5 rounded-lg border border-border bg-card px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {t.packListDetail.budgetLine(
                    formatGrams(weight.totalGrams, lang),
                    formatGrams(budgetGrams, lang)
                  )}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={openBudgetDialog}
                  aria-label={t.packListDetail.budgetEditAria}
                >
                  {t.packListDetail.budgetEdit}
                </Button>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(100, budget.percent)}
                aria-label={t.packListDetail.budgetProgressAria(budget.percent)}
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    budget.level === "over"
                      ? "bg-destructive"
                      : budget.level === "warn"
                        ? "bg-amber-500"
                        : "bg-primary"
                  )}
                  style={{ width: `${Math.min(100, budget.percent)}%` }}
                />
              </div>
              <p
                className={cn(
                  "text-xs",
                  budget.level === "over"
                    ? "font-medium text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {budget.level === "over"
                  ? t.packListDetail.budgetOver(
                      formatGrams(budget.overGrams, lang)
                    )
                  : t.packListDetail.budgetPercent(budget.percent)}
              </p>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={openBudgetDialog}>
              <Scale className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.packListDetail.budgetSetButton}
            </Button>
          )}
        </div>
      )}
      {weight.matchedCount === 0 && budget === null && <div className="mb-4" />}

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
            <Link href={`/packlisten/${listId}/drucken`}>
              <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.packListDetail.printButton}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPersonsDialogOpen(true)}
          >
            <Users className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.packListDetail.managePersonsButton}
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
          {checkedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={uncheckAllMutation.isPending}
              onClick={() => {
                if (confirm(t.packListDetail.uncheckAllConfirm(checkedCount))) {
                  uncheckAllMutation.mutate({ listId });
                }
              }}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.packListDetail.uncheckAllButton}
            </Button>
          )}
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

      {items.length === 0 && (
        <p className="py-4 text-center text-muted-foreground">
          {t.packListDetail.emptyList}
        </p>
      )}

      {/* Bereiche: «Allgemein» zuoberst, danach ein Bereich pro Person */}
      {sections.map(section => {
        const sectionLabel = section.person ?? t.packListDetail.sectionGeneral;
        const sectionChecked = section.items.filter(i => i.checked).length;
        return (
          <section key={section.key} className="mb-8">
            <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border pb-1.5">
              <h2 className="flex items-center gap-1.5 font-serif text-lg font-semibold">
                {section.person ? (
                  <UserRound
                    className="h-4.5 w-4.5 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <Users
                    className="h-4.5 w-4.5 text-primary"
                    aria-hidden="true"
                  />
                )}
                {sectionLabel}
              </h2>
              {section.items.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {t.packListDetail.sectionProgress(
                    sectionChecked,
                    section.items.length
                  )}
                </span>
              )}
              {section.person && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-7 w-7 text-muted-foreground/60 hover:text-foreground"
                  asChild
                >
                  <Link
                    href={`/packlisten/${listId}/drucken?person=${encodeURIComponent(
                      section.person
                    )}`}
                    aria-label={t.packListDetail.printPersonAria(
                      section.person
                    )}
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </div>

            {section.items.length === 0 && (
              <p className="mb-2 text-sm text-muted-foreground">
                {t.packListDetail.sectionEmpty}
              </p>
            )}

            {section.groups.map(([category, categoryItems]) => (
              <div key={category} className="mb-4">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
                </h3>
                <ul
                  className={cn(
                    "space-y-1.5",
                    drag.dragId !== null && "select-none"
                  )}
                >
                  {categoryItems.map(item => (
                    <li
                      key={item.id}
                      {...drag.dragProps(
                        JSON.stringify([section.key, category]),
                        String(item.id)
                      )}
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
                        aria-label={t.packListDetail.reorderAria(item.name)}
                        className="-ml-1.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 hover:text-foreground active:cursor-grabbing"
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
                        title={
                          editorLabel(item)
                            ? t.packListDetail.editedByTitle(
                                editorLabel(item)!,
                                formatEditedAt(item.updatedAt)
                              )
                            : undefined
                        }
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
                        {editorLabel(item) && (
                          <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 align-middle text-[10px] font-semibold text-secondary-foreground">
                            <span aria-hidden="true">
                              {initialsOf(editorLabel(item)!)}
                            </span>
                            <span className="sr-only">
                              {t.packListDetail.editedByBadgeAria(
                                editorLabel(item)!
                              )}
                            </span>
                          </span>
                        )}
                      </label>
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
                            setEditCatItemId(null);
                          }
                        }}
                        aria-label={t.packListDetail.assignButtonAria(
                          item.name
                        )}
                        aria-expanded={assignItemId === item.id}
                      >
                        <UserRoundPlus
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
                        onClick={() => {
                          if (editCatItemId === item.id) {
                            setEditCatItemId(null);
                          } else {
                            setEditCatItemId(item.id);
                            const known = categories.includes(item.category);
                            setEditCatChoice(
                              known ? item.category : CATEGORY_NEW
                            );
                            setEditCatName(known ? "" : item.category);
                            setAssignItemId(null);
                          }
                        }}
                        aria-label={t.packListDetail.editCategoryAria(
                          item.name
                        )}
                        aria-expanded={editCatItemId === item.id}
                      >
                        <Tag className="h-3.5 w-3.5" aria-hidden="true" />
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
                            aria-label={t.packListDetail.assignInputAria(
                              item.name
                            )}
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
                          {suggestionNames
                            .filter(name => name !== item.assignee?.trim())
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
                      {editCatItemId === item.id && (
                        <form
                          className="flex w-full flex-wrap items-center gap-2 border-t border-border pt-2"
                          onSubmit={e => {
                            e.preventDefault();
                            const category =
                              editCatChoice === CATEGORY_NEW
                                ? editCatName.trim().slice(0, 80)
                                : editCatChoice;
                            if (!category) return;
                            updateItemMutation.mutate({
                              id: item.id,
                              category,
                            });
                            setEditCatItemId(null);
                            setEditCatName("");
                          }}
                        >
                          <CategorySelect
                            categories={categories}
                            choice={editCatChoice}
                            onChoiceChange={setEditCatChoice}
                            newName={editCatName}
                            onNewNameChange={setEditCatName}
                            selectAria={t.packListDetail.editCategorySelectAria(
                              item.name
                            )}
                            className="h-8 text-sm"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="h-8"
                            disabled={
                              editCatChoice === CATEGORY_NEW &&
                              !editCatName.trim()
                            }
                          >
                            {t.packListDetail.categorySave}
                          </Button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Eigener «Artikel hinzufügen» pro Bereich */}
            <SectionAddForm
              listId={listId}
              assignee={section.person}
              categories={categories}
              sectionLabel={sectionLabel}
            />
          </section>
        );
      })}

      {/* Dialog «Personen verwalten» */}
      <Dialog open={personsDialogOpen} onOpenChange={setPersonsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.packListDetail.managePersonsTitle}</DialogTitle>
            <DialogDescription>
              {t.packListDetail.managePersonsDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {persons.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                {t.packListDetail.personsEmpty}
              </p>
            )}
            {persons.map(person => (
              <div
                key={person}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <UserRound
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {person}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  disabled={setPersonsMutation.isPending}
                  onClick={() => {
                    if (confirm(t.packListDetail.removePersonConfirm(person))) {
                      setPersonsMutation.mutate({
                        listId,
                        persons: persons.filter(p => p !== person),
                      });
                    }
                  }}
                  aria-label={t.packListDetail.removePersonAria(person)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={e => {
              e.preventDefault();
              const name = personDraft.trim().slice(0, 80);
              if (!name || persons.length >= MAX_PERSONS) return;
              setPersonsMutation.mutate({
                listId,
                persons: [...persons, name],
              });
            }}
          >
            <Input
              value={personDraft}
              onChange={e => setPersonDraft(e.target.value)}
              placeholder={t.packListDetail.assignPlaceholder}
              aria-label={t.packListDetail.personNameAria}
              maxLength={80}
              disabled={persons.length >= MAX_PERSONS}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={
                !personDraft.trim() ||
                setPersonsMutation.isPending ||
                persons.length >= MAX_PERSONS
              }
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.packListDetail.addPersonButton}
            </Button>
          </form>
          {persons.length >= MAX_PERSONS && (
            <p className="text-xs text-muted-foreground">
              {t.packListDetail.personsMaxHint}
            </p>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Dialog «Gewichts-Budget» */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.packListDetail.budgetDialogTitle}</DialogTitle>
            <DialogDescription>
              {t.packListDetail.budgetDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              const grams = parseKgToGrams(budgetDraft);
              if (grams === null) {
                toast.error(t.packListDetail.budgetInvalid);
                return;
              }
              budgetMutation.mutate({ listId, grams });
            }}
          >
            <Label htmlFor="weight-budget">
              {t.packListDetail.budgetLabel}
            </Label>
            <Input
              id="weight-budget"
              className="mt-1.5"
              inputMode="decimal"
              placeholder={t.packListDetail.budgetPlaceholder}
              value={budgetDraft}
              onChange={e => setBudgetDraft(e.target.value)}
              autoFocus
            />
            <Button
              type="submit"
              className="mt-4 w-full"
              disabled={budgetMutation.isPending || !budgetDraft.trim()}
            >
              {budgetMutation.isPending && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t.packListDetail.budgetSave}
            </Button>
            {budgetGrams !== null && (
              <Button
                type="button"
                variant="ghost"
                className="mt-2 w-full text-muted-foreground hover:text-destructive"
                disabled={budgetMutation.isPending}
                onClick={() => budgetMutation.mutate({ listId, grams: null })}
              >
                {t.packListDetail.budgetRemove}
              </Button>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
