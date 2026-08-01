/**
 * Offline Erste-Hilfe-Guide – alle Inhalte sind im App-Bundle enthalten
 * und funktionieren vollständig ohne Internetverbindung.
 * Hinweis: Ersetzt keine professionelle medizinische Hilfe.
 */
export interface FirstAidStep {
  title: string;
  text: string;
}

export interface FirstAidTopic {
  id: string;
  title: string;
  icon: string;
  severity: "leicht" | "mittel" | "ernst";
  summary: string;
  symptoms: string[];
  steps: FirstAidStep[];
  warning: string;
  kidNote?: string;
}

export const firstAidTopics: FirstAidTopic[] = [
  {
    id: "zeckenbiss",
    title: "Zeckenbiss",
    icon: "Bug",
    severity: "mittel",
    summary:
      "Zecken sollten so schnell wie möglich entfernt werden, um das Risiko einer Borreliose- oder FSME-Übertragung zu senken.",
    symptoms: [
      "Festgesaugte Zecke auf der Haut",
      "Später: Rötung um die Stichstelle (Wanderröte)",
      "Grippeähnliche Beschwerden Tage bis Wochen danach",
    ],
    steps: [
      {
        title: "Zecke fassen",
        text: "Mit einer Zeckenzange, Zeckenkarte oder feinen Pinzette die Zecke möglichst hautnah am Kopf fassen – nicht am vollgesogenen Körper quetschen.",
      },
      {
        title: "Langsam herausziehen",
        text: "Die Zecke langsam und kontrolliert gerade herausziehen. Nicht drehen, nicht mit Öl oder Klebstoff beträufeln.",
      },
      {
        title: "Stichstelle desinfizieren",
        text: "Die Einstichstelle mit einem Desinfektionsmittel reinigen und die Stelle mit einem Stift markieren oder fotografieren.",
      },
      {
        title: "Beobachten",
        text: "Die Stelle über 4–6 Wochen beobachten. Bei einer ringförmigen Rötung (Wanderröte), Fieber oder Gelenkschmerzen ärztliche Hilfe aufsuchen.",
      },
    ],
    warning:
      "Bei kreisrunder, wandernder Rötung, Fieber oder starkem Krankheitsgefühl unbedingt ärztlich abklären lassen. In FSME-Risikogebieten (fast die ganze Schweiz) an die Impfung denken.",
    kidNote:
      "Kinder nach jedem Tag draussen gründlich absuchen – besonders Haaransatz, Ohren, Achseln, Leisten und Kniekehlen.",
  },
  {
    id: "verbrennung",
    title: "Verbrennung & Verbrühung",
    icon: "Flame",
    severity: "ernst",
    summary:
      "Typische Camping-Verletzung am Gaskocher, Feuer oder mit heissem Wasser. Schnelles, richtiges Kühlen lindert Schmerz und begrenzt den Schaden.",
    symptoms: [
      "Rötung und Schmerz (Grad 1)",
      "Blasenbildung (Grad 2)",
      "Weisse oder verkohlte, schmerzarme Haut (Grad 3 – Notfall)",
    ],
    steps: [
      {
        title: "Gefahr stoppen",
        text: "Hitzequelle entfernen, brennende Kleidung löschen (Wasser, Decke, Wälzen). Verbrühte Kleidung sofort ausziehen, eingebrannte Kleidung belassen.",
      },
      {
        title: "Kühlen – aber richtig",
        text: "Kleinflächige Verbrennungen sofort 10–20 Minuten mit handwarmem Leitungswasser (ca. 20 °C) kühlen. Kein Eis, keine Kühlbox-Akkus direkt auf die Haut.",
      },
      {
        title: "Wunde schützen",
        text: "Blasen nicht öffnen. Wunde locker mit steriler, nicht flusender Wundauflage abdecken. Keine Hausmittel wie Mehl, Butter oder Zahnpasta.",
      },
      {
        title: "Grösse einschätzen",
        text: "Als Faustregel entspricht die Handfläche der betroffenen Person etwa 1 % der Körperoberfläche. Ab ca. 5 % (bei Kindern weniger) ärztliche Hilfe holen.",
      },
    ],
    warning:
      "Bei grossflächigen Verbrennungen, Verbrennungen im Gesicht, an Händen, Gelenken oder Genitalien sowie bei Kindern immer ärztliche Hilfe (112) anfordern. Grossflächig nie kühlen – Unterkühlungsgefahr.",
    kidNote:
      "Kinderhaut ist dünner – schon kurzer Kontakt mit heissem Wasser kann tiefe Verbrühungen verursachen. Im Zweifel immer ärztlich abklären.",
  },
  {
    id: "verstauchung",
    title: "Verstauchung & Zerrung",
    icon: "Footprints",
    severity: "mittel",
    summary:
      "Umgeknickte Knöchel gehören zu den häufigsten Verletzungen auf unebenem Gelände. Die PECH-Regel hilft in den ersten Stunden.",
    symptoms: [
      "Schmerz beim Auftreten oder Bewegen",
      "Schwellung und Bluterguss",
      "Eingeschränkte Beweglichkeit",
    ],
    steps: [
      {
        title: "P – Pause",
        text: "Aktivität sofort stoppen und das Gelenk ruhigstellen. Nicht «weiterlaufen, bis es geht».",
      },
      {
        title: "E – Eis",
        text: "15–20 Minuten kühlen (Kühlakku in ein Tuch gewickelt, kalter Bachlauf). Nie Eis direkt auf die Haut.",
      },
      {
        title: "C – Compression",
        text: "Elastische Binde anlegen – fest, aber nicht abschnürend. Zehen müssen warm und rosig bleiben.",
      },
      {
        title: "H – Hochlagern",
        text: "Das Gelenk über Herzhöhe lagern, z. B. auf dem Rucksack. Das reduziert die Schwellung.",
      },
    ],
    warning:
      "Wenn kein Auftreten möglich ist, das Gelenk stark deformiert wirkt oder der Schmerz direkt auf dem Knochen sitzt, an einen Bruch denken und ärztliche Hilfe holen.",
    kidNote:
      "Kinder klagen oft erst spät – bei Humpeln oder Schonhaltung das Gelenk in Ruhe anschauen.",
  },
  {
    id: "schnittwunde",
    title: "Schnittwunde",
    icon: "Slice",
    severity: "mittel",
    summary:
      "Beim Schnitzen, Kochen oder Hantieren mit Heringen passieren schnell Schnittverletzungen. Sauberkeit und Druck sind entscheidend.",
    symptoms: [
      "Blutende Wunde",
      "Bei tiefen Schnitten: klaffende Wundränder",
      "Starke Blutung bei verletzten Gefässen",
    ],
    steps: [
      {
        title: "Blutung stillen",
        text: "Mit steriler Kompresse oder sauberem Tuch direkt auf die Wunde drücken. Betroffenes Körperteil hochhalten.",
      },
      {
        title: "Wunde reinigen",
        text: "Sichtbaren Schmutz mit sauberem (Trink-)Wasser ausspülen. Wunde desinfizieren, nicht auswischen.",
      },
      {
        title: "Verbinden",
        text: "Pflaster oder steriler Wundverband. Bei stärkerer Blutung Druckverband: Kompresse, Wickel, Druckpolster, Wickel.",
      },
      {
        title: "Kontrolle",
        text: "Verband trocken halten und täglich prüfen. Bei Rötung, Pochen oder Eiter an eine Infektion denken.",
      },
    ],
    warning:
      "Bei tiefen, stark klaffenden oder stark blutenden Wunden sowie Verletzungen an Sehnen und Nerven (Taubheit, Bewegungsausfall) ärztliche Versorgung nötig. Tetanus-Impfschutz prüfen.",
  },
  {
    id: "unterkuehlung",
    title: "Unterkühlung",
    icon: "Snowflake",
    severity: "ernst",
    summary:
      "Nasse Kleidung, Wind und kalte Nächte können auch im Sommer zur Unterkühlung führen – besonders bei Kindern.",
    symptoms: [
      "Zittern, kalte blasse Haut, blaue Lippen",
      "Später: Verwirrtheit, Müdigkeit, Zittern hört auf (Alarmzeichen!)",
      "Verlangsamte Atmung und Puls",
    ],
    steps: [
      {
        title: "Aus Wind und Nässe",
        text: "Person ins Zelt oder an einen windgeschützten, trockenen Ort bringen. Nasse Kleidung ersetzen.",
      },
      {
        title: "Isolieren",
        text: "In Schlafsack, Decken und Rettungsdecke packen – auch von unten isolieren (Isomatte).",
      },
      {
        title: "Warme, süsse Getränke",
        text: "Nur wenn die Person wach ist: warmen Tee mit Zucker geben. Kein Alkohol, kein Kaffee.",
      },
      {
        title: "Aktiv bleiben oder Ruhe",
        text: "Leichte Unterkühlung: bewegen lassen. Starke Unterkühlung: nicht bewegen, Notruf absetzen.",
      },
    ],
    warning:
      "Wenn das Zittern aufhört, die Person verwirrt oder schläfrig wird: Notfall! Sofort 112 alarmieren und die Person flach lagern, keine aktive Bewegung mehr.",
    kidNote:
      "Kleinkinder kühlen deutlich schneller aus. Beim Zelten immer eine Mütze und trockene Wechselkleidung fürs Kind bereithalten.",
  },
  {
    id: "hitzschlag",
    title: "Sonnenstich & Hitzschlag",
    icon: "Sun",
    severity: "ernst",
    summary:
      "Lange Sonne auf Kopf und Nacken oder Anstrengung bei Hitze können gefährlich werden. Ein Hitzschlag ist lebensbedrohlich.",
    symptoms: [
      "Hochroter, heisser Kopf, Kopfschmerzen, Übelkeit",
      "Schwindel, Nackensteifheit (Sonnenstich)",
      "Heisse, trockene Haut, Körpertemperatur über 40 °C, Bewusstseinsstörung (Hitzschlag)",
    ],
    steps: [
      {
        title: "In den Schatten",
        text: "Person sofort in den Schatten bringen, Oberkörper leicht erhöht lagern.",
      },
      {
        title: "Kühlen",
        text: "Kopf und Nacken mit feuchten Tüchern kühlen. Kleidung öffnen, Luft zufächeln.",
      },
      {
        title: "Trinken",
        text: "Wenn wach: schluckweise Wasser oder Elektrolytgetränk geben.",
      },
      {
        title: "Beobachten",
        text: "Bei Bewusstseinsstörungen, Erbrechen oder Fieber über 40 °C sofort den Notruf 112 wählen.",
      },
    ],
    warning:
      "Hitzschlag ist ein lebensbedrohlicher Notfall: heisse trockene Haut, Verwirrtheit oder Bewusstlosigkeit → sofort 112. Bis zum Eintreffen konsequent kühlen.",
    kidNote:
      "Kinder immer mit Sonnenhut spielen lassen und regelmässige Trinkpausen im Schatten einplanen.",
  },
  {
    id: "insektenstich",
    title: "Insektenstich & allergische Reaktion",
    icon: "Zap",
    severity: "mittel",
    summary:
      "Wespen-, Bienen- und Bremsenstiche sind meist harmlos, können aber allergische Reaktionen auslösen – vor allem bei Stichen im Mund-Rachen-Raum.",
    symptoms: [
      "Lokale Schwellung, Rötung, Juckreiz",
      "Bei Allergie: Quaddeln am ganzen Körper, Atemnot, Schwindel",
      "Stiche im Mund: rasch zunehmende Schwellung der Atemwege",
    ],
    steps: [
      {
        title: "Stachel entfernen",
        text: "Bienenstachel mit dem Fingernagel oder einer Karte wegschaben – nicht mit der Pinzette ausdrücken.",
      },
      {
        title: "Kühlen",
        text: "Stichstelle kühlen. Hitzestift (ca. 50 °C) kann Juckreiz und Schwellung reduzieren.",
      },
      {
        title: "Beobachten",
        text: "Auf Anzeichen einer allergischen Reaktion achten, besonders in den ersten 30 Minuten.",
      },
      {
        title: "Bei Stich im Mund",
        text: "Eiswürfel oder kaltes Wasser lutschen lassen, kühlende Umschläge um den Hals, sofort 112 anrufen.",
      },
    ],
    warning:
      "Bei bekannter Insektengift-Allergie: Notfallset (Adrenalin-Autoinjektor) sofort anwenden und 112 alarmieren. Atemnot, Kreislaufprobleme oder Schwellungen im Gesicht sind immer ein Notfall.",
  },
  {
    id: "blasen",
    title: "Blasen an den Füssen",
    icon: "CircleDot",
    severity: "leicht",
    summary:
      "Reibung in feuchten Schuhen verursacht Blasen – die klassische Wanderverletzung. Vorbeugen ist einfacher als behandeln.",
    symptoms: [
      "Druckstelle, Rötung («Hotspot»)",
      "Mit Flüssigkeit gefüllte Hautblase",
      "Offene, nässende Blase",
    ],
    steps: [
      {
        title: "Frühzeichen ernst nehmen",
        text: "Bei brennenden Druckstellen sofort anhalten und die Stelle mit Blasenpflaster oder Tape schützen.",
      },
      {
        title: "Geschlossene Blase",
        text: "Möglichst geschlossen lassen und mit einem Blasenpflaster polstern. Die Haut ist der beste Wundschutz.",
      },
      {
        title: "Pralle, schmerzhafte Blase",
        text: "Nur mit desinfizierter Nadel am Rand anstechen, Flüssigkeit herausdrücken, Haut belassen, steril abdecken.",
      },
      {
        title: "Offene Blase",
        text: "Wie eine Wunde behandeln: reinigen, desinfizieren, steril und gepolstert abdecken.",
      },
    ],
    warning:
      "Bei Rötung, Überwärmung, Pochen oder Eiter hat sich die Blase entzündet – dann ärztlich kontrollieren lassen (besonders bei Diabetes).",
    kidNote:
      "Kinderfüsse abends kurz kontrollieren – Kinder melden Blasen oft erst, wenn sie offen sind.",
  },
  {
    id: "nasenbluten",
    title: "Nasenbluten",
    icon: "Droplets",
    severity: "leicht",
    summary:
      "Trockene Luft, Sonne oder ein Ball ins Gesicht – Nasenbluten sieht dramatisch aus, ist aber meist harmlos.",
    symptoms: ["Blutung aus einem oder beiden Nasenlöchern"],
    steps: [
      {
        title: "Aufrecht sitzen",
        text: "Kopf leicht nach vorne beugen – nicht in den Nacken legen, damit kein Blut in den Rachen läuft.",
      },
      {
        title: "Nase zudrücken",
        text: "Nasenflügel 10 Minuten ununterbrochen zusammendrücken. Durch den Mund atmen.",
      },
      {
        title: "Kühlen",
        text: "Kalter Lappen oder Kühlakku in den Nacken – das verengt die Blutgefässe.",
      },
      {
        title: "Danach schonen",
        text: "Einige Stunden nicht schnäuzen und nicht in der Nase bohren.",
      },
    ],
    warning:
      "Hört die Blutung nach 20 Minuten Druck nicht auf oder folgt sie auf einen heftigen Sturz/Schlag, ärztliche Hilfe aufsuchen.",
  },
  {
    id: "bewusstlosigkeit",
    title: "Bewusstlosigkeit & Reanimation",
    icon: "HeartPulse",
    severity: "ernst",
    summary:
      "Der wichtigste Notfall-Ablauf überhaupt: prüfen, rufen, handeln. Diese Schritte können Leben retten.",
    symptoms: [
      "Person reagiert nicht auf Ansprache und Anfassen",
      "Atmung vorhanden oder nicht vorhanden",
    ],
    steps: [
      {
        title: "Prüfen",
        text: "Laut ansprechen, an den Schultern rütteln. Keine Reaktion? Atemwege freimachen (Kopf überstrecken) und maximal 10 Sekunden Atmung prüfen.",
      },
      {
        title: "Notruf 112",
        text: "Sofort 112 (oder Rega 1414) anrufen oder eine zweite Person damit beauftragen. Lautsprecher einschalten.",
      },
      {
        title: "Atmung vorhanden",
        text: "Stabile Seitenlage, zudecken, Atmung laufend überwachen bis die Rettung eintrifft.",
      },
      {
        title: "Keine normale Atmung",
        text: "Herzdruckmassage: 30× fest und schnell (5–6 cm tief, 100–120/min) in der Brustmitte drücken, dann 2 Beatmungen. Nicht aufhören, bis Hilfe da ist.",
      },
    ],
    warning:
      "Schnappatmung (einzelne, röchelnde Atemzüge) ist KEINE normale Atmung – sofort mit der Herzdruckmassage beginnen. Drücken ist wichtiger als Beatmen.",
    kidNote:
      "Bei Kindern: zuerst 5 Beatmungen, dann 30:2. Bei Kleinkindern mit zwei Fingern bzw. einer Hand drücken (ca. 1/3 der Brusttiefe).",
  },
];
