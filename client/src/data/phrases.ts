/**
 * Camping-Sprachhilfe: kurze Sätze für den Campingplatz-Alltag, gruppiert
 * nach Situation. Anders als in den übrigen Datenmodulen ist das L4 hier
 * KEIN übersetztes Anzeige-Label, sondern der Inhalt selbst: derselbe Satz
 * in DE/FR/IT/EN. Die Seite zeigt ihn in der App-Sprache (als Bedeutung)
 * und gross in der gewählten Zielsprache.
 *
 * `note` ist dagegen ein normaler Hinweistext und wird in der App-Sprache
 * angezeigt (Aussprache, regionale Varianten, Höflichkeitsformen).
 */
import { l4, type L4 } from "@shared/i18n";

/** Situations-Gruppen der Sprachhilfe (Schlüssel bleiben stabil). */
export const phraseGroups = [
  "arrival",
  "pitch",
  "shopping",
  "restaurant",
  "emergency",
  "wayfinding",
  "smalltalk",
] as const;

export type PhraseGroup = (typeof phraseGroups)[number];

export interface Phrase {
  id: string;
  group: PhraseGroup;
  /** Der Satz selbst – in jeder der vier Sprachen. */
  text: L4;
  /** Optionaler Hinweis in der App-Sprache (Aussprache, Variante, Anrede). */
  note?: L4;
}

/** Anzeige-Namen der Gruppen (in der App-Sprache). */
export const phraseGroupLabels: Record<PhraseGroup, L4> = {
  arrival: l4(
    "Ankunft & Rezeption",
    "Arrivée & réception",
    "Arrivo & reception",
    "Arrival & reception"
  ),
  pitch: l4(
    "Platz & Technik",
    "Emplacement & technique",
    "Piazzola & tecnica",
    "Pitch & facilities"
  ),
  shopping: l4("Einkaufen", "Courses", "Fare la spesa", "Shopping"),
  restaurant: l4(
    "Essen & Restaurant",
    "Repas & restaurant",
    "Mangiare & ristorante",
    "Eating out"
  ),
  emergency: l4(
    "Notfall & Arzt",
    "Urgence & médecin",
    "Emergenza & medico",
    "Emergency & doctor"
  ),
  wayfinding: l4(
    "Wetter & Wege",
    "Météo & chemins",
    "Meteo & percorsi",
    "Weather & directions"
  ),
  smalltalk: l4(
    "Höflichkeit & Small Talk",
    "Politesse & petite conversation",
    "Cortesia & due chiacchiere",
    "Courtesy & small talk"
  ),
};

/**
 * Die Sätze sind bewusst in der Höflichkeitsform gehalten (Sie/vous/Lei) –
 * gegenüber Rezeption, Verkäufer*innen und Ärzt*innen ist das überall passend.
 */
