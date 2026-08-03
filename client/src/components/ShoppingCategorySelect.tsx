/**
 * Auswahl-Einträge für die Laden-Kategorie eines Einkaufs-Eintrags (#272):
 * «Ohne Kategorie», der feste Katalog in Laden-Reihenfolge, danach die eigenen
 * Kategorien der Liste (alphabetisch) und zuunterst «Neue Kategorie …», die
 * beim Aufrufer ein Inline-Namensfeld öffnet – gleiches Bedienmuster wie in
 * den Packlisten. Nur der Inhalt des Dropdowns steckt hier: Auslöser und
 * Anordnung unterscheiden sich zwischen Erfassungs-Formular und Eintragszeile.
 */
import { SelectItem } from "@/components/ui/select";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";
import {
  customCategoryName,
  SHOPPING_CATEGORIES,
  SHOPPING_CATEGORY_LABELS,
} from "@shared/shopping";

/** Select-Wert für «Ohne Kategorie» (Radix erlaubt keinen leeren String). */
export const NO_CATEGORY = "none";

/** Select-Sonderwert: «Neue Kategorie …» öffnet ein Inline-Namensfeld. */
export const CATEGORY_NEW = "__new-category__";

export default function ShoppingCategoryOptions({
  customCategories,
}: {
  /** Eigene Kategorien der Liste als gespeicherte Werte («custom:<Name>»). */
  customCategories: string[];
}) {
  const { lang, t } = useI18n();
  return (
    <>
      <SelectItem value={NO_CATEGORY}>{t.shopping.noCategory}</SelectItem>
      {SHOPPING_CATEGORIES.map(cat => (
        <SelectItem key={cat} value={cat}>
          {pick(SHOPPING_CATEGORY_LABELS[cat], lang)}
        </SelectItem>
      ))}
      {customCategories.map(cat => (
        <SelectItem key={cat} value={cat}>
          {customCategoryName(cat)}
        </SelectItem>
      ))}
      <SelectItem value={CATEGORY_NEW}>
        {t.shopping.newCategoryOption}
      </SelectItem>
    </>
  );
}
