import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Check,
  HandHelping,
  ImagePlus,
  Loader2,
  Package,
  PackageOpen,
  Pencil,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Trash2,
  Undo2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import DataAge from "@/components/DataAge";
import ListSkeleton from "@/components/ListSkeleton";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { l4, LOCALE_TAGS, pick, type L4 } from "@shared/i18n";
import { GEAR_TASK_SUGGESTIONS, gearTaskDue } from "@shared/gearTasks";
import {
  countWarrantiesEndingSoon,
  MAX_WARRANTY_MONTHS,
  MIN_WARRANTY_MONTHS,
  warrantyStatus,
} from "@shared/warranty";
import { countLent, isLent, MAX_LENT_TO_LENGTH } from "@shared/lending";
import { resizeImageForUpload } from "@/lib/imageResize";
import {
  formatChf,
  hasAnyPrice,
  inventoryTotalRappen,
  parseChfInput,
  rappenToInput,
} from "@/lib/money";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

/** Private Foto-URL eines Inventar-Gegenstands (Auth über Session-Cookie). */
function inventoryPhotoUrl(fileName: string): string {
  return `/api/inventory/photos/${fileName}`;
}

/**
 * Eingabe «Garantie (Monate)» in einen speicherbaren Wert übersetzen:
 * leer oder unbrauchbar → null, sonst auf 1–240 Monate geklemmt.
 */
function parseWarrantyInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const months = Math.round(Number(trimmed));
  if (!Number.isFinite(months) || months < MIN_WARRANTY_MONTHS) return null;
  return Math.min(MAX_WARRANTY_MONTHS, months);
}

/** Private Beleg-URL eines Inventar-Gegenstands (Auth über Session-Cookie). */
function inventoryReceiptUrl(fileName: string): string {
  return `/api/inventory/receipts/${fileName}`;
}

/**
 * Kategorien fürs Inventar – gespeichert wird die Fassung in der aktuellen
 * Sprache (DB-Inhalte bleiben einsprachig, wie bei den Packlisten-Vorlagen).
 */
export const inventoryCategories: L4[] = [
  l4("Schlafen", "Sommeil", "Dormire", "Sleeping"),
  l4("Küche", "Cuisine", "Cucina", "Kitchen"),
  l4("Kleidung", "Vêtements", "Abbigliamento", "Clothing"),
  l4("Werkzeug", "Outils", "Attrezzi", "Tools"),
  l4("Licht & Energie", "Lumière & énergie", "Luce & energia", "Light & power"),
  l4("Sicherheit", "Sécurité", "Sicurezza", "Safety"),
  l4("Hygiene", "Hygiène", "Igiene", "Hygiene"),
  l4("Kinder", "Enfants", "Bambini", "Kids"),
  l4("Komfort", "Confort", "Comfort", "Comfort"),
  l4("Allgemein", "Général", "Generale", "General"),
];

/**
 * Abschnitt «Pflege & Wartung»: wiederkehrende Aufgaben (z. B. Zelt
 * imprägnieren) mit Fälligkeits-Badge (fällig rot, bald = innerhalb 30 Tagen
 * amber, sonst Termin), «Erledigt»-Knopf (lastDoneAt = heute vom Gerät) und
 * Hinzufügen aus Katalog-Vorschlägen (shared/gearTasks.ts) oder frei.
 */
