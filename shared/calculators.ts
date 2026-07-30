/**
 * Berechnungslogik für Energie-Budget, Trinkwasser und Pack-Optimierung.
 * Reine Funktionen – von Client und Tests gemeinsam genutzt.
 */

export interface ConsumerInput {
  name: string;
  watts: number;
  hoursPerDay: number;
  enabled?: boolean;
}

export interface EnergyBudgetInput {
  batteryWh: number;
  consumers: ConsumerInput[];
  /** Solarpanel-Nennleistung gesamt in Watt (z. B. 2× 200 W = 400) */
  solarPanelWatts: number;
  /** Effektive Sonnenstunden pro Tag (wetter- und jahreszeitabhängig) */
  sunHoursPerDay: number;
  /** Systemwirkungsgrad Solar (Ausrichtung, Kabel, Laderegler), Standard 0.7 */
  solarEfficiency?: number;
}

export interface EnergyBudgetResult {
  dailyConsumptionWh: number;
  dailySolarYieldWh: number;
  netDailyWh: number;
  /** Autarkie in Tagen; Infinity, wenn Solar den Verbrauch deckt */
  autonomyDays: number;
  selfSufficient: boolean;
}

export function calcEnergyBudget(input: EnergyBudgetInput): EnergyBudgetResult {
  const efficiency = input.solarEfficiency ?? 0.7;
  const dailyConsumptionWh = input.consumers
    .filter(c => c.enabled !== false)
    .reduce((sum, c) => sum + Math.max(0, c.watts) * Math.max(0, c.hoursPerDay), 0);
  const dailySolarYieldWh = Math.max(0, input.solarPanelWatts) * Math.max(0, input.sunHoursPerDay) * efficiency;
  const netDailyWh = dailyConsumptionWh - dailySolarYieldWh;
  const selfSufficient = netDailyWh <= 0 && dailyConsumptionWh > 0;
  let autonomyDays: number;
  if (dailyConsumptionWh === 0) {
    autonomyDays = Infinity;
  } else if (netDailyWh <= 0) {
    autonomyDays = Infinity;
  } else {
    autonomyDays = input.batteryWh / netDailyWh;
  }
  return { dailyConsumptionWh, dailySolarYieldWh, netDailyWh, autonomyDays, selfSufficient };
}

export interface WaterInput {
  adults: number;
  children: number;
  /** Anzahl Hunde (ca. 60 ml pro kg Körpergewicht; wir rechnen mit mittelgrossem Hund) */
  dogs?: number;
  days: number;
  /** Erwartete Tageshöchsttemperatur in °C */
  maxTempC: number;
  /** Aktivitätslevel: ruhig | normal | aktiv */
  activity: "ruhig" | "normal" | "aktiv";
  /** Wird auch mit dem Wasser gekocht/abgewaschen? */
  includeCookingHygiene: boolean;
  /** Komfortable Körperpflege (Katzenwäsche/Solar-Dusche): +4 l pro Person und Tag */
  includeComfortHygiene?: boolean;
}

export interface WaterResult {
  drinkingLitersPerAdult: number;
  drinkingLitersPerChild: number;
  drinkingLitersPerDog: number;
  totalDrinkingLiters: number;
  dogLiters: number;
  cookingHygieneLiters: number;
  comfortHygieneLiters: number;
  totalLiters: number;
  recommendedLiters: number;
}

/**
 * Trinkwasser-Berechnung:
 * Basis 2 l pro Erwachsene*n und Tag, 1.2 l pro Kind.
 * Temperaturzuschlag: +0.5 l pro 5 °C über 20 °C.
 * Aktivitätszuschlag: normal +0.5 l, aktiv +1 l.
 * Hund (mittelgross, ca. 20 kg): Basis 1.5 l pro Tag, gleicher Temperatur-/Aktivitätszuschlag wie Kind.
 * Kochen/Hygiene: +1.5 l pro Person und Tag.
 * Komfortable Körperpflege: +4 l pro Person und Tag.
 * Sicherheitsreserve: +20 %.
 */
export function calcWaterNeeds(input: WaterInput): WaterResult {
  const tempSurcharge = Math.max(0, Math.ceil((input.maxTempC - 20) / 5)) * 0.5;
  const activitySurcharge = input.activity === "aktiv" ? 1 : input.activity === "normal" ? 0.5 : 0;
  const drinkingLitersPerAdult = 2 + tempSurcharge + activitySurcharge;
  const drinkingLitersPerChild = 1.2 + tempSurcharge * 0.7 + activitySurcharge * 0.6;
  const drinkingLitersPerDog = 1.5 + tempSurcharge * 0.7 + activitySurcharge * 0.6;
  const dogs = input.dogs ?? 0;
  const persons = input.adults + input.children;
  const totalDrinkingLiters =
    (input.adults * drinkingLitersPerAdult + input.children * drinkingLitersPerChild) * input.days;
  const dogLiters = dogs * drinkingLitersPerDog * input.days;
  const cookingHygieneLiters = input.includeCookingHygiene ? persons * 1.5 * input.days : 0;
  const comfortHygieneLiters = input.includeComfortHygiene ? persons * 4 * input.days : 0;
  const totalLiters = totalDrinkingLiters + dogLiters + cookingHygieneLiters + comfortHygieneLiters;
  const recommendedLiters = Math.ceil(totalLiters * 1.2);
  return {
    drinkingLitersPerAdult,
    drinkingLitersPerChild,
    drinkingLitersPerDog,
    totalDrinkingLiters,
    dogLiters,
    cookingHygieneLiters,
    comfortHygieneLiters,
    totalLiters,
    recommendedLiters,
  };
}

