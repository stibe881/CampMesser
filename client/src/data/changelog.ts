import { l4 } from "@shared/i18n";
import type { ChangelogBlock } from "./changelogMeta";

/**
 * «Was ist neu»: die NEUSTEN nutzersichtbaren Änderungen der App, gruppiert
 * nach Veröffentlichungs-Blöcken. Der neueste Block steht zuoberst; die Ids
 * sind aufsteigend sortierbar aufgebaut (ISO-Datum + laufende Nummer, z. B.
 * "2026-08-03.1"), damit «gesehen bis Id X» einfach vergleichbar bleibt.
 *
 * Pflegepflicht: Jeder Feature-Batch ergänzt seine nutzersichtbaren Features
 * als je EINE kurze L4-Zeile (Du-Form) im obersten Block – neuer Block, falls
 * von heute noch keiner existiert. Reine Fixes/Interna gehören NICHT hierher.
 * Kein Vollständigkeitsanspruch: die wichtigsten Neuerungen zuerst. Dazu
 * gehören zwei weitere Handgriffe: Die Id des obersten Blocks steht in
 * `changelogMeta.ts` und muss mitgezogen werden, und sobald hier mehr als
 * drei Blöcke stehen, wandern die ältesten nach `changelogArchive.ts`
 * (#535) – der Test `server/changelogMeta.test.ts` wacht über beides.
 *
 * DIESE DATEI WIRD NUR DYNAMISCH GELADEN. Sie darf nirgends statisch
 * importiert werden – wer Blöcke anzeigen will, holt sie per
 * `await import("@/data/changelog")`. Den Typ liefert `changelogMeta.ts`.
 * Die älteren Blöcke liegen in `changelogArchive.ts` und kommen erst auf
 * «Ältere anzeigen» dazu – so lädt der Start-Dialog ein paar kB statt der
 * ganzen App-Geschichte (die allein gegen 350 kB wiegt).
 */

export type { ChangelogBlock };

export const changelog: ChangelogBlock[] = [
  {
    id: "2026-08-09.2",
    date: "2026-08-09",
    entries: [
      l4(
        "Der Rückblick nach der Reise ist jetzt nach Kategorien gegliedert – wie die Packliste selbst. Und was gefehlt hat, bekommt beim Erfassen gleich seine Kategorie: Der Vorschlag auf der Packliste legt es später in die richtige Gruppe statt in «Allgemein».",
        "La rétrospective après le voyage est désormais structurée par catégories – comme la liste de bagages. Et ce qui a manqué reçoit sa catégorie dès la saisie : la suggestion sur la liste le placera ensuite dans le bon groupe au lieu de « Général ».",
        "La retrospettiva dopo il viaggio ora è suddivisa per categorie – come la lista bagagli. E ciò che è mancato riceve subito la sua categoria: il suggerimento sulla lista lo metterà poi nel gruppo giusto invece che in «Generale».",
        "The post-trip review is now grouped by categories – just like the packing list. And missing items get their category right when you note them: the suggestion on the list later places them in the right group instead of “General”."
      ),
      l4(
        "Unwetter-Push nur noch, wo du gerade bist: Gewarnt wird am Ort der laufenden Reise (verknüpfter Platz oder Ort mit Koordinaten) – nicht mehr das ganze Jahr für jeden gespeicherten Platz und den Heim-Standort. Das Daheim wird nur noch gewarnt, wenn eine laufende Reise in seiner Nähe liegt. In der App selbst siehst du die Warnungen deiner Plätze weiterhin jederzeit.",
        "Alerte intempéries seulement là où tu es : l’avertissement concerne le lieu du voyage en cours (emplacement lié ou lieu avec coordonnées) – plus toute l’année pour chaque emplacement enregistré et le domicile. Le domicile n’est averti que si un voyage en cours se trouve à proximité. Dans l’app, tu vois toujours les alertes de tes emplacements à tout moment.",
        "Avviso maltempo solo dove sei: l’avviso riguarda il luogo del viaggio in corso (piazzola collegata o luogo con coordinate) – non più tutto l’anno per ogni piazzola salvata e per casa. Casa viene avvisata solo se un viaggio in corso è nelle vicinanze. Nell’app vedi comunque sempre gli avvisi delle tue piazzole.",
        "Storm push only where you are: warnings cover the location of the running trip (linked spot or place with coordinates) – no longer all year for every saved spot and your home. Home is only warned when a running trip is nearby. In the app itself you still see your spots’ warnings at any time."
      ),
    ],
  },
  {
    id: "2026-08-09.1",
    date: "2026-08-09",
    entries: [
      l4(
        "«Wer ist dabei?» steht jetzt bei der Reise. Beim Anlegen oder Bearbeiten einer Reise tippst du an, wer mitkommt – die Reisepässe übernehmen das von selbst, die Häkchenliste im Pass ist weg. Neu ist der Familien-Pass streng: Er stempelt nur Reisen, bei denen die ganze Familie dabei war. Und wer zur Familie zählt, bestimmst du pro Person im Pass – das Göttikind darf fehlen, ohne den Familien-Stempel zu verhindern.",
        "« Qui vient ? » se trouve désormais sur le voyage. En créant ou modifiant un voyage, tu indiques qui participe – les passeports le reprennent tout seuls, la liste à cocher dans le passeport a disparu. Nouveau : le passeport familial est strict et ne tamponne que les voyages où toute la famille était là. Et tu décides par personne qui compte comme famille – le filleul peut manquer sans empêcher le tampon familial.",
        "«Chi viene?» ora sta sul viaggio. Creando o modificando un viaggio indichi chi partecipa – i passaporti lo riprendono da soli, la lista di spunte nel passaporto è sparita. Novità: il passaporto di famiglia è severo e timbra solo i viaggi con tutta la famiglia. E per ogni persona decidi chi conta come famiglia – il figlioccio può mancare senza impedire il timbro di famiglia.",
        "“Who’s along?” now lives on the trip. When creating or editing a trip you tap who joins – the passports pick it up automatically, and the tick list in the passport is gone. New: the family passport is strict and only stamps trips where the whole family was along. You decide per person who counts as family – the godchild may be absent without blocking the family stamp."
      ),
      l4(
        "Der Reisepass erkennt den Platznamen jetzt auch bei Reisen, die nur über den verknüpften Zeltplatz benannt sind – vorher blieb der Stempel dort aus.",
        "Le passeport reconnaît désormais le nom de l’emplacement même pour les voyages nommés seulement via le camping lié – avant, le tampon manquait.",
        "Il passaporto ora riconosce il nome della piazzola anche per i viaggi denominati solo tramite il campeggio collegato – prima il timbro mancava.",
        "The passport now recognises the place name even for trips named only via the linked campsite – previously the stamp was missing there."
      ),
    ],
  },
];
