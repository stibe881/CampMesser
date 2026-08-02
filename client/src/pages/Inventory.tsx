import { useEffect, useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
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
import { l4, pick, type L4 } from "@shared/i18n";
import { resizeImageForUpload } from "@/lib/imageResize";
import { trpc } from "@/lib/trpc";

/** Private Foto-URL eines Inventar-Gegenstands (Auth über Session-Cookie). */
function inventoryPhotoUrl(fileName: string): string {
  return `/api/inventory/photos/${fileName}`;
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

interface FormState {
  id?: number;
  name: string;
  category: string;
  weightGrams: string;
  volumeLiters: string;
  quantity: string;
  /** Bestehendes Foto des bearbeiteten Gegenstands (Dateiname) */
  imageFileName: string | null;
}

export default function InventoryPage() {
  const { isAuthenticated, loading } = useAuth();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const query = trpc.inventory.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

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
    imageFileName: null,
  };
  const [form, setForm] = useState<FormState>(emptyForm);
  // Foto: neu ausgewählt (bereits verkleinert), Vorschau-URL und
  // «bestehendes Foto entfernen»-Wunsch – ausgeführt wird alles beim Speichern.
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  // Vollbild-Ansicht eines Eintrags-Fotos (Klick aufs Thumbnail)
  const [viewPhoto, setViewPhoto] = useState<{
    fileName: string;
    name: string;
  } | null>(null);

  // Objekt-URL der Vorschau beim Ersetzen/Schliessen wieder freigeben
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const addMutation = trpc.inventory.add.useMutation();
  const updateMutation = trpc.inventory.update.useMutation();
  const removePhotoMutation = trpc.inventory.removePhoto.useMutation();
  const removeMutation = trpc.inventory.remove.useMutation({
    onSuccess: () => utils.inventory.list.invalidate(),
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

  const resetPhotoState = () => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setRemovePhoto(false);
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
      imageFileName: item.imageFileName ?? null,
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

  const submit = async () => {
    const data = {
      name: form.name.trim(),
      category: form.category,
      weightGrams: Math.round(Number(form.weightGrams) || 0),
      volumeLiters: Number(form.volumeLiters) || 0,
      quantity: Math.max(1, Math.round(Number(form.quantity) || 1)),
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
      utils.inventory.list.invalidate();
      setDialogOpen(false);
      toast.success(form.id ? t.inventory.updated : t.inventory.created);
    } catch {
      toast.error(t.common.saveFailed);
    }
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
          title={t.inventory.title}
          subtitle={t.inventory.subtitleLoggedOut}
        />
        <LoginPrompt feature={t.inventory.loginFeature} />
      </div>
    );
  }

  const items = query.data ?? [];
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
            <Button
              className="w-full"
              onClick={() => void submit()}
              disabled={
                addMutation.isPending ||
                updateMutation.isPending ||
                photoUploading
              }
            >
              {(addMutation.isPending ||
                updateMutation.isPending ||
                photoUploading) && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {photoUploading
                ? t.inventory.photoUploading
                : form.id
                  ? t.common.save
                  : t.inventory.submitNew}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {query.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
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
              {items.map(item => (
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
              ))}
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
    </div>
  );
}