export interface PackItemInput {
  name: string;
  weightGrams: number;
  volumeLiters: number;
  quantity: number;
  category: string;
}

export interface TransportProfile {
  id: string;
  label: string;
  maxWeightKg: number;
  maxVolumeLiters: number;
  hint: string;
}

export const transportProfiles: TransportProfile[] = [
  {
    id: "motorrad",
    label: "Motorrad",
    maxWeightKg: 30,
    maxVolumeLiters: 90,
    hint: "Typisch: 2 Seitenkoffer à ca. 30 l plus Gepäckrolle 30 l. Schwere Sachen nach unten und nah zur Fahrzeugmitte packen.",
  },
  {
    id: "kleinwagen",
    label: "Kleinwagen",
    maxWeightKg: 150,
    maxVolumeLiters: 300,
    hint: "Kofferraum ca. 300 l. Schwere Kisten unten, Zelt zuletzt einladen – es kommt am Zeltplatz zuerst raus.",
  },
  {
    id: "kombi",
    label: "Kombi / SUV",
    maxWeightKg: 300,
    maxVolumeLiters: 550,
    hint: "Viel Platz – aber Sichtfeld freihalten und schwere Ausrüstung gegen Verrutschen sichern.",
  },
  {
    id: "rucksack",
    label: "Nur Rucksack",
    maxWeightKg: 16,
    maxVolumeLiters: 65,
    hint: "Faustregel: Rucksackgewicht max. 20–25 % des Körpergewichts. Schweres nah am Rücken auf Schulterhöhe.",
  },
];

export interface PackAnalysis {
  totalWeightKg: number;
  totalVolumeLiters: number;
  weightPercent: number;
  volumePercent: number;
  heaviestItems: PackItemInput[];
  bulkiestItems: PackItemInput[];
  hints: string[];
}

export function analyzePack(items: PackItemInput[], profile: TransportProfile): PackAnalysis {
  const totalWeightKg = items.reduce((s, i) => s + (i.weightGrams * i.quantity) / 1000, 0);
  const totalVolumeLiters = items.reduce((s, i) => s + i.volumeLiters * i.quantity, 0);
  const weightPercent = profile.maxWeightKg > 0 ? (totalWeightKg / profile.maxWeightKg) * 100 : 0;
  const volumePercent = profile.maxVolumeLiters > 0 ? (totalVolumeLiters / profile.maxVolumeLiters) * 100 : 0;
  const sortedByWeight = [...items].sort((a, b) => b.weightGrams * b.quantity - a.weightGrams * a.quantity);
  const sortedByVolume = [...items].sort((a, b) => b.volumeLiters * b.quantity - a.volumeLiters * a.quantity);

  const hints: string[] = [];
  if (weightPercent > 100) {
    hints.push(
      `Zuladung um ${(totalWeightKg - profile.maxWeightKg).toFixed(1)} kg überschritten – prüfe die schwersten Positionen.`,
    );
  } else if (weightPercent > 85) {
    hints.push("Gewicht nahe am Limit – plane Reserven für Wasser und Lebensmittel ein.");
  }
  if (volumePercent > 100) {
    hints.push(
      `Packvolumen um ${(totalVolumeLiters - profile.maxVolumeLiters).toFixed(0)} l überschritten – Kompressionssäcke helfen bei Schlafsack und Kleidung.`,
    );
  } else if (volumePercent > 85) {
    hints.push("Volumen fast ausgeschöpft – weiche Teile (Kleidung) in Lücken stopfen statt separat packen.");
  }
  if (weightPercent <= 85 && volumePercent <= 85 && items.length > 0) {
    hints.push("Gute Reserve – Gewicht und Volumen liegen im grünen Bereich.");
  }
  if (items.length === 0) {
    hints.push("Füge Ausrüstung aus deinem Inventar hinzu, um die Analyse zu starten.");
  }
  return {
    totalWeightKg,
    totalVolumeLiters,
    weightPercent,
    volumePercent,
    heaviestItems: sortedByWeight.slice(0, 3),
    bulkiestItems: sortedByVolume.slice(0, 3),
    hints,
  };
}
