import { useState } from "react";
import { Link } from "wouter";
import {
  Backpack,
  Bike,
  Copy,
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
import { packScenarios } from "@shared/packTemplates";
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
    </div>
  );
}
