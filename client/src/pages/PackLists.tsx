import { useState } from "react";
import { Link } from "wouter";
import { Backpack, Bike, ListPlus, Loader2, Plus, Trash2, Users } from "lucide-react";
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
import { trpc } from "@/lib/trpc";
import { packScenarios } from "@shared/packTemplates";
import { cn } from "@/lib/utils";

const scenarioIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  solo: Backpack,
  familie: Users,
  motorrad: Bike,
  custom: ListPlus,
};

export default function PackListsPage() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const listsQuery = trpc.packing.lists.useQuery(undefined, { enabled: isAuthenticated });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scenario, setScenario] = useState("solo");
  const [name, setName] = useState("");

  const createMutation = trpc.packing.createList.useMutation({
    onSuccess: () => {
      utils.packing.lists.invalidate();
      setDialogOpen(false);
      setName("");
      toast.success("Packliste erstellt");
    },
    onError: () => toast.error("Liste konnte nicht erstellt werden"),
  });

  const deleteMutation = trpc.packing.deleteList.useMutation({
    onSuccess: () => utils.packing.lists.invalidate(),
  });

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
          title="Packlisten"
          subtitle="Szenario-basierte Checklisten, die du abhaken und erweitern kannst."
        />
        <LoginPrompt feature="deine Packlisten" />
      </div>
    );
  }

  const selectedScenario = packScenarios.find(s => s.id === scenario);

  return (
    <div className="container py-6">
      <PageHeader
        title="Packlisten"
        subtitle="Szenario-basierte Checklisten, die du abhaken und erweitern kannst."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-6" aria-label="Neue Packliste erstellen">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Neue Packliste
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Packliste</DialogTitle>
            <DialogDescription>
              Wähle ein Szenario – die passende Basis-Ausrüstung wird automatisch eingetragen.
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
                        : "border-border hover:border-primary/40",
                    )}
                    aria-pressed={scenario === s.id}
                    aria-label={`Szenario ${s.label} wählen`}
                  >
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="text-sm font-semibold">{s.label}</span>
                    <span className="text-xs text-muted-foreground">{s.description}</span>
                  </button>
                );
              })}
            </div>
            {selectedScenario && selectedScenario.items.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Enthält {selectedScenario.items.length} vorbereitete Einträge.
              </p>
            )}
            <div>
              <Label htmlFor="list-name">Name der Liste</Label>
              <Input
                id="list-name"
                className="mt-1.5"
                placeholder={selectedScenario ? `z. B. ${selectedScenario.label} Sommer` : "Name"}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={createMutation.isPending}
              onClick={() => {
                const finalName = name.trim() || selectedScenario?.label || "Meine Packliste";
                createMutation.mutate({ name: finalName, scenario });
              }}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Liste erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {listsQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Lädt" />
        </div>
      ) : listsQuery.data && listsQuery.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {listsQuery.data.map(list => {
            const Icon = scenarioIcons[list.scenario] ?? ListPlus;
            const scenarioLabel = packScenarios.find(s => s.id === list.scenario)?.label ?? "Eigene Liste";
            return (
              <div
                key={list.id}
                className="group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <Link
                  href={`/packlisten/${list.id}`}
                  className="absolute inset-0"
                  aria-label={`Packliste ${list.name} öffnen`}
                />
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{list.name}</p>
                  <p className="text-sm text-muted-foreground">{scenarioLabel}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative z-10 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Liste «${list.name}» wirklich löschen?`)) {
                      deleteMutation.mutate({ id: list.id });
                    }
                  }}
                  aria-label={`Packliste ${list.name} löschen`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Backpack className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="font-medium">Noch keine Packlisten</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Erstelle deine erste Liste – wähle einfach ein Szenario aus.
          </p>
        </div>
      )}
    </div>
  );
}