export const phrases: Phrase[] = [
  // ---------------------------------------------------------------- Ankunft
  {
    id: "arrival-reservation",
    group: "arrival",
    text: l4(
      "Ich habe eine Reservierung auf den Namen …",
      "J'ai une réservation au nom de …",
      "Ho una prenotazione a nome …",
      "I have a booking under the name …"
    ),
    note: l4(
      "Den Namen am besten gleich buchstabieren.",
      "Le mieux est d'épeler le nom tout de suite.",
      "Meglio dettare subito il nome lettera per lettera.",
      "Best to spell the name out right away."
    ),
  },
  {
    id: "arrival-free-pitch",
    group: "arrival",
    text: l4(
      "Haben Sie noch einen freien Stellplatz?",
      "Avez-vous encore un emplacement libre ?",
      "Avete ancora una piazzola libera?",
      "Do you still have a pitch available?"
    ),
  },
  {
    id: "arrival-two-nights",
    group: "arrival",
    text: l4(
      "Wir möchten zwei Nächte bleiben.",
      "Nous aimerions rester deux nuits.",
      "Vorremmo restare due notti.",
      "We would like to stay two nights."
    ),
  },
  {
    id: "arrival-price",
    group: "arrival",
    text: l4(
      "Was kostet eine Nacht mit Zelt und zwei Personen?",
      "Combien coûte une nuit avec une tente et deux personnes ?",
      "Quanto costa una notte con tenda e due persone?",
      "How much is one night with a tent and two people?"
    ),
  },
  {
    id: "arrival-motorhome",
    group: "arrival",
    text: l4(
      "Wir sind mit dem Wohnmobil unterwegs.",
      "Nous voyageons en camping-car.",
      "Viaggiamo in camper.",
      "We are travelling in a motorhome."
    ),
  },
  {
    id: "arrival-checkout",
    group: "arrival",
    text: l4(
      "Bis wann müssen wir den Platz räumen?",
      "Jusqu'à quelle heure devons-nous libérer l'emplacement ?",
      "Entro che ora dobbiamo liberare la piazzola?",
      "By what time do we have to vacate the pitch?"
    ),
  },
  {
    id: "arrival-shady-pitch",
    group: "arrival",
    text: l4(
      "Haben Sie einen ruhigen Platz im Schatten?",
      "Avez-vous un emplacement calme à l'ombre ?",
      "Avete una piazzola tranquilla all'ombra?",
      "Do you have a quiet pitch in the shade?"
    ),
  },
  {
    id: "arrival-card",
    group: "arrival",
    text: l4(
      "Kann ich mit Karte bezahlen?",
      "Puis-je payer par carte ?",
      "Posso pagare con la carta?",
      "Can I pay by card?"
    ),
  },
  {
    id: "arrival-id",
    group: "arrival",
    text: l4(
      "Brauchen Sie meinen Ausweis?",
      "Avez-vous besoin de ma pièce d'identité ?",
      "Le serve il mio documento d'identità?",
      "Do you need my ID?"
    ),
  },

  // ------------------------------------------------------- Platz & Technik
  {
    id: "pitch-power",
    group: "pitch",
    text: l4(
      "Wo finde ich den Stromanschluss?",
      "Où se trouve la borne électrique ?",
      "Dov'è la colonnina elettrica?",
      "Where is the electricity hook-up?"
    ),
  },
  {
    id: "pitch-adapter",
    group: "pitch",
    text: l4(
      "Haben Sie einen Adapter für das Stromkabel?",
      "Avez-vous un adaptateur pour le câble électrique ?",
      "Avete un adattatore per il cavo elettrico?",
      "Do you have an adapter for the power cable?"
    ),
  },
  {
    id: "pitch-drinking-water",
    group: "pitch",
    text: l4(
      "Ist das Trinkwasser?",
      "Est-ce de l'eau potable ?",
      "È acqua potabile?",
      "Is this drinking water?"
    ),
    note: l4(
      "Nicht als Trinkwasser gekennzeichnete Hähne im Zweifel meiden.",
      "En cas de doute, évite les robinets non marqués comme potables.",
      "Nel dubbio evita i rubinetti non contrassegnati come potabili.",
      "When in doubt, avoid taps not marked as drinking water."
    ),
  },
  {
    id: "pitch-sanitary",
    group: "pitch",
    text: l4(
      "Wo sind die Duschen und Toiletten?",
      "Où sont les douches et les toilettes ?",
      "Dove sono le docce e i servizi igienici?",
      "Where are the showers and toilets?"
    ),
  },
  {
    id: "pitch-shower-token",
    group: "pitch",
    text: l4(
      "Braucht die Dusche eine Münze oder einen Chip?",
      "La douche fonctionne-t-elle avec une pièce ou un jeton ?",
      "La doccia funziona a moneta o con un gettone?",
      "Does the shower need a coin or a token?"
    ),
  },
  {
    id: "pitch-grey-water",
    group: "pitch",
    text: l4(
      "Wo kann ich das Abwasser entsorgen?",
      "Où puis-je vider les eaux usées ?",
      "Dove posso scaricare le acque grigie?",
      "Where can I empty the waste water?"
    ),
  },
  {
    id: "pitch-chemical-toilet",
    group: "pitch",
    text: l4(
      "Wo ist die Entsorgung für die Chemietoilette?",
      "Où se trouve le vidoir pour les WC chimiques ?",
      "Dov'è lo scarico per la toilette chimica?",
      "Where is the chemical toilet disposal point?"
    ),
  },
  {
    id: "pitch-wifi",
    group: "pitch",
    text: l4(
      "Wie lautet das WLAN-Passwort?",
      "Quel est le mot de passe du wifi ?",
      "Qual è la password del wi-fi?",
      "What is the wifi password?"
    ),
  },
  {
    id: "pitch-quiet-hours",
    group: "pitch",
    text: l4(
      "Ab wann gilt die Nachtruhe?",
      "À partir de quelle heure le silence est-il demandé ?",
      "Da che ora vale il silenzio notturno?",
      "From what time do quiet hours apply?"
    ),
  },
  {
    id: "pitch-barbecue",
    group: "pitch",
    text: l4(
      "Darf ich hier grillieren?",
      "Ai-je le droit de faire un grill ici ?",
      "Posso fare la griglia qui?",
      "Am I allowed to barbecue here?"
    ),
    note: l4(
      "«Grillieren» ist schweizerisch – in Deutschland sagt man «grillen».",
      "En Suisse romande on dit aussi « faire une grillade ».",
      "In Italia si dice anche «fare una grigliata».",
      "In many places people simply say “have a barbecue”."
    ),
  },
  {
    id: "pitch-gas",
    group: "pitch",
    text: l4(
      "Wo kann ich meine Gasflasche auffüllen oder tauschen?",
      "Où puis-je remplir ou échanger ma bouteille de gaz ?",
      "Dove posso riempire o sostituire la bombola del gas?",
      "Where can I refill or exchange my gas bottle?"
    ),
  },

  // ------------------------------------------------------------- Einkaufen
  {
    id: "shopping-supermarket",
    group: "shopping",
    text: l4(
      "Wo ist der nächste Supermarkt?",
      "Où est le supermarché le plus proche ?",
      "Dov'è il supermercato più vicino?",
      "Where is the nearest supermarket?"
    ),
  },
  {
    id: "shopping-opening",
    group: "shopping",
    text: l4(
      "Wann öffnet der Laden?",
      "À quelle heure ouvre le magasin ?",
      "A che ora apre il negozio?",
      "What time does the shop open?"
    ),
  },
  {
    id: "shopping-bread",
    group: "shopping",
    text: l4(
      "Kann ich für morgen frisches Brot bestellen?",
      "Puis-je commander du pain frais pour demain ?",
      "Posso ordinare del pane fresco per domani?",
      "Can I order fresh bread for tomorrow?"
    ),
  },
  {
    id: "shopping-ice",
    group: "shopping",
    text: l4(
      "Haben Sie Eiswürfel oder Kühlakkus?",
      "Avez-vous des glaçons ou des blocs réfrigérants ?",
      "Avete ghiaccio o piastre refrigeranti?",
      "Do you have ice cubes or cool packs?"
    ),
    note: l4(
      "Praktisch, wenn die Kühlbox nachgeladen werden muss.",
      "Pratique quand la glacière doit être rechargée.",
      "Utile quando il frigo box va ricaricato.",
      "Handy when the cool box needs topping up."
    ),
  },
  {
    id: "shopping-price",
    group: "shopping",
    text: l4(
      "Was kostet das?",
      "Combien ça coûte ?",
      "Quanto costa?",
      "How much is this?"
    ),
  },
  {
    id: "shopping-bag",
    group: "shopping",
    text: l4(
      "Eine Tragtasche, bitte.",
      "Un sac, s'il vous plaît.",
      "Un sacchetto, per favore.",
      "A carrier bag, please."
    ),
  },
  {
    id: "shopping-cash",
    group: "shopping",
    text: l4(
      "Nehmen Sie Bargeld?",
      "Acceptez-vous les espèces ?",
      "Accettate contanti?",
      "Do you take cash?"
    ),
  },

  // --------------------------------------------------- Essen & Restaurant
  {
    id: "restaurant-table",
    group: "restaurant",
    text: l4(
      "Einen Tisch für vier Personen, bitte.",
      "Une table pour quatre personnes, s'il vous plaît.",
      "Un tavolo per quattro persone, per favore.",
      "A table for four, please."
    ),
  },
  {
    id: "restaurant-menu",
    group: "restaurant",
    text: l4(
      "Die Speisekarte, bitte.",
      "La carte, s'il vous plaît.",
      "Il menu, per favore.",
      "The menu, please."
    ),
  },
  {
    id: "restaurant-recommendation",
    group: "restaurant",
    text: l4(
      "Was empfehlen Sie?",
      "Que recommandez-vous ?",
      "Cosa consiglia?",
      "What do you recommend?"
    ),
  },
  {
    id: "restaurant-vegetarian",
    group: "restaurant",
    text: l4(
      "Ich esse vegetarisch.",
      "Je suis végétarien·ne.",
      "Sono vegetariano/a.",
      "I am vegetarian."
    ),
    note: l4(
      "Weibliche Form: «végétarienne» bzw. «vegetariana».",
      "Forme féminine : « végétarienne », en italien « vegetariana ».",
      "Forma femminile: «vegetariana», in francese «végétarienne».",
      "Feminine forms: “végétarienne” (fr), “vegetariana” (it)."
    ),
  },
  {
    id: "restaurant-allergy",
    group: "restaurant",
    text: l4(
      "Ich habe eine Nussallergie.",
      "Je suis allergique aux fruits à coque.",
      "Sono allergico/a alla frutta a guscio.",
      "I am allergic to nuts."
    ),
    note: l4(
      "Bei schweren Allergien zusätzlich schriftlich zeigen.",
      "En cas d'allergie grave, montre aussi la phrase par écrit.",
      "In caso di allergia grave mostra la frase anche per iscritto.",
      "With severe allergies, also show the sentence in writing."
    ),
  },
  {
    id: "restaurant-tap-water",
    group: "restaurant",
    text: l4(
      "Eine Karaffe Leitungswasser, bitte.",
      "Une carafe d'eau du robinet, s'il vous plaît.",
      "Una caraffa d'acqua del rubinetto, per favore.",
      "A jug of tap water, please."
    ),
  },
  {
    id: "restaurant-bill",
    group: "restaurant",
    text: l4(
      "Die Rechnung, bitte.",
      "L'addition, s'il vous plaît.",
      "Il conto, per favore.",
      "The bill, please."
    ),
  },
  {
    id: "restaurant-compliment",
    group: "restaurant",
    text: l4(
      "Das war sehr gut, danke.",
      "C'était très bon, merci.",
      "Era ottimo, grazie.",
      "That was very good, thank you."
    ),
  },

  // ------------------------------------------------------ Notfall & Arzt
  {
    id: "emergency-help",
    group: "emergency",
    text: l4("Hilfe!", "À l'aide !", "Aiuto!", "Help!"),
    note: l4(
      "Laut und deutlich rufen – zusätzlich winken.",
      "Crie fort et clairement, et fais de grands signes.",
      "Grida forte e chiaro e sbraccia per farti notare.",
      "Shout loudly and clearly, and wave your arms."
    ),
  },
  {
    id: "emergency-doctor",
    group: "emergency",
    text: l4(
      "Wir brauchen einen Arzt.",
      "Nous avons besoin d'un médecin.",
      "Abbiamo bisogno di un medico.",
      "We need a doctor."
    ),
  },
  {
    id: "emergency-ambulance",
    group: "emergency",
    text: l4(
      "Bitte rufen Sie einen Krankenwagen.",
      "Appelez une ambulance, s'il vous plaît.",
      "Chiami un'ambulanza, per favore.",
      "Please call an ambulance."
    ),
    note: l4(
      "Notruf in Europa: 112.",
      "Numéro d'urgence européen : 112.",
      "Numero d'emergenza europeo: 112.",
      "European emergency number: 112."
    ),
  },
  {
    id: "emergency-hospital",
    group: "emergency",
    text: l4(
      "Wo ist das nächste Spital?",
      "Où est l'hôpital le plus proche ?",
      "Dov'è l'ospedale più vicino?",
      "Where is the nearest hospital?"
    ),
    note: l4(
      "«Spital» ist schweizerisch – in Deutschland «Krankenhaus».",
      "En Suisse alémanique on dit « Spital », en Allemagne « Krankenhaus ».",
      "In Svizzera tedesca si dice «Spital», in Germania «Krankenhaus».",
      "Swiss German says “Spital”, Germany says “Krankenhaus”."
    ),
  },
  {
    id: "emergency-pharmacy",
    group: "emergency",
    text: l4(
      "Wo finde ich eine Apotheke?",
      "Où puis-je trouver une pharmacie ?",
      "Dove trovo una farmacia?",
      "Where can I find a pharmacy?"
    ),
  },
  {
    id: "emergency-pain",
    group: "emergency",
    text: l4(
      "Ich habe starke Schmerzen hier.",
      "J'ai de fortes douleurs ici.",
      "Ho forti dolori qui.",
      "I have severe pain here."
    ),
    note: l4(
      "Beim Sprechen auf die betroffene Stelle zeigen.",
      "Montre l'endroit concerné en parlant.",
      "Indica il punto interessato mentre parli.",
      "Point to the spot while you say it."
    ),
  },
  {
    id: "emergency-tick",
    group: "emergency",
    text: l4(
      "Ich wurde von einer Zecke gestochen.",
      "J'ai été piqué·e par une tique.",
      "Sono stato/a punto/a da una zecca.",
      "I have been bitten by a tick."
    ),
  },
  {
    id: "emergency-police",
    group: "emergency",
    text: l4(
      "Rufen Sie bitte die Polizei.",
      "Appelez la police, s'il vous plaît.",
      "Chiami la polizia, per favore.",
      "Please call the police."
    ),
  },
  {
    id: "emergency-child",
    group: "emergency",
    text: l4(
      "Ich vermisse mein Kind.",
      "Mon enfant a disparu.",
      "Ho perso di vista mio figlio.",
      "My child is missing."
    ),
    note: l4(
      "Alter, Kleidung und Name gleich mitnennen.",
      "Indique tout de suite l'âge, les vêtements et le prénom.",
      "Indica subito età, vestiti e nome.",
      "Give the age, clothing and name straight away."
    ),
  },

  // ------------------------------------------------------ Wetter & Wege
  {
    id: "wayfinding-forecast",
    group: "wayfinding",
    text: l4(
      "Wie wird das Wetter morgen?",
      "Quel temps fera-t-il demain ?",
      "Che tempo farà domani?",
      "What will the weather be like tomorrow?"
    ),
  },
  {
    id: "wayfinding-storm",
    group: "wayfinding",
    text: l4(
      "Ist ein Gewitter angesagt?",
      "Un orage est-il annoncé ?",
      "È previsto un temporale?",
      "Is a thunderstorm forecast?"
    ),
  },
  {
    id: "wayfinding-lake",
    group: "wayfinding",
    text: l4(
      "Wie komme ich zum See?",
      "Comment puis-je aller au lac ?",
      "Come arrivo al lago?",
      "How do I get to the lake?"
    ),
  },
  {
    id: "wayfinding-hike-duration",
    group: "wayfinding",
    text: l4(
      "Wie lange dauert die Wanderung?",
      "Combien de temps dure la randonnée ?",
      "Quanto dura l'escursione?",
      "How long does the hike take?"
    ),
  },
  {
    id: "wayfinding-trail-open",
    group: "wayfinding",
    text: l4(
      "Ist der Wanderweg offen?",
      "Le sentier est-il ouvert ?",
      "Il sentiero è aperto?",
      "Is the trail open?"
    ),
  },
  {
    id: "wayfinding-bus",
    group: "wayfinding",
    text: l4(
      "Wo hält der Bus ins Dorf?",
      "Où s'arrête le bus pour le village ?",
      "Dove ferma l'autobus per il paese?",
      "Where does the bus to the village stop?"
    ),
  },
  {
    id: "wayfinding-distance",
    group: "wayfinding",
    text: l4(
      "Ist es weit zu Fuss?",
      "Est-ce loin à pied ?",
      "È lontano a piedi?",
      "Is it far on foot?"
    ),
  },

  // ------------------------------------------- Höflichkeit & Small Talk
  {
    id: "smalltalk-hello",
    group: "smalltalk",
    text: l4("Guten Tag!", "Bonjour !", "Buongiorno!", "Hello!"),
    note: l4(
      "Am Abend: «Guten Abend» / «Bonsoir» / «Buonasera».",
      "Le soir : « Bonsoir », en italien « Buonasera ».",
      "Di sera: «Buonasera», in francese «Bonsoir».",
      "In the evening: “Bonsoir” (fr), “Buonasera” (it)."
    ),
  },
  {
    id: "smalltalk-please",
    group: "smalltalk",
    text: l4("Bitte.", "S'il vous plaît.", "Per favore.", "Please."),
  },
  {
    id: "smalltalk-thanks",
    group: "smalltalk",
    text: l4(
      "Vielen Dank!",
      "Merci beaucoup !",
      "Grazie mille!",
      "Thank you very much!"
    ),
  },
  {
    id: "smalltalk-sorry",
    group: "smalltalk",
    text: l4("Entschuldigung.", "Excusez-moi.", "Mi scusi.", "Excuse me."),
    note: l4(
      "Vertraut bzw. unter Gleichaltrigen: «Excuse-moi» / «Scusa».",
      "Entre proches : « Excuse-moi », en italien « Scusa ».",
      "Tra amici: «Scusa», in francese «Excuse-moi».",
      "Informally: “Excuse-moi” (fr), “Scusa” (it)."
    ),
  },
  {
    id: "smalltalk-little-language",
    group: "smalltalk",
    text: l4(
      "Ich spreche leider nur wenig von Ihrer Sprache.",
      "Je parle malheureusement très peu votre langue.",
      "Purtroppo parlo poco la vostra lingua.",
      "I am afraid I only speak a little of your language."
    ),
  },
  {
    id: "smalltalk-slower",
    group: "smalltalk",
    text: l4(
      "Können Sie bitte langsamer sprechen?",
      "Pouvez-vous parler plus lentement, s'il vous plaît ?",
      "Può parlare più lentamente, per favore?",
      "Could you speak more slowly, please?"
    ),
  },
  {
    id: "smalltalk-english",
    group: "smalltalk",
    text: l4(
      "Sprechen Sie Englisch?",
      "Parlez-vous anglais ?",
      "Parla inglese?",
      "Do you speak English?"
    ),
  },
  {
    id: "smalltalk-good-stay",
    group: "smalltalk",
    text: l4(
      "Schönen Aufenthalt!",
      "Bon séjour !",
      "Buon soggiorno!",
      "Enjoy your stay!"
    ),
  },
  {
    id: "smalltalk-goodbye",
    group: "smalltalk",
    text: l4("Auf Wiedersehen!", "Au revoir !", "Arrivederci!", "Goodbye!"),
  },
];
