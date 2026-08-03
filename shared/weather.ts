/**
 * Wetter-Logik: WMO-Codes, Camping-Warnstufen und Unwetter-Erkennung
 * aus Open-Meteo-Vorhersagedaten. Reine Funktionen – von Client und Tests genutzt.
 * Anzeigetexte sind vollständig übersetzt (L4); Default-Sprache bleibt Deutsch,
 * damit Server-Aufrufer (z. B. Push-Warnungen) unverändert funktionieren.
 */

import { l4, pick, LOCALE_TAGS, type L4, type Language } from "./i18n";

export interface HourlyWeather {
  time: string;
  temperatureC: number;
  apparentC: number;
  precipitationMm: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  weatherCode: number;
  cape: number;
  cloudCover: number;
  /**
   * Windrichtung in Grad, meteorologisch gezählt (0 = aus Norden, 90 = aus
   * Osten). Optional: nur das Wetter-Modul ruft `wind_direction_10m` ab.
   */
  windDirectionDeg?: number;
}

export interface DailyWeather {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationSumMm: number;
  precipitationProbabilityMax: number;
  windGustsMaxKmh: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
}

/** Ein 15-Minuten-Slot der Open-Meteo-Kurzfrist-Prognose (minutely_15). */
export interface RainSlot {
  /** Beginn des Slots (lokale ISO-Zeit, deckt [time, time + 15 min) ab) */
  time: string;
  precipitationMm: number;
}

/** Nächstes Regen-Fenster ab «jetzt» aus den 15-Minuten-Slots. */
export interface RainWindow {
  /** Beginn des nächsten Regens (null, wenn es bereits regnet) */
  startsAt: string | null;
  /** Ende des Regens (null, wenn er über die Datenreichweite hinaus anhält) */
  endsAt: string | null;
  /** Regnet es zum Zeitpunkt `now` bereits? */
  ongoing: boolean;
}

/** Ab dieser Menge pro 15 Minuten gilt ein Slot als «Regen». */
const RAIN_SLOT_MM = 0.1;
const SLOT_MS = 15 * 60000;

/**
 * Wann beginnt bzw. endet der nächste Regen? Betrachtet werden alle Slots
 * ab dem, der `now` enthält (Slots decken jeweils 15 Minuten ab).
 * Rückgabe null, wenn in der Datenreichweite kein Regen (mehr) ansteht.
 */
export function nextRainWindow(
  slots: RainSlot[],
  now: Date
): RainWindow | null {
  const relevant = slots.filter(s => {
    const t = new Date(s.time).getTime();
    return Number.isFinite(t) && t + SLOT_MS > now.getTime();
  });
  if (relevant.length === 0) return null;
  const rainy = relevant.map(s => (s.precipitationMm ?? 0) >= RAIN_SLOT_MM);

  if (rainy[0]) {
    // Es regnet bereits – Ende = erster trockener Slot danach
    const endIdx = rainy.findIndex(r => !r);
    return {
      ongoing: true,
      startsAt: null,
      endsAt: endIdx === -1 ? null : relevant[endIdx].time,
    };
  }

  const startIdx = rainy.findIndex(r => r);
  if (startIdx === -1) return null;
  let endIdx: number | null = null;
  for (let i = startIdx + 1; i < rainy.length; i++) {
    if (!rainy[i]) {
      endIdx = i;
      break;
    }
  }
  return {
    ongoing: false,
    startsAt: relevant[startIdx].time,
    endsAt: endIdx === null ? null : relevant[endIdx].time,
  };
}

export type AlertSeverity = "info" | "warnung" | "gefahr";

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  /** Zeitfenster der Warnung (lokale ISO-Zeit der ersten betroffenen Stunde) */
  startTime: string;
  advice: string;
}

