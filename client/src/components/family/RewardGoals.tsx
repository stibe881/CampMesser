/**
 * Belohnungs-Ziele (#399): Ämtli-Punkte einlösen.
 *
 * DIE RANGLISTE WAR NUR EINE TABELLE – Punkte, mit denen man nichts
 * machen kann, hören auf zu motivieren. Hier legen die Eltern Ziele fest
 * («Glacé am Kiosk – 20 Punkte»), das Kind sieht seinen Fortschritt als
 * Balken und löst ein, wenn es reicht. Verfügbar = verdient − eingelöst;
 * die Einlösung prüft der Server noch einmal gegen den echten Stand.
 */
import { useState } from "react";
import { Gift, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { fmtShort } from "@/lib/dateFormat";
import type { ScoreRow } from "@shared/chores";
import {
  MAX_REWARDS,
  MAX_REWARD_POINTS,
  REWARD_TITLE_MAX_LENGTH,
  availablePoints,
  rewardProgress,
} from "@shared/rewards";
import { cn } from "@/lib/utils";

export default function RewardGoals({
  scores,
  className,
}: {
  /** Punktestand aus der Rangliste – dieselbe Rechnung, dieselbe Quelle. */
  scores: ScoreRow[];
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tr = t.rewards;
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ title: "", points: "" });
  const [childId, setChildId] = useState<number | null>(null);

  const rewardsQuery = trpc.rewards.list.useQuery();
  const redemptionsQuery = trpc.rewards.redemptions.useQuery();
  const rewards = rewardsQuery.data ?? [];
  const redemptions = redemptionsQuery.data ?? [];

  const invalidate = () => {
    void utils.rewards.list.invalidate();
    void utils.rewards.redemptions.invalidate();
  };
  const addMutation = trpc.rewards.add.useMutation({
    onSuccess: () => {
      invalidate();
      setForm({ title: "", points: "" });
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });
  const removeMutation = trpc.rewards.remove.useMutation({
    onSuccess: invalidate,
    onError: e => toast.error(e.message || t.common.deleteFailed),
  });
  const redeemMutation = trpc.rewards.redeem.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success(tr.redeemed);
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });

  // Ohne Kinder in der Rangliste gibt es niemanden, der einlösen könnte.
  if (scores.length === 0) return null;

  const selectedId = childId ?? scores[0].childId;
  const selected = scores.find(row => row.childId === selectedId) ?? scores[0];
  const available = availablePoints(
    selected.points,
    redemptions,
    selected.childId
  );

  return (
    <Card className={className}>
      <CardContent className="pt-5">
        <p className="mb-1 flex items-center gap-2 font-serif text-lg font-bold">
          <Gift className="h-5 w-5 text-chart-1" aria-hidden="true" />
          {tr.title}
        </p>
        <p className="mb-3 text-xs text-muted-foreground">{tr.hint}</p>

        {/* Wessen Punkte? Chips wie beim Reisepass. */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {scores.map(row => (
            <button
              key={row.childId}
              type="button"
              aria-pressed={row.childId === selected.childId}
              onClick={() => setChildId(row.childId)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                row.childId === selected.childId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {row.name}
            </button>
          ))}
        </div>
        <p className="mb-3 text-sm">
          {tr.availableLine(selected.name, available)}
        </p>

        {rewards.length === 0 ? (
          <p className="mb-3 text-sm text-muted-foreground">{tr.empty}</p>
        ) : (
          <ul className="mb-3 space-y-2.5">
            {rewards.map(reward => {
              const progress = rewardProgress(available, reward.points);
              const reachable = available >= reward.points;
              return (
                <li key={reward.id}>
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 text-sm font-medium">
                      {reward.title}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {tr.pointsLine(reward.points)}
                    </span>
                    <Button
                      size="sm"
                      disabled={!reachable || redeemMutation.isPending}
                      onClick={() =>
                        redeemMutation.mutate({
                          rewardId: reward.id,
                          childId: selected.childId,
                        })
                      }
                    >
                      {tr.redeem}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
                      onClick={() => removeMutation.mutate({ id: reward.id })}
                      aria-label={tr.removeAria(reward.title)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                  <div
                    className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={tr.progressAria(
                      selected.name,
                      reward.title,
                      progress
                    )}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        reachable ? "bg-primary" : "bg-chart-1"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {rewards.length < MAX_REWARDS && (
          <form
            className="mb-3 grid grid-cols-[1fr_5rem_auto] gap-2"
            onSubmit={e => {
              e.preventDefault();
              const title = form.title.trim();
              const points = Number(form.points);
              if (!title || !(points > 0)) {
                toast.error(tr.formError);
                return;
              }
              addMutation.mutate({ title, points });
            }}
          >
            <Input
              value={form.title}
              maxLength={REWARD_TITLE_MAX_LENGTH}
              placeholder={tr.titlePlaceholder}
              aria-label={tr.titlePlaceholder}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <Input
              value={form.points}
              type="number"
              min="1"
              max={MAX_REWARD_POINTS}
              placeholder={tr.pointsPlaceholder}
              aria-label={tr.pointsPlaceholder}
              onChange={e => setForm(f => ({ ...f, points: e.target.value }))}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={addMutation.isPending}
              aria-label={tr.addAria}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        )}

        {/* Eingelöstes: die Jüngsten zuoberst, mehr als fünf braucht niemand */}
        {redemptions.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tr.historyTitle}
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {redemptions.slice(0, 5).map(entry => {
                const child = scores.find(r => r.childId === entry.childId);
                return (
                  <li key={entry.id}>
                    {tr.historyLine(
                      child?.name ?? "?",
                      entry.title,
                      entry.points,
                      fmtShort(new Date(entry.redeemedAt), lang)
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
