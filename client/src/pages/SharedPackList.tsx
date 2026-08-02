import { useParams } from "wouter";
import { ListChecks, Loader2, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useT } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

/**
 * Öffentliche Ansicht einer geteilten Packliste: Mitreisende können ohne
 * Anmeldung mitlesen und gemeinsam abhaken. Der Link-Token dient als Zugang.
 */
export default function SharedPackListPage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const t = useT();
  const utils = trpc.useUtils();

  const query = trpc.packing.sharedGet.useQuery(
    { token },
    { enabled: token.length >= 8, refetchInterval: 15000 }
  );

  const toggleMutation = trpc.packing.sharedToggle.useMutation({
    onMutate: async input => {
      await utils.packing.sharedGet.cancel({ token });
      const prev = utils.packing.sharedGet.getData({ token });
      utils.packing.sharedGet.setData({ token }, old =>
        old
          ? {
              ...old,
              items: old.items.map(i =>
                i.id === input.itemId ? { ...i, checked: input.checked } : i
              ),
            }
          : old
      );
      return { prev };
    },
    onError: (_e, _i, ctx) => {
      utils.packing.sharedGet.setData({ token }, ctx?.prev);
      toast.error(t.sharedPackList.toggleFailed);
    },
    onSettled: () => utils.packing.sharedGet.invalidate({ token }),
  });

  if (query.isLoading) {
    return (
      <div className="container max-w-3xl py-6">
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          {t.sharedPackList.loadingShared}
        </div>
      </div>
    );
  }

  if (!query.data?.list) {
    return (
      <div className="container max-w-3xl py-6">
        <PageHeader
          title={t.sharedPackList.notFoundTitle}
          backHref="/"
          backLabel={t.sharedPackList.backHome}
        />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t.sharedPackList.invalidLink}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { list, items } = query.data;
  const checkedCount = items.filter(i => i.checked).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  // Nach Person gruppieren: «Allgemein» (ohne Zuordnung) zuerst, dann die
  // Personen der Liste, danach Alt-Zuordnungen nur aus dem assignee-Feld.
  const personKeys: (string | null)[] = [null, ...list.persons];
  for (const item of items) {
    const name = item.assignee?.trim();
    if (name && !personKeys.includes(name)) personKeys.push(name);
  }
  const sections = personKeys
    .map(person => {
      const sectionItems = items.filter(item =>
        person === null
          ? !item.assignee?.trim()
          : (item.assignee ?? "").trim() === person
      );
      const grouped = sectionItems.reduce<Record<string, typeof items>>(
        (acc, item) => {
          (acc[item.category] ??= []).push(item);
          return acc;
        },
        {}
      );
      return { person, items: sectionItems, grouped };
    })
    .filter(section => section.items.length > 0);
  // Personen-Überschriften nur, wenn es wirklich mehrere Bereiche gibt
  const showPersonHeadings = !(
    sections.length <= 1 && sections[0]?.person == null
  );

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title={list.name}
        subtitle={t.sharedPackList.subtitle(checkedCount, items.length)}
        backHref="/"
        backLabel={t.sharedPackList.backHome}
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.sharedPackList.sharedInfo}
      </div>

      <div className="mb-6">
        <Progress
          value={progress}
          aria-label={t.sharedPackList.progressAria(Math.round(progress))}
        />
      </div>

      {items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <ListChecks
              className="h-8 w-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              {t.sharedPackList.emptyList}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-7">
        {sections.map(section => (
          <section key={section.person ?? "__general__"}>
            {showPersonHeadings && (
              <h2 className="mb-3 flex items-center gap-1.5 border-b border-border pb-1.5 font-serif text-lg font-semibold">
                {section.person ? (
                  <UserRound
                    className="h-4.5 w-4.5 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <Users
                    className="h-4.5 w-4.5 text-primary"
                    aria-hidden="true"
                  />
                )}
                {section.person ?? t.packListDetail.sectionGeneral}
              </h2>
            )}
            <div className="space-y-5">
              {Object.entries(section.grouped).map(
                ([category, categoryItems]) => (
                  <div key={category}>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {category}
                    </h3>
                    <ul className="space-y-1.5">
                      {categoryItems.map(item => (
                        <li
                          key={item.id}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5",
                            item.checked && "bg-muted/60"
                          )}
                        >
                          <Checkbox
                            id={`shared-item-${item.id}`}
                            checked={item.checked}
                            onCheckedChange={value =>
                              toggleMutation.mutate({
                                token,
                                itemId: item.id,
                                checked: value === true,
                              })
                            }
                            aria-label={t.sharedPackList.checkAria(item.name)}
                          />
                          <label
                            htmlFor={`shared-item-${item.id}`}
                            className={cn(
                              "flex-1 cursor-pointer text-sm",
                              item.checked &&
                                "text-muted-foreground line-through"
                            )}
                          >
                            {item.name}
                            {item.quantity > 1 && (
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                × {item.quantity}
                              </span>
                            )}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
