/**
 * Gute-Nacht-Geschichten fürs Zelt (#241).
 *
 * Kurze Vorlesegeschichten rund um Natur und Camping – 3 bis 5 Minuten, so
 * lange, wie ein Kind abends noch zuhört. Alle Geschichten sind eigens für
 * ReiseKompass geschrieben und liegen vollständig in DE/FR/IT/EN vor.
 *
 * Ton: warmherzig, in der Du-Form dort, wo die Geschichte das Kind direkt
 * anspricht (meist am Schluss), ohne Gruseliges für die Kleinen. Zwei
 * Geschichten dürfen für Grössere leicht spannend sein – «Die Nacht der
 * tausend Sterne» und «Das Geheimnis der alten Tanne» –, beide lösen sich
 * freundlich auf, niemand kommt zu Schaden.
 *
 * Die Jahreszeit steckt als Schlüssel drin (shared/season.ts, SEASON_KEYS);
 * ohne Angabe passt die Geschichte das ganze Jahr. Absätze werden mit einer
 * Leerzeile getrennt – die Oberfläche bricht daran um, der Vorlese-Modus
 * liest den Text am Stück.
 */
import { l4, type L4 } from "@shared/i18n";
import type { SeasonKey } from "@shared/season";

export interface BedtimeStory {
  /** Stabile Id – Merker «schon vorgelesen» hängt daran. */
  id: string;
  title: L4;
  /** Jahreszeit; fehlt sie, passt die Geschichte das ganze Jahr. */
  season?: SeasonKey;
  /** Altersempfehlung: ab so vielen Jahren. */
  minAge: number;
  /** Geschätzte Vorlesedauer in Minuten (ruhiges Tempo mit Pausen). */
  minutes: number;
  /** Der ganze Text; Absätze durch eine Leerzeile getrennt. */
  text: L4;
}