function GearCareSection() {
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const query = trpc.gear.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [months, setMonths] = useState("12");
  const today = new Date().toISOString().slice(0, 10);

  const addMutation = trpc.gear.add.useMutation({
    onSuccess: () => {
      toast.success(t.inventory.gearCreated);
      setDialogOpen(false);
      void utils.gear.list.invalidate();
    },
    onError: () => toast.error(t.common.saveFailed),
  });
  const markDoneMutation = trpc.gear.markDone.useMutation({
    onSuccess: () => {
      toast.success(t.inventory.gearMarkedDone);
      void utils.gear.list.invalidate();
    },
    onError: () => toast.error(t.common.actionFailed),
  });
  const removeMutation = trpc.gear.remove.useMutation({
    onSuccess: () => {
      toast.success(t.inventory.gearRemoved);
      void utils.gear.list.invalidate();
    },
    onError: () => toast.error(t.common.deleteFailed),
  });

  const formatDay = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error(t.inventory.gearTitleRequired);
      return;
    }
    const intervalMonths = Math.max(
      1,
      Math.min(120, Math.round(Number(months) || 12))
    );
    addMutation.mutate({ title: trimmed, intervalMonths });
  };

  const tasks = query.data ?? [];

  return (
    <section className="mt-10" aria-labelledby="gear-care-title">
      <h2
        id="gear-care-title"
        className="flex items-center gap-2 text-lg font-semibold"
      >
        <Wrench className="h-5 w-5 text-primary" aria-hidden="true" />
        {t.inventory.gearTitle}
      </h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        {t.inventory.gearIntro}
      </p>
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => {
          setTitle("");
          setMonths("12");
          setDialogOpen(true);
        }}
        aria-label={t.inventory.gearAddAria}
      >
        <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {t.inventory.gearAddButton}
      </Button>

      {tasks.length > 0 ? (
        <ul className="space-y-2">
          {tasks.map(task => {
            const info = gearTaskDue(task, today);
            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="truncate">{task.title}</span>
                    {info.due ? (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                        {t.inventory.gearDueBadge}
                      </span>
                    ) : info.soon ? (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {t.inventory.gearSoonBadge}
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {t.inventory.gearDueOn(formatDay(info.dueDate))}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.inventory.gearIntervalText(task.intervalMonths)} ·{" "}
                    {task.lastDoneAt
                      ? t.inventory.gearLastDone(formatDay(task.lastDoneAt))
                      : t.inventory.gearNeverDone}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={markDoneMutation.isPending}
                    onClick={() =>
                      markDoneMutation.mutate({ id: task.id, today })
                    }
                    aria-label={t.inventory.gearDoneAria(task.title)}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    {t.inventory.gearDoneButton}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={removeMutation.isPending}
                    onClick={() => {
                      if (confirm(t.inventory.gearRemoveConfirm(task.title))) {
                        removeMutation.mutate({ id: task.id });
                      }
                    }}
                    aria-label={t.inventory.gearRemoveAria(task.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t.inventory.gearEmpty}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.inventory.gearDialogTitle}</DialogTitle>
            <DialogDescription>
              {t.inventory.gearDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">
                {t.inventory.gearSuggestionsLabel}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {GEAR_TASK_SUGGESTIONS.map(suggestion => {
                  const label = pick(suggestion.title, lang);
                  return (
                    <button
                      key={label}
                      type="button"
                      className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-accent"
                      onClick={() => {
                        setTitle(label);
                        setMonths(String(suggestion.intervalMonths));
                      }}
                      aria-label={t.inventory.gearSuggestionAria(label)}
                    >
                      {label} ·{" "}
                      {t.inventory.gearIntervalText(suggestion.intervalMonths)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="gear-title">{t.inventory.gearTitleLabel}</Label>
              <Input
                id="gear-title"
                className="mt-1.5"
                placeholder={t.inventory.gearTitlePlaceholder}
                value={title}
                maxLength={120}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="gear-interval">
                {t.inventory.gearIntervalLabel}
              </Label>
              <Input
                id="gear-interval"
                className="mt-1.5"
                type="number"
                min="1"
                max="120"
                value={months}
                onChange={e => setMonths(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={addMutation.isPending}
              onClick={submit}
            >
              {t.inventory.gearSubmit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

interface FormState {
  id?: number;
  name: string;
  category: string;
  weightGrams: string;
  volumeLiters: string;
  quantity: string;
  /** Kaufpreis als Franken-Eingabe (intern gespeichert werden Rappen) */
  priceChf: string;
  /** Kaufdatum als ISO-String (YYYY-MM-DD) oder "" */
  purchaseDate: string;
  /** Garantiedauer in Monaten als Eingabe-String ("" = nicht erfasst) */
  warrantyMonths: string;
  /** Bestehendes Foto des bearbeiteten Gegenstands (Dateiname) */
  imageFileName: string | null;
  /** Bestehender Beleg des bearbeiteten Gegenstands (Dateiname) */
  receiptFileName: string | null;
}

export default function InventoryPage() {
  const { isAuthenticated, loading } = useAuth();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const query = trpc.inventory.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  // Suche (Name/Notizen, live) und Kategorien-Filter («» = alle)
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  // Filter aus dem Garantie-Hinweis: nur bald ablaufende Garantien zeigen
  const [warrantyFilter, setWarrantyFilter] = useState(false);
  // Filter-Chip «Verliehen (N)»: nur aktuell verliehene Gegenstände zeigen
  const [lentFilter, setLentFilter] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  // Ausleih-Dialog: Gegenstand, an wen und seit wann
  const [lentDialog, setLentDialog] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [lentTo, setLentTo] = useState("");
  const [lentAt, setLentAt] = useState(today);

  const categoryOptions = useMemo(
    () => inventoryCategories.map(c => pick(c, lang)),
    [lang]
  );
  const emptyForm: FormState = {
    name: "",
    category: pick(inventoryCategories[inventoryCategories.length - 1], lang),
    weightGrams: "",
    volumeLiters: "",
    quantity: "1",
    priceChf: "",
    purchaseDate: "",
    warrantyMonths: "",
    imageFileName: null,
    receiptFileName: null,
  };
  const [form, setForm] = useState<FormState>(emptyForm);
  // Foto: neu ausgewählt (bereits verkleinert), Vorschau-URL und
  // «bestehendes Foto entfernen»-Wunsch – ausgeführt wird alles beim Speichern.
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  // Beleg (Foto der Quittung) – gleiche Mechanik wie beim Gegenstands-Foto
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(
    null
  );
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  // Vollbild-Ansicht eines Eintrags-Fotos (Klick aufs Thumbnail)
  const [viewPhoto, setViewPhoto] = useState<{
    fileName: string;
    name: string;
  } | null>(null);
  // Vollbild-Ansicht eines Belegs (Klick aufs Beleg-Symbol)
  const [viewReceipt, setViewReceipt] = useState<{
    fileName: string;
    name: string;
  } | null>(null);

  // Objekt-URL der Vorschau beim Ersetzen/Schliessen wieder freigeben
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    return () => {
      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    };
  }, [receiptPreviewUrl]);

  const addMutation = trpc.inventory.add.useMutation();
  const updateMutation = trpc.inventory.update.useMutation();
  const removePhotoMutation = trpc.inventory.removePhoto.useMutation();
  const removeReceiptMutation = trpc.inventory.removeReceipt.useMutation();
  const removeMutation = trpc.inventory.remove.useMutation({
    onSuccess: () => utils.inventory.list.invalidate(),
  });
  /**
   * Versorgen (#276): In welche Kiste gehört der Gegenstand? Die Zuordnung
   * gibt es auch auf der Kisten-Seite; hier steht sie beim Gegenstand
   * selbst, weil man beim Einräumen vom Ding ausgeht und nicht von der Box.
   */
  const boxesQuery = trpc.boxes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const boxes = boxesQuery.data ?? [];
  const [boxDialogItem, setBoxDialogItem] = useState<{
    id: number;
    name: string;
    boxId: number | null;
  } | null>(null);
  const assignBoxMutation = trpc.boxes.assign.useMutation({
    onSuccess: () => {
      void utils.inventory.list.invalidate();
      setBoxDialogItem(null);
      toast.success(t.inventory.boxAssigned);
    },
    onError: e => toast.error(e.message),
  });

  const setLentMutation = trpc.inventory.setLent.useMutation({
    onSuccess: () => utils.inventory.list.invalidate(),
    onError: () => toast.error(t.common.saveFailed),
  });

  const totals = useMemo(() => {
    const items = query.data ?? [];
    return {
      count: items.reduce((s, i) => s + i.quantity, 0),
      weightKg: items.reduce(
        (s, i) => s + (i.weightGrams * i.quantity) / 1000,
        0
      ),
      volume: items.reduce((s, i) => s + i.volumeLiters * i.quantity, 0),
    };
  }, [query.data]);

  /** Gesamtwert (Preis × Anzahl) – nur relevant, wenn Preise erfasst sind. */
  const valueTotal = useMemo(() => {
    const items = query.data ?? [];
    return {
      rappen: inventoryTotalRappen(items),
      show: hasAnyPrice(items),
    };
  }, [query.data]);

  /** Kategorien, die im Inventar tatsächlich vorkommen (alphabetisch). */
  const presentCategories = useMemo(() => {
    const seen: string[] = [];
    (query.data ?? []).forEach(item => {
      if (item.category && !seen.includes(item.category))
        seen.push(item.category);
    });
    return seen.sort((a, b) => a.localeCompare(b, LOCALE_TAGS[lang]));
  }, [query.data, lang]);

  /** Wie viele Garantien laufen in den nächsten 60 Tagen ab? */
  const warrantiesEndingSoon = useMemo(
    () => countWarrantiesEndingSoon(query.data ?? [], today),
    [query.data, today]
  );

  /** Wie viele Gegenstände sind aktuell verliehen? */
  const lentCount = useMemo(() => countLent(query.data ?? []), [query.data]);

  /** Suche über Name + Notizen (case-insensitiv), kombiniert mit der Kategorie. */
  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (query.data ?? []).filter(item => {
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (lentFilter && !isLent(item)) return false;
      if (
        warrantyFilter &&
        warrantyStatus(item.purchaseDate, item.warrantyMonths, today)?.state !==
          "endingSoon"
      )
        return false;
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        (item.notes ?? "").toLowerCase().includes(needle)
      );
    });
  }, [query.data, search, categoryFilter, warrantyFilter, lentFilter, today]);

  const resetPhotoState = () => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setRemovePhoto(false);
    setReceiptBlob(null);
    setReceiptPreviewUrl(null);
    setRemoveReceipt(false);
  };

  const openNew = () => {
    setForm(emptyForm);
    resetPhotoState();
    setDialogOpen(true);
  };

  const openEdit = (item: NonNullable<typeof query.data>[number]) => {
    setForm({
      id: item.id,
      name: item.name,
      category: item.category,
      weightGrams: String(item.weightGrams || ""),
      volumeLiters: String(item.volumeLiters || ""),
      quantity: String(item.quantity),
      priceChf: rappenToInput(item.priceRappen),
      purchaseDate: item.purchaseDate ?? "",
      warrantyMonths: item.warrantyMonths ? String(item.warrantyMonths) : "",
      imageFileName: item.imageFileName ?? null,
      receiptFileName: item.receiptFileName ?? null,
    });
    resetPhotoState();
    setDialogOpen(true);
  };

  // Aktuelle Vorschau: neues Foto > bestehendes Foto (sofern nicht entfernt)
  const previewUrl =
    photoPreviewUrl ??
    (form.imageFileName && !removePhoto
      ? inventoryPhotoUrl(form.imageFileName)
      : null);

  const handlePhotoSelected = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (!file) return;
    try {
      const blob = await resizeImageForUpload(file);
      setPhotoBlob(blob);
      setPhotoPreviewUrl(URL.createObjectURL(blob));
      setRemovePhoto(false);
    } catch {
      // Dekodieren fehlgeschlagen – bei HEIC/HEIF gezielt darauf hinweisen
      const isHeic =
        /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
      toast.error(isHeic ? t.inventory.photoHeic : t.inventory.photoReadFailed);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    if (form.imageFileName) setRemovePhoto(true);
  };

  // Aktueller Beleg: neu gewählter > bestehender (sofern nicht entfernt)
  const receiptPreview =
    receiptPreviewUrl ??
    (form.receiptFileName && !removeReceipt
      ? inventoryReceiptUrl(form.receiptFileName)
      : null);

  const handleReceiptSelected = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (receiptInputRef.current) receiptInputRef.current.value = "";
    if (!file) return;
    try {
      const blob = await resizeImageForUpload(file);
      setReceiptBlob(blob);
      setReceiptPreviewUrl(URL.createObjectURL(blob));
      setRemoveReceipt(false);
    } catch {
      const isHeic =
        /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
      toast.error(isHeic ? t.inventory.photoHeic : t.inventory.photoReadFailed);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptBlob(null);
    setReceiptPreviewUrl(null);
    if (form.receiptFileName) setRemoveReceipt(true);
  };

  const submit = async () => {
    const data = {
      name: form.name.trim(),
      category: form.category,
      weightGrams: Math.round(Number(form.weightGrams) || 0),
      volumeLiters: Number(form.volumeLiters) || 0,
      quantity: Math.max(1, Math.round(Number(form.quantity) || 1)),
      // Preis in Rappen (null = nicht erfasst), Kaufdatum als ISO-String
      priceRappen: parseChfInput(form.priceChf),
      purchaseDate: form.purchaseDate || null,
      // Garantiedauer in Monaten (null = nicht erfasst)
      warrantyMonths: parseWarrantyInput(form.warrantyMonths),
    };
    if (!data.name) {
      toast.error(t.inventory.nameRequired);
      return;
    }
    try {
      let id: number;
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, ...data });
        id = form.id;
      } else {
        id = await addMutation.mutateAsync(data);
      }
      // Foto-Schritt nach dem Speichern: Upload ersetzt ein bestehendes
      // Foto serverseitig, Entfernen läuft über tRPC.
      if (photoBlob) {
        setPhotoUploading(true);
        try {
          const response = await fetch(`/api/inventory/${id}/photo`, {
            method: "POST",
            headers: { "Content-Type": "image/jpeg" },
            body: photoBlob,
            credentials: "include",
          });
          if (!response.ok) {
            toast.error(
              response.status === 413
                ? t.inventory.photoTooLarge
                : t.inventory.photoUploadFailed
            );
          }
        } catch {
          toast.error(t.inventory.photoUploadFailed);
        } finally {
          setPhotoUploading(false);
        }
      } else if (removePhoto && form.imageFileName) {
        try {
          await removePhotoMutation.mutateAsync({ id });
        } catch {
          toast.error(t.inventory.photoRemoveFailed);
        }
      }
      // Beleg-Schritt: exakt dieselbe Mechanik wie beim Foto
      if (receiptBlob) {
        setReceiptUploading(true);
        try {
          const response = await fetch(`/api/inventory/${id}/receipt`, {
            method: "POST",
            headers: { "Content-Type": "image/jpeg" },
            body: receiptBlob,
            credentials: "include",
          });
          if (!response.ok) {
            toast.error(
              response.status === 413
                ? t.inventory.photoTooLarge
                : t.inventory.receiptUploadFailed
            );
          }
        } catch {
          toast.error(t.inventory.receiptUploadFailed);
        } finally {
          setReceiptUploading(false);
        }
      } else if (removeReceipt && form.receiptFileName) {
        try {
          await removeReceiptMutation.mutateAsync({ id });
        } catch {
          toast.error(t.inventory.receiptRemoveFailed);
        }
      }
      utils.inventory.list.invalidate();
      setDialogOpen(false);
      toast.success(form.id ? t.inventory.updated : t.inventory.created);
    } catch {
      toast.error(t.common.saveFailed);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl py-6">
        <ListSkeleton rows={4} height={72} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader
          title={t.inventory.title}
          subtitle={t.inventory.subtitleLoggedOut}
        />
        <LoginPrompt feature={t.inventory.loginFeature} />
      </div>
    );
  }

  const allItems = query.data ?? [];
  const items = filteredItems;
  const filterActive =
    search.trim() !== "" ||
    categoryFilter !== "" ||
    warrantyFilter ||
    lentFilter;
  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setWarrantyFilter(false);
    setLentFilter(false);
  };
  /** Datum kurz und in der App-Sprache (z. B. 03.08.2026). */
  const formatDay = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  /** Datum ohne Jahr (z. B. 03.08.) – fürs «verliehen seit»-Badge. */
  const formatDayShort = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      day: "2-digit",
      month: "2-digit",
    });

  /** Ausleih-Dialog mit Vorgaben öffnen (Datum = heute). */
  const openLentDialog = (item: { id: number; name: string }) => {
    setLentTo("");
    setLentAt(today);
    setLentDialog({ id: item.id, name: item.name });
  };

  const submitLent = () => {
    if (!lentDialog) return;
    const name = lentTo.trim();
    if (!name) {
      toast.error(t.inventory.lentToRequired);
      return;
    }
    setLentMutation.mutate(
      {
        id: lentDialog.id,
        data: { lentTo: name.slice(0, MAX_LENT_TO_LENGTH), lentAt },
      },
      {
        onSuccess: () => {
          toast.success(t.inventory.lentSaved);
          setLentDialog(null);
        },
      }
    );
  };

  /** Verliehenen Gegenstand zurückbuchen (Name und Datum werden geleert). */
  const returnLent = (id: number) => {
    setLentMutation.mutate(
      { id, data: null },
      { onSuccess: () => toast.success(t.inventory.lentReturned) }
    );
  };
  // Beim Bearbeiten kann eine (z. B. in anderer Sprache) gespeicherte
  // Kategorie auftauchen, die nicht in der Liste steht – als Option ergänzen.
  const selectOptions = categoryOptions.includes(form.category)
    ? categoryOptions
    : form.category
      ? [form.category, ...categoryOptions]
      : categoryOptions;

  return (
    <div className="container py-6">
      <PageHeader title={t.inventory.title} subtitle={t.inventory.subtitle} />
      <DataAge updatedAt={query.dataUpdatedAt} />

      {/* Übersicht */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{totals.count}</p>
          <p className="text-xs text-muted-foreground">
            {t.inventory.itemsCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{totals.weightKg.toFixed(1)} kg</p>
          <p className="text-xs text-muted-foreground">
            {t.inventory.totalWeight}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{totals.volume.toFixed(0)} l</p>
          <p className="text-xs text-muted-foreground">
            {t.inventory.totalVolume}
          </p>
        </div>
      </div>

      {/* Gesamtwert – nur, wenn mindestens ein Preis erfasst ist */}
      {valueTotal.show && (
        <div className="mb-6 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-xl border border-border bg-card px-4 py-3">
          <p className="font-semibold">
            {t.inventory.totalValue(formatChf(valueTotal.rappen, lang))}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.inventory.totalValueHint}
          </p>
        </div>
      )}

      {/* Dezenter Hinweis auf bald ablaufende Garantien – Klick filtert danach */}
      {warrantiesEndingSoon > 0 && (
        <button
          type="button"
          onClick={() => setWarrantyFilter(v => !v)}
          aria-pressed={warrantyFilter}
          className="mb-6 flex w-full items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left transition-colors hover:bg-amber-500/15"
        >
          <ShieldCheck
            className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              {t.inventory.warrantySoonTitle(warrantiesEndingSoon)}
            </span>
            <span className="block text-xs text-muted-foreground">
              {t.inventory.warrantySoonText}
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400">
            {warrantyFilter
              ? t.inventory.warrantySoonShowAll
              : t.inventory.warrantySoonShow}
          </span>
        </button>
      )}

      <Button
        className="mb-6"
        onClick={openNew}
        aria-label={t.inventory.addAria}
      >
        <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {t.inventory.addButton}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id
                ? t.inventory.dialogTitleEdit
                : t.inventory.dialogTitleNew}
            </DialogTitle>
            <DialogDescription>
              {t.inventory.dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inv-name">{t.inventory.nameLabel}</Label>
              <Input
                id="inv-name"
                className="mt-1.5"
                placeholder={t.inventory.namePlaceholder}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="inv-category">{t.inventory.categoryLabel}</Label>
              <Select
                value={form.category}
                onValueChange={v => setForm(f => ({ ...f, category: v }))}
              >
                <SelectTrigger
                  id="inv-category"
                  className="mt-1.5"
                  aria-label={t.inventory.categoryAria}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="inv-weight">{t.inventory.weightLabel}</Label>
                <Input
                  id="inv-weight"
                  className="mt-1.5"
                  type="number"
                  min="0"
                  placeholder="1200"
                  value={form.weightGrams}
                  onChange={e =>
                    setForm(f => ({ ...f, weightGrams: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="inv-volume">{t.inventory.volumeLabel}</Label>
                <Input
                  id="inv-volume"
                  className="mt-1.5"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="8"
                  value={form.volumeLiters}
                  onChange={e =>
                    setForm(f => ({ ...f, volumeLiters: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="inv-quantity">
                  {t.inventory.quantityLabel}
                </Label>
                <Input
                  id="inv-quantity"
                  className="mt-1.5"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={e =>
                    setForm(f => ({ ...f, quantity: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="inv-price">{t.inventory.priceLabel}</Label>
                <Input
                  id="inv-price"
                  className="mt-1.5"
                  type="number"
                  min="0"
                  step="0.05"
                  inputMode="decimal"
                  placeholder="129.90"
                  aria-label={t.inventory.priceAria}
                  value={form.priceChf}
                  onChange={e =>
                    setForm(f => ({ ...f, priceChf: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="inv-purchase-date">
                  {t.inventory.purchaseDateLabel}
                </Label>
                <Input
                  id="inv-purchase-date"
                  className="mt-1.5"
                  type="date"
                  value={form.purchaseDate}
                  onChange={e =>
                    setForm(f => ({ ...f, purchaseDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="inv-warranty">
                  {t.inventory.warrantyLabel}
                </Label>
                <Input
                  id="inv-warranty"
                  className="mt-1.5"
                  type="number"
                  min={MIN_WARRANTY_MONTHS}
                  max={MAX_WARRANTY_MONTHS}
                  inputMode="numeric"
                  placeholder="24"
                  aria-label={t.inventory.warrantyAria}
                  value={form.warrantyMonths}
                  onChange={e =>
                    setForm(f => ({ ...f, warrantyMonths: e.target.value }))
                  }
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t.inventory.warrantyHelp}
                </p>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">{t.inventory.photoLabel}</Label>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={t.inventory.photoPreviewAlt}
                  className="mb-2 aspect-[4/3] w-full rounded-lg border border-border/60 object-cover"
                />
              )}
              <div className="flex gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handlePhotoSelected(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <ImagePlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {previewUrl
                    ? t.inventory.photoChange
                    : t.inventory.photoChoose}
                </Button>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRemovePhoto}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t.inventory.photoRemove}
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t.inventory.photoHint}
              </p>
            </div>
            <div>
              <Label className="mb-1.5 block">{t.inventory.receiptLabel}</Label>
              {receiptPreview && (
                <button
                  type="button"
                  className="mb-2 block w-full overflow-hidden rounded-lg border border-border/60"
                  onClick={() =>
                    setViewReceipt({
                      fileName: form.receiptFileName ?? "",
                      name: form.name,
                    })
                  }
                  disabled={!form.receiptFileName || removeReceipt}
                  aria-label={t.inventory.receiptIconAria(form.name)}
                >
                  <img
                    src={receiptPreview}
                    alt={t.inventory.receiptPreviewAlt}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </button>
              )}
              <div className="flex gap-2">
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleReceiptSelected(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => receiptInputRef.current?.click()}
                >
                  <Receipt className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {receiptPreview
                    ? t.inventory.receiptChange
                    : t.inventory.receiptChoose}
                </Button>
                {receiptPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRemoveReceipt}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t.inventory.receiptRemove}
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t.inventory.receiptHint}
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => void submit()}
              disabled={
                addMutation.isPending ||
                updateMutation.isPending ||
                photoUploading ||
                receiptUploading
              }
            >
              {(addMutation.isPending ||
                updateMutation.isPending ||
                photoUploading ||
                receiptUploading) && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {photoUploading
                ? t.inventory.photoUploading
                : receiptUploading
                  ? t.inventory.receiptUploading
                  : form.id
                    ? t.common.save
                    : t.inventory.submitNew}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suche + Kategorien-Filter (nur sinnvoll, wenn es Gegenstände gibt) */}
      {allItems.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              placeholder={t.inventory.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label={t.inventory.searchAria}
            />
          </div>
          {presentCategories.length > 1 && (
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={t.inventory.categoryFilterAria}
            >
              <button
                type="button"
                onClick={() => setCategoryFilter("")}
                aria-pressed={categoryFilter === ""}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  categoryFilter === ""
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {t.inventory.filterAll}
              </button>
              {presentCategories.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  aria-pressed={categoryFilter === category}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    categoryFilter === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
          {/* Filter-Chip «Verliehen (N)» – nur, wenn etwas verliehen ist */}
          {lentCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setLentFilter(v => !v)}
                aria-pressed={lentFilter}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  lentFilter
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <HandHelping className="h-3.5 w-3.5" aria-hidden="true" />
                {t.inventory.lentFilterChip(lentCount)}
              </button>
            </div>
          )}
          {filterActive && (
            <p className="text-xs text-muted-foreground">
              {t.inventory.filterCount(items.length, allItems.length)}
            </p>
          )}
        </div>
      )}

      {query.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      ) : allItems.length > 0 && items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Search
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="font-medium">{t.inventory.filterEmptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.inventory.filterEmptyText}
          </p>
          <Button variant="outline" className="mt-4" onClick={resetFilters}>
            {t.inventory.filterReset}
          </Button>
        </div>
      ) : items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-4 py-2.5 font-semibold">
                  {t.inventory.tableName}
                </th>
                <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                  {t.inventory.tableCategory}
                </th>
                <th className="px-4 py-2.5 text-right font-semibold">
                  {t.inventory.tableWeight}
                </th>
                <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">
                  {t.inventory.tableVolume}
                </th>
                <th
                  className="px-2 py-2.5"
                  aria-label={t.inventory.actionsAria}
                ></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const warranty = warrantyStatus(
                  item.purchaseDate,
                  item.warrantyMonths,
                  today
                );
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {item.imageFileName && (
                          <button
                            type="button"
                            onClick={() =>
                              setViewPhoto({
                                fileName: item.imageFileName!,
                                name: item.name,
                              })
                            }
                            aria-label={t.inventory.photoThumbAria(item.name)}
                            className="shrink-0 overflow-hidden rounded-md border border-border/60"
                          >
                            <img
                              src={inventoryPhotoUrl(item.imageFileName)}
                              alt=""
                              loading="lazy"
                              className="h-9 w-9 object-cover"
                            />
                          </button>
                        )}
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              × {item.quantity}
                            </span>
                          )}
                          {item.priceRappen ? (
                            <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {t.inventory.priceBadge(
                                formatChf(item.priceRappen, lang)
                              )}
                            </span>
                          ) : null}
                          {item.receiptFileName && (
                            <button
                              type="button"
                              className="ml-1.5 align-middle text-muted-foreground transition-colors hover:text-foreground"
                              onClick={() =>
                                setViewReceipt({
                                  fileName: item.receiptFileName!,
                                  name: item.name,
                                })
                              }
                              aria-label={t.inventory.receiptIconAria(
                                item.name
                              )}
                            >
                              <Receipt
                                className="inline h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </button>
                          )}
                          {warranty && (
                            <span
                              title={
                                warranty.state === "expired"
                                  ? undefined
                                  : t.inventory.warrantyDaysLeft(
                                      warranty.daysLeft
                                    )
                              }
                              className={cn(
                                "ml-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                                warranty.state === "active"
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : warranty.state === "endingSoon"
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                    : "bg-muted text-muted-foreground"
                              )}
                            >
                              {warranty.state === "expired"
                                ? t.inventory.warrantyExpiredBadge(
                                    formatDay(warranty.endsOn)
                                  )
                                : t.inventory.warrantyBadge(
                                    formatDay(warranty.endsOn)
                                  )}
                            </span>
                          )}
                          {item.lentTo && (
                            <span className="ml-1.5 rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400">
                              {t.inventory.lentBadge(
                                item.lentTo,
                                item.lentAt ? formatDayShort(item.lentAt) : "–"
                              )}
                            </span>
                          )}
                          {item.boxId != null &&
                            boxes.some(box => box.id === item.boxId) && (
                              <span className="ml-1.5 rounded-full bg-accent px-2 py-0.5 font-mono text-xs font-medium text-accent-foreground">
                                {boxes.find(box => box.id === item.boxId)?.code}
                              </span>
                            )}
                          <span className="block text-xs text-muted-foreground sm:hidden">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                      {item.category}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {item.weightGrams >= 1000
                        ? `${(item.weightGrams / 1000).toFixed(1)} kg`
                        : `${item.weightGrams} g`}
                    </td>
                    <td className="hidden px-4 py-2.5 text-right font-mono text-xs sm:table-cell">
                      {item.volumeLiters} l
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex justify-end gap-0.5">
                        {item.lentTo ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-sky-700 dark:text-sky-400"
                            disabled={setLentMutation.isPending}
                            onClick={() => returnLent(item.id)}
                            aria-label={t.inventory.lentReturnAria(item.name)}
                            title={t.inventory.lentReturnButton}
                          >
                            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => openLentDialog(item)}
                            aria-label={t.inventory.lentAria(item.name)}
                            title={t.inventory.lentButton}
                          >
                            <HandHelping
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() =>
                            setBoxDialogItem({
                              id: item.id,
                              name: item.name,
                              boxId: item.boxId,
                            })
                          }
                          aria-label={t.inventory.boxAria(item.name)}
                          title={t.inventory.boxButton}
                        >
                          <PackageOpen
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => openEdit(item)}
                          aria-label={t.inventory.editAria(item.name)}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm(t.inventory.deleteConfirm(item.name))) {
                              removeMutation.mutate({ id: item.id });
                            }
                          }}
                          aria-label={t.inventory.deleteAria(item.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Package
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="font-medium">{t.inventory.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.inventory.emptyText}
          </p>
        </div>
      )}

      <GearCareSection />

      {/* Versorgen-Dialog (#276): in welche Kiste gehört der Gegenstand? */}
      <Dialog
        open={boxDialogItem !== null}
        onOpenChange={open => {
          if (!open) setBoxDialogItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.inventory.boxDialogTitle}</DialogTitle>
            <DialogDescription>
              {t.inventory.boxDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm font-medium">{boxDialogItem?.name}</p>
          {boxes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.inventory.boxNoBoxes}
            </p>
          ) : (
            <div className="space-y-2">
              {boxes.map(box => (
                <Button
                  key={box.id}
                  variant={
                    boxDialogItem?.boxId === box.id ? "default" : "outline"
                  }
                  className="w-full justify-start"
                  disabled={assignBoxMutation.isPending}
                  onClick={() =>
                    boxDialogItem &&
                    assignBoxMutation.mutate({
                      itemId: boxDialogItem.id,
                      boxId: box.id,
                    })
                  }
                >
                  <span className="mr-2 font-mono font-semibold">
                    {box.code}
                  </span>
                  <span className="min-w-0 truncate">{box.name}</span>
                </Button>
              ))}
              {boxDialogItem?.boxId != null && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  disabled={assignBoxMutation.isPending}
                  onClick={() =>
                    boxDialogItem &&
                    assignBoxMutation.mutate({
                      itemId: boxDialogItem.id,
                      boxId: null,
                    })
                  }
                >
                  {t.inventory.boxRemove}
                </Button>
              )}
            </div>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/kisten">{t.inventory.boxManageLink}</Link>
          </Button>
        </DialogContent>
      </Dialog>

      {/* Ausleih-Dialog: an wen und seit wann */}
      <Dialog
        open={lentDialog !== null}
        onOpenChange={open => {
          if (!open) setLentDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.inventory.lentDialogTitle}</DialogTitle>
            <DialogDescription>
              {t.inventory.lentDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-medium">{lentDialog?.name}</p>
            <div>
              <Label htmlFor="inv-lent-to">{t.inventory.lentToLabel}</Label>
              <Input
                id="inv-lent-to"
                className="mt-1.5"
                placeholder={t.inventory.lentToPlaceholder}
                maxLength={MAX_LENT_TO_LENGTH}
                value={lentTo}
                onChange={e => setLentTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="inv-lent-at">{t.inventory.lentAtLabel}</Label>
              <Input
                id="inv-lent-at"
                className="mt-1.5"
                type="date"
                value={lentAt}
                onChange={e => setLentAt(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={setLentMutation.isPending}
              onClick={submitLent}
            >
              {setLentMutation.isPending && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t.inventory.lentSubmit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vollbild-Ansicht eines Fotos (Klick aufs Thumbnail) */}
      <Dialog
        open={viewPhoto !== null}
        onOpenChange={open => {
          if (!open) setViewPhoto(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewPhoto?.name}</DialogTitle>
            <DialogDescription>
              {t.inventory.photoDialogDescription}
            </DialogDescription>
          </DialogHeader>
          {viewPhoto && (
            <img
              src={inventoryPhotoUrl(viewPhoto.fileName)}
              alt={t.inventory.photoDialogAlt(viewPhoto.name)}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Vollbild-Ansicht eines Belegs (Klick aufs Beleg-Symbol) */}
      <Dialog
        open={viewReceipt !== null}
        onOpenChange={open => {
          if (!open) setViewReceipt(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {viewReceipt
                ? t.inventory.receiptDialogTitle(viewReceipt.name)
                : ""}
            </DialogTitle>
            <DialogDescription>
              {t.inventory.receiptDialogDescription}
            </DialogDescription>
          </DialogHeader>
          {viewReceipt && (
            <img
              src={inventoryReceiptUrl(viewReceipt.fileName)}
              alt={t.inventory.receiptDialogAlt(viewReceipt.name)}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
