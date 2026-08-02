import { useState } from "react";
import { Link } from "wouter";
import {
  Baby,
  Backpack,
  Bike,
  Copy,
  ListChecks,
  ListPlus,
  Loader2,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { familyAddOns, packScenarios } from "@shared/packTemplates";
import { pick } from "@shared/i18n";
import { cn } from "@/lib/utils";

const scenarioIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  solo: Backpack,
  familie: Users,
  motorrad: Bike,
  custom: ListPlus,
};

export default function PackListsPage() {
  const { isAuthenticated, loading } = useAuth();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const listsQuery = trpc.packing.lists.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scenario, setScenario] = useState("solo");
  const [name, setName] = useState("");
  // Familien-Checkliste, für die gerade eine Ziel-Liste gewählt wird
  const [addOnId, setAddOnId] = useState<string | null>(null);

  const createMutation = trpc.packing.createList.useMutation({
    onSuccess: () => {
      utils.packing.lists.invalidate();
      setDialogOpen(false);
      setName("");
      toast.success(t.packLists.created);
    },
    onError: () => toast.error(t.packLists.createFailed),
  });

  const deleteMutation = trpc.packing.deleteList.useMutation({
    onSuccess: () => utils.packing.lists.invalidate(),
  });

  const duplicateMutation = trpc.packing.duplicateList.useMutation({
    onSuccess: () => {
      utils.packing.lists.invalidate();
      toast.success(t.packLists.duplicated);
    },
    onError: () => toast.error(t.packLists.duplicateFailed),
  });

  const addItemsMutation = trpc.packing.addItems.useMutation({
    onError: () => toast.error(t.packLists.addOnAddFailed),
  });

  const activeAddOn = familyAddOns.find(a => a.id === addOnId) ?? null;

  /** Einträge des gewählten Pakets in der aktiven Sprache in die Liste übernehmen. */
  const addAddOnToList = (list: { id: number; name: string }) => {
    if (!activeAddOn) return;
    addItemsMutation.mutate(
      {
        listId: list.id,
        // Vorlagen-Einträge in der aktuellen Sprache speichern – die Liste
        // selbst bleibt einsprachig.
        items: activeAddOn.items.map(i => ({
          name: pick(i.name, lang),
          category: pick(i.category, lang),
          quantity: i.quantity ?? 1,
        })),
      },
      {
        onSuccess: () => {
          utils.packing.items.invalidate({ listId: list.id });
          toast.success(
            t.packLists.addOnAdded(pick(activeAddOn.label, lang), list.name)
          );
          setAddOnId(null);
        },
      }
    );
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
        <PageHeader title={t.packLists.title} subtitle={t.packLists.subtitle} />
        <LoginPrompt feature={t.packLists.loginFeature} />
      </div>
    );
  }

  const selectedScenario = packScenarios.find(s => s.id === scenario);

  return (
    <div className="container py-6">
      <PageHeader title={t.packLists.title} subtitle={t.packLists.subtitle} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-6" aria-label={t.packLists.newListAria}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.packLists.newList}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.packLists.newList}</DialogTitle>
            <DialogDescription>
              {t.packLists.dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {packScenarios.map(s => {
                const Icon = scenarioIcons[s.id] ?? ListPlus;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScenario(s.id)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                      scenario === s.id
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/40"
                    )}
                    aria-pressed={scenario === s.id}
                    aria-label={t.packLists.scenarioAria(pick(s.label, lang))}
                  >
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="text-sm font-semibold">
                      {pick(s.label, lang)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {pick(s.description, lang)}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedScenario && selectedScenario.items.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t.packLists.preparedItems(selectedScenario.items.length)}
              </p>
            )}
            <div>
              <Label htmlFor="list-name">{t.packLists.nameLabel}</Label>
              <Input
                id="list-name"
                className="mt-1.5"
                placeholder={
                  selectedScenario
                    ? t.packLists.namePlaceholder(
                        pick(selectedScenario.label, lang)
                      )
                    : t.packLists.namePlaceholderFallback
                }
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={createMutation.isPending}
              onClick={() => {
                const finalName =
                  name.trim() ||
                  (selectedScenario
                    ? pick(selectedScenario.label, lang)
                    : t.packLists.defaultName);
                createMutation.mutate({ name: finalName, scenario, lang });
              }}
            >
              {createMutation.isPending && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t.packLists.createList}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {listsQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      ) : listsQuery.data && listsQuery.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {listsQuery.data.map(list => {
            const Icon = scenarioIcons[list.scenario] ?? ListPlus;
            const scenarioOfList = packScenarios.find(
              s => s.id === list.scenario
            );
            const scenarioLabel = scenarioOfList
              ? pick(scenarioOfList.label, lang)
              : pick(packScenarios.find(s => s.id === "custom")!.label, lang);
            return (
              <div
                key={list.id}
                className="group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <Link
                  href={`/packlisten/${list.id}`}
                  className="absolute inset-0"
                  aria-label={t.packLists.openAria(list.name)}
                />
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{list.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {scenarioLabel}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative z-10 text-muted-foreground hover:text-primary"
                  disabled={duplicateMutation.isPending}
                  onClick={() =>
                    duplicateMutation.mutate({ id: list.id, lang })
                  }
                  aria-label={t.packLists.duplicateAria(list.name)}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative z-10 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm(t.packLists.deleteConfirm(list.name))) {
                      deleteMutation.mutate({ id: list.id });
                    }
                  }}
                  aria-label={t.packLists.deleteAria(list.name)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Backpack
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="font-medium">{t.packLists.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.packLists.emptyText}
          </p>
        </div>
      )}

      {/* Checklisten für Familien: fertige Pakete in eine Liste übernehmen */}
      <h2 className="mb-1 mt-10 font-serif text-xl font-semibold">
        {t.packLists.familyTitle}
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        {t.packLists.familySubtitle}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {familyAddOns.map(addOn => (
          <Card key={addOn.id}>
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Baby className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <p className="font-semibold">{pick(addOn.label, lang)}</p>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                {pick(addOn.description, lang)}
              </p>
              <ul className="mb-4 space-y-1 text-sm">
                {addOn.items.slice(0, 4).map(item => (
                  <li key={item.name.de} className="flex gap-2">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    {pick(item.name, lang)}
                  </li>
                ))}
                {addOn.items.length > 4 && (
                  <li className="text-xs text-muted-foreground">
                    {t.packLists.moreItems(addOn.items.length - 4)}
                  </li>
                )}
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddOnId(addOn.id)}
                aria-label={t.packLists.addToPackListAria(
                  pick(addOn.label, lang)
                )}
              >
                <ListChecks className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.packLists.addToPackList}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ziel-Liste für das gewählte Paket auswählen */}
      <Dialog
        open={activeAddOn !== null}
        onOpenChange={open => !open && setAddOnId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.packLists.chooseListTitle}</DialogTitle>
            <DialogDescription>
              {activeAddOn
                ? t.packLists.chooseListDescription(
                    pick(activeAddOn.label, lang)
                  )
                : ""}
            </DialogDescription>
          </DialogHeader>
          {listsQuery.data && listsQuery.data.length > 0 ? (
            <div className="space-y-2">
              {listsQuery.data.map(list => {
                const Icon = scenarioIcons[list.scenario] ?? ListPlus;
                return (
                  <button
                    key={list.id}
                    type="button"
                    disabled={addItemsMutation.isPending}
                    onClick={() => addAddOnToList(list)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 text-left text-sm font-medium transition-all hover:border-primary/40 disabled:opacity-50"
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">{list.name}</span>
                    {addItemsMutation.isPending ? (
                      <Loader2
                        className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
                        aria-hidden="true"
                      />
                    ) : (
                      <Plus
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.packLists.noListsForAddOn}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