export const bedtimeStories: BedtimeStory[] = [
  {
    id: "murmeltiere",
    season: "spring",
    minAge: 4,
    minutes: 4,
    title: l4(
      "Die Murmeltiere wachen auf",
      "Les marmottes se réveillent",
      "Le marmotte si svegliano",
      "The marmots wake up"
    ),
    text: l4(
      `Hoch oben am Berg, wo im Winter nur der Wind unterwegs ist, liegt eine kleine Wiese. Unter der Wiese, tief unter der Erde, schläft eine ganze Murmeltier-Familie. Sie schlafen schon so lange, dass sie den Schnee gar nicht bemerkt haben, der über ihnen liegt.

Das kleinste Murmeltier heisst Pippa. Eines Morgens im Frühling kitzelt etwas ihre Nase. Es ist ein Tropfen. Ein einziger, kleiner Wassertropfen, der sich durch die Erde gearbeitet hat. «Das Wasser ist wach», murmelt Pippas Mama im Schlaf. «Dann ist der Winter fertig.»

Pippa gräbt sich nach oben. Sie schiebt Erde weg, sie schiebt Wurzeln weg, sie schiebt sogar einen kleinen Stein weg. Und dann steckt sie die Nase ins Freie – und muss ganz fest blinzeln. So hell ist es draussen! Der Schnee ist fast weg. Nur ein paar weisse Flecken liegen noch in den Mulden, wie vergessene Taschentücher.

Pippa pfeift. Ein einziger, langer Pfiff. So sagen Murmeltiere: Ich bin da.

Aus einem Loch weiter unten pfeift jemand zurück. Dann noch jemand. Und noch jemand. Der ganze Berg pfeift, hin und her, und jeder Pfiff heisst dasselbe: Wir haben den Winter überlebt.

Am Abend sitzt die ganze Familie vor dem Bau. Die Sonne geht hinter dem grossen Grat unter und macht die Felsen für einen Moment ganz rosa. Pippa hat den ganzen Tag Gras gefressen, sie hat sich im Staub gerollt, und sie ist zweimal den Hang hinuntergekugelt, weil das lustig ist.

«Müde?», fragt Mama.

«Ein bisschen», sagt Pippa.

«Gut», sagt Mama. «Aber nur ein bisschen. Vor uns liegt ein ganzer Sommer.»

Und während über dem Berg die ersten Sterne aufgehen, kuschelt sich Pippa an ihre Mama und schläft ein.

Vielleicht schläft in diesem Moment ganz in der Nähe von deinem Zelt auch ein kleines Tier ein. Schlaf gut.`,
      `Tout en haut de la montagne, là où en hiver seul le vent se promène, il y a un petit pré. Sous le pré, profondément sous la terre, dort toute une famille de marmottes. Elles dorment depuis si longtemps qu'elles n'ont même pas remarqué la neige au-dessus d'elles.

La plus petite marmotte s'appelle Pippa. Un matin de printemps, quelque chose lui chatouille le nez. C'est une goutte. Une seule petite goutte d'eau qui s'est frayé un chemin à travers la terre. « L'eau est réveillée », murmure la maman de Pippa dans son sommeil. « Alors l'hiver est fini. »

Pippa creuse vers le haut. Elle pousse la terre, elle pousse les racines, elle pousse même un petit caillou. Et puis elle sort le nez à l'air libre – et elle doit cligner très fort des yeux. Comme il fait clair dehors ! La neige a presque disparu. Il ne reste que quelques taches blanches dans les creux, comme des mouchoirs oubliés.

Pippa siffle. Un seul long sifflement. C'est ainsi que les marmottes disent : je suis là.

D'un trou plus bas, quelqu'un siffle en retour. Puis quelqu'un d'autre. Et encore quelqu'un. Toute la montagne siffle, d'un côté et de l'autre, et chaque sifflement dit la même chose : nous avons survécu à l'hiver.

Le soir, toute la famille est assise devant le terrier. Le soleil se couche derrière la grande arête et rend les rochers tout roses pendant un instant. Pippa a mangé de l'herbe toute la journée, elle s'est roulée dans la poussière, et elle a dévalé la pente deux fois en boule, parce que c'est amusant.

« Fatiguée ? », demande maman.

« Un peu », dit Pippa.

« Bien », dit maman. « Mais un peu seulement. Nous avons tout un été devant nous. »

Et pendant que les premières étoiles se lèvent au-dessus de la montagne, Pippa se blottit contre sa maman et s'endort.

Peut-être qu'en ce moment, tout près de ta tente, un petit animal s'endort lui aussi. Dors bien.`,
      `In alto sulla montagna, dove d'inverno gira solo il vento, c'è un piccolo prato. Sotto il prato, in fondo alla terra, dorme un'intera famiglia di marmotte. Dormono da così tanto tempo che non si sono nemmeno accorte della neve sopra di loro.

La marmotta più piccola si chiama Pippa. Una mattina di primavera qualcosa le solletica il naso. È una goccia. Una sola, piccola goccia d'acqua che si è fatta strada attraverso la terra. «L'acqua è sveglia», mormora la mamma di Pippa nel sonno. «Allora l'inverno è finito.»

Pippa scava verso l'alto. Spinge via la terra, spinge via le radici, spinge via perfino un sassolino. E poi mette il naso all'aria aperta – e deve strizzare forte gli occhi. Com'è chiaro là fuori! La neve è quasi sparita. Restano solo alcune macchie bianche negli avvallamenti, come fazzoletti dimenticati.

Pippa fischia. Un unico, lungo fischio. È così che le marmotte dicono: sono qui.

Da una tana più in basso qualcuno fischia di rimando. Poi qualcun altro. E un altro ancora. Tutta la montagna fischia, avanti e indietro, e ogni fischio dice la stessa cosa: siamo sopravvissuti all'inverno.

La sera tutta la famiglia siede davanti alla tana. Il sole tramonta dietro la grande cresta e per un attimo rende le rocce tutte rosa. Pippa ha mangiato erba tutto il giorno, si è rotolata nella polvere ed è ruzzolata due volte giù per il pendio, perché è divertente.

«Stanca?», chiede la mamma.

«Un pochino», dice Pippa.

«Bene», dice la mamma. «Ma solo un pochino. Davanti a noi c'è un'estate intera.»

E mentre sopra la montagna spuntano le prime stelle, Pippa si rannicchia contro la sua mamma e si addormenta.

Forse in questo momento, proprio vicino alla tua tenda, anche un piccolo animale sta prendendo sonno. Dormi bene.`,
      `High up on the mountain, where in winter only the wind is out and about, there is a small meadow. Under the meadow, deep beneath the earth, a whole family of marmots is asleep. They have been asleep so long that they have not even noticed the snow lying above them.

The smallest marmot is called Pippa. One spring morning something tickles her nose. It is a drop. One single little drop of water that has worked its way down through the soil. “The water is awake,” Pippa's mother murmurs in her sleep. “Then winter is over.”

Pippa digs upwards. She pushes soil aside, she pushes roots aside, she even pushes a small stone aside. And then she sticks her nose out into the open – and has to blink very hard. How bright it is out here! The snow has almost gone. Only a few white patches are left in the hollows, like forgotten handkerchiefs.

Pippa whistles. One single long whistle. That is how marmots say: I am here.

From a burrow further down someone whistles back. Then someone else. And someone else again. The whole mountain is whistling, back and forth, and every whistle means the same thing: we have survived the winter.

In the evening the whole family sits outside the burrow. The sun goes down behind the great ridge and turns the rocks completely pink for a moment. Pippa has eaten grass all day, she has rolled in the dust, and she has tumbled down the slope twice, because that is funny.

“Tired?” asks her mother.

“A little,” says Pippa.

“Good,” says her mother. “But only a little. A whole summer lies ahead of us.”

And while the first stars come out above the mountain, Pippa snuggles up to her mother and falls asleep.

Perhaps at this very moment, very close to your tent, a small animal is falling asleep too. Sleep well.`
    ),
  },
  {
    id: "bach-zum-meer",
    season: "spring",
    minAge: 5,
    minutes: 4,
    title: l4(
      "Wie der kleine Bach das Meer fand",
      "Comment le petit ruisseau a trouvé la mer",
      "Come il ruscelletto trovò il mare",
      "How the little stream found the sea"
    ),
    text: l4(
      `Ganz oben am Berg, unter einem Stein, wohnte ein kleiner Bach. Er war so klein, dass man ihn kaum hörte. Plip. Plop. Mehr sagte er nicht.

Eines Tages hörte er zwei Wanderer reden. «Weisst du», sagte der eine, «alles Wasser fliesst irgendwann ins Meer.»

Der kleine Bach hatte noch nie vom Meer gehört. Aber er beschloss sofort: Da will ich hin.

Also machte er sich auf den Weg. Zuerst über die Wiese, wo die Kühe aus ihm tranken und sich dabei die Nasen nass machten. Dann über einen kleinen Wasserfall – und das war zuerst ziemlich beängstigend, aber unten angekommen musste der Bach lachen, weil es so gekitzelt hatte.

Beim Wald traf er einen anderen Bach.

«Wo willst du hin?», fragte der.

«Zum Meer», sagte der kleine Bach.

«Ich auch», sagte der andere. «Komm, wir gehen zusammen.»

Und plötzlich war der kleine Bach doppelt so gross.

So ging es weiter. Bei jedem Dorf kam jemand dazu. Ein Bach vom linken Hang, ein Bach vom rechten Hang, ein Rinnsal aus einem Rohr, das Wasser vom Kirchendach, ein Regenguss aus einer schwarzen Wolke. Aus dem kleinen Bach wurde ein Fluss. Aus dem Fluss wurde ein breiter, ruhiger Strom, auf dem Schiffe fuhren.

Und eines Morgens roch die Luft anders. Salzig. Der Strom wurde langsamer, breiter, immer breiter – und dann hörte er einfach auf, ein Fluss zu sein.

Vor ihm lag das Meer. So gross, dass man das andere Ufer nicht sah.

«Bin ich jetzt angekommen?», fragte der Bach.

«Du bist jetzt hier», sagte das Meer freundlich. «Angekommen ist etwas anderes. Warte nur, bis die Sonne dich hochhebt.»

Und tatsächlich: Ein paar Tage später zog die Sonne den kleinen Bach in den Himmel hinauf. Er wurde zu einer Wolke, flog über das Land zurück zu seinem Berg – und fiel als Regen wieder unter seinen Stein.

Plip. Plop.

Er war zu Hause. Und morgen würde er einfach wieder losgehen.`,
      `Tout en haut de la montagne, sous une pierre, vivait un petit ruisseau. Il était si petit qu'on l'entendait à peine. Plic. Ploc. Il n'en disait pas plus.

Un jour, il entendit deux randonneurs parler. « Tu sais », dit l'un, « toute l'eau finit un jour dans la mer. »

Le petit ruisseau n'avait jamais entendu parler de la mer. Mais il décida aussitôt : c'est là que je veux aller.

Il se mit donc en route. D'abord à travers le pré, où les vaches burent de son eau en s'y mouillant le museau. Puis par-dessus une petite cascade – et au début c'était vraiment effrayant, mais une fois en bas le ruisseau dut rire, tellement ça l'avait chatouillé.

Près de la forêt, il rencontra un autre ruisseau.

« Où vas-tu ? », demanda celui-ci.

« À la mer », dit le petit ruisseau.

« Moi aussi », dit l'autre. « Viens, allons-y ensemble. »

Et soudain le petit ruisseau était deux fois plus grand.

Cela continua ainsi. À chaque village, quelqu'un s'ajoutait. Un ruisseau du versant gauche, un ruisseau du versant droit, un filet d'eau sortant d'un tuyau, l'eau du toit de l'église, une averse tombée d'un nuage noir. Le petit ruisseau devint une rivière. La rivière devint un large fleuve tranquille sur lequel naviguaient des bateaux.

Et un matin, l'air sentit autrement. Salé. Le fleuve ralentit, s'élargit, s'élargit encore – et puis il cessa simplement d'être un fleuve.

Devant lui s'étendait la mer. Si grande qu'on n'en voyait pas l'autre rive.

« Suis-je arrivé maintenant ? », demanda le ruisseau.

« Tu es ici maintenant », dit la mer gentiment. « Arriver, c'est autre chose. Attends seulement que le soleil te soulève. »

Et en effet : quelques jours plus tard, le soleil tira le petit ruisseau vers le ciel. Il devint un nuage, survola le pays jusqu'à sa montagne – et retomba en pluie sous sa pierre.

Plic. Ploc.

Il était à la maison. Et demain, il repartirait tout simplement.`,
      `In alto sulla montagna, sotto una pietra, viveva un ruscelletto. Era così piccolo che lo si sentiva appena. Plic. Ploc. Non diceva altro.

Un giorno sentì parlare due escursionisti. «Sai», disse uno, «tutta l'acqua prima o poi finisce nel mare.»

Il ruscelletto non aveva mai sentito parlare del mare. Ma decise subito: è lì che voglio andare.

Così si mise in cammino. Prima attraverso il prato, dove le mucche bevvero da lui bagnandosi il muso. Poi giù da una piccola cascata – e all'inizio faceva parecchia paura, ma arrivato in fondo il ruscello dovette ridere, perché gli aveva fatto un gran solletico.

Vicino al bosco incontrò un altro ruscello.

«Dove vai?», chiese quello.

«Al mare», disse il ruscelletto.

«Anch'io», disse l'altro. «Dai, andiamoci insieme.»

E all'improvviso il ruscelletto era grande il doppio.

E continuò così. A ogni paese si aggiungeva qualcuno. Un ruscello dal versante sinistro, un ruscello dal versante destro, un rivolo che usciva da un tubo, l'acqua dal tetto della chiesa, un acquazzone caduto da una nuvola nera. Il ruscelletto divenne un fiume. Il fiume divenne una corrente larga e tranquilla su cui navigavano le navi.

E una mattina l'aria aveva un altro odore. Salato. La corrente rallentò, si allargò, si allargò ancora – e poi smise semplicemente di essere un fiume.

Davanti a lui c'era il mare. Così grande che non se ne vedeva l'altra riva.

«Sono arrivato adesso?», chiese il ruscello.

«Adesso sei qui», disse il mare gentilmente. «Arrivare è un'altra cosa. Aspetta solo che il sole ti sollevi.»

E infatti: qualche giorno dopo il sole tirò il ruscelletto su nel cielo. Diventò una nuvola, volò sopra il paese fino alla sua montagna – e ricadde come pioggia sotto la sua pietra.

Plic. Ploc.

Era a casa. E l'indomani sarebbe semplicemente ripartito.`,
      `High up on the mountain, under a stone, there lived a little stream. It was so small you could hardly hear it. Plip. Plop. That was all it said.

One day it heard two hikers talking. “You know,” said one of them, “all water ends up in the sea sooner or later.”

The little stream had never heard of the sea. But it decided at once: that is where I want to go.

So it set off. First across the meadow, where the cows drank from it and got their noses wet. Then over a small waterfall – and at first that was rather frightening, but once at the bottom the stream had to laugh, because it had tickled so much.

At the edge of the forest it met another stream.

“Where are you going?” the other one asked.

“To the sea,” said the little stream.

“Me too,” said the other. “Come on, let us go together.”

And suddenly the little stream was twice as big.

And so it went on. At every village someone joined in. A brook from the left-hand slope, a brook from the right-hand slope, a trickle out of a pipe, the water off the church roof, a downpour from a black cloud. The little stream became a river. The river became a broad, calm flow with ships on it.

And one morning the air smelled different. Salty. The river slowed down, grew wider, wider still – and then it simply stopped being a river.

Before it lay the sea. So big that you could not see the far shore.

“Have I arrived now?” asked the stream.

“You are here now,” said the sea kindly. “Arriving is something else. Just wait until the sun lifts you up.”

And sure enough: a few days later the sun drew the little stream up into the sky. It became a cloud, flew back over the land to its mountain – and fell as rain under its stone again.

Plip. Plop.

It was home. And tomorrow it would simply set off once more.`
    ),
  },
  {
    id: "gluehwuermchen",
    season: "summer",
    minAge: 3,
    minutes: 3,
    title: l4(
      "Die Glühwürmchen-Laterne",
      "La lanterne des vers luisants",
      "La lanterna delle lucciole",
      "The glow-worm lantern"
    ),
    text: l4(
      `Es war ein warmer Sommerabend, so einer, an dem man die Zelttür offen lassen kann.

Nele lag auf ihrer Matte und konnte nicht schlafen. Draussen war es nicht ganz dunkel und nicht ganz hell, sondern genau dazwischen. Und dann sah sie es: ein winziges grünes Licht, das durch die Wiese schwebte.

Dann noch eines. Und noch eines. Bald war die ganze Wiese voller kleiner Lichter, die auf- und abgingen, als würde jemand ganz langsam mit einer Taschenlampe blinzeln.

Nele schlich aus dem Zelt. Das Gras war kühl und nass unter ihren Füssen.

Ein Licht kam ganz nahe und setzte sich auf ihren Finger. Es war ein kleiner brauner Käfer, gar nicht besonders hübsch – und trotzdem leuchtete sein Hinterteil so grün wie ein Stück Mond.

«Warum leuchtest du?», flüsterte Nele.

Der Käfer sagte natürlich nichts. Käfer reden nicht. Aber Neles Papa, der plötzlich hinter ihr stand, sagte leise: «Er sucht jemanden. Das Leuchten ist sein Ruf.»

«Und findet er sie?»

«Meistens schon.»

Sie standen noch eine Weile da, Nele und ihr Papa, mitten in einer Wiese voller kleiner grüner Rufe.

Dann flog der Käfer davon, hinüber zu einem anderen Licht, und die beiden Lichter tanzten zusammen weg.

«Darf ich eines mit ins Zelt nehmen?», fragte Nele.

«Lieber nicht», sagte Papa. «In einem Glas hört es auf zu leuchten. Draussen leuchtet es die ganze Nacht.»

Also liess Nele die Lichter dort, wo sie hingehören.

Sie legte sich zurück auf ihre Matte, liess die Zelttür ein Stückchen offen und schaute den kleinen grünen Lichtern zu, bis ihre Augen von ganz allein zufielen.

Vielleicht leuchtet gerade jetzt auch bei dir eines. Schau ruhig noch einmal hinaus – und dann schlaf gut.`,
      `C'était un chaud soir d'été, un de ceux où l'on peut laisser la porte de la tente ouverte.

Nele était allongée sur son matelas et n'arrivait pas à dormir. Dehors, il ne faisait pas tout à fait nuit et pas tout à fait jour, mais exactement entre les deux. Et puis elle le vit : une minuscule lumière verte qui flottait à travers le pré.

Puis une autre. Et encore une autre. Bientôt tout le pré fut plein de petites lumières qui s'allumaient et s'éteignaient, comme si quelqu'un clignait très lentement d'une lampe de poche.

Nele sortit de la tente sur la pointe des pieds. L'herbe était fraîche et mouillée sous ses pieds.

Une lumière s'approcha tout près et se posa sur son doigt. C'était un petit scarabée brun, pas particulièrement joli – et pourtant son arrière-train brillait d'un vert comme un morceau de lune.

« Pourquoi est-ce que tu brilles ? », chuchota Nele.

Le scarabée ne dit rien, bien sûr. Les scarabées ne parlent pas. Mais le papa de Nele, qui se tenait soudain derrière elle, dit doucement : « Il cherche quelqu'un. Sa lumière, c'est son appel. »

« Et est-ce qu'il la trouve ? »

« La plupart du temps, oui. »

Ils restèrent là encore un moment, Nele et son papa, au milieu d'un pré plein de petits appels verts.

Puis le scarabée s'envola vers une autre lumière, et les deux lumières s'en allèrent en dansant ensemble.

« Est-ce que je peux en emporter un dans la tente ? », demanda Nele.

« Mieux vaut pas », dit papa. « Dans un bocal, il arrête de briller. Dehors, il brille toute la nuit. »

Alors Nele laissa les lumières là où elles ont leur place.

Elle se recoucha sur son matelas, laissa la porte de la tente un peu ouverte et regarda les petites lumières vertes jusqu'à ce que ses yeux se ferment tout seuls.

Peut-être qu'en ce moment une lumière brille aussi près de toi. Regarde donc encore une fois dehors – et puis dors bien.`,
      `Era una calda sera d'estate, una di quelle in cui si può lasciare aperta la porta della tenda.

Nele era sdraiata sul suo materassino e non riusciva a dormire. Fuori non era del tutto buio e non era del tutto chiaro, ma esattamente nel mezzo. E poi la vide: una minuscola luce verde che fluttuava attraverso il prato.

Poi un'altra. E un'altra ancora. Presto tutto il prato fu pieno di piccole luci che si accendevano e si spegnevano, come se qualcuno ammiccasse lentissimamente con una torcia.

Nele sgusciò fuori dalla tenda. L'erba era fresca e bagnata sotto i suoi piedi.

Una luce si avvicinò moltissimo e si posò sul suo dito. Era un piccolo coleottero marrone, per niente bello – eppure la sua parte posteriore brillava di un verde come un pezzo di luna.

«Perché brilli?», sussurrò Nele.

Il coleottero naturalmente non disse nulla. I coleotteri non parlano. Ma il papà di Nele, che all'improvviso era dietro di lei, disse piano: «Sta cercando qualcuno. La luce è il suo richiamo.»

«E la trova?»

«Quasi sempre sì.»

Rimasero lì ancora un po', Nele e il suo papà, in mezzo a un prato pieno di piccoli richiami verdi.

Poi il coleottero volò via, verso un'altra luce, e le due luci se ne andarono danzando insieme.

«Posso portarne uno in tenda?», chiese Nele.

«Meglio di no», disse papà. «In un barattolo smette di brillare. Fuori brilla tutta la notte.»

Così Nele lasciò le luci dove è giusto che stiano.

Si sdraiò di nuovo sul materassino, lasciò la porta della tenda socchiusa e guardò le piccole luci verdi finché gli occhi le si chiusero da soli.

Forse proprio adesso ne brilla una anche vicino a te. Guarda pure ancora una volta fuori – e poi dormi bene.`,
      `It was a warm summer evening, one of those when you can leave the tent door open.

Nele was lying on her mat and could not sleep. Outside it was not quite dark and not quite light, but exactly in between. And then she saw it: a tiny green light drifting across the meadow.

Then another one. And another. Soon the whole meadow was full of little lights going on and off, as if someone were blinking very slowly with a torch.

Nele crept out of the tent. The grass was cool and wet under her feet.

One light came very close and settled on her finger. It was a small brown beetle, not especially pretty – and yet its tail glowed as green as a piece of the moon.

“Why do you glow?” whispered Nele.

The beetle said nothing, of course. Beetles do not talk. But Nele's dad, who was suddenly standing behind her, said quietly: “He is looking for someone. The glow is his call.”

“And does he find her?”

“Most of the time, yes.”

They stood there a while longer, Nele and her dad, in the middle of a meadow full of little green calls.

Then the beetle flew off towards another light, and the two lights danced away together.

“Can I take one into the tent?” asked Nele.

“Better not,” said her dad. “In a jar it stops glowing. Out here it glows all night.”

So Nele left the lights where they belong.

She lay back down on her mat, left the tent door open a crack and watched the little green lights until her eyes closed all by themselves.

Perhaps one is glowing near you right now too. Do have another look outside – and then sleep well.`
    ),
  },
  {
    id: "sternennacht",
    season: "summer",
    minAge: 6,
    minutes: 5,
    title: l4(
      "Die Nacht der tausend Sterne",
      "La nuit aux mille étoiles",
      "La notte delle mille stelle",
      "The night of a thousand stars"
    ),
    text: l4(
      `In der Nacht vom elften auf den zwölften August passiert am Himmel etwas Besonderes. Dann fliegt die Erde durch eine Spur aus Staub, die ein Komet vor langer Zeit hinterlassen hat – und jedes Staubkorn, das in die Luft über uns rast, verglüht als Sternschnuppe.

Jan wusste das. Er wusste es den ganzen Sommer und strich jeden Tag im Kalender ab.

Nur: Um zehn Uhr abends war der Himmel voller Wolken.

«Es hat keinen Sinn», sagte Jan. «Wir sehen gar nichts.»

«Wolken ziehen weiter», sagte Grosspapa. «Zieh die Jacke an.»

Sie gingen zusammen den Weg hinauf, weg von den Lampen des Zeltplatzes, bis dorthin, wo es richtig dunkel war. Richtig dunkel ist dunkler, als du denkst. Nach ein paar Minuten sah Jan seine eigenen Hände wieder – die Augen gewöhnen sich.

Sie legten sich auf eine Wolldecke ins Gras. Über ihnen zogen die Wolken. Ein Käuzchen rief, ganz nah, und Jan erschrak ein bisschen. Aber nur ein bisschen.

Und dann riss der Himmel auf.

Zuerst nur ein Loch, so gross wie eine Hand. Darin standen mehr Sterne, als Jan je auf einmal gesehen hatte.

«Da!», sagte Grosspapa.

Ein heller Strich, quer über das Loch, weg. Weniger als eine Sekunde.

«Hast du dir etwas gewünscht?»

«Ich habe vergessen zu wünschen.»

«Dann pass beim nächsten auf.»

Die Wolken zogen weiter, und plötzlich war der ganze Himmel offen. Die Milchstrasse stand wie ein blasses Band darüber. Und dann fielen sie: eine, drei, sieben, siebzehn. Manche kurz und schnell, eine so hell, dass das Gras für einen Moment einen Schatten warf.

Jan zählte bis vierzig und hörte dann auf zu zählen, weil das Zählen die Sache kleiner machte.

Irgendwann sagte Grosspapa: «Wir sollten zurück.» Aber er stand nicht auf. Und Jan auch nicht.

Als sie schliesslich doch zum Zelt gingen, war es weit nach Mitternacht, und Jans Rücken war nass vom Tau.

«Und?», fragte Grosspapa. «Was hast du dir gewünscht?»

Jan überlegte lange. «Nichts», sagte er dann. «Es war schon alles da.»

Schlaf gut. Und wenn du das nächste Mal draussen bist: Schau nach oben. Es passiert öfter, als man denkt.`,
      `Dans la nuit du onze au douze août, il se passe quelque chose de particulier dans le ciel. La Terre traverse alors une traînée de poussière laissée il y a très longtemps par une comète – et chaque grain de poussière qui file dans l'air au-dessus de nous se consume en étoile filante.

Jan le savait. Il le savait depuis tout l'été et biffait chaque jour dans le calendrier.

Seulement voilà : à dix heures du soir, le ciel était plein de nuages.

« Ça ne sert à rien », dit Jan. « On ne verra rien du tout. »

« Les nuages passent », dit grand-papa. « Mets ta veste. »

Ils montèrent le chemin ensemble, loin des lampes du camping, jusque-là où il faisait vraiment noir. Vraiment noir, c'est plus noir que tu ne le crois. Au bout de quelques minutes, Jan revoyait ses propres mains – les yeux s'habituent.

Ils s'allongèrent sur une couverture de laine dans l'herbe. Au-dessus d'eux, les nuages défilaient. Une chouette hulotte appela, tout près, et Jan sursauta un peu. Mais un peu seulement.

Et puis le ciel s'ouvrit.

D'abord un simple trou, grand comme une main. Dedans, il y avait plus d'étoiles que Jan n'en avait jamais vu d'un coup.

« Là ! », dit grand-papa.

Un trait clair, en travers du trou, disparu. Moins d'une seconde.

« Tu as fait un vœu ? »

« J'ai oublié de faire un vœu. »

« Alors sois attentif à la prochaine. »

Les nuages s'éloignèrent, et soudain tout le ciel fut ouvert. La Voie lactée s'étendait au-dessus comme un ruban pâle. Et puis elles tombèrent : une, trois, sept, dix-sept. Certaines courtes et rapides, une si brillante que l'herbe projeta un instant une ombre.

Jan compta jusqu'à quarante, puis arrêta de compter, parce que compter rendait la chose plus petite.

À un moment, grand-papa dit : « On devrait rentrer. » Mais il ne se leva pas. Et Jan non plus.

Quand ils regagnèrent finalement la tente, il était bien plus de minuit, et le dos de Jan était mouillé de rosée.

« Alors ? », demanda grand-papa. « Qu'est-ce que tu as souhaité ? »

Jan réfléchit longtemps. « Rien », dit-il enfin. « Tout était déjà là. »

Dors bien. Et la prochaine fois que tu es dehors : lève les yeux. Ça arrive plus souvent qu'on ne le croit.`,
      `Nella notte fra l'undici e il dodici agosto succede in cielo qualcosa di speciale. La Terra attraversa una scia di polvere lasciata tanto tempo fa da una cometa – e ogni granello di polvere che sfreccia nell'aria sopra di noi si consuma come stella cadente.

Jan lo sapeva. Lo sapeva per tutta l'estate e ogni giorno cancellava una casella sul calendario.

Solo che alle dieci di sera il cielo era pieno di nuvole.

«Non ha senso», disse Jan. «Non vedremo proprio niente.»

«Le nuvole passano», disse il nonno. «Mettiti la giacca.»

Salirono insieme per il sentiero, lontano dalle lampade del campeggio, fin dove era davvero buio. Davvero buio è più buio di quanto pensi. Dopo qualche minuto Jan rivedeva le proprie mani – gli occhi si abituano.

Si sdraiarono su una coperta di lana nell'erba. Sopra di loro passavano le nuvole. Un allocco chiamò, vicinissimo, e Jan si spaventò un po'. Ma solo un po'.

E poi il cielo si aprì.

Dapprima solo uno squarcio grande come una mano. Dentro c'erano più stelle di quante Jan ne avesse mai viste tutte insieme.

«Là!», disse il nonno.

Una riga luminosa, di traverso allo squarcio, sparita. Meno di un secondo.

«Hai espresso un desiderio?»

«Mi sono dimenticato di esprimerlo.»

«Allora stai attento alla prossima.»

Le nuvole se ne andarono e all'improvviso tutto il cielo era aperto. La Via Lattea ci stava sopra come un nastro pallido. E poi caddero: una, tre, sette, diciassette. Alcune corte e veloci, una così luminosa che per un attimo l'erba proiettò un'ombra.

Jan contò fino a quaranta e poi smise di contare, perché contare rendeva la cosa più piccola.

A un certo punto il nonno disse: «Dovremmo rientrare.» Ma non si alzò. E nemmeno Jan.

Quando alla fine tornarono alla tenda era ben oltre mezzanotte, e la schiena di Jan era bagnata di rugiada.

«Allora?», chiese il nonno. «Che cosa hai desiderato?»

Jan ci pensò a lungo. «Niente», disse poi. «C'era già tutto.»

Dormi bene. E la prossima volta che sei fuori: guarda in su. Succede più spesso di quanto si creda.`,
      `On the night of the eleventh to the twelfth of August something special happens in the sky. The Earth flies through a trail of dust left long ago by a comet – and every grain of dust that races into the air above us burns up as a shooting star.

Jan knew that. He had known it all summer and crossed off every day on the calendar.

The trouble was: at ten in the evening the sky was full of clouds.

“There is no point,” said Jan. “We will not see anything at all.”

“Clouds move on,” said Grandpa. “Put your jacket on.”

They walked up the path together, away from the lamps of the campsite, to where it was properly dark. Properly dark is darker than you think. After a few minutes Jan could see his own hands again – eyes get used to it.

They lay down on a woollen blanket in the grass. Above them the clouds drifted past. A tawny owl called, very close by, and Jan gave a little start. But only a little one.

And then the sky tore open.

At first only a hole the size of a hand. Inside it stood more stars than Jan had ever seen at once.

“There!” said Grandpa.

A bright streak, right across the hole, gone. Less than a second.

“Did you make a wish?”

“I forgot to wish.”

“Then watch out for the next one.”

The clouds moved on, and suddenly the whole sky was open. The Milky Way lay across it like a pale band. And then they fell: one, three, seven, seventeen. Some short and quick, one so bright that the grass cast a shadow for a moment.

Jan counted to forty and then stopped counting, because counting made the whole thing smaller.

At some point Grandpa said: “We ought to go back.” But he did not get up. And nor did Jan.

When they finally did walk back to the tent it was well past midnight, and Jan's back was wet with dew.

“Well?” asked Grandpa. “What did you wish for?”

Jan thought for a long time. “Nothing,” he said at last. “It was all there already.”

Sleep well. And next time you are outdoors: look up. It happens more often than people think.`
    ),
  },
  {
    id: "igel-herbst",
    season: "autumn",
    minAge: 3,
    minutes: 4,
    title: l4(
      "Der Igel, der den Herbst verschlafen wollte",
      "Le hérisson qui voulait dormir tout l'automne",
      "Il riccio che voleva dormire tutto l'autunno",
      "The hedgehog who wanted to sleep through autumn"
    ),
    text: l4(
      `Der Igel Borste war ein bisschen faul. Nicht sehr faul – aber genug, um im September zu sagen: «Ich glaube, ich fange schon mal an zu schlafen.»

«Jetzt schon?», fragte die Amsel. «Die Äpfel sind noch nicht einmal heruntergefallen.»

«Egal», sagte Borste. «Schlafen ist schön.»

Also rollte er sich unter einem Busch zusammen und machte die Augen zu.

Aber kaum lag er da, hörte er ein Rascheln. Es waren die ersten Blätter, die vom Baum fielen. Ein rotes landete genau auf seiner Nase.

Borste machte ein Auge auf. Das Blatt war so rot wie sonst gar nichts. Er schaute nach oben – und der ganze Baum war rot und gelb und orange, als hätte jemand über Nacht die Farben getauscht.

«Na gut», sagte Borste. «Eine Woche schaue ich noch zu.»

In dieser Woche fielen die Äpfel. Borste ass drei davon und wurde ein bisschen rund.

Dann kam der Nebel. Am Morgen stand er zwischen den Bäumen wie Milch, und jedes Spinnennetz hing voller kleiner Tropfen und glitzerte.

«Na gut», sagte Borste. «Noch eine Woche.»

In dieser Woche zogen die Kraniche über den Himmel, laut rufend, in einer langen Reihe.

«Na gut», sagte Borste. «Noch eine Woche.»

In dieser Woche fanden ihn die Kinder vom Zeltplatz. Sie legten ihm ganz vorsichtig einen Haufen Laub hin und bauten ihm daraus ein Häuschen.

Und in dieser Nacht wurde es zum ersten Mal richtig kalt.

Borste kroch in das Laubhäuschen, kugelte sich klein zusammen und dachte: Jetzt habe ich den ganzen Herbst gesehen. Jeden einzelnen Tag davon.

Dann schlief er ein, und diesmal wachte er erst im Frühling wieder auf.

Wenn du morgen einen Laubhaufen siehst: Tritt nicht hinein. Vielleicht wohnt jemand darin.

Schlaf gut.`,
      `Le hérisson Piquant était un peu paresseux. Pas très paresseux – mais assez pour dire en septembre : « Je crois que je vais commencer à dormir. »

« Déjà ? », demanda le merle. « Les pommes ne sont même pas encore tombées. »

« Peu importe », dit Piquant. « Dormir, c'est bien. »

Il se roula donc en boule sous un buisson et ferma les yeux.

Mais à peine était-il couché qu'il entendit un bruissement. C'étaient les premières feuilles qui tombaient de l'arbre. Une feuille rouge atterrit pile sur son nez.

Piquant ouvrit un œil. La feuille était rouge comme rien d'autre. Il leva les yeux – et l'arbre entier était rouge, jaune et orange, comme si quelqu'un avait échangé les couleurs pendant la nuit.

« Bon », dit Piquant. « Je regarde encore une semaine. »

Cette semaine-là, les pommes tombèrent. Piquant en mangea trois et devint un peu rond.

Puis vint le brouillard. Le matin, il se tenait entre les arbres comme du lait, et chaque toile d'araignée pendait pleine de gouttelettes et scintillait.

« Bon », dit Piquant. « Encore une semaine. »

Cette semaine-là, les grues traversèrent le ciel, criant fort, en une longue file.

« Bon », dit Piquant. « Encore une semaine. »

Cette semaine-là, les enfants du camping le trouvèrent. Ils lui déposèrent tout doucement un tas de feuilles et lui en construisirent une petite maison.

Et cette nuit-là, il fit vraiment froid pour la première fois.

Piquant se glissa dans la maison de feuilles, se roula tout petit et pensa : maintenant j'ai vu tout l'automne. Chacun de ses jours.

Puis il s'endormit, et cette fois il ne se réveilla qu'au printemps.

Si demain tu vois un tas de feuilles : ne marche pas dedans. Peut-être que quelqu'un y habite.

Dors bien.`,
      `Il riccio Setola era un po' pigro. Non molto pigro – ma abbastanza per dire a settembre: «Credo che comincerò già a dormire.»

«Di già?», chiese il merlo. «Le mele non sono nemmeno cadute.»

«Non importa», disse Setola. «Dormire è bello.»

Così si arrotolò sotto un cespuglio e chiuse gli occhi.

Ma appena si fu sdraiato sentì un fruscio. Erano le prime foglie che cadevano dall'albero. Una foglia rossa atterrò proprio sul suo naso.

Setola aprì un occhio. La foglia era rossa come nient'altro. Guardò in alto – e tutto l'albero era rosso, giallo e arancione, come se qualcuno avesse scambiato i colori durante la notte.

«Va bene», disse Setola. «Guardo ancora una settimana.»

In quella settimana caddero le mele. Setola ne mangiò tre e diventò un po' rotondo.

Poi arrivò la nebbia. Al mattino stava fra gli alberi come latte, e ogni ragnatela pendeva piena di goccioline e luccicava.

«Va bene», disse Setola. «Ancora una settimana.»

In quella settimana le gru attraversarono il cielo, gridando forte, in una lunga fila.

«Va bene», disse Setola. «Ancora una settimana.»

In quella settimana lo trovarono i bambini del campeggio. Gli posarono con molta attenzione un mucchio di foglie e gliene costruirono una casetta.

E quella notte fece freddo davvero per la prima volta.

Setola sgusciò nella casetta di foglie, si rannicchiò tutto piccolo e pensò: adesso ho visto tutto l'autunno. Ogni singolo giorno.

Poi si addormentò, e questa volta si risvegliò solo in primavera.

Se domani vedi un mucchio di foglie: non calpestarlo. Forse ci abita qualcuno.

Dormi bene.`,
      `Bristle the hedgehog was a little bit lazy. Not very lazy – but lazy enough to say in September: “I think I shall start going to sleep now.”

“Already?” asked the blackbird. “The apples have not even fallen yet.”

“Never mind,” said Bristle. “Sleeping is lovely.”

So he curled up under a bush and closed his eyes.

But no sooner was he lying there than he heard a rustling. It was the first leaves falling from the tree. A red one landed right on his nose.

Bristle opened one eye. The leaf was redder than anything else. He looked up – and the whole tree was red and yellow and orange, as if someone had swapped the colours overnight.

“All right then,” said Bristle. “I shall watch for one more week.”

That week the apples fell. Bristle ate three of them and became a little round.

Then the mist came. In the morning it stood between the trees like milk, and every spider's web hung full of tiny drops and glittered.

“All right then,” said Bristle. “One more week.”

That week the cranes crossed the sky, calling loudly, in a long line.

“All right then,” said Bristle. “One more week.”

That week the children from the campsite found him. Very carefully they laid down a pile of leaves for him and built him a little house out of it.

And that night it got properly cold for the first time.

Bristle crawled into the leaf house, curled up small and thought: now I have seen the whole of autumn. Every single day of it.

Then he fell asleep, and this time he did not wake up until spring.

If you see a pile of leaves tomorrow: do not step in it. Somebody might be living inside.

Sleep well.`
    ),
  },
  {
    id: "alte-tanne",
    season: "autumn",
    minAge: 7,
    minutes: 5,
    title: l4(
      "Das Geheimnis der alten Tanne",
      "Le secret du vieux sapin",
      "Il segreto del vecchio abete",
      "The secret of the old fir tree"
    ),
    text: l4(
      `Am Rand des Zeltplatzes stand eine Tanne, die viel älter war als alle anderen. Ihr Stamm war so dick, dass drei Kinder ihn nicht umfassen konnten, und ganz unten hatte sie ein Loch.

Mia und Sami hatten sich vorgenommen, in dieses Loch zu schauen. Aber nicht am Tag – am Tag war das ja nichts Besonderes.

Also warteten sie, bis es dunkel war.

Der Weg zur Tanne war kürzer, als sie dachten, und trotzdem kam er ihnen lang vor. Der Wald machte Geräusche. Etwas knackte. Etwas huschte. Sami blieb stehen.

«Sollen wir umkehren?»

«Nur noch bis zur Tanne», sagte Mia.

Vor dem Loch blieben sie stehen. Aus dem Loch kam ein Geräusch: ein leises, kratzendes, schabendes Geräusch, so als würde jemand etwas hin- und herschieben.

Mia hielt die Taschenlampe hoch. Ihre Hand zitterte ein bisschen. Sie schaltete ein.

Im Licht sassen zwei Augen.

Sami machte einen Schritt rückwärts, blieb an einer Wurzel hängen und landete im Moos.

Und da flog es aus dem Loch. Lautlos. Ganz lautlos, so als hätte es gar keine Flügel. Es strich über die beiden hinweg, drehte eine Runde und setzte sich auf einen Ast.

Ein Waldkauz. Klein, rund, mit einem Gesicht wie ein Herz.

Er schaute die beiden an, drehte den Kopf fast ganz herum, wie es nur Eulen können, und rief: «Huu-huhuhu-huuu.»

Sami lag noch immer im Moos und fing an zu lachen.

Zurück beim Zelt erzählten sie alles: das Kratzen, die Augen, den lautlosen Flug. Mias Mutter hörte zu und sagte dann: «Wisst ihr, warum Eulen lautlos fliegen? Ihre Federn haben vorne einen ganz feinen Kamm. Der zerschneidet die Luft, statt sie rauschen zu lassen.»

«Warum denn?»

«Damit die Maus sie nicht hört. Und damit die Eule selber hören kann, wo die Maus ist.»

In dieser Nacht lag Mia lange wach, aber nicht aus Angst.

Sie lauschte. Und irgendwo, weit weg, rief es noch einmal: «Huu-huhuhu-huuu.»

Schlaf gut. Der Wald ist nachts nicht leer – er ist nur mit anderen beschäftigt.`,
      `Au bord du camping se dressait un sapin bien plus vieux que tous les autres. Son tronc était si épais que trois enfants n'arrivaient pas à en faire le tour, et tout en bas il avait un trou.

Mia et Sami s'étaient promis de regarder dans ce trou. Mais pas de jour – de jour, ça n'avait rien d'extraordinaire.

Ils attendirent donc qu'il fasse nuit.

Le chemin jusqu'au sapin était plus court qu'ils ne le pensaient, et pourtant il leur parut long. La forêt faisait des bruits. Quelque chose craqua. Quelque chose détala. Sami s'arrêta.

« On fait demi-tour ? »

« Juste jusqu'au sapin », dit Mia.

Devant le trou, ils s'immobilisèrent. Du trou sortait un bruit : un bruit léger, qui grattait et raclait, comme si quelqu'un poussait quelque chose d'avant en arrière.

Mia leva la lampe de poche. Sa main tremblait un peu. Elle alluma.

Dans la lumière, il y avait deux yeux.

Sami fit un pas en arrière, se prit les pieds dans une racine et atterrit dans la mousse.

Et voilà que ça sortit du trou en volant. Sans un bruit. Absolument sans un bruit, comme si ça n'avait pas d'ailes du tout. Ça passa au-dessus d'eux, fit un tour et se posa sur une branche.

Une chouette hulotte. Petite, ronde, avec un visage en forme de cœur.

Elle les regarda tous les deux, tourna la tête presque complètement, comme seules les chouettes savent le faire, et lança : « Hou-houhouhou-houuu. »

Sami était encore dans la mousse et se mit à rire.

De retour à la tente, ils racontèrent tout : le grattement, les yeux, le vol silencieux. La maman de Mia écouta, puis dit : « Vous savez pourquoi les chouettes volent sans bruit ? Leurs plumes ont devant un peigne très fin. Il découpe l'air au lieu de le laisser siffler. »

« Mais pourquoi ? »

« Pour que la souris ne les entende pas. Et pour que la chouette elle-même puisse entendre où est la souris. »

Cette nuit-là, Mia resta longtemps éveillée, mais pas par peur.

Elle écoutait. Et quelque part, au loin, cela appela encore une fois : « Hou-houhouhou-houuu. »

Dors bien. La nuit, la forêt n'est pas vide – elle est simplement occupée avec d'autres.`,
      `Al margine del campeggio c'era un abete molto più vecchio di tutti gli altri. Il suo tronco era così grosso che tre bambini non riuscivano ad abbracciarlo, e in fondo aveva un buco.

Mia e Sami si erano ripromessi di guardare in quel buco. Ma non di giorno – di giorno non aveva niente di speciale.

Aspettarono quindi che facesse buio.

La strada fino all'abete era più corta di quanto pensassero, eppure sembrò loro lunga. Il bosco faceva rumori. Qualcosa scricchiolò. Qualcosa guizzò via. Sami si fermò.

«Torniamo indietro?»

«Solo fino all'abete», disse Mia.

Davanti al buco si fermarono. Dal buco usciva un rumore: un rumore lieve, che grattava e raschiava, come se qualcuno spostasse qualcosa avanti e indietro.

Mia alzò la torcia. La sua mano tremava un po'. La accese.

Nella luce c'erano due occhi.

Sami fece un passo indietro, inciampò in una radice e finì nel muschio.

Ed ecco che uscì dal buco volando. Senza rumore. Proprio senza rumore, come se non avesse affatto ali. Passò sopra di loro, fece un giro e si posò su un ramo.

Un allocco. Piccolo, tondo, con una faccia a forma di cuore.

Guardò i due, girò la testa quasi del tutto, come sanno fare solo i gufi, e chiamò: «Uuu-uhuhu-uuuu.»

Sami era ancora nel muschio e cominciò a ridere.

Tornati alla tenda raccontarono tutto: il raschiare, gli occhi, il volo silenzioso. La mamma di Mia ascoltò e poi disse: «Sapete perché i gufi volano senza rumore? Le loro penne hanno davanti un pettine finissimo. Taglia l'aria invece di lasciarla sibilare.»

«E perché mai?»

«Perché il topo non li senta. E perché il gufo stesso possa sentire dov'è il topo.»

Quella notte Mia restò sveglia a lungo, ma non per paura.

Ascoltava. E da qualche parte, lontano, chiamò ancora una volta: «Uuu-uhuhu-uuuu.»

Dormi bene. Di notte il bosco non è vuoto – è solo occupato con altri.`,
      `At the edge of the campsite stood a fir tree far older than all the others. Its trunk was so thick that three children could not reach around it, and right at the bottom it had a hole.

Mia and Sami had made up their minds to look into that hole. But not by day – by day there would have been nothing special about it.

So they waited until dark.

The way to the fir tree was shorter than they thought, and yet it felt long. The forest made noises. Something cracked. Something scurried. Sami stopped.

“Shall we turn back?”

“Only as far as the fir tree,” said Mia.

They stood still in front of the hole. A sound was coming out of it: a soft scratching, scraping sound, as if someone were pushing something back and forth.

Mia held up the torch. Her hand was shaking a little. She switched it on.

In the light sat two eyes.

Sami took a step backwards, caught his foot on a root and landed in the moss.

And then it came flying out of the hole. Silently. Completely silently, as if it had no wings at all. It swept over the two of them, made a circle and settled on a branch.

A tawny owl. Small, round, with a face like a heart.

It looked at them both, turned its head almost all the way round, the way only owls can, and called: “Hoo-hoohoohoo-hoooo.”

Sami was still lying in the moss and started to laugh.

Back at the tent they told the whole story: the scratching, the eyes, the silent flight. Mia's mother listened and then said: “Do you know why owls fly silently? Their feathers have a very fine comb along the front edge. It cuts the air instead of letting it rush.”

“But why?”

“So that the mouse cannot hear them. And so that the owl herself can hear where the mouse is.”

That night Mia lay awake for a long time, but not out of fear.

She listened. And somewhere far away it called once more: “Hoo-hoohoohoo-hoooo.”

Sleep well. At night the forest is not empty – it is just busy with somebody else.`
    ),
  },
  {
    id: "frau-fuchs-schnee",
    season: "winter",
    minAge: 4,
    minutes: 4,
    title: l4(
      "Frau Fuchs und der erste Schnee",
      "Madame Renarde et la première neige",
      "La signora Volpe e la prima neve",
      "Mrs Fox and the first snow"
    ),
    text: l4(
      `Frau Fuchs hatte einen guten Bau: trocken, warm, mit zwei Ausgängen, wie es sich gehört.

In einer Nacht im November wachte sie auf, weil es zu still war. Nicht ein bisschen still – vollkommen still. Kein Blatt, kein Wind, kein Tropfen.

Sie steckte den Kopf hinaus. Alles war weiss.

Der erste Schnee war gekommen, während sie geschlafen hatte.

Frau Fuchs machte einen Schritt. Der Schnee knirschte. Sie machte noch einen. Er knirschte wieder. Sie ging bis in die Mitte der Wiese und schaute zurück – und da war eine Spur. Ihre eigene Spur, ganz allein auf dem weissen Feld.

«So sieht das also aus, wenn ich irgendwo war», dachte Frau Fuchs.

Dann tat sie, was Füchse im Schnee tun. Sie blieb stehen. Sie spitzte die Ohren, drehte den Kopf und hörte hin. Unter dem Schnee, tief unten, raschelte es ganz leise: eine Maus, die durch ihre Gänge lief und nicht wusste, dass jemand zuhörte.

Frau Fuchs sprang. Hoch, in einem Bogen, die Nase zuerst, mitten in den Schnee hinein.

Und – nichts. Die Maus war schneller gewesen.

Frau Fuchs zog den Kopf aus dem Schnee, mit einer weissen Mütze auf der Nase, und nieste.

Beim zweiten Mal ging es besser.

Später sass sie satt auf einem Stein und schaute auf den Zeltplatz hinunter. Ein einziges Zelt stand noch da, das letzte des Jahres. Darin brannte eine kleine Lampe, und man hörte jemanden leise reden.

Frau Fuchs blieb sitzen, bis die Lampe ausging.

Dann trottete sie zurück in ihren Bau, rollte sich zusammen und legte den buschigen Schwanz über die Nase – so machen es Füchse, damit es warm bleibt – und schlief ein.

Draussen fing es wieder an zu schneien, und bis zum Morgen war ihre Spur verschwunden.

Schlaf gut. Der Schnee deckt alles zu, und morgen darf man wieder eine ganz neue Spur machen.`,
      `Madame Renarde avait un bon terrier : sec, chaud, avec deux sorties, comme il se doit.

Une nuit de novembre, elle se réveilla parce que c'était trop silencieux. Pas un peu silencieux – complètement silencieux. Pas une feuille, pas de vent, pas une goutte.

Elle sortit la tête. Tout était blanc.

La première neige était tombée pendant qu'elle dormait.

Madame Renarde fit un pas. La neige crissa. Elle en fit un autre. Elle crissa encore. Elle alla jusqu'au milieu du pré et regarda derrière elle – et il y avait une trace. Sa propre trace, toute seule sur le champ blanc.

« Voilà donc à quoi ça ressemble quand je suis passée quelque part », pensa Madame Renarde.

Puis elle fit ce que font les renards dans la neige. Elle s'immobilisa. Elle dressa les oreilles, tourna la tête et écouta. Sous la neige, tout au fond, quelque chose bruissait très doucement : une souris qui courait dans ses galeries sans savoir que quelqu'un l'écoutait.

Madame Renarde bondit. Haut, en arc, le museau d'abord, en plein dans la neige.

Et – rien. La souris avait été plus rapide.

Madame Renarde sortit la tête de la neige, un bonnet blanc sur le museau, et éternua.

La deuxième fois, ça marcha mieux.

Plus tard, rassasiée, elle s'assit sur une pierre et regarda le camping en contrebas. Une seule tente était encore là, la dernière de l'année. À l'intérieur brûlait une petite lampe, et on entendait quelqu'un parler doucement.

Madame Renarde resta assise jusqu'à ce que la lampe s'éteigne.

Puis elle trottina jusqu'à son terrier, se roula en boule et posa sa queue touffue sur son museau – c'est ainsi que font les renards pour rester au chaud – et s'endormit.

Dehors, il recommença à neiger, et au matin sa trace avait disparu.

Dors bien. La neige recouvre tout, et demain on pourra faire une trace toute neuve.`,
      `La signora Volpe aveva una buona tana: asciutta, calda, con due uscite, come si deve.

Una notte di novembre si svegliò perché c'era troppo silenzio. Non un po' di silenzio – silenzio assoluto. Nessuna foglia, nessun vento, nessuna goccia.

Mise fuori la testa. Era tutto bianco.

La prima neve era arrivata mentre dormiva.

La signora Volpe fece un passo. La neve scricchiolò. Ne fece un altro. Scricchiolò di nuovo. Andò fino in mezzo al prato e si voltò – e c'era una traccia. La sua traccia, tutta sola sul campo bianco.

«Ecco come si vede che sono passata di qui», pensò la signora Volpe.

Poi fece quello che fanno le volpi nella neve. Si fermò. Drizzò le orecchie, girò la testa e ascoltò. Sotto la neve, in fondo, qualcosa frusciava pianissimo: un topo che correva nelle sue gallerie senza sapere che qualcuno lo ascoltava.

La signora Volpe saltò. In alto, ad arco, prima il muso, dritta nella neve.

E – niente. Il topo era stato più veloce.

La signora Volpe tirò fuori la testa dalla neve, con un berretto bianco sul muso, e starnutì.

La seconda volta andò meglio.

Più tardi, sazia, sedeva su una pietra e guardava giù verso il campeggio. C'era ancora una sola tenda, l'ultima dell'anno. Dentro ardeva una lampadina, e si sentiva qualcuno parlare piano.

La signora Volpe rimase seduta finché la lampada non si spense.

Poi trotterellò fino alla sua tana, si arrotolò e si mise la coda folta sul muso – è così che fanno le volpi per restare al caldo – e si addormentò.

Fuori ricominciò a nevicare, e al mattino la sua traccia era sparita.

Dormi bene. La neve copre tutto, e domani si potrà fare una traccia tutta nuova.`,
      `Mrs Fox had a good den: dry, warm, with two exits, as it should be.

One night in November she woke up because it was too quiet. Not a little quiet – completely quiet. Not a leaf, no wind, not a single drip.

She poked her head out. Everything was white.

The first snow had come while she was asleep.

Mrs Fox took a step. The snow crunched. She took another. It crunched again. She walked out into the middle of the meadow and looked back – and there was a trail. Her own trail, all alone on the white field.

“So that is what it looks like when I have been somewhere,” thought Mrs Fox.

Then she did what foxes do in the snow. She stood still. She pricked up her ears, turned her head and listened. Under the snow, deep down, something rustled very faintly: a mouse running through its tunnels, not knowing that somebody was listening.

Mrs Fox jumped. High, in an arc, nose first, straight into the snow.

And – nothing. The mouse had been quicker.

Mrs Fox pulled her head out of the snow with a white cap on her nose, and sneezed.

The second time it went better.

Later, well fed, she sat on a stone and looked down at the campsite. One single tent was still standing there, the last one of the year. A small lamp was burning inside, and you could hear somebody talking quietly.

Mrs Fox stayed sitting until the lamp went out.

Then she trotted back to her den, curled up and laid her bushy tail over her nose – that is how foxes keep warm – and fell asleep.

Outside it began to snow again, and by morning her trail had disappeared.

Sleep well. The snow covers everything, and tomorrow you may make a brand-new trail.`
    ),
  },
  {
    id: "zelt-fliegen",
    minAge: 4,
    minutes: 4,
    title: l4(
      "Das Zelt, das fliegen wollte",
      "La tente qui voulait voler",
      "La tenda che voleva volare",
      "The tent that wanted to fly"
    ),
    text: l4(
      `Es war einmal ein Zelt, das war nicht zufrieden. Alle anderen Dinge auf dem Zeltplatz durften irgendwohin: Das Auto fuhr, der Ball rollte, sogar der Rucksack kam mit auf den Berg. Nur das Zelt stand.

«Ich möchte fliegen», sagte das Zelt.

«Du bist ein Zelt», sagte der Hering, der tief in der Erde steckte. «Zelte fliegen nicht. Dafür bin ich schliesslich da.»

Aber in dieser Nacht kam der Wind.

Zuerst zupfte er nur ein bisschen. Dann drückte er von der Seite. Und dann kam eine Böe, die packte das Zelt am Dach und zog.

Ein Hering rutschte heraus. Dann noch einer.

«Ich fliege!», rief das Zelt. «Ich fliege wirklich!»

Es hob eine Ecke, dann zwei, es beulte sich, es blähte sich auf wie ein Segel – und dann merkte es etwas Unangenehmes.

Fliegen war laut. Fliegen war wackelig. Und vor allem: Drinnen schliefen zwei Kinder.

«Halt!», rief das Zelt. «So habe ich das nicht gemeint!»

Es zog sich zusammen, so fest es konnte. Es machte sich klein und flach und schwer. Es hielt seine Stangen fest, es klammerte sich an die letzten beiden Heringe – und der Wind zerrte und riss und gab schliesslich auf und zog weiter zum See.

Am Morgen kam der Vater heraus, sah zwei Heringe im Gras liegen und schlug sie kopfschüttelnd wieder ein.

«Gut gehalten», sagte der letzte Hering leise.

«Danke», sagte das Zelt.

Von da an war es zufrieden. Denn es hatte gemerkt, wofür es gut ist: Ein Zelt fliegt nicht. Ein Zelt bleibt.

Und wenn draussen der Wind an der Plane zerrt und es rundherum knattert, dann heisst das nicht, dass etwas kaputtgeht.

Dann heisst das nur, dass dein Zelt gerade seine Arbeit macht.

Schlaf gut.`,
      `Il était une fois une tente qui n'était pas contente. Toutes les autres choses du camping avaient le droit d'aller quelque part : la voiture roulait, le ballon roulait, même le sac à dos montait à la montagne. Seule la tente restait plantée là.

« J'aimerais voler », dit la tente.

« Tu es une tente », dit le piquet, planté profondément dans la terre. « Les tentes ne volent pas. C'est bien pour ça que je suis là. »

Mais cette nuit-là, le vent arriva.

D'abord il tira juste un peu. Puis il poussa sur le côté. Et puis vint une rafale qui attrapa la tente par le toit et tira.

Un piquet sortit de terre. Puis un autre.

« Je vole ! », cria la tente. « Je vole vraiment ! »

Elle souleva un coin, puis deux, elle se bomba, elle se gonfla comme une voile – et puis elle remarqua quelque chose de désagréable.

Voler, c'était bruyant. Voler, c'était instable. Et surtout : deux enfants dormaient à l'intérieur.

« Stop ! », cria la tente. « Ce n'est pas ce que je voulais dire ! »

Elle se contracta de toutes ses forces. Elle se fit petite, plate et lourde. Elle tint bon ses arceaux, elle s'accrocha aux deux derniers piquets – et le vent tira et secoua et finit par abandonner et s'en alla vers le lac.

Au matin, le papa sortit, vit deux piquets couchés dans l'herbe et les replanta en secouant la tête.

« Bien tenu », dit doucement le dernier piquet.

« Merci », dit la tente.

À partir de ce jour, elle fut contente. Car elle avait compris à quoi elle sert : une tente ne vole pas. Une tente reste.

Et quand dehors le vent tire sur la toile et que ça claque tout autour, cela ne veut pas dire que quelque chose casse.

Cela veut seulement dire que ta tente est en train de faire son travail.

Dors bien.`,
      `C'era una volta una tenda che non era contenta. Tutte le altre cose del campeggio potevano andare da qualche parte: l'auto viaggiava, la palla rotolava, perfino lo zaino saliva in montagna. Solo la tenda stava ferma.

«Vorrei volare», disse la tenda.

«Tu sei una tenda», disse il picchetto, conficcato in fondo alla terra. «Le tende non volano. È proprio per questo che ci sono io.»

Ma quella notte arrivò il vento.

Prima tirò solo un pochino. Poi spinse di lato. E poi arrivò una raffica che afferrò la tenda per il tetto e tirò.

Un picchetto scivolò fuori. Poi un altro.

«Sto volando!», gridò la tenda. «Sto volando davvero!»

Sollevò un angolo, poi due, si gonfiò, si gonfiò come una vela – e poi si accorse di una cosa spiacevole.

Volare era rumoroso. Volare era traballante. E soprattutto: dentro dormivano due bambini.

«Ferma!», gridò la tenda. «Non intendevo questo!»

Si strinse con tutte le sue forze. Si fece piccola, piatta e pesante. Tenne stretti i suoi archetti, si aggrappò agli ultimi due picchetti – e il vento tirò e strattonò e alla fine si arrese e proseguì verso il lago.

Al mattino il papà uscì, vide due picchetti sull'erba e li ripiantò scuotendo la testa.

«Hai tenuto bene», disse piano l'ultimo picchetto.

«Grazie», disse la tenda.

Da quel giorno fu contenta. Perché aveva capito a che cosa serve: una tenda non vola. Una tenda resta.

E se fuori il vento tira il telo e tutt'intorno sbatte, non vuol dire che qualcosa si stia rompendo.

Vuol dire solo che la tua tenda sta facendo il suo lavoro.

Dormi bene.`,
      `Once upon a time there was a tent that was not content. All the other things at the campsite were allowed to go somewhere: the car drove, the ball rolled, even the rucksack came along up the mountain. Only the tent stood still.

“I should like to fly,” said the tent.

“You are a tent,” said the peg, stuck deep in the ground. “Tents do not fly. That is exactly what I am here for.”

But that night the wind came.

At first it only plucked a little. Then it pushed from the side. And then came a gust that grabbed the tent by the roof and pulled.

One peg slipped out. Then another.

“I am flying!” cried the tent. “I really am flying!”

It lifted one corner, then two, it bulged, it filled out like a sail – and then it noticed something unpleasant.

Flying was loud. Flying was wobbly. And above all: two children were asleep inside.

“Stop!” cried the tent. “That is not what I meant!”

It pulled itself together as tightly as it could. It made itself small and flat and heavy. It held on to its poles, it clung to the last two pegs – and the wind tugged and tore and finally gave up and moved on towards the lake.

In the morning the father came out, saw two pegs lying in the grass and hammered them back in, shaking his head.

“Well held,” said the last peg quietly.

“Thank you,” said the tent.

From that day on it was content. For it had realised what it is good for: a tent does not fly. A tent stays.

And when the wind tugs at the fabric outside and everything rattles around you, that does not mean something is breaking.

It only means that your tent is doing its job.

Sleep well.`
    ),
  },
  {
    id: "gute-nacht-zeltplatz",
    minAge: 3,
    minutes: 3,
    title: l4(
      "Gute Nacht, Zeltplatz",
      "Bonne nuit, camping",
      "Buonanotte, campeggio",
      "Good night, campsite"
    ),
    text: l4(
      `Es ist Abend, und der Zeltplatz macht sich fertig für die Nacht.

Der Grill ist aus. Er ist noch ein bisschen warm, und wenn du die Hand darüber hältst, spürst du den ganzen Tag, der darin steckt. Gute Nacht, Grill.

Die Wäscheleine hat den ganzen Tag Badehosen getragen. Jetzt ist sie leer und hängt ein bisschen durch. Gute Nacht, Wäscheleine.

Die Velos lehnen aneinander wie müde Freunde. Ein Rad dreht sich noch ganz langsam aus. Gute Nacht, Velos.

Der Brunnen läuft weiter. Der läuft immer. Nachts hört man ihm nur besser zu. Gute Nacht, Brunnen.

Das Boot am Ufer schaukelt ein bisschen, ganz sachte, weil der See atmet. Gute Nacht, Boot. Gute Nacht, See.

Die Amsel, die den ganzen Tag gesungen hat, hat sich einen Ast gesucht, ganz nah am Stamm, wo der Wind nicht hinkommt. Sie hat ein Bein hochgezogen und die Federn aufgeplustert. Gute Nacht, Amsel.

Im Zelt nebenan macht jemand den Reissverschluss zu. Ritsch. Dann wird es leise. Gute Nacht, ihr da drüben.

Die Taschenlampe hat noch Strom für morgen. Gute Nacht, Taschenlampe.

Die Schuhe stehen vor dem Zelt, mit ein bisschen Erde vom Weg. Morgen bringen sie dich wieder irgendwohin. Gute Nacht, Schuhe.

Der Schlafsack ist genau so warm, wie er sein soll.

Und oben, über der Zeltplane, dreht sich der ganze Himmel ganz langsam weiter, so wie in jeder Nacht, ob wir hinschauen oder nicht.

Gute Nacht, Himmel.

Gute Nacht, Zelt.

Gute Nacht, du.`,
      `C'est le soir, et le camping se prépare pour la nuit.

Le gril est éteint. Il est encore un peu chaud, et si tu tiens la main au-dessus, tu sens toute la journée qui est dedans. Bonne nuit, gril.

La corde à linge a porté des maillots de bain toute la journée. Maintenant elle est vide et pend un peu. Bonne nuit, corde à linge.

Les vélos sont appuyés l'un contre l'autre comme des amis fatigués. Une roue tourne encore tout doucement. Bonne nuit, vélos.

La fontaine continue de couler. Elle coule toujours. La nuit, on l'écoute simplement mieux. Bonne nuit, fontaine.

Le bateau au bord se balance un peu, tout doucement, parce que le lac respire. Bonne nuit, bateau. Bonne nuit, lac.

Le merle qui a chanté toute la journée s'est cherché une branche, tout près du tronc, là où le vent n'arrive pas. Il a replié une patte et gonflé ses plumes. Bonne nuit, merle.

Dans la tente d'à côté, quelqu'un ferme la fermeture éclair. Zip. Puis c'est le silence. Bonne nuit, vous là-bas.

La lampe de poche a encore du courant pour demain. Bonne nuit, lampe de poche.

Les chaussures sont posées devant la tente, avec un peu de terre du chemin. Demain, elles t'emmèneront de nouveau quelque part. Bonne nuit, chaussures.

Le sac de couchage est exactement aussi chaud qu'il doit l'être.

Et là-haut, au-dessus de la toile, tout le ciel continue de tourner tout doucement, comme chaque nuit, que nous le regardions ou non.

Bonne nuit, ciel.

Bonne nuit, tente.

Bonne nuit, toi.`,
      `È sera, e il campeggio si prepara per la notte.

Il grill è spento. È ancora un po' caldo, e se ci tieni sopra la mano senti tutta la giornata che c'è dentro. Buonanotte, grill.

Il filo del bucato ha portato costumi da bagno tutto il giorno. Adesso è vuoto e si affloscia un po'. Buonanotte, filo del bucato.

Le biciclette sono appoggiate l'una all'altra come amici stanchi. Una ruota gira ancora lentissima. Buonanotte, biciclette.

La fontana continua a scorrere. Scorre sempre. Di notte la si ascolta solo meglio. Buonanotte, fontana.

La barca sulla riva dondola un poco, pianissimo, perché il lago respira. Buonanotte, barca. Buonanotte, lago.

Il merlo che ha cantato tutto il giorno si è cercato un ramo, vicinissimo al tronco, dove il vento non arriva. Ha tirato su una zampa e gonfiato le penne. Buonanotte, merlo.

Nella tenda accanto qualcuno chiude la cerniera. Zip. Poi cala il silenzio. Buonanotte, voi là.

La torcia ha ancora corrente per domani. Buonanotte, torcia.

Le scarpe sono davanti alla tenda, con un po' di terra del sentiero. Domani ti porteranno di nuovo da qualche parte. Buonanotte, scarpe.

Il sacco a pelo è caldo esattamente come deve essere.

E lassù, sopra il telo della tenda, tutto il cielo continua a girare lentissimo, come ogni notte, che noi lo guardiamo o no.

Buonanotte, cielo.

Buonanotte, tenda.

Buonanotte, tu.`,
      `It is evening, and the campsite is getting ready for the night.

The grill is out. It is still a little warm, and if you hold your hand above it you can feel the whole day that is inside. Good night, grill.

The washing line has carried swimming trunks all day. Now it is empty and sags a little. Good night, washing line.

The bikes lean against each other like tired friends. One wheel is still turning, very slowly. Good night, bikes.

The fountain keeps running. It always runs. At night you simply listen to it better. Good night, fountain.

The boat by the shore rocks a little, very gently, because the lake is breathing. Good night, boat. Good night, lake.

The blackbird that sang all day has found itself a branch, right next to the trunk, where the wind cannot get in. It has pulled up one leg and puffed out its feathers. Good night, blackbird.

In the tent next door someone closes the zip. Zzzip. Then it goes quiet. Good night, you over there.

The torch still has power for tomorrow. Good night, torch.

The shoes are standing outside the tent, with a bit of earth from the path on them. Tomorrow they will take you somewhere again. Good night, shoes.

The sleeping bag is exactly as warm as it should be.

And up above, over the tent fabric, the whole sky keeps turning very slowly, just like every night, whether we look at it or not.

Good night, sky.

Good night, tent.

Good night, you.`
    ),
  },
];
