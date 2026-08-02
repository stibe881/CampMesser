import { useMemo, useState } from "react";
import { Loader2, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { useT } from "@/i18n";
import { trpc } from "@/lib/trpc";

/**
 * Einkaufsliste: schnelles Erfassen, Abhaken und Aufräumen. Offene Einträge
 * stehen oben, erledigte durchgestrichen darunter – Zutaten kommen wahlweise
 * direkt aus dem Rezeptbuch (shopping.addMany).
 */
export default function ShoppingPage() {
  const { isAuthenticated, loading } = useAuth();
  const t = useT();
  const utils = trpc.useUtils();
  const query = trpc.shopping.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [name, setName] = useState("");

  const invalidate = () => utils.shopping.list.invalidate();
  const addMutation = trpc.shopping.add.useMutation({
    onSuccess: () => {
      invalidate();
      setName("");
    },
    onError: () => toast.error(t.shopping.addFailed),
  });
  const toggleMutation = trpc.shopping.toggle.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.actionFailed),
  });
  const removeMutation = trpc.shopping.remove.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.deleteFailed),
  });
  const removeCheckedMutation = trpc.shopping.removeChecked.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.deleteFailed),
  });
  const clearMutation = trpc.shopping.clear.useMutation({
    onSuccess: invalidate,
    onError: () => toast.error(t.common.deleteFailed),
  });

  const items = useMemo(() => query.data ?? [], [query.data]);
  const openItems = useMemo(() => items.filter(i => !i.checked), [items]);
  const doneItems = useMemo(() => items.filter(i => i.checked), [items]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addMutation.mutate({ name: trimmed.slice(0, 160) });
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
          title={t.shopping.title}
          subtitle={t.shopping.subtitleLoggedOut}
        />
        <LoginPrompt feature={t.shopping.loginFeature} />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={t.shopping.title} subtitle={t.shopping.subtitle} />

      {/* Schnelles Hinzufügen */}
      <form
        className="mb-6 flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          value={name}
          maxLength={160}
          placeholder={t.shopping.addPlaceholder}
          aria-label={t.shopping.addNameAria}
          onChange={e => setName(e.target.value)}
        />
        <Button
          type="submit"
          disabled={!name.trim() || addMutation.isPending}
          aria-label={t.shopping.addNameAria}
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.shopping.addButton}
        </Button>
      </form>

      {query.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <ShoppingCart
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="font-medium">{t.shopping.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.shopping.emptyText}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Offene Einträge */}
          <section>
            <h2 className="mb-2 flex items-baseline justify-between font-serif text-base font-semibold">
              {t.shopping.openTitle}
              <span className="text-xs font-normal text-muted-foreground">
                {t.shopping.openCount(openItems.length)}
              </span>
            </h2>
            {openItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                {t.shopping.emptyText}
              </p>
            ) : (
              <ul className="overflow-hidden rounded-xl border border-border">
                {openItems.map(item => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 border-b border-border/60 bg-card px-4 py-2.5 last:border-0"
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() =>
                        toggleMutation.mutate({ id: item.id, checked: true })
                      }
                      aria-label={t.shopping.itemCheckAria(item.name)}
                    />
                    <span className="min-w-0 flex-1 break-words text-sm">
                      {item.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                      onClick={() => removeMutation.mutate({ id: item.id })}
                      aria-label={t.shopping.removeAria(item.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Erledigte Einträge */}
          {doneItems.length > 0 && (
            <section>
              <h2 className="mb-2 font-serif text-base font-semibold text-muted-foreground">
                {t.shopping.doneTitle}
              </h2>
              <ul className="overflow-hidden rounded-xl border border-border">
                {doneItems.map(item => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-2.5 last:border-0"
                  >
                    <Checkbox
                      checked
                      onCheckedChange={() =>
                        toggleMutation.mutate({ id: item.id, checked: false })
                      }
                      aria-label={t.shopping.itemUncheckAria(item.name)}
                    />
                    <span className="min-w-0 flex-1 break-words text-sm text-muted-foreground line-through">
                      {item.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                      onClick={() => removeMutation.mutate({ id: item.id })}
                      aria-label={t.shopping.removeAria(item.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={removeCheckedMutation.isPending}
                  onClick={() => removeCheckedMutation.mutate()}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.shopping.removeChecked}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={clearMutation.isPending}
                  onClick={() => {
                    if (confirm(t.shopping.clearConfirm)) {
                      clearMutation.mutate();
                    }
                  }}
                >
                  {t.shopping.clearAll}
                </Button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
