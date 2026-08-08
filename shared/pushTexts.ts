import { l4, pick, type Language } from "./i18n";

/**
 * Texte der Push-Meldungen in vier Sprachen.
 *
 * WARUM ES DAS BRAUCHT: Die App ist seit #50 vollständig viersprachig – die
 * Mitteilungen waren es nicht. Im Server-Code stand sechsmal derselbe Satz:
 * «Texte deutsch, weil der Server die Sprache der Nutzer*innen nicht kennt.»
 * Das stimmte, war aber behebbar: Der Browser kennt die Sprache in dem
 * Moment, in dem er sich für Mitteilungen anmeldet. Seit #313 steht sie am
 * Abo (`pushSubscriptions.lang`), und damit endet die Übersetzung nicht mehr
 * am Sperrbildschirm.
 *
 * PRO ABO, NICHT PRO KONTO: Wer das Handy auf Französisch und das Tablet auf
 * Deutsch nutzt, bekommt die Meldung je Gerät passend – die Sprache ist eine
 * Eigenschaft des Geräts, nicht des Kontos.
 *
 * Die Bausteine sind bewusst Funktionen und keine fertigen Sätze: Zahlen,
 * Namen und Aufzählungen stehen in jeder Sprache woanders.
 */

/** «A, B und 2 weitere» – Aufzählung mit Rest-Angabe. */
export function nameList(
  names: string[],
  rest: number,
  lang: Language
): string {
  const joined = names.join(", ");
  if (rest <= 0) return joined;
  const more = pick(
    l4(
      `und ${rest} weitere`,
      `et ${rest} de plus`,
      `e altri ${rest}`,
      `and ${rest} more`
    ),
    lang
  );
  return `${joined} ${more}`;
}

/** Kühlbox: MHD-Erinnerung. */
export function foodAlertText(count: number, list: string, lang: Language) {
  return {
    title: pick(
      l4(
        "🧊 Kühlbox: MHD-Erinnerung",
        "🧊 Glacière : dates limites",
        "🧊 Frigo: scadenze",
        "🧊 Cool box: use-by reminder"
      ),
      lang
    ),
    body: pick(
      count === 1
        ? l4(
            `1 Lebensmittel läuft bald ab: ${list}`,
            `1 aliment arrive à expiration : ${list}`,
            `1 alimento sta per scadere: ${list}`,
            `1 item is about to expire: ${list}`
          )
        : l4(
            `${count} Lebensmittel laufen bald ab: ${list}`,
            `${count} aliments arrivent à expiration : ${list}`,
            `${count} alimenti stanno per scadere: ${list}`,
            `${count} items are about to expire: ${list}`
          ),
      lang
    ),
  };
}

/** Ausrüstung: fällige Pflege-Aufgaben. */
export function gearAlertText(count: number, list: string, lang: Language) {
  return {
    title: pick(
      l4(
        "🛠️ Ausrüstung: Pflege fällig",
        "🛠️ Équipement : entretien à faire",
        "🛠️ Attrezzatura: manutenzione dovuta",
        "🛠️ Gear: maintenance due"
      ),
      lang
    ),
    body: pick(
      count === 1
        ? l4(
            `1 Pflege-Aufgabe ist fällig: ${list}`,
            `1 tâche d’entretien est due : ${list}`,
            `1 attività di manutenzione è dovuta: ${list}`,
            `1 maintenance task is due: ${list}`
          )
        : l4(
            `${count} Pflege-Aufgaben sind fällig: ${list}`,
            `${count} tâches d’entretien sont dues : ${list}`,
            `${count} attività di manutenzione sono dovute: ${list}`,
            `${count} maintenance tasks are due: ${list}`
          ),
      lang
    ),
  };
}

