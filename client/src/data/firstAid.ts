/**
 * Offline Erste-Hilfe-Guide – alle Inhalte sind im App-Bundle enthalten
 * und funktionieren vollständig ohne Internetverbindung.
 * Hinweis: Ersetzt keine professionelle medizinische Hilfe.
 * Alle Anzeigetexte liegen als L4 (de/fr/it/en) vor.
 */
import { l4, type L4 } from "@shared/i18n";

export interface FirstAidStep {
  title: L4;
  text: L4;
}

export interface FirstAidTopic {
  id: string;
  title: L4;
  icon: string;
  severity: "leicht" | "mittel" | "ernst";
  summary: L4;
  symptoms: L4[];
  steps: FirstAidStep[];
  warning: L4;
  kidNote?: L4;
}

export const firstAidTopics: FirstAidTopic[] = [
  {
    id: "zeckenbiss",
    title: l4("Zeckenbiss", "Piqûre de tique", "Puntura di zecca", "Tick bite"),
    icon: "Bug",
    severity: "mittel",
    summary: l4(
      "Zecken sollten so schnell wie möglich entfernt werden, um das Risiko einer Borreliose- oder FSME-Übertragung zu senken.",
      "Les tiques doivent être retirées le plus vite possible pour réduire le risque de transmission de la borréliose ou de la méningo-encéphalite à tiques (FSME).",
      "Le zecche vanno rimosse il più presto possibile per ridurre il rischio di trasmissione della borreliosi o della meningoencefalite da zecche (TBE).",
      "Ticks should be removed as quickly as possible to lower the risk of Lyme disease or tick-borne encephalitis (TBE)."
    ),
    symptoms: [
      l4(
        "Festgesaugte Zecke auf der Haut",
        "Tique accrochée à la peau",
        "Zecca attaccata alla pelle",
        "Tick attached to the skin"
      ),
      l4(
        "Später: Rötung um die Stichstelle (Wanderröte)",
        "Plus tard : rougeur autour de la piqûre (érythème migrant)",
        "In seguito: arrossamento attorno alla puntura (eritema migrante)",
        "Later: redness around the bite site (erythema migrans)"
      ),
      l4(
        "Grippeähnliche Beschwerden Tage bis Wochen danach",
        "Symptômes grippaux quelques jours à quelques semaines plus tard",
        "Sintomi simil-influenzali da giorni a settimane dopo",
        "Flu-like symptoms days to weeks afterwards"
      ),
    ],
    steps: [
      {
        title: l4(
          "Zecke fassen",
          "Saisir la tique",
          "Afferrare la zecca",
          "Grip the tick"
        ),
        text: l4(
          "Mit einer Zeckenzange, Zeckenkarte oder feinen Pinzette die Zecke möglichst hautnah am Kopf fassen – nicht am vollgesogenen Körper quetschen.",
          "Avec une pince à tiques, une carte à tiques ou une pincette fine, saisir la tique par la tête, au plus près de la peau – sans écraser le corps gorgé de sang.",
          "Con una pinza per zecche, una tessera apposita o una pinzetta fine, afferrare la zecca per la testa, il più vicino possibile alla pelle – senza schiacciare il corpo pieno di sangue.",
          "Using tick tweezers, a tick card or fine-pointed tweezers, grip the tick by the head as close to the skin as possible – do not squeeze the engorged body."
        ),
      },
      {
        title: l4(
          "Langsam herausziehen",
          "Retirer lentement",
          "Estrarre lentamente",
          "Pull out slowly"
        ),
        text: l4(
          "Die Zecke langsam und kontrolliert gerade herausziehen. Nicht drehen, nicht mit Öl oder Klebstoff beträufeln.",
          "Retirer la tique lentement et de façon contrôlée, bien droit. Ne pas la tourner, ne pas verser d'huile ni de colle dessus.",
          "Estrarre la zecca lentamente e in modo controllato, tirando dritto. Non ruotarla, non applicare olio o colla.",
          "Pull the tick out slowly and steadily, straight upwards. Do not twist it and do not apply oil or glue."
        ),
      },
      {
        title: l4(
          "Stichstelle desinfizieren",
          "Désinfecter la piqûre",
          "Disinfettare la puntura",
          "Disinfect the bite site"
        ),
        text: l4(
          "Die Einstichstelle mit einem Desinfektionsmittel reinigen und die Stelle mit einem Stift markieren oder fotografieren.",
          "Nettoyer le point de piqûre avec un désinfectant et marquer l'endroit au stylo ou le photographier.",
          "Pulire il punto della puntura con un disinfettante e segnare il punto con una penna o fotografarlo.",
          "Clean the bite site with a disinfectant and mark the spot with a pen or take a photo."
        ),
      },
      {
        title: l4("Beobachten", "Surveiller", "Osservare", "Watch the site"),
        text: l4(
          "Die Stelle über 4–6 Wochen beobachten. Bei einer ringförmigen Rötung (Wanderröte), Fieber oder Gelenkschmerzen ärztliche Hilfe aufsuchen.",
          "Surveiller l'endroit pendant 4 à 6 semaines. En cas de rougeur en anneau (érythème migrant), de fièvre ou de douleurs articulaires, consulter un médecin.",
          "Osservare il punto per 4–6 settimane. In caso di arrossamento ad anello (eritema migrante), febbre o dolori articolari, consultare un medico.",
          "Watch the site for 4–6 weeks. If a ring-shaped rash (erythema migrans), fever or joint pain develops, seek medical advice."
        ),
      },
    ],
    warning: l4(
      "Bei kreisrunder, wandernder Rötung, Fieber oder starkem Krankheitsgefühl unbedingt ärztlich abklären lassen. In FSME-Risikogebieten (fast die ganze Schweiz) an die Impfung denken.",
      "En cas de rougeur circulaire qui s'étend, de fièvre ou de forte sensation de maladie, consulter impérativement un médecin. Dans les régions à risque de FSME (presque toute la Suisse), penser à la vaccination.",
      "In caso di arrossamento circolare che si allarga, febbre o forte malessere, farsi assolutamente visitare da un medico. Nelle zone a rischio TBE (quasi tutta la Svizzera), pensare alla vaccinazione.",
      "If you notice a circular, spreading rash, fever or feel seriously unwell, see a doctor without fail. In TBE risk areas (almost all of Switzerland), consider vaccination."
    ),
    kidNote: l4(
      "Kinder nach jedem Tag draussen gründlich absuchen – besonders Haaransatz, Ohren, Achseln, Leisten und Kniekehlen.",
      "Inspecter soigneusement les enfants après chaque journée dehors – surtout la lisière des cheveux, les oreilles, les aisselles, l'aine et le creux des genoux.",
      "Controllare accuratamente i bambini dopo ogni giornata all'aperto – soprattutto attaccatura dei capelli, orecchie, ascelle, inguine e cavo del ginocchio.",
      "Check children thoroughly after every day outdoors – especially the hairline, ears, armpits, groin and backs of the knees."
    ),
  },
  {
    id: "verbrennung",
    title: l4(
      "Verbrennung & Verbrühung",
      "Brûlure & ébouillantement",
      "Ustione & scottatura",
      "Burns & scalds"
    ),
    icon: "Flame",
    severity: "ernst",
    summary: l4(
      "Typische Camping-Verletzung am Gaskocher, Feuer oder mit heissem Wasser. Schnelles, richtiges Kühlen lindert Schmerz und begrenzt den Schaden.",
      "Blessure typique du camping au réchaud à gaz, au feu ou avec de l'eau bouillante. Un refroidissement rapide et correct soulage la douleur et limite les dégâts.",
      "Lesione tipica del campeggio con fornello a gas, fuoco o acqua bollente. Raffreddare subito e nel modo giusto allevia il dolore e limita i danni.",
      "A classic camping injury from the gas stove, campfire or hot water. Quick, correct cooling eases the pain and limits the damage."
    ),
    symptoms: [
      l4(
        "Rötung und Schmerz (Grad 1)",
        "Rougeur et douleur (1er degré)",
        "Arrossamento e dolore (1° grado)",
        "Redness and pain (first degree)"
      ),
      l4(
        "Blasenbildung (Grad 2)",
        "Formation de cloques (2e degré)",
        "Formazione di vesciche (2° grado)",
        "Blistering (second degree)"
      ),
      l4(
        "Weisse oder verkohlte, schmerzarme Haut (Grad 3 – Notfall)",
        "Peau blanche ou carbonisée, peu douloureuse (3e degré – urgence)",
        "Pelle bianca o carbonizzata, poco dolente (3° grado – emergenza)",
        "White or charred, largely painless skin (third degree – emergency)"
      ),
    ],
    steps: [
      {
        title: l4(
          "Gefahr stoppen",
          "Stopper le danger",
          "Fermare il pericolo",
          "Stop the danger"
        ),
        text: l4(
          "Hitzequelle entfernen, brennende Kleidung löschen (Wasser, Decke, Wälzen). Verbrühte Kleidung sofort ausziehen, eingebrannte Kleidung belassen.",
          "Éloigner la source de chaleur, éteindre les vêtements en feu (eau, couverture, rouler au sol). Retirer immédiatement les vêtements ébouillantés, laisser en place les vêtements collés à la peau.",
          "Allontanare la fonte di calore, spegnere gli abiti in fiamme (acqua, coperta, rotolarsi). Togliere subito gli abiti bagnati di liquido bollente, lasciare quelli attaccati alla pelle.",
          "Remove the heat source and put out burning clothing (water, blanket, rolling). Take off scalded clothing immediately; leave clothing that is stuck to the skin."
        ),
      },
      {
        title: l4(
          "Kühlen – aber richtig",
          "Refroidir – mais correctement",
          "Raffreddare – nel modo giusto",
          "Cool – but correctly"
        ),
        text: l4(
          "Kleinflächige Verbrennungen sofort 10–20 Minuten mit handwarmem Leitungswasser (ca. 20 °C) kühlen. Kein Eis, keine Kühlbox-Akkus direkt auf die Haut.",
          "Refroidir immédiatement les brûlures de petite surface pendant 10 à 20 minutes à l'eau tiède du robinet (env. 20 °C). Pas de glace ni d'accumulateurs de froid directement sur la peau.",
          "Raffreddare subito le ustioni di piccola estensione per 10–20 minuti con acqua corrente tiepida (ca. 20 °C). Niente ghiaccio né siberini direttamente sulla pelle.",
          "Cool small burns immediately for 10–20 minutes with lukewarm tap water (about 20 °C). No ice and no cool-box packs directly on the skin."
        ),
      },
      {
        title: l4(
          "Wunde schützen",
          "Protéger la plaie",
          "Proteggere la ferita",
          "Protect the wound"
        ),
        text: l4(
          "Blasen nicht öffnen. Wunde locker mit steriler, nicht flusender Wundauflage abdecken. Keine Hausmittel wie Mehl, Butter oder Zahnpasta.",
          "Ne pas percer les cloques. Couvrir la plaie sans serrer avec un pansement stérile non pelucheux. Pas de remèdes maison comme la farine, le beurre ou le dentifrice.",
          "Non aprire le vesciche. Coprire la ferita senza stringere con una medicazione sterile che non lasci pelucchi. Niente rimedi casalinghi come farina, burro o dentifricio.",
          "Do not burst blisters. Cover the wound loosely with a sterile, non-fluffy dressing. No home remedies such as flour, butter or toothpaste."
        ),
      },
      {
        title: l4(
          "Grösse einschätzen",
          "Estimer l'étendue",
          "Valutare l'estensione",
          "Estimate the size"
        ),
        text: l4(
          "Als Faustregel entspricht die Handfläche der betroffenen Person etwa 1 % der Körperoberfläche. Ab ca. 5 % (bei Kindern weniger) ärztliche Hilfe holen.",
          "En règle générale, la paume de la main de la personne touchée correspond à environ 1 % de la surface corporelle. À partir d'env. 5 % (moins chez les enfants), consulter un médecin.",
          "Come regola generale, il palmo della mano della persona colpita corrisponde a circa l'1 % della superficie corporea. A partire dal 5 % circa (meno nei bambini), cercare aiuto medico.",
          "As a rule of thumb, the casualty's palm equals about 1% of their body surface. From about 5% (less for children), get medical help."
        ),
      },
    ],
    warning: l4(
      "Bei grossflächigen Verbrennungen, Verbrennungen im Gesicht, an Händen, Gelenken oder Genitalien sowie bei Kindern immer ärztliche Hilfe (112) anfordern. Grossflächig nie kühlen – Unterkühlungsgefahr.",
      "En cas de brûlures étendues, de brûlures au visage, aux mains, aux articulations ou aux parties génitales, ainsi que chez les enfants, toujours appeler les secours (112). Ne jamais refroidir de grandes surfaces – risque d'hypothermie.",
      "In caso di ustioni estese, ustioni al viso, alle mani, alle articolazioni o ai genitali, così come nei bambini, chiamare sempre i soccorsi (112). Mai raffreddare grandi superfici – rischio di ipotermia.",
      "For extensive burns, burns to the face, hands, joints or genitals, and always for children, call the emergency services (112). Never cool large areas – risk of hypothermia."
    ),
    kidNote: l4(
      "Kinderhaut ist dünner – schon kurzer Kontakt mit heissem Wasser kann tiefe Verbrühungen verursachen. Im Zweifel immer ärztlich abklären.",
      "La peau des enfants est plus fine – même un bref contact avec de l'eau chaude peut causer des ébouillantements profonds. En cas de doute, toujours consulter un médecin.",
      "La pelle dei bambini è più sottile – anche un breve contatto con acqua calda può causare scottature profonde. Nel dubbio, farsi sempre visitare da un medico.",
      "Children's skin is thinner – even brief contact with hot water can cause deep scalds. When in doubt, always seek medical advice."
    ),
  },
  {
    id: "verstauchung",
    title: l4(
      "Verstauchung & Zerrung",
      "Entorse & élongation",
      "Distorsione & stiramento",
      "Sprains & strains"
    ),
    icon: "Footprints",
    severity: "mittel",
    summary: l4(
      "Umgeknickte Knöchel gehören zu den häufigsten Verletzungen auf unebenem Gelände. Die PECH-Regel hilft in den ersten Stunden.",
      "Les chevilles tordues comptent parmi les blessures les plus fréquentes en terrain accidenté. Le protocole RICE (repos, glace, compression, surélévation) aide durant les premières heures.",
      "Le caviglie storte sono tra gli infortuni più frequenti su terreni accidentati. La regola RICE (riposo, ghiaccio, compressione, elevazione) aiuta nelle prime ore.",
      "Twisted ankles are among the most common injuries on uneven ground. The RICE rule helps in the first hours."
    ),
    symptoms: [
      l4(
        "Schmerz beim Auftreten oder Bewegen",
        "Douleur en posant le pied ou en bougeant",
        "Dolore nel caricare il peso o nel muoversi",
        "Pain when bearing weight or moving"
      ),
      l4(
        "Schwellung und Bluterguss",
        "Gonflement et hématome",
        "Gonfiore ed ematoma",
        "Swelling and bruising"
      ),
      l4(
        "Eingeschränkte Beweglichkeit",
        "Mobilité réduite",
        "Mobilità limitata",
        "Restricted movement"
      ),
    ],
    steps: [
      {
        title: l4("P – Pause", "Repos", "Riposo", "R – Rest"),
        text: l4(
          "Aktivität sofort stoppen und das Gelenk ruhigstellen. Nicht «weiterlaufen, bis es geht».",
          "Arrêter immédiatement l'activité et immobiliser l'articulation. Ne pas «continuer à marcher jusqu'à ce que ça passe».",
          "Interrompere subito l'attività e immobilizzare l'articolazione. Niente «continuare a camminare finché passa».",
          "Stop the activity immediately and rest the joint. Do not try to 'walk it off'."
        ),
      },
      {
        title: l4("E – Eis", "Glace", "Ghiaccio", "I – Ice"),
        text: l4(
          "15–20 Minuten kühlen (Kühlakku in ein Tuch gewickelt, kalter Bachlauf). Nie Eis direkt auf die Haut.",
          "Refroidir 15 à 20 minutes (accumulateur de froid enveloppé dans un linge, eau froide du ruisseau). Jamais de glace directement sur la peau.",
          "Raffreddare per 15–20 minuti (siberino avvolto in un panno, acqua fredda del ruscello). Mai ghiaccio direttamente sulla pelle.",
          "Cool for 15–20 minutes (an ice pack wrapped in a cloth, or a cold stream). Never put ice directly on the skin."
        ),
      },
      {
        title: l4(
          "C – Compression",
          "Compression",
          "Compressione",
          "C – Compression"
        ),
        text: l4(
          "Elastische Binde anlegen – fest, aber nicht abschnürend. Zehen müssen warm und rosig bleiben.",
          "Poser une bande élastique – serrée, mais sans couper la circulation. Les orteils doivent rester chauds et rosés.",
          "Applicare una benda elastica – stretta ma senza bloccare la circolazione. Le dita dei piedi devono restare calde e rosee.",
          "Apply an elastic bandage – firm, but not so tight it cuts off circulation. Toes must stay warm and pink."
        ),
      },
      {
        title: l4(
          "H – Hochlagern",
          "Surélévation",
          "Elevazione",
          "E – Elevate"
        ),
        text: l4(
          "Das Gelenk über Herzhöhe lagern, z. B. auf dem Rucksack. Das reduziert die Schwellung.",
          "Surélever l'articulation au-dessus du niveau du cœur, p. ex. sur le sac à dos. Cela réduit le gonflement.",
          "Sollevare l'articolazione sopra il livello del cuore, ad es. sullo zaino. Questo riduce il gonfiore.",
          "Raise the joint above heart level, for example on a rucksack. This reduces the swelling."
        ),
      },
    ],
    warning: l4(
      "Wenn kein Auftreten möglich ist, das Gelenk stark deformiert wirkt oder der Schmerz direkt auf dem Knochen sitzt, an einen Bruch denken und ärztliche Hilfe holen.",
      "Si poser le pied est impossible, si l'articulation semble fortement déformée ou si la douleur siège directement sur l'os, penser à une fracture et consulter un médecin.",
      "Se è impossibile caricare il peso, se l'articolazione appare molto deformata o se il dolore è localizzato direttamente sull'osso, pensare a una frattura e cercare aiuto medico.",
      "If weight-bearing is impossible, the joint looks clearly deformed or the pain sits directly on the bone, suspect a fracture and get medical help."
    ),
    kidNote: l4(
      "Kinder klagen oft erst spät – bei Humpeln oder Schonhaltung das Gelenk in Ruhe anschauen.",
      "Les enfants ne se plaignent souvent que tard – en cas de boitement ou de posture d'évitement, examiner calmement l'articulation.",
      "I bambini spesso si lamentano tardi – se zoppicano o assumono una postura di protezione, esaminare con calma l'articolazione.",
      "Children often complain late – if they limp or protect a limb, take a calm look at the joint."
    ),
  },
  {
    id: "schnittwunde",
    title: l4("Schnittwunde", "Coupure", "Ferita da taglio", "Cuts"),
    icon: "Slice",
    severity: "mittel",
    summary: l4(
      "Beim Schnitzen, Kochen oder Hantieren mit Heringen passieren schnell Schnittverletzungen. Sauberkeit und Druck sind entscheidend.",
      "En taillant du bois, en cuisinant ou en manipulant des sardines, les coupures arrivent vite. Propreté et compression sont décisives.",
      "Intagliando il legno, cucinando o maneggiando i picchetti, le ferite da taglio capitano in fretta. Pulizia e compressione sono decisive.",
      "Whittling, cooking or handling tent pegs can quickly lead to cuts. Cleanliness and pressure are what count."
    ),
    symptoms: [
      l4(
        "Blutende Wunde",
        "Plaie qui saigne",
        "Ferita sanguinante",
        "Bleeding wound"
      ),
      l4(
        "Bei tiefen Schnitten: klaffende Wundränder",
        "En cas de coupures profondes : bords de plaie béants",
        "Nei tagli profondi: margini della ferita divaricati",
        "With deep cuts: gaping wound edges"
      ),
      l4(
        "Starke Blutung bei verletzten Gefässen",
        "Saignement abondant si des vaisseaux sont touchés",
        "Sanguinamento abbondante se sono lesi dei vasi",
        "Heavy bleeding if blood vessels are damaged"
      ),
    ],
    steps: [
      {
        title: l4(
          "Blutung stillen",
          "Arrêter le saignement",
          "Fermare l'emorragia",
          "Stop the bleeding"
        ),
        text: l4(
          "Mit steriler Kompresse oder sauberem Tuch direkt auf die Wunde drücken. Betroffenes Körperteil hochhalten.",
          "Appuyer directement sur la plaie avec une compresse stérile ou un linge propre. Surélever la partie du corps touchée.",
          "Premere direttamente sulla ferita con una compressa sterile o un panno pulito. Tenere sollevata la parte del corpo colpita.",
          "Press directly on the wound with a sterile compress or clean cloth. Raise the injured body part."
        ),
      },
      {
        title: l4(
          "Wunde reinigen",
          "Nettoyer la plaie",
          "Pulire la ferita",
          "Clean the wound"
        ),
        text: l4(
          "Sichtbaren Schmutz mit sauberem (Trink-)Wasser ausspülen. Wunde desinfizieren, nicht auswischen.",
          "Rincer les saletés visibles avec de l'eau propre (potable). Désinfecter la plaie, sans la frotter.",
          "Sciacquare lo sporco visibile con acqua pulita (potabile). Disinfettare la ferita senza strofinarla.",
          "Rinse away visible dirt with clean (drinking) water. Disinfect the wound; do not wipe inside it."
        ),
      },
      {
        title: l4("Verbinden", "Panser", "Bendare", "Bandage"),
        text: l4(
          "Pflaster oder steriler Wundverband. Bei stärkerer Blutung Druckverband: Kompresse, Wickel, Druckpolster, Wickel.",
          "Pansement adhésif ou pansement stérile. En cas de saignement plus important, pansement compressif : compresse, bande, coussin de compression, bande.",
          "Cerotto o medicazione sterile. In caso di sanguinamento più forte, bendaggio compressivo: compressa, fasciatura, tampone di compressione, fasciatura.",
          "Use a plaster or sterile dressing. For heavier bleeding, apply a pressure bandage: compress, wrap, pressure pad, wrap."
        ),
      },
      {
        title: l4("Kontrolle", "Contrôler", "Controllare", "Check"),
        text: l4(
          "Verband trocken halten und täglich prüfen. Bei Rötung, Pochen oder Eiter an eine Infektion denken.",
          "Garder le pansement au sec et le vérifier chaque jour. En cas de rougeur, de douleur pulsatile ou de pus, penser à une infection.",
          "Tenere la medicazione asciutta e controllarla ogni giorno. In caso di arrossamento, dolore pulsante o pus, pensare a un'infezione.",
          "Keep the dressing dry and check it daily. Redness, throbbing or pus point to an infection."
        ),
      },
    ],
    warning: l4(
      "Bei tiefen, stark klaffenden oder stark blutenden Wunden sowie Verletzungen an Sehnen und Nerven (Taubheit, Bewegungsausfall) ärztliche Versorgung nötig. Tetanus-Impfschutz prüfen.",
      "Les plaies profondes, très béantes ou qui saignent abondamment, ainsi que les lésions de tendons et de nerfs (engourdissement, perte de mobilité) nécessitent des soins médicaux. Vérifier la vaccination contre le tétanos.",
      "Le ferite profonde, molto aperte o con forte sanguinamento, così come le lesioni di tendini e nervi (intorpidimento, perdita di movimento) richiedono cure mediche. Verificare la vaccinazione antitetanica.",
      "Deep, widely gaping or heavily bleeding wounds, and injuries to tendons or nerves (numbness, loss of movement) need medical care. Check tetanus vaccination status."
    ),
  },
  {
    id: "unterkuehlung",
    title: l4("Unterkühlung", "Hypothermie", "Ipotermia", "Hypothermia"),
    icon: "Snowflake",
    severity: "ernst",
    summary: l4(
      "Nasse Kleidung, Wind und kalte Nächte können auch im Sommer zur Unterkühlung führen – besonders bei Kindern.",
      "Vêtements mouillés, vent et nuits froides peuvent provoquer une hypothermie même en été – surtout chez les enfants.",
      "Vestiti bagnati, vento e notti fredde possono causare ipotermia anche in estate – soprattutto nei bambini.",
      "Wet clothing, wind and cold nights can cause hypothermia even in summer – especially in children."
    ),
    symptoms: [
      l4(
        "Zittern, kalte blasse Haut, blaue Lippen",
        "Frissons, peau froide et pâle, lèvres bleues",
        "Brividi, pelle fredda e pallida, labbra blu",
        "Shivering, cold pale skin, blue lips"
      ),
      l4(
        "Später: Verwirrtheit, Müdigkeit, Zittern hört auf (Alarmzeichen!)",
        "Plus tard : confusion, somnolence, les frissons cessent (signal d'alarme !)",
        "In seguito: confusione, sonnolenza, i brividi cessano (segnale d'allarme!)",
        "Later: confusion, drowsiness, shivering stops (warning sign!)"
      ),
      l4(
        "Verlangsamte Atmung und Puls",
        "Respiration et pouls ralentis",
        "Respirazione e polso rallentati",
        "Slowed breathing and pulse"
      ),
    ],
    steps: [
      {
        title: l4(
          "Aus Wind und Nässe",
          "À l'abri du vent et de l'humidité",
          "Via da vento e umidità",
          "Out of wind and wet"
        ),
        text: l4(
          "Person ins Zelt oder an einen windgeschützten, trockenen Ort bringen. Nasse Kleidung ersetzen.",
          "Amener la personne dans la tente ou dans un endroit sec et abrité du vent. Remplacer les vêtements mouillés.",
          "Portare la persona nella tenda o in un luogo asciutto e riparato dal vento. Sostituire i vestiti bagnati.",
          "Move the person into the tent or to a dry, wind-sheltered spot. Replace wet clothing."
        ),
      },
      {
        title: l4("Isolieren", "Isoler", "Isolare", "Insulate"),
        text: l4(
          "In Schlafsack, Decken und Rettungsdecke packen – auch von unten isolieren (Isomatte).",
          "Envelopper dans un sac de couchage, des couvertures et une couverture de survie – isoler aussi du sol (matelas isolant).",
          "Avvolgere in sacco a pelo, coperte e telo termico di emergenza – isolare anche dal suolo (materassino).",
          "Wrap in a sleeping bag, blankets and an emergency blanket – insulate from the ground too (sleeping mat)."
        ),
      },
      {
        title: l4(
          "Warme, süsse Getränke",
          "Boissons chaudes et sucrées",
          "Bevande calde e zuccherate",
          "Warm, sweet drinks"
        ),
        text: l4(
          "Nur wenn die Person wach ist: warmen Tee mit Zucker geben. Kein Alkohol, kein Kaffee.",
          "Seulement si la personne est éveillée : donner du thé chaud sucré. Pas d'alcool, pas de café.",
          "Solo se la persona è sveglia: dare tè caldo con zucchero. Niente alcol, niente caffè.",
          "Only if the person is awake: give warm tea with sugar. No alcohol, no coffee."
        ),
      },
      {
        title: l4(
          "Aktiv bleiben oder Ruhe",
          "Bouger ou repos",
          "Movimento o riposo",
          "Keep active or keep still"
        ),
        text: l4(
          "Leichte Unterkühlung: bewegen lassen. Starke Unterkühlung: nicht bewegen, Notruf absetzen.",
          "Hypothermie légère : laisser bouger. Hypothermie sévère : ne pas bouger la personne, appeler les secours.",
          "Ipotermia lieve: far muovere. Ipotermia grave: non muovere la persona, chiamare i soccorsi.",
          "Mild hypothermia: let them move about. Severe hypothermia: do not move the person, call the emergency services."
        ),
      },
    ],
    warning: l4(
      "Wenn das Zittern aufhört, die Person verwirrt oder schläfrig wird: Notfall! Sofort 112 alarmieren und die Person flach lagern, keine aktive Bewegung mehr.",
      "Si les frissons cessent, si la personne devient confuse ou somnolente : urgence ! Appeler immédiatement le 112, allonger la personne à plat et éviter tout mouvement actif.",
      "Se i brividi cessano, se la persona diventa confusa o sonnolenta: emergenza! Chiamare subito il 112, sdraiare la persona in piano e niente più movimenti attivi.",
      "If the shivering stops or the person becomes confused or drowsy: emergency! Call 112 immediately, lay the person flat and avoid any further active movement."
    ),
    kidNote: l4(
      "Kleinkinder kühlen deutlich schneller aus. Beim Zelten immer eine Mütze und trockene Wechselkleidung fürs Kind bereithalten.",
      "Les petits enfants se refroidissent nettement plus vite. En camping, toujours prévoir un bonnet et des vêtements de rechange secs pour l'enfant.",
      "I bambini piccoli si raffreddano molto più in fretta. In campeggio, tenere sempre pronti un berretto e vestiti di ricambio asciutti per il bambino.",
      "Small children lose heat much faster. When camping, always keep a hat and dry spare clothes ready for your child."
    ),
  },
  {
    id: "hitzschlag",
    title: l4(
      "Sonnenstich & Hitzschlag",
      "Insolation & coup de chaleur",
      "Colpo di sole & colpo di calore",
      "Sunstroke & heatstroke"
    ),
    icon: "Sun",
    severity: "ernst",
    summary: l4(
      "Lange Sonne auf Kopf und Nacken oder Anstrengung bei Hitze können gefährlich werden. Ein Hitzschlag ist lebensbedrohlich.",
      "Un long moment au soleil tête et nuque exposées ou un effort par forte chaleur peuvent devenir dangereux. Le coup de chaleur met la vie en danger.",
      "Sole prolungato su testa e nuca o sforzi con il caldo possono diventare pericolosi. Il colpo di calore è potenzialmente letale.",
      "Long sun exposure on head and neck, or exertion in the heat, can become dangerous. Heatstroke is life-threatening."
    ),
    symptoms: [
      l4(
        "Hochroter, heisser Kopf, Kopfschmerzen, Übelkeit",
        "Tête rouge vif et chaude, maux de tête, nausées",
        "Testa molto arrossata e calda, mal di testa, nausea",
        "Flushed, hot head, headache, nausea"
      ),
      l4(
        "Schwindel, Nackensteifheit (Sonnenstich)",
        "Vertiges, raideur de la nuque (insolation)",
        "Vertigini, rigidità della nuca (colpo di sole)",
        "Dizziness, stiff neck (sunstroke)"
      ),
      l4(
        "Heisse, trockene Haut, Körpertemperatur über 40 °C, Bewusstseinsstörung (Hitzschlag)",
        "Peau chaude et sèche, température corporelle au-dessus de 40 °C, troubles de la conscience (coup de chaleur)",
        "Pelle calda e asciutta, temperatura corporea oltre 40 °C, alterazione della coscienza (colpo di calore)",
        "Hot, dry skin, body temperature above 40 °C, impaired consciousness (heatstroke)"
      ),
    ],
    steps: [
      {
        title: l4(
          "In den Schatten",
          "À l'ombre",
          "All'ombra",
          "Into the shade"
        ),
        text: l4(
          "Person sofort in den Schatten bringen, Oberkörper leicht erhöht lagern.",
          "Amener immédiatement la personne à l'ombre, buste légèrement surélevé.",
          "Portare subito la persona all'ombra, con il busto leggermente sollevato.",
          "Move the person into the shade immediately, upper body slightly raised."
        ),
      },
      {
        title: l4("Kühlen", "Refroidir", "Raffreddare", "Cool"),
        text: l4(
          "Kopf und Nacken mit feuchten Tüchern kühlen. Kleidung öffnen, Luft zufächeln.",
          "Rafraîchir la tête et la nuque avec des linges humides. Ouvrir les vêtements, éventer.",
          "Raffreddare testa e nuca con panni umidi. Aprire i vestiti, fare aria.",
          "Cool the head and neck with damp cloths. Loosen clothing and fan air."
        ),
      },
      {
        title: l4("Trinken", "Faire boire", "Far bere", "Give fluids"),
        text: l4(
          "Wenn wach: schluckweise Wasser oder Elektrolytgetränk geben.",
          "Si la personne est éveillée : donner de l'eau ou une boisson électrolytique par petites gorgées.",
          "Se la persona è sveglia: dare acqua o una bevanda elettrolitica a piccoli sorsi.",
          "If awake: give water or an electrolyte drink in small sips."
        ),
      },
      {
        title: l4("Beobachten", "Surveiller", "Osservare", "Monitor"),
        text: l4(
          "Bei Bewusstseinsstörungen, Erbrechen oder Fieber über 40 °C sofort den Notruf 112 wählen.",
          "En cas de troubles de la conscience, de vomissements ou de fièvre au-dessus de 40 °C, appeler immédiatement le 112.",
          "In caso di alterazione della coscienza, vomito o febbre oltre 40 °C, chiamare subito il 112.",
          "If consciousness is impaired, or with vomiting or a temperature above 40 °C, call 112 immediately."
        ),
      },
    ],
    warning: l4(
      "Hitzschlag ist ein lebensbedrohlicher Notfall: heisse trockene Haut, Verwirrtheit oder Bewusstlosigkeit → sofort 112. Bis zum Eintreffen konsequent kühlen.",
      "Le coup de chaleur est une urgence vitale : peau chaude et sèche, confusion ou perte de connaissance → appeler immédiatement le 112. Refroidir sans relâche jusqu'à l'arrivée des secours.",
      "Il colpo di calore è un'emergenza potenzialmente letale: pelle calda e asciutta, confusione o perdita di coscienza → chiamare subito il 112. Raffreddare costantemente fino all'arrivo dei soccorsi.",
      "Heatstroke is a life-threatening emergency: hot dry skin, confusion or unconsciousness → call 112 immediately. Keep cooling until help arrives."
    ),
    kidNote: l4(
      "Kinder immer mit Sonnenhut spielen lassen und regelmässige Trinkpausen im Schatten einplanen.",
      "Toujours faire jouer les enfants avec un chapeau de soleil et prévoir des pauses boisson régulières à l'ombre.",
      "Far giocare i bambini sempre con un cappellino da sole e programmare pause regolari per bere all'ombra.",
      "Always have children play with a sun hat on and plan regular drink breaks in the shade."
    ),
  },
  {
    id: "insektenstich",
    title: l4(
      "Insektenstich & allergische Reaktion",
      "Piqûre d'insecte & réaction allergique",
      "Puntura d'insetto & reazione allergica",
      "Insect stings & allergic reactions"
    ),
    icon: "Zap",
    severity: "mittel",
    summary: l4(
      "Wespen-, Bienen- und Bremsenstiche sind meist harmlos, können aber allergische Reaktionen auslösen – vor allem bei Stichen im Mund-Rachen-Raum.",
      "Les piqûres de guêpes, d'abeilles et de taons sont généralement bénignes, mais peuvent déclencher des réactions allergiques – surtout en cas de piqûre dans la bouche ou la gorge.",
      "Le punture di vespe, api e tafani sono per lo più innocue, ma possono scatenare reazioni allergiche – soprattutto in caso di punture in bocca o in gola.",
      "Wasp, bee and horsefly stings are usually harmless but can trigger allergic reactions – especially stings in the mouth or throat."
    ),
    symptoms: [
      l4(
        "Lokale Schwellung, Rötung, Juckreiz",
        "Gonflement local, rougeur, démangeaisons",
        "Gonfiore locale, arrossamento, prurito",
        "Local swelling, redness, itching"
      ),
      l4(
        "Bei Allergie: Quaddeln am ganzen Körper, Atemnot, Schwindel",
        "En cas d'allergie : urticaire sur tout le corps, difficultés respiratoires, vertiges",
        "In caso di allergia: orticaria su tutto il corpo, difficoltà respiratorie, vertigini",
        "If allergic: hives all over the body, breathing difficulty, dizziness"
      ),
      l4(
        "Stiche im Mund: rasch zunehmende Schwellung der Atemwege",
        "Piqûres dans la bouche : gonflement des voies respiratoires augmentant rapidement",
        "Punture in bocca: gonfiore delle vie respiratorie in rapido aumento",
        "Stings in the mouth: rapidly increasing swelling of the airways"
      ),
    ],
    steps: [
      {
        title: l4(
          "Stachel entfernen",
          "Retirer le dard",
          "Rimuovere il pungiglione",
          "Remove the sting"
        ),
        text: l4(
          "Bienenstachel mit dem Fingernagel oder einer Karte wegschaben – nicht mit der Pinzette ausdrücken.",
          "Gratter le dard d'abeille avec l'ongle ou une carte – ne pas le presser avec une pincette.",
          "Raschiare via il pungiglione d'ape con l'unghia o una tessera – non spremerlo con la pinzetta.",
          "Scrape a bee sting away with a fingernail or a card – do not squeeze it out with tweezers."
        ),
      },
      {
        title: l4("Kühlen", "Refroidir", "Raffreddare", "Cool"),
        text: l4(
          "Stichstelle kühlen. Hitzestift (ca. 50 °C) kann Juckreiz und Schwellung reduzieren.",
          "Refroidir la piqûre. Un stylo chauffant (env. 50 °C) peut réduire démangeaisons et gonflement.",
          "Raffreddare la puntura. Una penna termica (ca. 50 °C) può ridurre prurito e gonfiore.",
          "Cool the sting site. A heat pen (about 50 °C) can reduce itching and swelling."
        ),
      },
      {
        title: l4("Beobachten", "Surveiller", "Osservare", "Watch"),
        text: l4(
          "Auf Anzeichen einer allergischen Reaktion achten, besonders in den ersten 30 Minuten.",
          "Guetter les signes d'une réaction allergique, surtout durant les 30 premières minutes.",
          "Fare attenzione ai segni di una reazione allergica, soprattutto nei primi 30 minuti.",
          "Watch for signs of an allergic reaction, especially in the first 30 minutes."
        ),
      },
      {
        title: l4(
          "Bei Stich im Mund",
          "Piqûre dans la bouche",
          "Puntura in bocca",
          "Sting in the mouth"
        ),
        text: l4(
          "Eiswürfel oder kaltes Wasser lutschen lassen, kühlende Umschläge um den Hals, sofort 112 anrufen.",
          "Faire sucer des glaçons ou de l'eau froide, compresses froides autour du cou, appeler immédiatement le 112.",
          "Far succhiare cubetti di ghiaccio o acqua fredda, impacchi freddi attorno al collo, chiamare subito il 112.",
          "Have them suck ice cubes or cold water, apply cool compresses around the neck and call 112 immediately."
        ),
      },
    ],
    warning: l4(
      "Bei bekannter Insektengift-Allergie: Notfallset (Adrenalin-Autoinjektor) sofort anwenden und 112 alarmieren. Atemnot, Kreislaufprobleme oder Schwellungen im Gesicht sind immer ein Notfall.",
      "En cas d'allergie connue au venin d'insectes : utiliser immédiatement la trousse d'urgence (auto-injecteur d'adrénaline) et appeler le 112. Difficultés respiratoires, problèmes circulatoires ou gonflement du visage sont toujours une urgence.",
      "In caso di allergia nota al veleno d'insetti: usare subito il kit d'emergenza (autoiniettore di adrenalina) e chiamare il 112. Difficoltà respiratorie, problemi circolatori o gonfiori al viso sono sempre un'emergenza.",
      "With a known insect venom allergy: use the emergency kit (adrenaline auto-injector) immediately and call 112. Breathing difficulty, circulation problems or facial swelling are always an emergency."
    ),
  },
  {
    id: "blasen",
    title: l4(
      "Blasen an den Füssen",
      "Ampoules aux pieds",
      "Vesciche ai piedi",
      "Blisters on the feet"
    ),
    icon: "CircleDot",
    severity: "leicht",
    summary: l4(
      "Reibung in feuchten Schuhen verursacht Blasen – die klassische Wanderverletzung. Vorbeugen ist einfacher als behandeln.",
      "Le frottement dans des chaussures humides provoque des ampoules – la blessure de randonnée classique. Prévenir est plus simple que soigner.",
      "Lo sfregamento nelle scarpe umide provoca vesciche – il classico infortunio da escursione. Prevenire è più facile che curare.",
      "Friction in damp shoes causes blisters – the classic hiking injury. Prevention is easier than treatment."
    ),
    symptoms: [
      l4(
        "Druckstelle, Rötung («Hotspot»)",
        "Point de pression, rougeur («hotspot»)",
        "Punto di pressione, arrossamento («hotspot»)",
        "Pressure point, redness ('hotspot')"
      ),
      l4(
        "Mit Flüssigkeit gefüllte Hautblase",
        "Ampoule remplie de liquide",
        "Vescica piena di liquido",
        "Fluid-filled blister"
      ),
      l4(
        "Offene, nässende Blase",
        "Ampoule ouverte et suintante",
        "Vescica aperta ed essudante",
        "Open, weeping blister"
      ),
    ],
    steps: [
      {
        title: l4(
          "Frühzeichen ernst nehmen",
          "Prendre les premiers signes au sérieux",
          "Prendere sul serio i primi segnali",
          "Take early signs seriously"
        ),
        text: l4(
          "Bei brennenden Druckstellen sofort anhalten und die Stelle mit Blasenpflaster oder Tape schützen.",
          "En cas de points de frottement qui brûlent, s'arrêter immédiatement et protéger l'endroit avec un pansement pour ampoules ou du tape.",
          "Se un punto brucia per lo sfregamento, fermarsi subito e proteggerlo con un cerotto per vesciche o del tape.",
          "If a spot starts to burn, stop immediately and protect it with a blister plaster or tape."
        ),
      },
      {
        title: l4(
          "Geschlossene Blase",
          "Ampoule fermée",
          "Vescica chiusa",
          "Closed blister"
        ),
        text: l4(
          "Möglichst geschlossen lassen und mit einem Blasenpflaster polstern. Die Haut ist der beste Wundschutz.",
          "La laisser fermée si possible et la protéger avec un pansement pour ampoules. La peau est la meilleure protection de la plaie.",
          "Lasciarla chiusa se possibile e proteggerla con un cerotto per vesciche. La pelle è la migliore protezione della ferita.",
          "Leave it closed if possible and cushion it with a blister plaster. The skin is the best wound protection."
        ),
      },
      {
        title: l4(
          "Pralle, schmerzhafte Blase",
          "Ampoule tendue et douloureuse",
          "Vescica tesa e dolorosa",
          "Tense, painful blister"
        ),
        text: l4(
          "Nur mit desinfizierter Nadel am Rand anstechen, Flüssigkeit herausdrücken, Haut belassen, steril abdecken.",
          "Percer uniquement au bord avec une aiguille désinfectée, faire sortir le liquide, laisser la peau en place, couvrir de façon stérile.",
          "Forare solo sul bordo con un ago disinfettato, far uscire il liquido, lasciare la pelle in sede, coprire in modo sterile.",
          "Only pierce at the edge with a disinfected needle, press the fluid out, leave the skin in place and cover with a sterile dressing."
        ),
      },
      {
        title: l4(
          "Offene Blase",
          "Ampoule ouverte",
          "Vescica aperta",
          "Open blister"
        ),
        text: l4(
          "Wie eine Wunde behandeln: reinigen, desinfizieren, steril und gepolstert abdecken.",
          "Traiter comme une plaie : nettoyer, désinfecter, couvrir de façon stérile et matelassée.",
          "Trattare come una ferita: pulire, disinfettare, coprire in modo sterile e imbottito.",
          "Treat like a wound: clean, disinfect, cover with a sterile, padded dressing."
        ),
      },
    ],
    warning: l4(
      "Bei Rötung, Überwärmung, Pochen oder Eiter hat sich die Blase entzündet – dann ärztlich kontrollieren lassen (besonders bei Diabetes).",
      "En cas de rougeur, de chaleur, de douleur pulsatile ou de pus, l'ampoule s'est infectée – la faire contrôler par un médecin (surtout en cas de diabète).",
      "In caso di arrossamento, calore, dolore pulsante o pus, la vescica si è infettata – farla controllare da un medico (soprattutto in caso di diabete).",
      "Redness, heat, throbbing or pus mean the blister has become infected – have it checked by a doctor (especially with diabetes)."
    ),
    kidNote: l4(
      "Kinderfüsse abends kurz kontrollieren – Kinder melden Blasen oft erst, wenn sie offen sind.",
      "Contrôler brièvement les pieds des enfants le soir – les enfants ne signalent souvent les ampoules que lorsqu'elles sont ouvertes.",
      "Controllare brevemente i piedi dei bambini la sera – spesso i bambini segnalano le vesciche solo quando sono aperte.",
      "Give children's feet a quick check in the evening – children often only mention blisters once they are open."
    ),
  },
  {
    id: "nasenbluten",
    title: l4(
      "Nasenbluten",
      "Saignement de nez",
      "Sangue dal naso",
      "Nosebleed"
    ),
    icon: "Droplets",
    severity: "leicht",
    summary: l4(
      "Trockene Luft, Sonne oder ein Ball ins Gesicht – Nasenbluten sieht dramatisch aus, ist aber meist harmlos.",
      "Air sec, soleil ou un ballon en plein visage – un saignement de nez semble spectaculaire, mais il est généralement bénin.",
      "Aria secca, sole o una palla in faccia – il sangue dal naso sembra drammatico, ma di solito è innocuo.",
      "Dry air, sun or a ball to the face – a nosebleed looks dramatic but is usually harmless."
    ),
    symptoms: [
      l4(
        "Blutung aus einem oder beiden Nasenlöchern",
        "Saignement d'une ou des deux narines",
        "Sanguinamento da una o entrambe le narici",
        "Bleeding from one or both nostrils"
      ),
    ],
    steps: [
      {
        title: l4(
          "Aufrecht sitzen",
          "S'asseoir droit",
          "Sedersi dritti",
          "Sit upright"
        ),
        text: l4(
          "Kopf leicht nach vorne beugen – nicht in den Nacken legen, damit kein Blut in den Rachen läuft.",
          "Pencher légèrement la tête en avant – ne pas la basculer en arrière, pour que le sang ne coule pas dans la gorge.",
          "Piegare leggermente la testa in avanti – non inclinarla all'indietro, così il sangue non cola in gola.",
          "Lean the head slightly forward – do not tip it back, so no blood runs down the throat."
        ),
      },
      {
        title: l4(
          "Nase zudrücken",
          "Pincer le nez",
          "Comprimere il naso",
          "Pinch the nose"
        ),
        text: l4(
          "Nasenflügel 10 Minuten ununterbrochen zusammendrücken. Durch den Mund atmen.",
          "Pincer les ailes du nez pendant 10 minutes sans interruption. Respirer par la bouche.",
          "Comprimere le ali del naso per 10 minuti senza interruzione. Respirare con la bocca.",
          "Pinch the nostrils shut for 10 minutes without letting go. Breathe through the mouth."
        ),
      },
      {
        title: l4("Kühlen", "Refroidir", "Raffreddare", "Cool"),
        text: l4(
          "Kalter Lappen oder Kühlakku in den Nacken – das verengt die Blutgefässe.",
          "Linge froid ou accumulateur de froid sur la nuque – cela resserre les vaisseaux sanguins.",
          "Panno freddo o siberino sulla nuca – restringe i vasi sanguigni.",
          "A cold cloth or ice pack on the back of the neck – this narrows the blood vessels."
        ),
      },
      {
        title: l4(
          "Danach schonen",
          "Ménager ensuite",
          "Poi riguardarsi",
          "Take it easy afterwards"
        ),
        text: l4(
          "Einige Stunden nicht schnäuzen und nicht in der Nase bohren.",
          "Ne pas se moucher et ne pas se curer le nez pendant quelques heures.",
          "Per alcune ore non soffiarsi il naso e non metterci le dita.",
          "Do not blow or pick the nose for a few hours."
        ),
      },
    ],
    warning: l4(
      "Hört die Blutung nach 20 Minuten Druck nicht auf oder folgt sie auf einen heftigen Sturz/Schlag, ärztliche Hilfe aufsuchen.",
      "Si le saignement ne s'arrête pas après 20 minutes de compression ou s'il fait suite à une chute ou un coup violent, consulter un médecin.",
      "Se il sanguinamento non si ferma dopo 20 minuti di compressione o segue una caduta o un colpo violento, cercare aiuto medico.",
      "If the bleeding does not stop after 20 minutes of pressure, or if it follows a heavy fall or blow, seek medical help."
    ),
  },
  {
    id: "bewusstlosigkeit",
    title: l4(
      "Bewusstlosigkeit & Reanimation",
      "Perte de connaissance & réanimation",
      "Perdita di coscienza & rianimazione",
      "Unconsciousness & CPR"
    ),
    icon: "HeartPulse",
    severity: "ernst",
    summary: l4(
      "Der wichtigste Notfall-Ablauf überhaupt: prüfen, rufen, handeln. Diese Schritte können Leben retten.",
      "La procédure d'urgence la plus importante de toutes : contrôler, alerter, agir. Ces gestes peuvent sauver des vies.",
      "La procedura d'emergenza più importante in assoluto: controllare, chiamare, agire. Questi passaggi possono salvare vite.",
      "The most important emergency routine of all: check, call, act. These steps can save lives."
    ),
    symptoms: [
      l4(
        "Person reagiert nicht auf Ansprache und Anfassen",
        "La personne ne réagit ni à la voix ni au toucher",
        "La persona non reagisce né alla voce né al contatto",
        "The person does not respond to voice or touch"
      ),
      l4(
        "Atmung vorhanden oder nicht vorhanden",
        "Respiration présente ou absente",
        "Respirazione presente o assente",
        "Breathing present or absent"
      ),
    ],
    steps: [
      {
        title: l4("Prüfen", "Contrôler", "Controllare", "Check"),
        text: l4(
          "Laut ansprechen, an den Schultern rütteln. Keine Reaktion? Atemwege freimachen (Kopf überstrecken) und maximal 10 Sekunden Atmung prüfen.",
          "Parler fort, secouer aux épaules. Pas de réaction ? Libérer les voies respiratoires (basculer la tête en arrière) et contrôler la respiration pendant 10 secondes au maximum.",
          "Parlare ad alta voce, scuotere per le spalle. Nessuna reazione? Liberare le vie aeree (iperestendere la testa) e controllare la respirazione per massimo 10 secondi.",
          "Speak loudly and shake the shoulders. No response? Open the airway (tilt the head back) and check breathing for no more than 10 seconds."
        ),
      },
      {
        title: l4(
          "Notruf 112",
          "Appeler le 112",
          "Chiamare il 112",
          "Call 112"
        ),
        text: l4(
          "Sofort 112 (oder Rega 1414) anrufen oder eine zweite Person damit beauftragen. Lautsprecher einschalten.",
          "Appeler immédiatement le 112 (ou la Rega au 1414) ou charger une deuxième personne de le faire. Activer le haut-parleur.",
          "Chiamare subito il 112 (o la Rega al 1414) o incaricare una seconda persona. Attivare il vivavoce.",
          "Call 112 (or Rega on 1414) immediately, or ask someone else to do it. Switch on the speakerphone."
        ),
      },
      {
        title: l4(
          "Atmung vorhanden",
          "Respiration présente",
          "Respirazione presente",
          "Breathing present"
        ),
        text: l4(
          "Stabile Seitenlage, zudecken, Atmung laufend überwachen bis die Rettung eintrifft.",
          "Position latérale de sécurité, couvrir, surveiller la respiration en continu jusqu'à l'arrivée des secours.",
          "Posizione laterale di sicurezza, coprire, sorvegliare costantemente la respirazione fino all'arrivo dei soccorsi.",
          "Recovery position, cover them up and monitor breathing continuously until help arrives."
        ),
      },
      {
        title: l4(
          "Keine normale Atmung",
          "Pas de respiration normale",
          "Respirazione non normale",
          "No normal breathing"
        ),
        text: l4(
          "Herzdruckmassage: 30× fest und schnell (5–6 cm tief, 100–120/min) in der Brustmitte drücken, dann 2 Beatmungen. Nicht aufhören, bis Hilfe da ist.",
          "Massage cardiaque : appuyer 30 fois, fort et vite (5–6 cm de profondeur, 100–120/min) au milieu de la poitrine, puis 2 insufflations. Ne pas s'arrêter avant l'arrivée des secours.",
          "Massaggio cardiaco: comprimere 30 volte, con forza e rapidità (5–6 cm di profondità, 100–120/min) al centro del torace, poi 2 ventilazioni. Non fermarsi finché non arrivano i soccorsi.",
          "Chest compressions: press hard and fast 30 times (5–6 cm deep, 100–120/min) in the centre of the chest, then give 2 rescue breaths. Do not stop until help arrives."
        ),
      },
    ],
    warning: l4(
      "Schnappatmung (einzelne, röchelnde Atemzüge) ist KEINE normale Atmung – sofort mit der Herzdruckmassage beginnen. Drücken ist wichtiger als Beatmen.",
      "Une respiration agonique (quelques inspirations isolées et bruyantes) n'est PAS une respiration normale – commencer immédiatement le massage cardiaque. Comprimer est plus important que ventiler.",
      "Il respiro agonico (singoli respiri rantolanti) NON è una respirazione normale – iniziare subito il massaggio cardiaco. Comprimere è più importante che ventilare.",
      "Agonal gasps (isolated, snoring breaths) are NOT normal breathing – start chest compressions immediately. Compressions matter more than rescue breaths."
    ),
    kidNote: l4(
      "Bei Kindern: zuerst 5 Beatmungen, dann 30:2. Bei Kleinkindern mit zwei Fingern bzw. einer Hand drücken (ca. 1/3 der Brusttiefe).",
      "Chez les enfants : d'abord 5 insufflations, puis 30:2. Chez les tout-petits, comprimer avec deux doigts ou une seule main (env. 1/3 de la profondeur du thorax).",
      "Nei bambini: prima 5 ventilazioni, poi 30:2. Nei bambini piccoli comprimere con due dita o con una sola mano (ca. 1/3 della profondità del torace).",
      "For children: give 5 rescue breaths first, then 30:2. For infants and toddlers, press with two fingers or one hand (about 1/3 of the chest depth)."
    ),
  },
];
