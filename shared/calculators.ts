/**
 * Berechnungslogik für Energie-Budget, Trinkwasser und Pack-Optimierung.
 * Reine Funktionen – von Client und Tests gemeinsam genutzt.
 */
import { l4, pick, type L4, type Language } from "./i18n";

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
    .reduce(
      (sum, c) => sum + Math.max(0, c.watts) * Math.max(0, c.hoursPerDay),
      0
    );
  const dailySolarYieldWh =
    Math.max(0, input.solarPanelWatts) *
    Math.max(0, input.sunHoursPerDay) *
    efficiency;
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
  return {
    dailyConsumptionWh,
    dailySolarYieldWh,
    netDailyWh,
    autonomyDays,
    selfSufficient,
  };
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
  const activitySurcharge =
    input.activity === "aktiv" ? 1 : input.activity === "normal" ? 0.5 : 0;
  const drinkingLitersPerAdult = 2 + tempSurcharge + activitySurcharge;
  const drinkingLitersPerChild =
    1.2 + tempSurcharge * 0.7 + activitySurcharge * 0.6;
  const drinkingLitersPerDog =
    1.5 + tempSurcharge * 0.7 + activitySurcharge * 0.6;
  const dogs = input.dogs ?? 0;
  const persons = input.adults + input.children;
  const totalDrinkingLiters =
    (input.adults * drinkingLitersPerAdult +
      input.children * drinkingLitersPerChild) *
    input.days;
  const dogLiters = dogs * drinkingLitersPerDog * input.days;
  const cookingHygieneLiters = input.includeCookingHygiene
    ? persons * 1.5 * input.days
    : 0;
  const comfortHygieneLiters = input.includeComfortHygiene
    ? persons * 4 * input.days
    : 0;
  const totalLiters =
    totalDrinkingLiters +
    dogLiters +
    cookingHygieneLiters +
    comfortHygieneLiters;
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
  label: L4;
  maxWeightKg: number;
  maxVolumeLiters: number;
  hint: L4;
}