/** WMO-Wettercode in ein L4-Label und einen Icon-Schlüssel übersetzen. */
function weatherCodeL4(code: number): { label: L4; icon: string } {
  if (code === 0)
    return {
      label: l4("Klarer Himmel", "Ciel dégagé", "Cielo sereno", "Clear sky"),
      icon: "sun",
    };
  if (code === 1)
    return {
      label: l4(
        "Überwiegend klar",
        "Plutôt dégagé",
        "Prevalentemente sereno",
        "Mostly clear"
      ),
      icon: "sun",
    };
  if (code === 2)
    return {
      label: l4(
        "Teilweise bewölkt",
        "Partiellement nuageux",
        "Parzialmente nuvoloso",
        "Partly cloudy"
      ),
      icon: "cloud-sun",
    };
  if (code === 3)
    return {
      label: l4("Bedeckt", "Couvert", "Coperto", "Overcast"),
      icon: "cloud",
    };
  if (code === 45 || code === 48)
    return { label: l4("Nebel", "Brouillard", "Nebbia", "Fog"), icon: "fog" };
  if (code >= 51 && code <= 57)
    return {
      label: l4("Nieselregen", "Bruine", "Pioviggine", "Drizzle"),
      icon: "drizzle",
    };
  if (code >= 61 && code <= 65)
    return { label: l4("Regen", "Pluie", "Pioggia", "Rain"), icon: "rain" };
  if (code === 66 || code === 67)
    return {
      label: l4(
        "Gefrierender Regen",
        "Pluie verglaçante",
        "Pioggia gelata",
        "Freezing rain"
      ),
      icon: "rain",
    };
  if (code >= 71 && code <= 77)
    return {
      label: l4("Schneefall", "Chute de neige", "Nevicata", "Snowfall"),
      icon: "snow",
    };
  if (code >= 80 && code <= 82)
    return {
      label: l4(
        "Regenschauer",
        "Averses",
        "Rovesci di pioggia",
        "Rain showers"
      ),
      icon: "rain",
    };
  if (code === 85 || code === 86)
    return {
      label: l4(
        "Schneeschauer",
        "Averses de neige",
        "Rovesci di neve",
        "Snow showers"
      ),
      icon: "snow",
    };
  if (code === 95)
    return {
      label: l4("Gewitter", "Orage", "Temporale", "Thunderstorm"),
      icon: "storm",
    };
  if (code === 96 || code === 99)
    return {
      label: l4(
        "Gewitter mit Hagel",
        "Orage avec grêle",
        "Temporale con grandine",
        "Thunderstorm with hail"
      ),
      icon: "storm",
    };
  return {
    label: l4("Unbekannt", "Inconnu", "Sconosciuto", "Unknown"),
    icon: "cloud",
  };
}

/** WMO-Wettercode in Anzeigetext (gewählte Sprache) und Icon-Schlüssel übersetzen */
export function describeWeatherCode(
  code: number,
  lang: Language = "de"
): {
  label: string;
  icon: string;
} {
  const { label, icon } = weatherCodeL4(code);
  return { label: pick(label, lang), icon };
}

/** UV-Stufen nach WHO-Skala (gerundeter Index): 0–2, 3–5, 6–7, 8–10, 11+ */
export type UvLevel = "niedrig" | "maessig" | "hoch" | "sehrHoch" | "extrem";

