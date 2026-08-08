/**
 * Feuer-Ratgeber (#507): Aufbau, Anzünden, Unterhalten und richtiges
 * Löschen eines Lagerfeuers – die Lücke zwischen Feuerholz-Rechner
 * (#287), Feuerstellen-Finder (#247) und Feuerverbots-Übersicht (#263).
 * Offline-Nachschlage-Material.
 */
import { l4, type L4 } from "@shared/i18n";

export interface FireGuideEntry {
  id: string;
  title: L4;
  text: L4;
}

export const fireGuideSteps: FireGuideEntry[] = [
  {
    id: "erlaubt",
    title: l4(
      "Zuerst: Ist Feuer hier erlaubt?",
      "D'abord : le feu est-il autorisé ici ?",
      "Prima di tutto: il fuoco è permesso qui?",
      "First: is fire allowed here?"
    ),
    text: l4(
      "Feuerverbote des Kantons und Platzregeln gehen vor. Bestehende Feuerstellen nutzen statt neue Brandflecken schaffen.",
      "Les interdictions cantonales et le règlement du camping priment. Utiliser les foyers existants plutôt que créer de nouvelles traces de feu.",
      "I divieti cantonali e il regolamento del campeggio hanno la precedenza. Usare i focolari esistenti invece di creare nuove bruciature.",
      "Cantonal fire bans and site rules come first. Use existing fire pits instead of scorching new ground."
    ),
  },
  {
    id: "platz",
    title: l4(
      "Den Platz vorbereiten",
      "Préparer l'emplacement",
      "Preparare il posto",
      "Prepare the spot"
    ),
    text: l4(
      "Windgeschützt, mindestens 3 m Abstand zu Zelt, Bäumen und trockenem Gras; Untergrund aus Stein oder blanker Erde, Wasser zum Löschen bereitstellen.",
      "À l'abri du vent, au moins 3 m du tente, des arbres et de l'herbe sèche ; sol de pierre ou de terre nue, eau d'extinction à portée.",
      "Al riparo dal vento, ad almeno 3 m da tenda, alberi ed erba secca; fondo di pietra o terra nuda, acqua per spegnere a portata di mano.",
      "Sheltered from wind, at least 3 m from tent, trees and dry grass; ground of stone or bare earth, water for extinguishing at hand."
    ),
  },
  {
    id: "pyramide",
    title: l4(
      "Aufbau: die Pyramide",
      "Montage : la pyramide",
      "Costruzione: la piramide",
      "Build: the teepee"
    ),
    text: l4(
      "Zuunterst Zunder (Birkenrinde, trockenes Gras), darüber Kleinholz als Zelt, aussen fingerdicke Äste. Luft muss von unten nachströmen können.",
      "En bas l'amadou (écorce de bouleau, herbe sèche), au-dessus le petit bois en tipi, à l'extérieur des branches épaisses comme un doigt. L'air doit pouvoir monter par le bas.",
      "Sotto l'esca (corteccia di betulla, erba secca), sopra la legna minuta a capanna, all'esterno rami spessi un dito. L'aria deve poter affluire dal basso.",
      "Tinder at the bottom (birch bark, dry grass), kindling above it like a tent, finger-thick branches outside. Air must be able to flow in from below."
    ),
  },
  {
    id: "blockhaus",
    title: l4(
      "Aufbau: das Blockhaus",
      "Montage : la cabane",
      "Costruzione: la catasta",
      "Build: the log cabin"
    ),
    text: l4(
      "Scheite kreuzweise wie Blockhaus-Wände schichten, Zunder in die Mitte – brennt ruhiger und länger als die Pyramide, ideal für Glut zum Grillieren.",
      "Empiler les bûches en croix comme des murs de cabane, l'amadou au centre – brûle plus calmement et plus longtemps que la pyramide, idéal pour la braise à griller.",
      "Impilare i ceppi incrociati come pareti di una baita, l'esca al centro – brucia più calmo e più a lungo della piramide, ideale per la brace da griglia.",
      "Stack logs crosswise like cabin walls with tinder in the middle – burns steadier and longer than the teepee, ideal for grilling embers."
    ),
  },
  {
    id: "anzuenden",
    title: l4(
      "Anzünden ohne Brandbeschleuniger",
      "Allumer sans accélérant",
      "Accendere senza accelerante",
      "Lighting without accelerants"
    ),
    text: l4(
      "Zunder an mehreren Stellen anzünden, von unten und aus der Windrichtung. NIE Benzin oder Spiritus nachgiessen – die Stichflamme trifft die Hand.",
      "Allumer l'amadou à plusieurs endroits, par le bas et côté vent. NE JAMAIS rajouter d'essence ou d'alcool – la flamme jaillit vers la main.",
      "Accendere l'esca in più punti, dal basso e dal lato del vento. MAI aggiungere benzina o alcol – la fiammata colpisce la mano.",
      "Light the tinder in several places, from below and from the windward side. NEVER pour on petrol or spirits – the flash flame hits your hand."
    ),
  },
  {
    id: "unterhalten",
    title: l4(
      "Unterhalten & beaufsichtigen",
      "Entretenir & surveiller",
      "Mantenere & sorvegliare",
      "Feeding & supervising"
    ),
    text: l4(
      "Nur trockenes, unbehandeltes Holz nachlegen – kein Abfall, kein lackiertes Holz. Ein Feuer bleibt nie unbeaufsichtigt, Kinder nur mit Aufsicht davor.",
      "N'ajouter que du bois sec non traité – pas de déchets, pas de bois peint. Un feu ne reste jamais sans surveillance, les enfants seulement accompagnés.",
      "Aggiungere solo legna secca non trattata – niente rifiuti, niente legno verniciato. Un fuoco non resta mai incustodito, i bambini solo sorvegliati.",
      "Only add dry, untreated wood – no rubbish, no painted wood. A fire is never left unattended; children only with supervision."
    ),
  },
  {
    id: "funkenflug",
    title: l4(
      "Wind heisst aufhören",
      "Vent = on arrête",
      "Vento = si smette",
      "Wind means stop"
    ),
    text: l4(
      "Bei auffrischendem Wind und Funkenflug das Feuer verkleinern oder löschen – Funken tragen hundert Meter weit. Die Lagerfeuer-Ampel der App hilft beim Entscheid.",
      "Si le vent forcit et que les étincelles volent, réduire ou éteindre le feu – une étincelle porte à cent mètres. Le feu vert/rouge de l'app aide à décider.",
      "Se il vento rinforza e volano scintille, ridurre o spegnere il fuoco – una scintilla vola cento metri. Il semaforo del falò nell'app aiuta a decidere.",
      "If the wind picks up and sparks fly, shrink or extinguish the fire – sparks travel a hundred metres. The app's campfire light helps you decide."
    ),
  },
  {
    id: "loeschen",
    title: l4(
      "Richtig löschen",
      "Bien éteindre",
      "Spegnere bene",
      "Extinguishing properly"
    ),
    text: l4(
      "Glut auseinanderziehen, reichlich Wasser darüber, umrühren, nochmals wässern – bis alles handkalt ist. Erde ersetzt Wasser nicht: Darunter glimmt es weiter.",
      "Étaler la braise, verser beaucoup d'eau, remuer, arroser encore – jusqu'à ce que tout soit froid au toucher. La terre ne remplace pas l'eau : dessous, ça couve.",
      "Allargare la brace, versare molta acqua, mescolare, bagnare di nuovo – finché tutto è freddo al tatto. La terra non sostituisce l'acqua: sotto continua a covare.",
      "Spread the embers, douse with plenty of water, stir, douse again – until everything is cold to the touch. Soil is no substitute for water: it smoulders on underneath."
    ),
  },
];