export const transportProfiles: TransportProfile[] = [
  {
    id: "motorrad",
    label: l4("Motorrad", "Moto", "Moto", "Motorbike"),
    maxWeightKg: 30,
    maxVolumeLiters: 90,
    hint: l4(
      "Typisch: 2 Seitenkoffer à ca. 30 l plus Gepäckrolle 30 l. Schwere Sachen nach unten und nah zur Fahrzeugmitte packen.",
      "Typique : 2 valises latérales d'env. 30 l plus un sac de selle de 30 l. Range le lourd en bas et près du centre du véhicule.",
      "Tipico: 2 valigie laterali da ca. 30 l più un borsone da 30 l. Metti le cose pesanti in basso e vicino al centro del veicolo.",
      "Typical: 2 panniers of about 30 l each plus a 30 l roll bag. Pack heavy items low and close to the centre of the bike."
    ),
  },
  {
    id: "kleinwagen",
    label: l4("Kleinwagen", "Petite voiture", "Utilitaria", "Small car"),
    maxWeightKg: 150,
    maxVolumeLiters: 300,
    hint: l4(
      "Kofferraum ca. 300 l. Schwere Kisten unten, Zelt zuletzt einladen – es kommt am Zeltplatz zuerst raus.",
      "Coffre d'env. 300 l. Caisses lourdes en bas, la tente en dernier – c'est elle qui sort en premier à l'emplacement.",
      "Bagagliaio di ca. 300 l. Casse pesanti in basso, tenda per ultima – in piazzola sarà la prima a uscire.",
      "Boot of about 300 l. Heavy boxes at the bottom, tent loaded last – it comes out first at the pitch."
    ),
  },
  {
    id: "kombi",
    label: l4(
      "Kombi / SUV",
      "Break / SUV",
      "Station wagon / SUV",
      "Estate / SUV"
    ),
    maxWeightKg: 300,
    maxVolumeLiters: 550,
    hint: l4(
      "Viel Platz – aber Sichtfeld freihalten und schwere Ausrüstung gegen Verrutschen sichern.",
      "Beaucoup de place – mais garde le champ de vision dégagé et arrime l'équipement lourd pour qu'il ne glisse pas.",
      "Tanto spazio – ma lascia libera la visuale e fissa l'attrezzatura pesante perché non scivoli.",
      "Plenty of space – but keep the view clear and secure heavy gear so it cannot slide."
    ),
  },
  {
    id: "rucksack",
    label: l4("Nur Rucksack", "Sac à dos seul", "Solo zaino", "Backpack only"),
    maxWeightKg: 16,
    maxVolumeLiters: 65,
    hint: l4(
      "Faustregel: Rucksackgewicht max. 20–25 % des Körpergewichts. Schweres nah am Rücken auf Schulterhöhe.",
      "Règle de base : poids du sac max. 20–25 % du poids du corps. Le lourd près du dos, à hauteur des épaules.",
      "Regola pratica: peso dello zaino max. 20–25 % del peso corporeo. Le cose pesanti vicino alla schiena, all'altezza delle spalle.",
      "Rule of thumb: pack weight max. 20–25% of body weight. Heavy items close to your back at shoulder height."
    ),
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

export function analyzePack(
  items: PackItemInput[],
  profile: TransportProfile,
  lang: Language = "de"
): PackAnalysis {
  const totalWeightKg = items.reduce(
    (s, i) => s + (i.weightGrams * i.quantity) / 1000,
    0
  );
  const totalVolumeLiters = items.reduce(
    (s, i) => s + i.volumeLiters * i.quantity,
    0
  );
  const weightPercent =
    profile.maxWeightKg > 0 ? (totalWeightKg / profile.maxWeightKg) * 100 : 0;
  const volumePercent =
    profile.maxVolumeLiters > 0
      ? (totalVolumeLiters / profile.maxVolumeLiters) * 100
      : 0;
  const sortedByWeight = [...items].sort(
    (a, b) => b.weightGrams * b.quantity - a.weightGrams * a.quantity
  );
  const sortedByVolume = [...items].sort(
    (a, b) => b.volumeLiters * b.quantity - a.volumeLiters * a.quantity
  );

  const hints: string[] = [];
  if (weightPercent > 100) {
    const over = (totalWeightKg - profile.maxWeightKg).toFixed(1);
    hints.push(
      pick(
        l4(
          `Zuladung um ${over} kg überschritten – prüfe die schwersten Positionen.`,
          `Charge utile dépassée de ${over} kg – vérifie les positions les plus lourdes.`,
          `Carico superato di ${over} kg – controlla le posizioni più pesanti.`,
          `Payload exceeded by ${over} kg – check the heaviest items.`
        ),
        lang
      )
    );
  } else if (weightPercent > 85) {
    hints.push(
      pick(
        l4(
          "Gewicht nahe am Limit – plane Reserven für Wasser und Lebensmittel ein.",
          "Poids proche de la limite – prévois des réserves pour l'eau et les provisions.",
          "Peso vicino al limite – prevedi riserve per acqua e provviste.",
          "Weight close to the limit – leave reserves for water and food."
        ),
        lang
      )
    );
  }
  if (volumePercent > 100) {
    const over = (totalVolumeLiters - profile.maxVolumeLiters).toFixed(0);
    hints.push(
      pick(
        l4(
          `Packvolumen um ${over} l überschritten – Kompressionssäcke helfen bei Schlafsack und Kleidung.`,
          `Volume dépassé de ${over} l – des sacs de compression aident pour le sac de couchage et les vêtements.`,
          `Volume superato di ${over} l – i sacchi a compressione aiutano con sacco a pelo e vestiti.`,
          `Packing volume exceeded by ${over} l – compression sacks help with sleeping bag and clothing.`
        ),
        lang
      )
    );
  } else if (volumePercent > 85) {
    hints.push(
      pick(
        l4(
          "Volumen fast ausgeschöpft – weiche Teile (Kleidung) in Lücken stopfen statt separat packen.",
          "Volume presque épuisé – glisse les pièces souples (vêtements) dans les interstices au lieu de les emballer séparément.",
          "Volume quasi esaurito – infila i pezzi morbidi (vestiti) negli spazi vuoti invece di imballarli a parte.",
          "Volume almost used up – stuff soft items (clothing) into gaps instead of packing them separately."
        ),
        lang
      )
    );
  }
  if (weightPercent <= 85 && volumePercent <= 85 && items.length > 0) {
    hints.push(
      pick(
        l4(
          "Gute Reserve – Gewicht und Volumen liegen im grünen Bereich.",
          "Bonne réserve – le poids et le volume sont dans le vert.",
          "Buona riserva – peso e volume sono nella zona verde.",
          "Good reserve – weight and volume are well within limits."
        ),
        lang
      )
    );
  }
  if (items.length === 0) {
    hints.push(
      pick(
        l4(
          "Füge Ausrüstung aus deinem Inventar hinzu, um die Analyse zu starten.",
          "Ajoute de l'équipement depuis ton inventaire pour lancer l'analyse.",
          "Aggiungi attrezzatura dal tuo inventario per avviare l'analisi.",
          "Add gear from your inventory to start the analysis."
        ),
        lang
      )
    );
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
