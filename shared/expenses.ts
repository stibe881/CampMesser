/**
 * Reisekasse pro Reise (#219): Kategorien, Summen und der Ausgleich
 * («wer schuldet wem»). Reine Funktionen ohne DOM/React – von der
 * Reise-Seite, dem Router und den Tests genutzt.
 *
 * Alle Beträge sind Ganzzahlen in RAPPEN (Muster money.ts / weightGrams) –
 * mit Fliesskommazahlen ginge beim Aufteilen sonst je nach Rundung ein
 * Rappen verloren.
 */
import { l4, type L4 } from "./i18n";

/** Gespeicherte Kategorie-Schlüssel (deutsch, wie im übrigen Projekt). */
export const EXPENSE_CATEGORIES = [
  "camping",
  "essen",
  "sprit",
  "freizeit",
  "sonstiges",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Anzeige-Labels der Kategorien – der Schlüssel bleibt in der Datenbank. */
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, L4> = {
  camping: l4("Camping", "Camping", "Campeggio", "Camping"),
  essen: l4("Essen", "Repas", "Cibo", "Food"),
  sprit: l4("Sprit", "Carburant", "Carburante", "Fuel"),
  freizeit: l4("Freizeit", "Loisirs", "Tempo libero", "Leisure"),
  sonstiges: l4("Sonstiges", "Divers", "Varie", "Other"),
};

/** Maximale Länge der Beschreibung (DB: varchar(160)). */
export const EXPENSE_DESCRIPTION_MAX_LENGTH = 160;
/** Maximale Länge des Namens «wer bezahlt hat» (DB: varchar(80)). */
export const EXPENSE_PAID_BY_MAX_LENGTH = 80;
/** Grösster erfassbarer Einzelbetrag: 100 000 CHF – fängt Tippfehler ab. */
export const EXPENSE_MAX_RAPPEN = 10_000_000;

/** Unbekannte Kategorien landen bei «Sonstiges». */
export function normalizeExpenseCategory(value: string): ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value)
    ? (value as ExpenseCategory)
    : "sonstiges";
}

/** Minimalform eines Ausgaben-Eintrags für Summen und Aufteilungen. */
export interface ExpenseLike {
  amountRappen: number;
  category: string;
}

/** Ganzzahliger, nicht negativer Rappen-Betrag (ungültige Werte = 0). */
function cleanRappen(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value);
}

/** Gesamtsumme aller Ausgaben in Rappen. */
export function expensesTotalRappen(expenses: readonly ExpenseLike[]): number {
  return expenses.reduce((sum, e) => sum + cleanRappen(e.amountRappen), 0);
}

/**
 * Summe je Kategorie – in der festen Reihenfolge von EXPENSE_CATEGORIES,
 * damit die Balken zwischen zwei Aufrufen nicht springen. Kategorien ohne
 * Ausgaben erscheinen mit 0.
 */
export function expensesByCategory(
  expenses: readonly ExpenseLike[]
): { category: ExpenseCategory; rappen: number }[] {
  return EXPENSE_CATEGORIES.map(category => ({
    category,
    rappen: expenses.reduce(
      (sum, e) =>
        normalizeExpenseCategory(e.category) === category
          ? sum + cleanRappen(e.amountRappen)
          : sum,
      0
    ),
  }));
}

/** Wer hat wie viel bezahlt (mehrere Zeilen pro Person sind erlaubt). */
export interface Payment {
  who: string;
  rappen: number;
}

/** Eine Ausgleichszahlung: `from` überweist `rappen` an `to`. */
export interface Settlement {
  from: string;
  to: string;
  rappen: number;
}

interface Payer {
  /** Anzeigename in der Schreibweise des ersten Vorkommens. */
  name: string;
  /** Reihenfolge des ersten Vorkommens – hält das Ergebnis stabil. */
  order: number;
  paid: number;
  balance: number;
}

/**
 * Einfacher Ausgleich: alle zahlen gleich viel, ausgeglichen wird mit
 * möglichst wenigen Zahlungen.
 *
 * - Mehrere Einträge derselben Person werden zusammengezählt; Gross-/
 *   Kleinschreibung und Leerzeichen am Rand spielen dabei keine Rolle
 *   («Anna» und «anna » sind dieselbe Person), angezeigt wird die zuerst
 *   erfasste Schreibweise.
 * - Personen mit 0 Rappen zählen mit: Wer nichts bezahlt hat, schuldet
 *   trotzdem seinen Anteil.
 * - Rundung: Der Anteil ist `floor(Summe / Anzahl)`; die übrigen 1–(n-1)
 *   Rappen tragen die zuerst erfassten Personen. Dadurch ist die Summe der
 *   Anteile EXAKT die Gesamtsumme und die Ausgleichszahlungen gehen genau
 *   auf – es bleibt kein Rappen liegen.
 * - Ausgeglichen wird gierig: die grösste Schuld an das grösste Guthaben.
 *   Das ergibt höchstens n-1 Zahlungen.
 */
export function settleUp(payments: readonly Payment[]): Settlement[] {
  const payers: Payer[] = [];
  const indexByKey = new Map<string, number>();
  payments.forEach(payment => {
    const name = (payment.who ?? "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    const known = indexByKey.get(key);
    if (known === undefined) {
      indexByKey.set(key, payers.length);
      payers.push({
        name,
        order: payers.length,
        paid: cleanRappen(payment.rappen),
        balance: 0,
      });
    } else {
      payers[known].paid += cleanRappen(payment.rappen);
    }
  });

  if (payers.length < 2) return [];

  const total = payers.reduce((sum, p) => sum + p.paid, 0);
  if (total <= 0) return [];

  const base = Math.floor(total / payers.length);
  // Die 1–(n-1) übrigen Rappen tragen die zuerst erfassten Personen; damit
  // ergibt die Summe der Anteile exakt wieder die Gesamtsumme.
  const remainder = total - base * payers.length;
  payers.forEach(payer => {
    const share = base + (payer.order < remainder ? 1 : 0);
    payer.balance = payer.paid - share;
  });

  // Schuldner (grösste Schuld zuerst) und Guthaben (grösstes zuerst)
  const debtors = payers
    .filter(p => p.balance < 0)
    .map(p => ({ name: p.name, order: p.order, open: -p.balance }))
    .sort((a, b) => b.open - a.open || a.order - b.order);
  const creditors = payers
    .filter(p => p.balance > 0)
    .map(p => ({ name: p.name, order: p.order, open: p.balance }))
    .sort((a, b) => b.open - a.open || a.order - b.order);

  const settlements: Settlement[] = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const amount = Math.min(debtor.open, creditor.open);
    if (amount > 0) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        rappen: amount,
      });
      debtor.open -= amount;
      creditor.open -= amount;
    }
    if (debtor.open === 0) d++;
    if (creditor.open === 0) c++;
  }
  return settlements;
}
