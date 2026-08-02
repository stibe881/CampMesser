/**
 * Icon-Chips für die Platz-Eigenschaften: löst die lucide-Icon-Namen aus dem
 * Attribut-Katalog (shared/spotAttributes.ts) in Komponenten auf und zeigt
 * gesetzte Attribute als kleine Chips. Ja-Werte zeigen nur das Label
 * («WLAN»), alle anderen Werte «Label: Wert» («Schatten: viel»).
 */
import {
  Baby,
  Dog,
  MapPin,
  Plug,
  ShoppingCart,
  ShowerHead,
  TreePine,
  Volume2,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import {
  listSpotAttributes,
  type SpotAttributes,
} from "@shared/spotAttributes";
import { pick, type Language } from "@shared/i18n";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  TreePine,
  ShowerHead,
  Volume2,
  Wifi,
  Plug,
  Dog,
  Baby,
  ShoppingCart,
};

export default function SpotAttributeChips({
  attributes,
  lang,
  compact = false,
  className,
}: {
  attributes: SpotAttributes;
  lang: Language;
  /** Kleinere Chips für die Favoriten-Karten */
  compact?: boolean;
  className?: string;
}) {
  const entries = listSpotAttributes(attributes);
  if (entries.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {entries.map(({ def, value }) => {
        const Icon = ICONS[def.icon] ?? MapPin;
        const label = pick(def.label, lang);
        const text =
          value.value === "yes"
            ? label
            : `${label}: ${pick(value.label, lang)}`;
        return (
          <li
            key={def.key}
            className={cn(
              "flex items-center gap-1 rounded-full border border-border bg-muted font-medium text-foreground",
              compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
            )}
          >
            <Icon
              className={cn(
                "shrink-0 text-primary",
                compact ? "h-3 w-3" : "h-3.5 w-3.5"
              )}
              aria-hidden="true"
            />
            {text}
          </li>
        );
      })}
    </ul>
  );
}
