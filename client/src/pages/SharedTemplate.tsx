import { useParams, useLocation } from "wouter";
import {
  BookmarkPlus,
  ListChecks,
  ListPlus,
  Loader2,
  LogIn,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useT } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

/**
 * Öffentliche Ansicht einer geteilten Packvorlage: Der Link-Token dient als
 * Zugang, die Einträge sind read-only nach Kategorie gruppiert. Angemeldete
 * können die Vorlage als eigene Vorlage übernehmen oder direkt eine neue
 * Packliste daraus erstellen; Gäste sehen einen Anmelde-Hinweis.
 */
export default function SharedTemplatePage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const t = useT();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const query = trpc.packing.sharedTemplateGet.useQuery(
    { token },
    { enabled: token.length >= 8 }
  );

  const importMutation = trpc.packing.importSharedTemplate.useMutation({
    onSuccess: () => {
      utils.packing.listTemplates.invalidate();
      toast.success(t.sharedTemplate.imported);
    },
    onError: () => toast.error(t.sharedTemplate.importFailed),
  });

  const createListMutation =
    trpc.packing.createListFromSharedTemplate.useMutation({
      onSuccess: ({ listId }) => {
        utils.packing.lists.invalidate();
        toast.success(t.sharedTemplate.listCreated);
        navigate(`/packlisten/${listId}`);
      },
      onError: () => toast.error(t.sharedTemplate.createListFailed),
    });

  if (query.isLoading) {
    return (
      <div className="container max-w-3xl py-6">
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          {t.sharedTemplate.loading}
        </div>
      </div>
    );
  }

  const template = query.data?.template;
  if (!template) {
    return (
      <div className="container max-w-3xl py-6">
        <PageHeader
          title={t.sharedTemplate.notFoundTitle}
          backHref="/"
          backLabel={t.sharedTemplate.backHome}
        />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t.sharedTemplate.invalidLink}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { items } = template;
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});
  const actionPending =
    importMutation.isPending || createListMutation.isPending;

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title={template.name}
        subtitle={t.sharedTemplate.subtitle(items.length)}
        backHref="/"
        backLabel={t.sharedTemplate.backHome}
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.sharedTemplate.sharedInfo}
      </div>

      {/* Aktionen: übernehmen oder direkt eine Liste starten (nur angemeldet) */}
      {isAuthenticated ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={actionPending || items.length === 0}
            onClick={() => importMutation.mutate({ token })}
          >
            <BookmarkPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.sharedTemplate.importButton}
          </Button>
          <Button
            size="sm"
            disabled={actionPending || items.length === 0}
            onClick={() =>
              createListMutation.mutate({ token, listName: template.name })
            }
          >
            <ListPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.sharedTemplate.createListButton}
          </Button>
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm">
          <LogIn
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 text-muted-foreground">
            {t.sharedTemplate.loginHint}
          </span>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/anmelden">{t.loginPrompt.cta}</Link>
          </Button>
        </div>
      )}

      {items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <ListChecks
              className="h-8 w-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              {t.sharedTemplate.emptyTemplate}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-5">
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <section key={category}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category}
            </h2>
            <ul className="space-y-1.5">
              {categoryItems.map((item, idx) => (
                <li
                  key={`${item.name}-${idx}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span className="flex-1">
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        × {item.quantity}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
