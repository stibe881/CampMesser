import { useParams, useLocation, Link } from "wouter";
import { BookmarkPlus, HelpCircle, Loader2, LogIn, Users } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { useT } from "@/i18n";
import { trpc } from "@/lib/trpc";

/**
 * Öffentliche Ansicht eines geteilten Quiz: Der Link-Token dient als Zugang,
 * gezeigt werden nur Titel, Fragen-Anzahl und die erste Frage als Vorgeschmack
 * (die Antworten bleiben geheim). Angemeldete übernehmen das Quiz als eigenes
 * Quiz in den Familien-Modus; Gäste sehen einen Anmelde-Hinweis.
 */
export default function SharedQuizPage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const t = useT();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const query = trpc.quizzes.sharedGet.useQuery(
    { token },
    { enabled: token.length >= 8 }
  );

  const importMutation = trpc.quizzes.importShared.useMutation({
    onSuccess: () => {
      utils.quizzes.list.invalidate();
      toast.success(t.sharedQuiz.imported);
      navigate("/familie");
    },
    onError: () => toast.error(t.sharedQuiz.importFailed),
  });

  if (query.isLoading) {
    return (
      <div className="container max-w-3xl py-6">
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          {t.sharedQuiz.loading}
        </div>
      </div>
    );
  }

  const quiz = query.data?.quiz;
  if (!quiz) {
    return (
      <div className="container max-w-3xl py-6">
        <PageHeader
          title={t.sharedQuiz.notFoundTitle}
          backHref="/"
          backLabel={t.sharedQuiz.backHome}
        />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t.sharedQuiz.invalidLink}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title={quiz.title}
        subtitle={t.sharedQuiz.subtitle}
        backHref="/"
        backLabel={t.sharedQuiz.backHome}
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.sharedQuiz.sharedInfo}
      </div>

      {/* Übernehmen (nur angemeldet) oder Anmelde-Hinweis */}
      {isAuthenticated ? (
        <div className="mb-6">
          <Button
            size="sm"
            disabled={importMutation.isPending || quiz.questionCount === 0}
            onClick={() => importMutation.mutate({ token })}
          >
            <BookmarkPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.sharedQuiz.importButton}
          </Button>
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm">
          <LogIn
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 text-muted-foreground">
            {t.sharedQuiz.loginHint}
          </span>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/anmelden">{t.loginPrompt.cta}</Link>
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <Badge variant="secondary">
              {t.sharedQuiz.questionCount(quiz.questionCount)}
            </Badge>
          </div>
          {quiz.sampleQuestion ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.sharedQuiz.sampleQuestionTitle}
              </p>
              <p className="mt-1.5 text-sm font-medium">
                {quiz.sampleQuestion}
              </p>
              {quiz.questionCount > 1 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.sharedQuiz.moreQuestions(quiz.questionCount - 1)}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.sharedQuiz.emptyQuiz}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