const UV_LEVELS: Record<UvLevel, { label: L4; advice: L4 | null }> = {
  niedrig: {
    label: l4("Niedrig", "Faible", "Basso", "Low"),
    advice: null,
  },
  maessig: {
    label: l4("Mässig", "Modéré", "Moderato", "Moderate"),
    advice: null,
  },
  hoch: {
    label: l4("Hoch", "Élevé", "Alto", "High"),
    advice: l4(
      "Sonnencreme (LSF 30+) auftragen, Sonnenhut und Sonnenbrille tragen und über Mittag den Schatten aufsuchen.",
      "Applique de la crème solaire (IP 30+), porte un chapeau et des lunettes de soleil et reste à l'ombre à la mi-journée.",
      "Applica la crema solare (SPF 30+), indossa cappello e occhiali da sole e cerca l'ombra nelle ore centrali.",
      "Apply sunscreen (SPF 30+), wear a sun hat and sunglasses and seek shade around midday."
    ),
  },
  sehrHoch: {
    label: l4("Sehr hoch", "Très élevé", "Molto alto", "Very high"),
    advice: l4(
      "Zwischen 11 und 15 Uhr möglichst im Schatten bleiben, Haut bedecken und Sonnencreme (LSF 50+) regelmässig nachcremen.",
      "Reste autant que possible à l'ombre entre 11 h et 15 h, couvre ta peau et remets régulièrement de la crème solaire (IP 50+).",
      "Tra le 11 e le 15 resta il più possibile all'ombra, copri la pelle e riapplica regolarmente la crema solare (SPF 50+).",
      "Stay in the shade between 11 am and 3 pm if possible, cover your skin and reapply sunscreen (SPF 50+) regularly."
    ),
  },
  extrem: {
    label: l4("Extrem", "Extrême", "Estremo", "Extreme"),
    advice: l4(
      "Mittagssonne unbedingt meiden, lange Kleidung und Sonnenhut tragen, Sonnencreme (LSF 50+) mehrfach auftragen – besonders am Wasser und in den Bergen.",
      "Évite absolument le soleil de midi, porte des vêtements longs et un chapeau, applique plusieurs fois de la crème solaire (IP 50+) – surtout au bord de l'eau et en montagne.",
      "Evita assolutamente il sole di mezzogiorno, indossa abiti lunghi e un cappello, applica più volte la crema solare (SPF 50+) – soprattutto vicino all'acqua e in montagna.",
      "Avoid the midday sun entirely, wear long clothing and a sun hat, apply sunscreen (SPF 50+) several times – especially near water and in the mountains."
    ),
  },
};

/** UV-Index (WHO-Skala) in die Stufe übersetzen – gerundet wie in der Anzeige. */
export function uvLevelForIndex(uv: number): UvLevel {
  const v = Math.round(uv);
  if (v <= 2) return "niedrig";
  if (v <= 5) return "maessig";
  if (v <= 7) return "hoch";
  if (v <= 10) return "sehrHoch";
  return "extrem";
}

/**
 * UV-Index in Stufe, Stufen-Label und Schutzhinweis übersetzen.
 * Der Hinweis ist erst ab Stufe «hoch» gesetzt (WHO-Empfehlung), sonst null.
 */
export function describeUvIndex(
  uv: number,
  lang: Language = "de"
): { level: UvLevel; label: string; advice: string | null } {
  const level = uvLevelForIndex(uv);
  const entry = UV_LEVELS[level];
  return {
    level,
    label: pick(entry.label, lang),
    advice: entry.advice ? pick(entry.advice, lang) : null,
  };
}

/**
 * Unwetter-Erkennung für die nächsten 48 h – speziell auf Zelt-Camping ausgelegt.
 * Schwellenwerte orientieren sich an MeteoSchweiz-Warnstufen:
 * - Windböen: ab 60 km/h Warnung (Zeltstangen), ab 90 km/h Gefahr
 * - Starkregen: ab 6 mm/h Warnung, ab 15 mm/h Gefahr
 * - Gewitter: WMO 95/96/99 oder CAPE > 1500 J/kg
 * - Hitze: gefühlte Temperatur ab 33 °C
 * - Frost: unter 0 °C
 */
