/**
 * Ämtli-Wochenplan zum Ausdrucken (#430): Der Plan hängt am besten am
 * Kühlschrank im Vorzelt – mit Papier-Kästchen zum Abhaken, wie die
 * Packlisten-Druckansicht (#66). Gedruckt wird die kommende Woche ab
 * heute; wer wann was macht, kommt aus derselben Rotation wie in der
 * App (rotateAssignments, #270) – nachrechenbar, ohne Zufall.
 */
import { useEffect } from "react";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginPrompt from "@/components/LoginPrompt";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { fmtLong, fmtWeekdayDay } from "@/lib/dateFormat";
import { isStandaloneApp } from "@/lib/standalone";
import { useTodayIso } from "@/lib/useTodayIso";
import { choresForDay, rotateAssignments } from "@shared/chores";

/** ISO-Tag + n Tage über die Kalenderfelder (#333). */
function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, (d ?? 1) + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function ChoresPrintPage() {
  const { lang, t } = useI18n();
  const cp = t.choresPrint;
  const standalone = isStandaloneApp();
  const today = useTodayIso();
  const { isAuthenticated, loading } = useAuth();

  const choresQuery = trpc.chores.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const childrenQuery = trpc.family.children.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const chores = choresQuery.data ?? [];
  const children = childrenQuery.data ?? [];

  useEffect(() => {
    document.title = cp.docTitle;
    return () => {
      document.title = t.packListPrint.appTitle;
    };
  }, [cp, t]);

  if (loading || (isAuthenticated && choresQuery.isLoading)) {
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
      <div className="container max-w-2xl py-8">
        <LoginPrompt feature={t.chores.loginFeature} />
      </div>
    );
  }

  const days = Array.from({ length: 7 }, (_, i) => shiftIso(today, i));
  const childName = (id: number) =>
    children.find(child => child.id === id)?.name ?? "?";

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.common.back}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (standalone) {
              window.open(window.location.href, "_blank", "noopener");
            } else {
              window.print();
            }
          }}
        >
          <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.packListPrint.printButton}
        </Button>
      </div>
      {standalone && (
        <p className="mb-6 text-xs text-muted-foreground print:hidden">
          {t.packListPrint.printBrowserHint}
        </p>
      )}

      <div className="print-sheet">
        <header className="mb-6 border-b-2 border-foreground pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest">
            {cp.kicker}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold">{cp.title}</h1>
          <p className="mt-1 text-sm">
            {t.packListPrint.printedOn(fmtLong(new Date(), lang))}
          </p>
        </header>

        {chores.length === 0 || children.length === 0 ? (
          <p className="text-sm">{cp.empty}</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b-2 border-foreground pb-1 pr-3 text-left font-bold">
                  {cp.choreColumn}
                </th>
                {days.map(day => (
                  <th
                    key={day}
                    className="border-b-2 border-foreground pb-1 text-center font-bold"
                  >
                    {fmtWeekdayDay(day, lang)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chores.map(chore => (
                <tr key={chore.id}>
                  <td className="border-b border-foreground/30 py-2 pr-3 font-medium">
                    {chore.title}
                  </td>
                  {days.map(day => {
                    // Wochentage (#447): Rotation läuft nur über die an
                    // diesem Tag anfallenden Ämtli – wie autoAssign im Server
                    const active = choresForDay(chores, day);
                    const planned = active.some(c => c.id === chore.id)
                      ? rotateAssignments(active, children, day).find(
                          entry => entry.choreId === chore.id
                        )
                      : undefined;
                    return (
                      <td
                        key={day}
                        className="border-b border-foreground/30 py-2 text-center"
                      >
                        {planned ? (
                          <>
                            <span className="block text-xs">
                              {childName(planned.childId)}
                            </span>
                            <span
                              className="mx-auto mt-1 block h-4 w-4 rounded border border-foreground"
                              aria-hidden="true"
                            />
                          </>
                        ) : (
                          <span
                            className="text-xs text-muted-foreground"
                            aria-hidden="true"
                          >
                            –
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-4 text-xs text-muted-foreground">{cp.note}</p>
      </div>
    </div>
  );
}
