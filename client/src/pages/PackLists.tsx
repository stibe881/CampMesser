import { useEffect, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { ShareExpiryNote, ShareExpirySelect } from "@/components/ShareExpiry";
import type { ShareExpiryDays } from "@shared/sharing";
import { Link, useSearch } from "wouter";
import {
  Archive,
  ArchiveRestore,
  Baby,
  Backpack,
  Bike,
  Bookmark,
  ChevronDown,
  Copy,
  Link2,
  ListChecks,
  ListPlus,
  Loader2,
  Plus,
  QrCode,
  Scale,
  Share2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import QueryError from "@/components/QueryError";
import ListSkeleton from "@/components/ListSkeleton";
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
import { MAX_PERSONS } from "@shared/packPersons";
import { formatGrams } from "@shared/packWeight";
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
  const ask = useConfirm();
  const { isAuthenticated, loading } = useAuth();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const listsQuery = trpc.packing.lists.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const templatesQuery = trpc.packing.listTemplates.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scenario, setScenario] = useState("solo");
  /** Gewählte eigene Vorlage – hat Vorrang vor dem Szenario. */
  const [templateChoice, setTemplateChoice] = useState<number | null>(null);
  const [name, setName] = useState("");
  /** Optionale Personen-Bereiche der neuen Liste (Chips, Enter fügt hinzu). */
  const [persons, setPersons] = useState<string[]>([]);
  const [personDraft, setPersonDraft] = useState("");
  // Familien-Checkliste, für die gerade eine Ziel-Liste gewählt wird
  const [addOnId, setAddOnId] = useState<string | null>(null);
  /** Vorlage, deren Teil-Link gerade im Dialog gezeigt wird. */
  const [templateShare, setTemplateShare] = useState<{
    id: number;
    name: string;
    url: string;
    expiresAt: Date | null;
  } | null>(null);
  const [templateQr, setTemplateQr] = useState<string | null>(null);
  /** Im Dialog gewählte Gültigkeit; null = unbegrenzt. */
  const [templateExpiresIn, setTemplateExpiresIn] =
    useState<ShareExpiryDays | null>(null);

  // Schnellaktion «Neue Packliste» (?neu=1): den Neue-Liste-Dialog öffnen
  const searchParams = useSearch();
  useEffect(() => {
    if (!isAuthenticated) return;
    if (new URLSearchParams(searchParams).get("neu") === "1")
      setDialogOpen(true);
  }, [searchParams, isAuthenticated]);

  // QR-Code zum Teil-Link erzeugen (Muster PackListDetail): einfach abscannen lassen
  useEffect(() => {
    if (!templateShare) {
      setTemplateQr(null);
      return;
    }
    QRCode.toDataURL(templateShare.url, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setTemplateQr)
      .catch(() => setTemplateQr(null));
  }, [templateShare]);

  const createMutation = trpc.packing.createList.useMutation({
    onSuccess: () => {
      utils.packing.lists.invalidate();
      setDialogOpen(false);
      setName("");
      setPersons([]);
      setPersonDraft("");
      toast.success(t.packLists.created);
    },
    onError: () => toast.error(t.packLists.createFailed),
  });

  const createFromTemplateMutation =
    trpc.packing.createListFromTemplate.useMutation({
      onSuccess: () => {
        utils.packing.lists.invalidate();
        setDialogOpen(false);
        setName("");
        setPersons([]);
        setPersonDraft("");
        toast.success(t.packLists.created);
      },
      onError: () => toast.error(t.packLists.createFailed),
    });

  /** Personen-Chip hinzufügen (Enter im Feld oder Plus-Knopf). */
  const addPersonChip = () => {
    const person = personDraft.trim().slice(0, 80);
    if (!person || persons.length >= MAX_PERSONS) return;
    if (!persons.some(p => p.toLowerCase() === person.toLowerCase())) {
      setPersons([...persons, person]);
    }
    setPersonDraft("");
  };

  /** Chips plus allenfalls noch nicht bestätigte Eingabe im Feld. */
  const finalPersons = () => {
    const person = personDraft.trim().slice(0, 80);
    if (
      person &&
      persons.length < MAX_PERSONS &&
      !persons.some(p => p.toLowerCase() === person.toLowerCase())
    ) {
      return [...persons, person];
    }
    return persons;
  };

  const deleteMutation = trpc.packing.deleteList.useMutation({
    onSuccess: () => utils.packing.lists.invalidate(),
  });

  /** Archiv-Abschnitt ist bewusst standardmässig eingeklappt (#194). */
  const [archiveOpen, setArchiveOpen] = useState(false);

  const archiveMutation = trpc.packing.setArchived.useMutation({
    onSuccess: (_data, vars) => {
      utils.packing.lists.invalidate();
      toast.success(
        vars.archived ? t.packLists.archived : t.packLists.unarchived
      );
    },
    onError: () => toast.error(t.packLists.archiveFailed),
  });

  const deleteTemplateMutation = trpc.packing.deleteTemplate.useMutation({
    onSuccess: () => {
      utils.packing.listTemplates.invalidate();
      toast.success(t.packLists.templateDeleted);
    },
    onError: () => toast.error(t.packLists.templateDeleteFailed),
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

  const shareTemplateMutation = trpc.packing.shareTemplate.useMutation({
    onError: () => toast.error(t.packLists.templateShareFailed),
  });

  /** Teil-Link der Vorlage erzeugen (idempotent), Dialog öffnen, Link kopieren. */
  const openTemplateShare = (
    template: { id: number; name: string },
    // undefined = Gültigkeit unverändert lassen (Dialog nur öffnen)
    expiresInDays?: ShareExpiryDays | null
  ) => {
    shareTemplateMutation.mutate(
      { id: template.id, expiresInDays },
      {
        onSuccess: async ({ token, expiresAt }) => {
          const url = `${window.location.origin}/vorlage/${token}`;
          setTemplateShare({
            id: template.id,
            name: template.name,
            url,
            expiresAt,
          });
          utils.packing.listTemplates.invalidate();
          try {
            await navigator.clipboard.writeText(url);
            toast.success(t.packLists.templateShareCopied);
          } catch {
            // Zwischenablage blockiert – der Link steht im Dialog
          }
        },
      }
    );
  };

  const unshareTemplateMutation = trpc.packing.unshareTemplate.useMutation({
    onSuccess: () => {
      utils.packing.listTemplates.invalidate();
      setTemplateShare(null);
      toast.success(t.packLists.templateUnshared);
    },
    onError: () => toast.error(t.packLists.templateUnshareFailed),
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
      <div className="container max-w-2xl py-6">
        <ListSkeleton rows={4} height={72} />
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
  const templates = templatesQuery.data ?? [];
  const selectedTemplate =
    templates.find(tpl => tpl.id === templateChoice) ?? null;

  // Archivierte Listen (#194) erscheinen nur im eigenen Abschnitt unten und
  // NICHT in Auswahl-Listen (hier: Ziel-Liste der Familien-Checklisten).
  const allLists = listsQuery.data ?? [];
  const activeLists = allLists.filter(list => list.archivedAt == null);
  const archivedLists = allLists.filter(list => list.archivedAt != null);

  /** Eine Listen-Karte – archivierte bekommen «Wiederherstellen» statt «Archivieren». */
  const renderListCard = (list: (typeof allLists)[number]) => {
    const archived = list.archivedAt != null;
    const Icon = scenarioIcons[list.scenario] ?? ListPlus;
    const scenarioOfList = packScenarios.find(s => s.id === list.scenario);
    const scenarioLabel = scenarioOfList
      ? pick(scenarioOfList.label, lang)
      : pick(packScenarios.find(s => s.id === "custom")!.label, lang);
    return (
      <div
        key={list.id}
        className={cn(
          "group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md",
          archived && "opacity-80"
        )}
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
          <p className="text-sm text-muted-foreground">{scenarioLabel}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {list.weightBudgetGrams != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                <Scale className="h-3 w-3" aria-hidden="true" />
                {t.packLists.budgetBadge(
                  formatGrams(list.weightBudgetGrams, lang)
                )}
              </span>
            )}
            {archived && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <Archive className="h-3 w-3" aria-hidden="true" />
                {t.packLists.archivedBadge}
              </span>
            )}
          </div>
        </div>
        {!archived && (
          <Button
            variant="ghost"
            size="icon"
            className="relative z-10 text-muted-foreground hover:text-primary"
            disabled={duplicateMutation.isPending}
            onClick={() => duplicateMutation.mutate({ id: list.id, lang })}
            aria-label={t.packLists.duplicateAria(list.name)}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="relative z-10 text-muted-foreground hover:text-primary"
          disabled={archiveMutation.isPending}
          onClick={() =>
            archiveMutation.mutate({ listId: list.id, archived: !archived })
          }
          aria-label={
            archived
              ? t.packLists.unarchiveAria(list.name)
              : t.packLists.archiveAria(list.name)
          }
        >
          {archived ? (
            <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Archive className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative z-10 text-muted-foreground hover:text-destructive"
          onClick={async () => {
            if (await ask({ title: t.packLists.deleteConfirm(list.name) })) {
              deleteMutation.mutate({ id: list.id });
            }
          }}
          aria-label={t.packLists.deleteAria(list.name)}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );
  };

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
                    onClick={() => {
                      setScenario(s.id);
                      setTemplateChoice(null);
                    }}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                      templateChoice === null && scenario === s.id
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/40"
                    )}
                    aria-pressed={templateChoice === null && scenario === s.id}
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
            {/* Eigene Vorlagen: gespeicherte Listen als Ausgangspunkt */}
            {templates.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Bookmark
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  {t.packLists.myTemplatesTitle}
                </p>
                <div className="space-y-2">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border pr-1 transition-all",
                        templateChoice === template.id
                          ? "border-primary bg-accent"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setTemplateChoice(template.id)}
                        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 p-3 text-left"
                        aria-pressed={templateChoice === template.id}
                        aria-label={t.packLists.templateAria(template.name)}
                      >
                        <span className="w-full truncate text-sm font-semibold">
                          {template.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t.packLists.templateItemCount(template.items.length)}
                          {template.shareToken != null &&
                            ` · ${t.packLists.templateSharedBadge}`}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                        disabled={shareTemplateMutation.isPending}
                        onClick={() => openTemplateShare(template)}
                        aria-label={t.packLists.templateShareAria(
                          template.name
                        )}
                      >
                        <Share2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={deleteTemplateMutation.isPending}
                        onClick={async () => {
                          if (
                            await ask({
                              title: t.packLists.templateDeleteConfirm(
                                template.name
                              ),
                            })
                          ) {
                            if (templateChoice === template.id) {
                              setTemplateChoice(null);
                            }
                            deleteTemplateMutation.mutate({ id: template.id });
                          }
                        }}
                        aria-label={t.packLists.templateDeleteAria(
                          template.name
                        )}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedTemplate ? (
              <p className="text-xs text-muted-foreground">
                {t.packLists.preparedItems(selectedTemplate.items.length)}
              </p>
            ) : (
              selectedScenario &&
              selectedScenario.items.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t.packLists.preparedItems(selectedScenario.items.length)}
                </p>
              )
            )}
            <div>
              <Label htmlFor="list-name">{t.packLists.nameLabel}</Label>
              <Input
                id="list-name"
                className="mt-1.5"
                placeholder={
                  selectedTemplate
                    ? t.packLists.namePlaceholder(selectedTemplate.name)
                    : selectedScenario
                      ? t.packLists.namePlaceholder(
                          pick(selectedScenario.label, lang)
                        )
                      : t.packLists.namePlaceholderFallback
                }
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            {/* Optionale Personen: jede bekommt einen eigenen Bereich auf der Liste */}
            <div>
              <Label htmlFor="list-persons">{t.packLists.personsLabel}</Label>
              {persons.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {persons.map(person => (
                    <span
                      key={person}
                      className="inline-flex max-w-48 items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                    >
                      <span className="truncate">{person}</span>
                      <button
                        type="button"
                        className="shrink-0 rounded-full text-accent-foreground/70 transition-colors hover:text-accent-foreground"
                        onClick={() =>
                          setPersons(persons.filter(p => p !== person))
                        }
                        aria-label={t.packLists.personsRemoveAria(person)}
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="list-persons"
                  value={personDraft}
                  maxLength={80}
                  placeholder={t.packLists.personsPlaceholder}
                  onChange={e => setPersonDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPersonChip();
                    }
                  }}
                  disabled={persons.length >= MAX_PERSONS}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={addPersonChip}
                  disabled={
                    !personDraft.trim() || persons.length >= MAX_PERSONS
                  }
                  aria-label={t.packLists.personsAddAria}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.packLists.personsHint}
              </p>
            </div>
            <Button
              className="w-full"
              disabled={
                createMutation.isPending || createFromTemplateMutation.isPending
              }
              onClick={() => {
                if (selectedTemplate) {
                  const finalName = name.trim() || selectedTemplate.name;
                  createFromTemplateMutation.mutate({
                    templateId: selectedTemplate.id,
                    listName: finalName,
                    persons: finalPersons(),
                  });
                  return;
                }
                const finalName =
                  name.trim() ||
                  (selectedScenario
                    ? pick(selectedScenario.label, lang)
                    : t.packLists.defaultName);
                createMutation.mutate({
                  name: finalName,
                  scenario,
                  lang,
                  persons: finalPersons(),
                });
              }}
            >
              {(createMutation.isPending ||
                createFromTemplateMutation.isPending) && (
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

      {listsQuery.isError ? (
        <QueryError
          onRetry={() => void listsQuery.refetch()}
          retrying={listsQuery.isFetching}
        />
      ) : listsQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      ) : activeLists.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeLists.map(renderListCard)}
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

      {/* Archiv (#194): standardmässig eingeklappt, damit es nicht stört */}
      {archivedLists.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setArchiveOpen(o => !o)}
            aria-expanded={archiveOpen}
            aria-label={t.packLists.archiveSectionAria}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm"
          >
            <Archive
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-left font-medium">
              {t.packLists.archiveSectionTitle(archivedLists.length)}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                archiveOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
          {archiveOpen && (
            <div className="border-t border-border px-4 py-3">
              <p className="mb-3 text-xs text-muted-foreground">
                {t.packLists.archiveHint}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {archivedLists.map(renderListCard)}
              </div>
            </div>
          )}
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
          {activeLists.length > 0 ? (
            <div className="space-y-2">
              {activeLists.map(list => {
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

      {/* Teil-Link einer Vorlage: Link + QR-Code, Teilen beenden */}
      <Dialog
        open={templateShare !== null}
        onOpenChange={open => !open && setTemplateShare(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.packLists.templateShareTitle}</DialogTitle>
            <DialogDescription>
              {t.packLists.templateShareDescription}
            </DialogDescription>
          </DialogHeader>
          {templateShare && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <Link2
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <code className="min-w-0 flex-1 truncate text-xs">
                  {templateShare.url}
                </code>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(templateShare.url);
                      toast.success(t.common.linkCopied);
                    } catch {
                      toast.error(t.common.copyFailed);
                    }
                  }}
                >
                  {t.common.copy}
                </button>
              </div>
              {templateQr && (
                <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                  {/* Weisser Rahmen, damit der Code auch im Dark Mode scannbar bleibt */}
                  <div className="shrink-0 rounded-md bg-white p-2 shadow-sm">
                    <img
                      src={templateQr}
                      alt={t.packLists.templateQrAlt(templateShare.name)}
                      className="h-36 w-36"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <QrCode
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      {t.packLists.templateQrTitle}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.packLists.templateQrText}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <ShareExpirySelect
                  value={templateExpiresIn}
                  onChange={days => {
                    setTemplateExpiresIn(days);
                    openTemplateShare(templateShare, days);
                  }}
                />
                <ShareExpiryNote expiresAt={templateShare.expiresAt} />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={unshareTemplateMutation.isPending}
                onClick={() =>
                  unshareTemplateMutation.mutate({ id: templateShare.id })
                }
              >
                {t.packLists.templateUnshare}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
