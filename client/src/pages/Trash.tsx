/**
 * Papierkorb (#295): Gelöschtes 30 Tage lang wiederherstellen.
 *
 * Die Liste zeigt, WAS gelöscht wurde, wie viel daran hing und wie lange
 * es noch da ist. Wiederherstellen ist ein Klick; endgültig löschen
 * ebenfalls, aber mit Rückfrage – das ist der einzige Knopf hier, nach
 * dem nichts mehr zu retten ist.
 */
import { useMemo } from "react";
import { fmtPlain } from "@/lib/dateFormat";
import { useConfirm } from "@/components/ConfirmDialog";
import { RotateCcw, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import {
  RETENTION_DAYS,
  TRASH_KIND_LABELS,
  daysLeft,
  isTrashKind,
} from "@shared/trash";

export default function TrashPage() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const tr = t.trash;
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const listQuery = trpc.trash.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  /**
   * Nach einer Wiederherstellung ist im Grunde jede Liste der App
   * betroffen – Reisen, Plätze, Packlisten, Notizen, Rezepte,
   * Wanderungen. Statt sechs Caches einzeln nachzuführen wird alles
   * ungültig: Das passiert selten genug, um sich das leisten zu können.
   */
  const refreshEverything = async () => {
    await utils.invalidate();
  };

  const restore = trpc.trash.restore.useMutation({
    onSuccess: async () => {
      toast.success(tr.restored);
      await refreshEverything();
    },
    onError: () => toast.error(tr.restoreFailed),
  });
  const remove = trpc.trash.remove.useMutation({
    onSuccess: async () => {
      await utils.trash.list.invalidate();
    },
  });
  const empty = trpc.trash.empty.useMutation({
    onSuccess: async () => {
      await utils.trash.list.invalidate();
    },
  });

  const now = Date.now();
  const entries = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  if (loading) {
    return (
      <div className="container max-w-2xl py-6">
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }
  if (!isAuthenticated) return <LoginPrompt feature={tr.title} />;

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={tr.title} subtitle={tr.intro(RETENTION_DAYS)} />

      {listQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {tr.empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map(entry => {
            const left = daysLeft(entry.deletedAt, now);
            return (
              <li
                key={entry.id}
                className="rounded-lg border border-border/70 bg-background p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{entry.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {isTrashKind(entry.kind)
                        ? pick(TRASH_KIND_LABELS[entry.kind], lang)
                        : entry.kind}
                      {entry.detail ? ` · ${entry.detail}` : ""}
                      {entry.itemCount > 0
                        ? ` · ${tr.itemCount(entry.itemCount)}`
                        : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {tr.deletedOn(fmtPlain(new Date(entry.deletedAt), lang))}{" "}
                      · {tr.daysLeft(left)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={restore.isPending}
                      onClick={() => restore.mutate({ id: entry.id })}
                    >
                      <Undo2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      {tr.restore}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={tr.removeAria(entry.label)}
                      onClick={async () => {
                        if (
                          !(await ask({ title: tr.removeConfirm(entry.label) }))
                        ) {
                          return;
                        }
                        remove.mutate({ id: entry.id });
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {entries.length > 0 && (
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={async () => {
            if (
              !(await ask({
                title: tr.emptyConfirm(entries.length),
                confirmLabel: t.common.confirmEmpty,
              }))
            )
              return;
            empty.mutate();
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          {tr.emptyAll}
        </Button>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        {tr.note(RETENTION_DAYS)}
      </p>
    </div>
  );
}
