import { useMemo, useState } from "react";
import {
  Backpack,
  Bike,
  Car,
  CarFront,
  Loader2,
  Scale,
  TrendingDown,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { analyzePack, transportProfiles } from "@shared/calculators";
import { pick } from "@shared/i18n";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const profileIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  motorrad: Bike,
  kleinwagen: CarFront,
  kombi: Car,
  rucksack: Backpack,
};

export default function PackOptimizerPage() {
  const { isAuthenticated, loading } = useAuth();
  const { lang, t } = useI18n();
  const query = trpc.inventory.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [profileId, setProfileId] = useState("kombi");

  const profile = transportProfiles.find(p => p.id === profileId)!;

  const analysis = useMemo(() => {
    const items = (query.data ?? []).map(i => ({
      name: i.name,
      weightGrams: i.weightGrams,
      volumeLiters: i.volumeLiters,
      quantity: i.quantity,
      category: i.category,
    }));
    return analyzePack(items, profile, lang);
  }, [query.data, profile, lang]);

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
          title={t.packOptimizer.title}
          subtitle={t.packOptimizer.subtitleLoggedOut}
        />
        <LoginPrompt feature={t.packOptimizer.loginFeature} />
      </div>
    );
  }

  const barColor = (percent: number) =>
    percent > 100
      ? "bg-destructive"
      : percent > 85
        ? "bg-chart-1"
        : "bg-primary";

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title={t.packOptimizer.title}
        subtitle={t.packOptimizer.subtitle}
      />

      {/* Transportprofil */}
      <h2 className="mb-3 font-serif text-lg font-semibold">
        {t.packOptimizer.transportTitle}
      </h2>
      <div
        className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="group"
        aria-label={t.packOptimizer.transportGroupAria}
      >
        {transportProfiles.map(p => {
          const Icon = profileIcons[p.id] ?? Car;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setProfileId(p.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3.5 transition-all",
                profileId === p.id
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-primary/40"
              )}
              aria-pressed={profileId === p.id}
            >
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold">
                {pick(p.label, lang)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {p.maxWeightKg} kg · {p.maxVolumeLiters} l
              </span>
            </button>
          );
        })}
      </div>

      {/* Auslastung */}
      <Card className="mb-6">
        <CardContent className="space-y-5 pt-6">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">{t.packOptimizer.weight}</span>
              <span className="font-mono">
                {analysis.totalWeightKg.toFixed(1)} / {profile.maxWeightKg} kg
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(analysis.weightPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t.packOptimizer.weightPercentAria(
                Math.round(analysis.weightPercent)
              )}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  barColor(analysis.weightPercent)
                )}
                style={{ width: `${Math.min(100, analysis.weightPercent)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">{t.packOptimizer.volume}</span>
              <span className="font-mono">
                {analysis.totalVolumeLiters.toFixed(0)} /{" "}
                {profile.maxVolumeLiters} l
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(analysis.volumePercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t.packOptimizer.volumePercentAria(
                Math.round(analysis.volumePercent)
              )}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  barColor(analysis.volumePercent)
                )}
                style={{ width: `${Math.min(100, analysis.volumePercent)}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {pick(profile.hint, lang)}
          </p>
        </CardContent>
      </Card>

      {/* Hinweise */}
      <h2 className="mb-3 font-serif text-lg font-semibold">
        {t.packOptimizer.hintsTitle}
      </h2>
      <ul className="mb-6 space-y-2">
        {analysis.hints.map(hint => (
          <li
            key={hint}
            className="flex gap-2.5 rounded-xl border border-border bg-card p-3.5 text-sm"
          >
            <TrendingDown
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            {hint}
          </li>
        ))}
      </ul>

      {/* Top-Positionen */}
      {analysis.heaviestItems.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Scale className="h-4 w-4" aria-hidden="true" />
                {t.packOptimizer.heaviestTitle}
              </h3>
              <ol className="space-y-2 text-sm">
                {analysis.heaviestItems.map(item => (
                  <li key={item.name} className="flex justify-between gap-2">
                    <span>
                      {item.name}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {((item.weightGrams * item.quantity) / 1000).toFixed(1)}{" "}
                      kg
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Backpack className="h-4 w-4" aria-hidden="true" />
                {t.packOptimizer.bulkiestTitle}
              </h3>
              <ol className="space-y-2 text-sm">
                {analysis.bulkiestItems.map(item => (
                  <li key={item.name} className="flex justify-between gap-2">
                    <span>
                      {item.name}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {(item.volumeLiters * item.quantity).toFixed(1)} l
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}

      {(query.data ?? []).length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t.packOptimizer.emptyPrefix}{" "}
          <Link
            href="/inventar"
            className="font-medium text-primary hover:underline"
          >
            {t.packOptimizer.emptyLink}
          </Link>{" "}
          {t.packOptimizer.emptySuffix}
        </p>
      )}
    </div>
  );
}
