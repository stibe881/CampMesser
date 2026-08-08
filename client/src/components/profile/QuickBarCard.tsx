/**
 * Profil-Karte «QuickBarCard» – aus Profile.tsx herausgelöst (#414).
 * Die Seite war nach #408 über 1600 Zeilen; die fünf grossen Karten
 * wohnen jetzt hier (Muster wie die Aufteilung von Trips.tsx, #322).
 */
import { useState } from "react";
import CollapsibleCard from "@/components/CollapsibleCard";
import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { modules } from "@/data/modules";
import { pick } from "@shared/i18n";
import {
  DEFAULT_QUICK_BAR,
  QUICK_BAR_SOS,
  QUICK_BAR_START,
  isDefaultQuickBar,
  sanitizeQuickBar,
  setQuickBarSlot,
} from "@shared/quickBar";
import {
  loadQuickBar,
  quickBarChoices,
  saveQuickBar,
} from "@/lib/quickBarStore";

/**
 * Schnellzugriff-Leiste frei belegen (#297).
 *
 * Vier Auswahlfelder für die vier freien Plätze; Start und SOS stehen
 * als unveränderliche Enden daneben, damit man sieht, WARUM es nur vier
 * sind. Die Begründung dazu steht in shared/quickBar.ts.
 */
export default function QuickBarCard() {
  const { lang, t } = useI18n();
  const qb = t.quickBar;
  const [custom, setCustom] = useState<string[]>(() => loadQuickBar());
  const sync = useSyncedSetting<unknown>("quickBar", value => {
    setCustom(sanitizeQuickBar(value, quickBarChoices()));
  });

  const apply = (next: string[]) => {
    setCustom(next);
    saveQuickBar(next);
    sync.push(next);
    // Die Leiste steckt im AppShell und liest beim Laden aus dem
    // localStorage – ein Ereignis erspart einen globalen Zustand.
    window.dispatchEvent(new Event("campmesser:quickbar"));
  };

  const choices = modules
    .filter(module => module.path !== QUICK_BAR_START)
    .filter(module => module.path !== QUICK_BAR_SOS)
    .slice()
    .sort((a, b) => pick(a.title, lang).localeCompare(pick(b.title, lang)));

  return (
    <CollapsibleCard
      className="mb-5"
      icon={<LayoutGrid className="h-4 w-4 text-primary" aria-hidden="true" />}
      title={qb.title}
    >
      <p className="text-sm text-muted-foreground">{qb.intro}</p>
      <div className="mt-3 space-y-2">
        {custom.map((path, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-xs text-muted-foreground">
              {index + 1}.
            </span>
            <Select
              value={path}
              onValueChange={value =>
                apply(setQuickBarSlot(custom, index, value))
              }
            >
              <SelectTrigger aria-label={qb.slotAria(index + 1)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {choices.map(module => (
                  <SelectItem key={module.path} value={module.path}>
                    {pick(module.title, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{qb.fixed}</p>
      {!isDefaultQuickBar(custom) && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-muted-foreground"
          onClick={() => apply([...DEFAULT_QUICK_BAR])}
        >
          {qb.reset}
        </Button>
      )}
    </CollapsibleCard>
  );
}
