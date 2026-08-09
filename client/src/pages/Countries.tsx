import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import {
  AlertTriangle,
  BadgeEuro,
  Bike,
  Gauge,
  Leaf,
  LifeBuoy,
  Moon,
  ShieldCheck,
  Wine,
  CreditCard,
  HandCoins,
  Plug,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  findCountryRules,
  roadRules,
  type CountryRules,
} from "@/data/roadRules";
import { LOCALE_TAGS, pick, type L4 } from "@shared/i18n";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const COUNTRY_KEY = "campmesser.roadRulesCountry";

function loadCountry(): string {
  try {
    const stored = localStorage.getItem(COUNTRY_KEY);
    if (findCountryRules(stored)) return stored as string;
  } catch {
    /* Standard */
  }
  return roadRules[0].code;
}

function saveCountry(code: string) {
  try {
    localStorage.setItem(COUNTRY_KEY, code);
  } catch {
    /* Sitzung reicht */
  }
}

/** Ein Abschnitt des Länder-Dossiers. */
function RuleCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-6">
        <p className="mb-1.5 flex items-center gap-2 font-serif text-base font-semibold">
          {icon}
          {title}
        </p>
        {children}
      </CardContent>
    </Card>
  );
}

export default function CountriesPage() {
  const { lang, t } = useI18n();
  const search = useSearch();
  const [code, setCode] = useState<string>(() => loadCountry());

  // Deep-Link aus dem Reise-Planer: ?land=IT wählt das Zielland vor
  useEffect(() => {
    const wanted = new URLSearchParams(search).get("land");
    const country = findCountryRules(wanted);
    if (country) {
      setCode(country.code);
      saveCountry(country.code);
    }
  }, [search]);

  const country: CountryRules =
    findCountryRules(code) ?? (roadRules[0] as CountryRules);
  const text = (value: L4) => pick(value, lang);
  const permille = (value: number) => {
    const fixed = value.toFixed(1);
    return lang === "en" ? fixed : fixed.replace(".", ",");
  };
  const updated = new Date(`${country.updated}T00:00:00Z`).toLocaleDateString(
    LOCALE_TAGS[lang],
    { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }
  );

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={t.roadRules.title} subtitle={t.roadRules.subtitle} />

      {/* Länderauswahl */}
      <div
        className="mb-4 flex flex-wrap gap-2"
        role="group"
        aria-label={t.roadRules.countryLabel}
      >
        {roadRules.map(entry => (
          <button
            key={entry.code}
            type="button"
            onClick={() => {
              setCode(entry.code);
              saveCountry(entry.code);
            }}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              entry.code === country.code
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={entry.code === country.code}
          >
            <span aria-hidden="true">{entry.flag}</span>{" "}
            {pick(entry.name, lang)}
          </button>
        ))}
      </div>

      {/* Warnhinweis: Regeln ändern sich */}
      <p className="mb-4 flex items-start gap-2 rounded-lg border border-chart-4/50 bg-chart-4/10 px-3.5 py-2.5 text-xs leading-relaxed">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-chart-4"
          aria-hidden="true"
        />
        <span>{t.roadRules.disclaimer}</span>
      </p>

      <RuleCard
        icon={<BadgeEuro className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.roadRules.tollTitle}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {text(country.toll)}
        </p>
        <p className="mt-2 rounded-lg bg-accent/50 px-3 py-2 text-sm text-accent-foreground">
          <span className="font-medium">{t.roadRules.trailerTitle}: </span>
          {text(country.trailer)}
        </p>
      </RuleCard>

      <RuleCard
        icon={<Gauge className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.roadRules.speedTitle}
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          {(
            [
              ["motorway", country.speed.motorway],
              ["rural", country.speed.rural],
              ["urban", country.speed.urban],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="rounded-lg bg-accent/50 py-2.5">
              <p className="font-mono text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">
                {t.roadRules.roadNames[key]}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {text(country.speedNote)}
        </p>
      </RuleCard>

      <RuleCard
        icon={<Wine className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.roadRules.bacTitle}
      >
        <p className="font-mono text-xl font-bold">
          {t.roadRules.permille(permille(country.bacPermille))}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {text(country.bacNote)}
        </p>
      </RuleCard>

      <RuleCard
        icon={
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        }
        title={t.roadRules.equipmentTitle}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {text(country.equipment)}
        </p>
      </RuleCard>

      <RuleCard
        icon={<Leaf className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.roadRules.zonesTitle}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {text(country.zones)}
        </p>
      </RuleCard>

      {/* Motorrad & Velo (#581): Maut, Helm- und Sonderregeln für
          Zweiräder – passend zur Reiseart Motorradtour/Velotour. */}
      <RuleCard
        icon={<Bike className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.roadRules.twoWheelsTitle}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {text(country.twoWheels)}
        </p>
      </RuleCard>

      <RuleCard
        icon={<Plug className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.roadRules.plugTitle}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {text(country.plug)}
        </p>
      </RuleCard>

      <RuleCard
        icon={<HandCoins className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.roadRules.tippingTitle}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {text(country.tipping)}
        </p>
      </RuleCard>

      <RuleCard
        icon={
          <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
        }
        title={t.roadRules.paymentTitle}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {text(country.payment)}
        </p>
      </RuleCard>

      <RuleCard
        icon={<LifeBuoy className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.roadRules.emergencyTitle}
      >
        <a
          href={`tel:${country.emergency}`}
          className="font-mono text-xl font-bold text-primary hover:underline"
          aria-label={t.roadRules.callAria(country.emergency)}
        >
          {country.emergency}
        </a>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {text(country.emergencyNote)}
        </p>
      </RuleCard>

      <RuleCard
        icon={<Moon className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.roadRules.campingTitle}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {text(country.camping)}
        </p>
      </RuleCard>

      <p className="text-xs text-muted-foreground">
        {t.roadRules.updatedLine(pick(country.name, lang), updated)}
      </p>
    </div>
  );
}