/** Karten & Ausweise (#476): ablaufende oder abgelaufene Dokumente. */
export function docsAlertText(count: number, list: string, lang: Language) {
  return {
    title: pick(
      l4(
        "🪪 Ausweise: Ablaufdatum prüfen",
        "🪪 Documents : vérifier la date d'expiration",
        "🪪 Documenti: controllare la scadenza",
        "🪪 Documents: check expiry date"
      ),
      lang
    ),
    body: pick(
      count === 1
        ? l4(
            `1 Karte läuft bald ab oder ist abgelaufen: ${list}`,
            `1 carte expire bientôt ou est expirée : ${list}`,
            `1 tessera sta per scadere o è scaduta: ${list}`,
            `1 card is about to expire or has expired: ${list}`
          )
        : l4(
            `${count} Karten laufen bald ab oder sind abgelaufen: ${list}`,
            `${count} cartes expirent bientôt ou sont expirées : ${list}`,
            `${count} tessere stanno per scadere o sono scadute: ${list}`,
            `${count} cards are about to expire or have expired: ${list}`
          ),
      lang
    ),
  };
}

/** Sonnencreme- und Trink-Erinnerung. */
export function heatAlertText(
  input: {
    placeName: string;
    sunscreen: boolean;
    hydration: boolean;
    uvIndex: number;
    reapplyMinutes: number;
    burnMinutes: number;
    maxTempC: number;
    liters: string;
  },
  lang: Language
) {
  const parts: string[] = [];
  if (input.sunscreen) {
    parts.push(
      pick(
        l4(
          `UV ${Math.round(input.uvIndex)}: eincremen, alle ${input.reapplyMinutes} Minuten nachlegen (ungeschützt rot nach ~${input.burnMinutes} Min.)`,
          `UV ${Math.round(input.uvIndex)} : crème solaire, à renouveler toutes les ${input.reapplyMinutes} minutes (rougeurs sans protection après ~${input.burnMinutes} min)`,
          `UV ${Math.round(input.uvIndex)}: crema solare, da riapplicare ogni ${input.reapplyMinutes} minuti (senza protezione rossore dopo ~${input.burnMinutes} min)`,
          `UV ${Math.round(input.uvIndex)}: apply sunscreen, reapply every ${input.reapplyMinutes} minutes (unprotected burn after ~${input.burnMinutes} min)`
        ),
        lang
      )
    );
  }
  if (input.hydration) {
    parts.push(
      pick(
        l4(
          `${Math.round(input.maxTempC)} °C: rund ${input.liters} l Wasser pro Erwachsener einplanen`,
          `${Math.round(input.maxTempC)} °C : prévoir environ ${input.liters} l d’eau par adulte`,
          `${Math.round(input.maxTempC)} °C: prevedere circa ${input.liters} l d’acqua per adulto`,
          `${Math.round(input.maxTempC)} °C: plan for about ${input.liters} l of water per adult`
        ),
        lang
      )
    );
  }
  const title = input.sunscreen
    ? input.hydration
      ? l4(
          `☀️ ${input.placeName}: Sonne und Hitze`,
          `☀️ ${input.placeName} : soleil et chaleur`,
          `☀️ ${input.placeName}: sole e caldo`,
          `☀️ ${input.placeName}: sun and heat`
        )
      : l4(
          `☀️ ${input.placeName}: hoher UV-Index`,
          `☀️ ${input.placeName} : indice UV élevé`,
          `☀️ ${input.placeName}: indice UV alto`,
          `☀️ ${input.placeName}: high UV index`
        )
    : l4(
        `💧 ${input.placeName}: Hitzetag`,
        `💧 ${input.placeName} : journée de chaleur`,
        `💧 ${input.placeName}: giornata calda`,
        `💧 ${input.placeName}: hot day`
      );
  return { title: pick(title, lang), body: parts.join(" · ") };
}