export function detectAlerts(
  hours: HourlyWeather[],
  lang: Language = "de"
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const next48 = hours.slice(0, 48);

  const gustHour = next48.find(h => h.windGustsKmh >= 90);
  const windHour = next48.find(h => h.windGustsKmh >= 60);
  if (gustHour) {
    const maxGust = Math.round(Math.max(...next48.map(h => h.windGustsKmh)));
    const when = formatHour(gustHour.time, lang);
    alerts.push({
      id: "sturm",
      severity: "gefahr",
      title: pick(
        l4(
          "Sturmböen erwartet",
          "Rafales tempétueuses attendues",
          "Raffiche di tempesta in arrivo",
          "Storm gusts expected"
        ),
        lang
      ),
      description: pick(
        l4(
          `Böen bis ${maxGust} km/h ab ${when}.`,
          `Rafales jusqu'à ${maxGust} km/h dès ${when}.`,
          `Raffiche fino a ${maxGust} km/h da ${when}.`,
          `Gusts up to ${maxGust} km/h from ${when}.`
        ),
        lang
      ),
      startTime: gustHour.time,
      advice: pick(
        l4(
          "Zelt sturmfest machen: alle Abspannleinen setzen, Heringe tief einschlagen, Tarp abbauen. Bei Sturm nicht unter Bäumen aufhalten.",
          "Prépare la tente à la tempête : tends tous les haubans, enfonce bien les sardines, démonte le tarp. Ne reste pas sous les arbres pendant la tempête.",
          "Prepara la tenda alla tempesta: fissa tutti i tiranti, pianta bene i picchetti, smonta il tarp. Durante la tempesta non sostare sotto gli alberi.",
          "Storm-proof the tent: attach all guy lines, drive the pegs in deep, take down the tarp. Do not shelter under trees during a storm."
        ),
        lang
      ),
    });
  } else if (windHour) {
    const maxGust = Math.round(Math.max(...next48.map(h => h.windGustsKmh)));
    const when = formatHour(windHour.time, lang);
    alerts.push({
      id: "wind",
      severity: "warnung",
      title: pick(
        l4("Starker Wind", "Vent fort", "Vento forte", "Strong wind"),
        lang
      ),
      description: pick(
        l4(
          `Böen bis ${maxGust} km/h ab ${when}.`,
          `Rafales jusqu'à ${maxGust} km/h dès ${when}.`,
          `Raffiche fino a ${maxGust} km/h da ${when}.`,
          `Gusts up to ${maxGust} km/h from ${when}.`
        ),
        lang
      ),
      startTime: windHour.time,
      advice: pick(
        l4(
          "Abspannleinen nachspannen, lose Gegenstände (Stühle, Tisch) sichern, Markise oder Tarp prüfen.",
          "Retends les haubans, sécurise les objets non fixés (chaises, table), vérifie l'auvent ou le tarp.",
          "Tendi di nuovo i tiranti, metti al sicuro gli oggetti sciolti (sedie, tavolo), controlla la veranda o il tarp.",
          "Re-tension the guy lines, secure loose items (chairs, table), check the awning or tarp."
        ),
        lang
      ),
    });
  }

  const heavyRain = next48.find(h => h.precipitationMm >= 15);
  const rain = next48.find(h => h.precipitationMm >= 6);
  if (heavyRain) {
    const maxRain = Math.max(...next48.map(h => h.precipitationMm)).toFixed(0);
    const when = formatHour(heavyRain.time, lang);
    alerts.push({
      id: "starkregen",
      severity: "gefahr",
      title: pick(
        l4(
          "Starkregen erwartet",
          "Fortes précipitations attendues",
          "Precipitazioni intense in arrivo",
          "Heavy rain expected"
        ),
        lang
      ),
      description: pick(
        l4(
          `Bis ${maxRain} mm Regen pro Stunde ab ${when}.`,
          `Jusqu'à ${maxRain} mm de pluie par heure dès ${when}.`,
          `Fino a ${maxRain} mm di pioggia all'ora da ${when}.`,
          `Up to ${maxRain} mm of rain per hour from ${when}.`
        ),
        lang
      ),
      startTime: heavyRain.time,
      advice: pick(
        l4(
          "Zeltgraben prüfen, nicht in Mulden oder an Bachläufen campieren – Gefahr von Überflutung. Ausrüstung wasserdicht verpacken.",
          "Vérifie la rigole de la tente, ne campe pas dans des creux ni au bord des ruisseaux – risque d'inondation. Emballe l'équipement de façon étanche.",
          "Controlla la canaletta della tenda, non campeggiare in avvallamenti o lungo i ruscelli – rischio di allagamento. Imballa l'attrezzatura in modo impermeabile.",
          "Check the tent drainage channel, do not camp in hollows or next to streams – risk of flooding. Pack your equipment waterproof."
        ),
        lang
      ),
    });
  } else if (rain) {
    const maxRain = Math.max(...next48.map(h => h.precipitationMm)).toFixed(1);
    const when = formatHour(rain.time, lang);
    alerts.push({
      id: "regen",
      severity: "warnung",
      title: pick(
        l4(
          "Kräftiger Regen",
          "Pluie soutenue",
          "Pioggia sostenuta",
          "Steady rain"
        ),
        lang
      ),
      description: pick(
        l4(
          `Bis ${maxRain} mm pro Stunde ab ${when}.`,
          `Jusqu'à ${maxRain} mm par heure dès ${when}.`,
          `Fino a ${maxRain} mm all'ora da ${when}.`,
          `Up to ${maxRain} mm per hour from ${when}.`
        ),
        lang
      ),
      startTime: rain.time,
      advice: pick(
        l4(
          "Regensachen bereitlegen, Zeltboden-Wanne kontrollieren und empfindliche Ausrüstung ins Zeltinnere räumen.",
          "Prépare les affaires de pluie, contrôle le fond de tente en baignoire et range l'équipement sensible à l'intérieur de la tente.",
          "Prepara l'abbigliamento antipioggia, controlla il fondo a catino della tenda e sposta l'attrezzatura delicata all'interno della tenda.",
          "Get rain gear ready, check the tent's bathtub floor and move sensitive equipment inside the tent."
        ),
        lang
      ),
    });
  }

  const thunderHour = next48.find(
    h => h.weatherCode === 95 || h.weatherCode === 96 || h.weatherCode === 99
  );
  const capeHour = next48.find(h => h.cape > 1500);
  if (thunderHour) {
    const hail = next48.some(h => h.weatherCode === 96 || h.weatherCode === 99);
    const when = formatHour(thunderHour.time, lang);
    alerts.push({
      id: "gewitter",
      severity: "gefahr",
      title: hail
        ? pick(
            l4(
              "Gewitter mit Hagel",
              "Orage avec grêle",
              "Temporale con grandine",
              "Thunderstorm with hail"
            ),
            lang
          )
        : pick(
            l4(
              "Gewitter erwartet",
              "Orage attendu",
              "Temporale in arrivo",
              "Thunderstorm expected"
            ),
            lang
          ),
      description: pick(
        l4(
          `Gewitter ab ${when}${hail ? ", örtlich mit Hagel" : ""}.`,
          `Orage dès ${when}${hail ? ", localement avec grêle" : ""}.`,
          `Temporale da ${when}${hail ? ", localmente con grandine" : ""}.`,
          `Thunderstorm from ${when}${hail ? ", locally with hail" : ""}.`
        ),
        lang
      ),
      startTime: thunderHour.time,
      advice: pick(
        l4(
          "Rechtzeitig Schutz suchen (Auto oder festes Gebäude, nicht das Zelt). Abstand zu einzelnen Bäumen und Gewässern halten.",
          "Cherche un abri à temps (voiture ou bâtiment en dur, pas la tente). Garde tes distances avec les arbres isolés et les plans d'eau.",
          "Cerca riparo per tempo (auto o edificio solido, non la tenda). Mantieni la distanza da alberi isolati e specchi d'acqua.",
          "Seek shelter in good time (car or solid building, not the tent). Keep away from single trees and open water."
        ),
        lang
      ),
    });
  } else if (capeHour) {
    const when = formatHour(capeHour.time, lang);
    alerts.push({
      id: "gewitterneigung",
      severity: "warnung",
      title: pick(
        l4(
          "Erhöhte Gewitterneigung",
          "Tendance orageuse accrue",
          "Maggiore tendenza temporalesca",
          "Increased thunderstorm risk"
        ),
        lang
      ),
      description: pick(
        l4(
          `Labile Luftschichtung ab ${when} – lokale Gewitter möglich.`,
          `Stratification instable de l'air dès ${when} – orages locaux possibles.`,
          `Aria instabile da ${when} – possibili temporali locali.`,
          `Unstable air mass from ${when} – local thunderstorms possible.`
        ),
        lang
      ),
      startTime: capeHour.time,
      advice: pick(
        l4(
          "Himmel im Auge behalten (Quellwolken), Wetter-Update vor dem Abend prüfen und Camp gewittersicher einrichten.",
          "Surveille le ciel (cumulus bourgeonnants), vérifie la météo avant le soir et prépare le camp pour l'orage.",
          "Tieni d'occhio il cielo (cumuli in crescita), controlla l'aggiornamento meteo prima di sera e prepara il campo al temporale.",
          "Keep an eye on the sky (building cumulus), check a weather update before the evening and set up camp storm-ready."
        ),
        lang
      ),
    });
  }

  const heatHour = next48.find(h => h.apparentC >= 33);
  if (heatHour) {
    const maxHeat = Math.round(Math.max(...next48.map(h => h.apparentC)));
    alerts.push({
      id: "hitze",
      severity: "warnung",
      title: pick(
        l4("Grosse Hitze", "Forte chaleur", "Gran caldo", "Intense heat"),
        lang
      ),
      description: pick(
        l4(
          `Gefühlte Temperaturen bis ${maxHeat} °C.`,
          `Températures ressenties jusqu'à ${maxHeat} °C.`,
          `Temperature percepite fino a ${maxHeat} °C.`,
          `Feels-like temperatures up to ${maxHeat} °C.`
        ),
        lang
      ),
      startTime: heatHour.time,
      advice: pick(
        l4(
          "Mehr Wasser einplanen (Trinkwasser-Rechner nutzen), Zelt in den Schatten stellen, Mittagshitze meiden.",
          "Prévois plus d'eau (utilise le calculateur d'eau potable), place la tente à l'ombre, évite la chaleur de midi.",
          "Pianifica più acqua (usa il calcolatore dell'acqua potabile), monta la tenda all'ombra, evita il caldo di mezzogiorno.",
          "Plan for more water (use the drinking water calculator), pitch the tent in the shade, avoid the midday heat."
        ),
        lang
      ),
    });
  }

  const frostHour = next48.find(h => h.temperatureC <= 0);
  if (frostHour) {
    const minTemp = Math.round(Math.min(...next48.map(h => h.temperatureC)));
    const when = formatHour(frostHour.time, lang);
    alerts.push({
      id: "frost",
      severity: "info",
      title: pick(
        l4(
          "Frost in der Nacht",
          "Gel pendant la nuit",
          "Gelo notturno",
          "Night frost"
        ),
        lang
      ),
      description: pick(
        l4(
          `Temperaturen bis ${minTemp} °C ab ${when}.`,
          `Températures jusqu'à ${minTemp} °C dès ${when}.`,
          `Temperature fino a ${minTemp} °C da ${when}.`,
          `Temperatures down to ${minTemp} °C from ${when}.`
        ),
        lang
      ),
      startTime: frostHour.time,
      advice: pick(
        l4(
          "Warmen Schlafsack (Komfortbereich prüfen), Isomatte mit gutem R-Wert und Mütze für die Nacht bereitlegen.",
          "Prépare un sac de couchage chaud (vérifie la zone de confort), un matelas isolant avec un bon indice R et un bonnet pour la nuit.",
          "Prepara un sacco a pelo caldo (verifica la zona comfort), un materassino con un buon valore R e un berretto per la notte.",
          "Have a warm sleeping bag ready (check its comfort rating), a sleeping mat with a good R-value and a hat for the night."
        ),
        lang
      ),
    });
  }

  const severityOrder: Record<AlertSeverity, number> = {
    gefahr: 0,
    warnung: 1,
    info: 2,
  };
  return alerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

function formatHour(isoTime: string, lang: Language): string {
  const d = new Date(isoTime);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today.getTime() + 86400000);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const hh = `${d.getHours()}:00`;
  if (isToday)
    return pick(
      l4(
        `heute ${hh} Uhr`,
        `aujourd'hui à ${hh}`,
        `oggi alle ${hh}`,
        `today at ${hh}`
      ),
      lang
    );
  if (isTomorrow)
    return pick(
      l4(
        `morgen ${hh} Uhr`,
        `demain à ${hh}`,
        `domani alle ${hh}`,
        `tomorrow at ${hh}`
      ),
      lang
    );
  const wd = d.toLocaleDateString(LOCALE_TAGS[lang], { weekday: "short" });
  return pick(
    l4(
      `${wd} ${hh} Uhr`,
      `${wd} à ${hh}`,
      `${wd} alle ${hh}`,
      `${wd} at ${hh}`
    ),
    lang
  );
}
