/**
 * Offline-Knoten-Bibliothek – alle Anleitungen sind im App-Bundle enthalten.
 */
import img_knoten_mastwurf from "@/assets/knoten-mastwurf.webp";
import img_knoten_palstek from "@/assets/knoten-palstek.webp";
import img_knoten_spannknoten from "@/assets/knoten-spannknoten.webp";
import img_knoten_kreuzknoten from "@/assets/knoten-kreuzknoten.webp";
import img_knoten_schotstek from "@/assets/knoten-schotstek.webp";
import img_knoten_prusik from "@/assets/knoten-prusik.webp";
import img_knoten_achterknoten from "@/assets/knoten-achterknoten.webp";
import img_knoten_fischerknoten from "@/assets/knoten-fischerknoten.webp";

export interface Knot {
  id: string;
  name: string;
  altName?: string;
  category: "Befestigen" | "Spannen" | "Verbinden" | "Schlaufen";
  difficulty: 1 | 2 | 3;
  useCase: string;
  campingUse: string;
  steps: string[];
  proTip: string;
  image?: string;
}

export const knots: Knot[] = [
  {
    id: "mastwurf",
    name: "Mastwurf",
    altName: "Webeleinenstek",
    category: "Befestigen",
    difficulty: 1,
    image: img_knoten_mastwurf,
    useCase: "Ein Seil schnell an einem Baum, Pfahl oder Hering befestigen.",
    campingUse:
      "Tarp-Leine am Baumstamm oder an der Zeltstange festmachen – schnell gelegt und ebenso schnell wieder gelöst.",
    steps: [
      "Das Seil einmal um den Baum oder Pfahl legen, sodass das lose Ende über dem festen Ende kreuzt.",
      "Eine zweite Runde um den Pfahl legen, parallel oberhalb der ersten.",
      "Das lose Ende unter der zweiten Runde (unter dem eigenen Kreuzungspunkt) durchstecken.",
      "Beide Enden in entgegengesetzte Richtungen ziehen, bis der Knoten fest sitzt.",
    ],
    proTip:
      "Der Mastwurf hält nur unter Zug zuverlässig. Für dauerhafte Befestigungen mit einem halben Schlag sichern.",
  },
  {
    id: "palstek",
    name: "Palstek",
    altName: "Bulin",
    category: "Schlaufen",
    difficulty: 2,
    image: img_knoten_palstek,
    useCase:
      "Eine feste Schlaufe, die sich unter Last nicht zuzieht – der «König der Knoten».",
    campingUse:
      "Feste Schlaufe zum Einhängen in Heringe, zum Abschleppen oder um etwas Schweres zu sichern.",
    steps: [
      "Ein kleines Auge ins Seil legen – das lose Ende liegt oben auf dem festen Ende.",
      "Das lose Ende von unten durch das Auge führen («der Fuchs kommt aus der Höhle»).",
      "Das lose Ende hinter dem festen Ende herumführen («läuft um den Baum»).",
      "Das lose Ende wieder von oben in das Auge zurückstecken («zurück in die Höhle») und festziehen.",
    ],
    proTip:
      "Nach dem Festziehen prüfen: Die Schlaufe darf sich unter Zug nicht verkleinern. Lässt sich auch nach starker Belastung leicht wieder öffnen.",
  },
  {
    id: "spannknoten",
    name: "Spannknoten",
    altName: "Tautline Hitch",
    category: "Spannen",
    difficulty: 2,
    image: img_knoten_spannknoten,
    useCase:
      "Verstellbarer Knoten, der eine Leine auf Spannung hält – nachspannbar ohne Neubinden.",
    campingUse:
      "Der wichtigste Zeltknoten: Abspannleinen von Zelt und Tarp lassen sich damit stufenlos nachspannen, wenn sie sich über Nacht lockern.",
    steps: [
      "Das Seil um den Hering führen und mit dem losen Ende zurück zur Leine gehen.",
      "Das lose Ende zweimal innerhalb der entstandenen Schlaufe um die stehende Leine wickeln (Richtung Hering).",
      "Eine dritte Wicklung aussen, oberhalb der Schlaufe, um die stehende Leine legen.",
      "Festziehen – der Knoten lässt sich nun auf der Leine verschieben und hält unter Zug.",
    ],
    proTip:
      "Funktioniert am besten mit leicht rauen Leinen. Bei sehr glatten Dyneema-Schnüren eine zusätzliche Wicklung einbauen.",
  },
  {
    id: "kreuzknoten",
    name: "Kreuzknoten",
    altName: "Weberknoten",
    category: "Verbinden",
    difficulty: 1,
    image: img_knoten_kreuzknoten,
    useCase: "Zwei gleich dicke Seilenden miteinander verbinden.",
    campingUse:
      "Gerissene Zeltleine flicken oder zwei kurze Schnüre zu einer langen verbinden (bei gleicher Dicke).",
    steps: [
      "Beide Seilenden kreuzen: links über rechts, dann einmal umeinander schlagen.",
      "Die Enden erneut kreuzen: jetzt rechts über links.",
      "Wieder umeinander schlagen und beide Enden festziehen.",
      "Kontrolle: Beide Enden müssen parallel aus dem Knoten austreten – sonst ist es ein (unsicherer) Altweiberknoten.",
    ],
    proTip:
      "Merkspruch: «Links über rechts, rechts über links.» Für unterschiedlich dicke Seile stattdessen den Schotstek verwenden.",
  },
  {
    id: "schotstek",
    name: "Schotstek",
    category: "Verbinden",
    difficulty: 2,
    image: img_knoten_schotstek,
    useCase: "Zwei unterschiedlich dicke Seile sicher verbinden.",
    campingUse:
      "Dünne Reepschnur an ein dickeres Seil knüpfen, z. B. um eine Tarp-Leine zu verlängern.",
    steps: [
      "Aus dem dickeren Seil eine Bucht (offene Schlaufe) formen.",
      "Das dünnere Seil von unten durch die Bucht führen.",
      "Mit dem dünnen Seil einmal um beide Schenkel der Bucht herumfahren.",
      "Das dünne Ende unter sich selbst durchstecken und festziehen – beide losen Enden liegen auf derselben Seite.",
    ],
    proTip:
      "Für glatte oder stark unterschiedliche Seile den doppelten Schotstek binden (zweite Wicklung um die Bucht).",
  },
  {
    id: "prusik",
    name: "Prusikknoten",
    category: "Schlaufen",
    difficulty: 2,
    image: img_knoten_prusik,
    useCase:
      "Klemmknoten, der sich auf einem gespannten Seil verschieben lässt und unter Last blockiert.",
    campingUse:
      "Perfekt für die Tarp-Firstleine: Damit lassen sich Aufhängepunkte verschieben, die unter Zug sofort festklemmen.",
    steps: [
      "Eine Reepschnur-Schlinge hinter das gespannte Seil legen.",
      "Die Schlinge zwei- bis dreimal durch sich selbst um das Seil wickeln.",
      "Die Wicklungen ordentlich nebeneinander legen – keine Überkreuzungen.",
      "Festziehen: Unter Last klemmt der Knoten, ohne Last lässt er sich verschieben.",
    ],
    proTip:
      "Die Schlinge sollte etwa halb so dick sein wie das Hauptseil, sonst klemmt der Knoten nicht zuverlässig.",
  },
  {
    id: "achterknoten",
    name: "Achterknoten",
    category: "Befestigen",
    difficulty: 1,
    image: img_knoten_achterknoten,
    useCase:
      "Stopperknoten, der verhindert, dass ein Seilende durch eine Öse rutscht.",
    campingUse:
      "Am Ende von Zeltleinen, damit sie nicht aus den Ösen oder Leinenspannern rutschen.",
    steps: [
      "Mit dem Seilende ein Auge legen – das Ende liegt unter dem festen Teil.",
      "Das Ende einmal um das feste Teil herumführen (eine halbe Drehung mehr als beim Überhandknoten).",
      "Das Ende von oben durch das Auge stecken.",
      "Festziehen – der Knoten bildet eine deutlich sichtbare «8».",
    ],
    proTip:
      "Lässt sich im Gegensatz zum einfachen Überhandknoten auch nach starker Belastung wieder gut lösen.",
  },
  {
    id: "fischerknoten",
    name: "Doppelter Spierenstich",
    altName: "Fischerknoten",
    category: "Verbinden",
    difficulty: 3,
    image: img_knoten_fischerknoten,
    useCase:
      "Bombenfeste Verbindung zweier Seile – auch bei glatten, dünnen Schnüren.",
    campingUse:
      "Gerissene Abspannleinen dauerhaft flicken oder eine geschlossene Prusikschlinge aus Reepschnur knüpfen.",
    steps: [
      "Beide Seilenden parallel, aber gegenläufig nebeneinander legen.",
      "Mit dem ersten Ende zwei Wicklungen um das andere Seil legen und durch die eigenen Wicklungen stecken.",
      "Mit dem zweiten Ende ebenso zwei Wicklungen um das erste Seil legen und durchstecken.",
      "Beide festen Enden ziehen – die zwei Einzelknoten rutschen zusammen und verkeilen sich.",
    ],
    proTip:
      "Sehr sicher, aber nach starker Belastung kaum mehr zu öffnen – für dauerhafte Verbindungen gedacht.",
  },
];
