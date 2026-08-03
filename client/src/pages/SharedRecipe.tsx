import { useParams, useLocation, Link } from "wouter";
import {
  Baby,
  BookmarkPlus,
  Clock,
  CookingPot,
  Loader2,
  LogIn,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import {
  RECIPE_DIFFICULTY_LABELS,
  RECIPE_METHOD_LABELS,
} from "@shared/customRecipes";
import { pick } from "@shared/i18n";

/**
 * Öffentliche Ansicht eines geteilten eigenen Rezepts: Der Link-Token dient
 * als Zugang, gezeigt werden Titel, Eckdaten, Zutaten und Zubereitung.
 * Das private Rezept-Foto wird bewusst NICHT mitgeliefert. Angemeldete
 * übernehmen das Rezept als eigenes ins Rezeptbuch; Gäste sehen einen
 * Anmelde-Hinweis.
 */
export default function SharedRecipePage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const { lang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const query = trpc.recipes.sharedGet.useQuery(
    { token },
    { enabled: token.length >= 8 }
  );

  const importMutation = trpc.recipes.importShared.useMutation({
    onSuccess: () => {
      utils.recipes.list.invalidate();
      toast.success(t.sharedRecipe.imported);
      navigate("/rezepte");
    },
    onError: () => toast.error(t.sharedRecipe.importFailed),
  });

  if (query.isLoading) {
    return (
      <div className="container max-w-3xl py-6">
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          {t.sharedRecipe.loading}
        </div>
      </div>
    );
  }

  const recipe = query.data?.recipe;
  if (!recipe) {
    return (
      <div className="container max-w-3xl py-6">
        <PageHeader
          title={t.sharedRecipe.notFoundTitle}
          backHref="/"
          backLabel={t.sharedRecipe.backHome}
        />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t.sharedRecipe.invalidLink}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title={recipe.name}
        subtitle={t.sharedRecipe.subtitle}
        backHref="/"
        backLabel={t.sharedRecipe.backHome}
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <CookingPot className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.sharedRecipe.sharedInfo}
      </div>

      {/* Übernehmen (nur angemeldet) oder Anmelde-Hinweis */}
      {isAuthenticated ? (
        <div className="mb-6">
          <Button
            size="sm"
            disabled={importMutation.isPending}
            onClick={() => importMutation.mutate({ token })}
          >
            <BookmarkPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.sharedRecipe.importButton}
          </Button>
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm">
          <LogIn
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 text-muted-foreground">
            {t.sharedRecipe.loginHint}
          </span>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/anmelden">{t.loginPrompt.cta}</Link>
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Eckdaten */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {t.sharedRecipe.minutes(recipe.timeMinutes)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {t.sharedRecipe.servings(recipe.servings)}
            </span>
            <Badge variant="secondary">
              {pick(RECIPE_METHOD_LABELS[recipe.method], lang)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {pick(RECIPE_DIFFICULTY_LABELS[recipe.difficulty], lang)}
            </Badge>
            {recipe.onePot && (
              <Badge variant="outline">{t.sharedRecipe.onePotBadge}</Badge>
            )}
            {recipe.kidFriendly && (
              <Badge variant="outline" className="gap-1">
                <Baby className="h-3 w-3" aria-hidden="true" />
                {t.sharedRecipe.kidsBadge}
              </Badge>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t.sharedRecipe.ingredientsTitle}
            </h2>
            <ul className="grid gap-1 text-sm sm:grid-cols-2">
              {recipe.ingredients.map((ingredient, idx) => (
                <li key={idx} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t.sharedRecipe.stepsTitle}
            </h2>
            <ol className="space-y-2.5">
              {recipe.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {idx + 1}
                  </span>
                  <p className="text-sm">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {recipe.tip && (
            <div className="rounded-lg bg-accent/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.sharedRecipe.tipTitle}
              </p>
              <p className="mt-1 text-sm">{recipe.tip}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {t.sharedRecipe.photoNote}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