/** Countdown vor der Anreise. */
export function tripAlertText(
  input: { days: number; name: string; pct: number | null },
  lang: Language
) {
  const inDays = pick(
    input.days === 1
      ? l4("1 Tag", "1 jour", "1 giorno", "1 day")
      : l4(
          `${input.days} Tagen`,
          `${input.days} jours`,
          `${input.days} giorni`,
          `${input.days} days`
        ),
    lang
  );
  return {
    title: pick(
      l4(
        `⛺ In ${inDays}: ${input.name}`,
        `⛺ Dans ${inDays} : ${input.name}`,
        `⛺ Fra ${inDays}: ${input.name}`,
        `⛺ In ${inDays}: ${input.name}`
      ),
      lang
    ),
    body:
      input.pct === null
        ? pick(
            l4(
              "Dein Aufenthalt beginnt bald – denk ans Packen.",
              "Ton séjour commence bientôt – pense à préparer tes bagages.",
              "Il tuo soggiorno inizia presto – pensa a fare i bagagli.",
              "Your stay starts soon – remember to pack."
            ),
            lang
          )
        : pick(
            l4(
              `Packliste zu ${input.pct} % erledigt`,
              `Liste de bagages faite à ${input.pct} %`,
              `Lista bagagli completata al ${input.pct} %`,
              `Packing list ${input.pct} % done`
            ),
            lang
          ),
  };
}

/** Vorabend-Check der Packliste. */
export function evePackAlertText(
  input: { name: string; pct: number },
  lang: Language
) {
  return {
    title: pick(
      l4(
        `⛺ Morgen geht's los: ${input.name}`,
        `⛺ Départ demain : ${input.name}`,
        `⛺ Si parte domani: ${input.name}`,
        `⛺ Off tomorrow: ${input.name}`
      ),
      lang
    ),
    body: pick(
      l4(
        `Packliste zu ${input.pct} % erledigt – schnapp dir den Rest noch heute Abend.`,
        `Liste de bagages faite à ${input.pct} % – termine le reste ce soir.`,
        `Lista bagagli al ${input.pct} % – completa il resto stasera.`,
        `Packing list ${input.pct} % done – finish the rest tonight.`
      ),
      lang
    ),
  };
}

/** Zelt trocknen nach der Heimkehr. */
export function dryingAlertText(
  input: { name: string; rainMm: number | null },
  lang: Language
) {
  if (input.rainMm !== null) {
    const mm = Math.round(input.rainMm);
    return {
      title: pick(
        l4(
          "⛺ Zelt trocknen nicht vergessen",
          "⛺ N’oublie pas de sécher la tente",
          "⛺ Non dimenticare di asciugare la tenda",
          "⛺ Do not forget to dry the tent"
        ),
        lang
      ),
      body: pick(
        l4(
          `Während «${input.name}» sind rund ${mm} mm Regen gefallen – häng das Zelt zum Trocknen auf, bevor es ins Lager kommt.`,
          `Pendant « ${input.name} », il est tombé environ ${mm} mm de pluie – fais sécher la tente avant de la ranger.`,
          `Durante «${input.name}» sono caduti circa ${mm} mm di pioggia – fai asciugare la tenda prima di riporla.`,
          `About ${mm} mm of rain fell during “${input.name}” – hang the tent up to dry before storing it.`
        ),
        lang
      ),
    };
  }
  return {
    title: pick(
      l4(
        "⛺ Zelt auslüften nicht vergessen",
        "⛺ N’oublie pas d’aérer la tente",
        "⛺ Non dimenticare di arieggiare la tenda",
        "⛺ Do not forget to air the tent"
      ),
      lang
    ),
    body: pick(
      l4(
        `Willkommen zurück von «${input.name}» – lüfte das Zelt gut aus, bevor es ins Lager kommt.`,
        `Bon retour de « ${input.name} » – aère bien la tente avant de la ranger.`,
        `Bentornato da «${input.name}» – arieggia bene la tenda prima di riporla.`,
        `Welcome back from “${input.name}” – air the tent well before storing it.`
      ),
      lang
    ),
  };
}

/** Sternschnuppen-Tipp bei klarer Nacht. */
export function meteorAlertText(
  input: { shower: string; zhr: number; placeName: string },
  lang: Language
) {
  return {
    title: pick(
      l4(
        `🌠 Heute Nacht: ${input.shower}`,
        `🌠 Cette nuit : ${input.shower}`,
        `🌠 Stanotte: ${input.shower}`,
        `🌠 Tonight: ${input.shower}`
      ),
      lang
    ),
    body: pick(
      l4(
        `Klarer Himmel am Ort «${input.placeName}» – bis zu ${input.zhr} Sternschnuppen pro Stunde.`,
        `Ciel dégagé à « ${input.placeName} » – jusqu’à ${input.zhr} étoiles filantes par heure.`,
        `Cielo sereno a «${input.placeName}» – fino a ${input.zhr} stelle cadenti all’ora.`,
        `Clear sky at “${input.placeName}” – up to ${input.zhr} meteors per hour.`
      ),
      lang
    ),
  };
}

