import { useMemo, useState } from "react";
import { Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
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
import { trpc } from "@/lib/trpc";

export const inventoryCategories = [
  "Schlafen",
  "Küche",
  "Kleidung",
  "Werkzeug",
  "Licht & Energie",
  "Sicherheit",
  "Hygiene",
  "Kinder",
  "Komfort",
  "Allgemein",
];

interface FormState {
  id?: number;
  name: string;
  category: string;
  weightGrams: string;
  volumeLiters: string;
  quantity: string;
}

const emptyForm: FormState = { name: "", category: "Allgemein", weightGrams: "", volumeLiters: "", quantity: "1" };

export default function InventoryPage() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.inventory.list.useQuery(undefined, { enabled: isAuthenticated });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const addMutation = trpc.inventory.add.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      setDialogOpen(false);
      toast.success("Ausrüstung erfasst");
    },
    onError: () => toast.error("Speichern fehlgeschlagen"),
  });
  const updateMutation = trpc.inventory.update.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      setDialogOpen(false);
      toast.success("Änderungen gespeichert");
    },
    onError: () => toast.error("Speichern fehlgeschlagen"),
  });
  const removeMutation = trpc.inventory.remove.useMutation({
    onSuccess: () => utils.inventory.list.invalidate(),
  });

  const totals = useMemo(() => {
    const items = query.data ?? [];
    return {
      count: items.reduce((s, i) => s + i.quantity, 0),
      weightKg: items.reduce((s, i) => s + (i.weightGrams * i.quantity) / 1000, 0),
      volume: items.reduce((s, i) => s + i.volumeLiters * i.quantity, 0),
    };
  }, [query.data]);

  const openNew = () => {
    setForm(emptyForm);
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
    });
    setDialogOpen(true);
  };

  const submit = () => {
    const data = {
      name: form.name.trim(),
      category: form.category,
      weightGrams: Math.round(Number(form.weightGrams) || 0),
      volumeLiters: Number(form.volumeLiters) || 0,
      quantity: Math.max(1, Math.round(Number(form.quantity) || 1)),
    };
    if (!data.name) {
      toast.error("Bitte einen Namen eingeben");
      return;
    }
    if (form.id) {
      updateMutation.mutate({ id: form.id, ...data });
    } else {
      addMutation.mutate(data);
    }
  };

  if (loading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Lädt" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Inventar"
          subtitle="Erfasse dein Campingmaterial mit Gewicht und Volumen."
        />
        <LoginPrompt feature="dein Inventar" />
      </div>
    );
  }

  const items = query.data ?? [];

  return (
    <div className="container py-6">
      <PageHeader
        title="Inventar"
        subtitle="Erfasse dein Campingmaterial – Gewicht und Volumen fliessen direkt in die Pack-Optimierung ein."
      />

      {/* Übersicht */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{totals.count}</p>
          <p className="text-xs text-muted-foreground">Gegenstände</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{totals.weightKg.toFixed(1)} kg</p>
          <p className="text-xs text-muted-foreground">Gesamtgewicht</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{totals.volume.toFixed(0)} l</p>
          <p className="text-xs text-muted-foreground">Gesamtvolumen</p>
        </div>
      </div>

      <Button className="mb-6" onClick={openNew} aria-label="Neue Ausrüstung erfassen">
        <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Ausrüstung erfassen
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Ausrüstung bearbeiten" : "Neue Ausrüstung"}</DialogTitle>
            <DialogDescription>
              Gewicht und Volumen helfen später bei der Pack-Optimierung.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inv-name">Name</Label>
              <Input
                id="inv-name"
                className="mt-1.5"
                placeholder="z. B. Schlafsack Komfort -5 °C"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="inv-category">Kategorie</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger id="inv-category" className="mt-1.5" aria-label="Kategorie wählen">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {inventoryCategories.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="inv-weight">Gewicht (g)</Label>
                <Input
                  id="inv-weight"
                  className="mt-1.5"
                  type="number"
                  min="0"
                  placeholder="1200"
                  value={form.weightGrams}
                  onChange={e => setForm(f => ({ ...f, weightGrams: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="inv-volume">Volumen (l)</Label>
                <Input
                  id="inv-volume"
                  className="mt-1.5"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="8"
                  value={form.volumeLiters}
                  onChange={e => setForm(f => ({ ...f, volumeLiters: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="inv-quantity">Anzahl</Label>
                <Input
                  id="inv-quantity"
                  className="mt-1.5"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={submit}
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {(addMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {form.id ? "Speichern" : "Erfassen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {query.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Lädt" />
        </div>
      ) : items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-4 py-2.5 font-semibold">Name</th>
                <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Kategorie</th>
                <th className="px-4 py-2.5 text-right font-semibold">Gewicht</th>
                <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">Volumen</th>
                <th className="px-2 py-2.5" aria-label="Aktionen"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{item.name}</span>
                    {item.quantity > 1 && (
                      <span className="ml-1.5 text-xs text-muted-foreground">× {item.quantity}</span>
                    )}
                    <span className="block text-xs text-muted-foreground sm:hidden">{item.category}</span>
                  </td>
                  <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">{item.category}</td>
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
                        aria-label={`${item.name} bearbeiten`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm(`«${item.name}» wirklich löschen?`)) {
                            removeMutation.mutate({ id: item.id });
                          }
                        }}
                        aria-label={`${item.name} löschen`}
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
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="font-medium">Noch keine Ausrüstung erfasst</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Beginne mit den grossen Teilen: Zelt, Schlafsack, Isomatte.
          </p>
        </div>
      )}
    </div>
  );
}