/** Unwetter-Warnung: Titel und Zusatz für weitere Warnungen. */
export function weatherAlertText(
  input: {
    official: boolean;
    title: string;
    spotName: string;
    description: string;
    more: number;
  },
  lang: Language
) {
  const officialPrefix = pick(
    l4(
      "🚨 Amtliche Warnung:",
      "🚨 Avertissement officiel :",
      "🚨 Avviso ufficiale:",
      "🚨 Official warning:"
    ),
    lang
  );
  const title = input.official
    ? `${officialPrefix} ${input.title} – ${input.spotName}`
    : `⚠️ ${input.title} – ${input.spotName}`;
  if (input.more <= 0) return { title, body: input.description };
  const more = pick(
    l4(
      `(+${input.more} weitere Warnungen an deinen Plätzen)`,
      `(+${input.more} autres avertissements à tes emplacements)`,
      `(+${input.more} altri avvisi nelle tue piazzole)`,
      `(+${input.more} more warnings at your pitches)`
    ),
    lang
  );
  return { title, body: `${input.description} ${more}` };
}

/**
 * Neuer Zettel an der Pinnwand einer Reise (#367).
 *
 * WARUM DER TEXT MITGESCHICKT WIRD: Eine Meldung «Neuer Eintrag an der
 * Pinnwand» zwingt zum Nachschauen. Wer am Feuer sitzt, soll am
 * Sperrbildschirm schon lesen können, worum es geht – gekürzt, damit die
 * Meldung nicht zur Wand wird.
 */
export function boardAlertText(
  input: { author: string; tripName: string; text: string; isTask: boolean },
  lang: Language
) {
  const title = input.isTask
    ? l4(
        `📌 ${input.author}: neue Aufgabe`,
        `📌 ${input.author} : nouvelle tâche`,
        `📌 ${input.author}: nuovo compito`,
        `📌 ${input.author}: new task`
      )
    : l4(
        `📌 ${input.author} an der Pinnwand`,
        `📌 ${input.author} sur le tableau`,
        `📌 ${input.author} sulla bacheca`,
        `📌 ${input.author} on the pinboard`
      );
  return {
    title: pick(title, lang),
    body: `${input.tripName} · ${input.text}`,
  };
}

/**
 * Jemand ist einer gemeinsamen Reise beigetreten (#376).
 *
 * WARUM AUSGERECHNET DAS EINE MELDUNG WERT IST: Eine Einladung geht als
 * Link raus – per Nachricht, mündlich, wie auch immer. Ob sie angenommen
 * wurde, sah bis jetzt nur, wer von sich aus den Mitreisenden-Dialog
 * öffnete. Wer plant, wartet aber darauf: Solange nicht klar ist, wer
 * mitkommt, kann man weder Betten noch Essen einteilen.
 *
 * EINMAL PRO PERSON, nie mehr: Beitreten passiert genau einmal. Das ist
 * das Gegenteil von Lärm – und der Grund, warum es hier keine
 * Zusammenfassung wie bei den Kühlbox-Meldungen braucht.
 */
export function tripJoinAlertText(
  input: { person: string; tripName: string },
  lang: Language
) {
  const title = l4(
    `🎒 ${input.person} ist dabei`,
    `🎒 ${input.person} est de la partie`,
    `🎒 ${input.person} è dei nostri`,
    `🎒 ${input.person} is coming along`
  );
  const body = l4(
    `${input.person} ist deiner Reise «${input.tripName}» beigetreten.`,
    `${input.person} a rejoint ton voyage « ${input.tripName} ».`,
    `${input.person} si è aggiunto al tuo viaggio «${input.tripName}».`,
    `${input.person} joined your trip “${input.tripName}”.`
  );
  return { title: pick(title, lang), body: pick(body, lang) };
}
