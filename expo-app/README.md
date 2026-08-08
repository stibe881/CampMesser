# ReiseKompass – native App

Ein dünner nativer Rahmen um dieselbe Web-App (`https://meinreisekompass.ch`).
Alles Sichtbare kommt aus dem WebView. Hier steht nur, was der Browser im
WebView nicht kann.

## Was der Rahmen beisteuert

| Fähigkeit                        | Warum nicht im Web                                           |
| -------------------------------- | ------------------------------------------------------------ |
| Push-Mitteilungen                | iOS liefert Web Push nur an installierte PWAs, unzuverlässig |
| Sprung zur Meldung beim Antippen | Der WebView weiss nichts vom Antippen einer Systemmeldung    |
| Zahl am App-Icon                 | `navigator.setAppBadge` gibt es im WebView nicht             |
| Kurzbefehle (langes Drücken)     | iOS ignoriert `shortcuts` im PWA-Manifest vollständig        |
| Widgets auf dem Home-Bildschirm  | WidgetKit ist Swift; eine Webseite kann kein Widget sein     |

## Die Brücke

Web → nativ läuft über `window.ReactNativeWebView.postMessage` mit einem
JSON-Objekt `{ type, ... }`. Die Namen stehen in
`client/src/lib/nativeBridge.ts` und müssen zu `App.js` passen:

| `type`               | Inhalt                   | Wirkung                            |
| -------------------- | ------------------------ | ---------------------------------- |
| `THEME_UPDATE`       | `value: "light"/"dark"`  | Farbe des Rands um den WebView     |
| `REQUEST_PUSH_TOKEN` | –                        | Berechtigung fragen, Token liefern |
| `SET_BADGE`          | `count: number`          | Zahl am App-Icon (0 = weg)         |
| `SET_QUICK_ACTIONS`  | `items: Action[]`        | Kurzbefehle in der App-Sprache     |
| `SET_WIDGET_DATA`    | `payload: WidgetPayload` | Widget-Daten + Neuzeichnen         |
| `OPEN_DIRECTIONS`    | `appUrl`, `webUrl`       | Route in der Karten-App öffnen     |

Nativ → Web läuft über `injectJavaScript` und ein `CustomEvent`:

| Ereignis                     | Inhalt             | Ausgelöst durch                      |
| ---------------------------- | ------------------ | ------------------------------------ |
| `ExpoPushToken`              | Token als `detail` | Antwort auf `REQUEST_PUSH_TOKEN`     |
| `ExpoPushTokenError`         | –                  | Berechtigung verweigert / kein Gerät |
| `campmesser:native-navigate` | Pfad als `detail`  | Mitteilung angetippt, Kurzbefehl     |
| `campmesser:widget-actions`  | `PendingAction[]`  | Im Widget gesetzte Häkchen           |

Der Sprung geht bewusst über ein Ereignis und nicht über `location.href`:
Der Router der Web-App ist damit sofort da, und der Zwischenspeicher (samt
Offline-Daten) bleibt stehen. Es werden nur Pfade mit führendem `/`
angenommen – auf beiden Seiten geprüft.

## Kurzbefehle

Die Liste steht in `shared/shortcuts.ts` (vier Sprachen). `app.json` trägt
sie zusätzlich fest auf Deutsch als `iosActions` – das gilt bis zum ersten
Start der App, danach ersetzt sie die Web-App über `SET_QUICK_ACTIONS` in
der eingestellten Sprache. iOS zeigt höchstens vier.

Wer die Liste ändert, ändert **beide** Stellen: `shared/shortcuts.ts` und
den `iosActions`-Block in `app.json`.

## Externe Links und Karten

Ein WebView lädt **alles**, was man antippt – auch einen Link auf
OpenStreetMap oder eine fremde Seite. Ohne Weiche landet man in einer
fremden Webseite _innerhalb_ von ReiseKompass, ohne Adresszeile und ohne
Zurück-Knopf. `onShouldStartLoadWithRequest` in `App.js` gibt deshalb
alles, was nicht auf `meinreisekompass.ch` liegt, an das System weiter.

Die **Route** ist ein Sonderfall, weil sie nicht nur nach draussen soll,
sondern in eine _bestimmte_ App. Dafür gibt es zwei Adressen:

| Anbieter     | App-Adresse                                       | Rückfall                            |
| ------------ | ------------------------------------------------- | ----------------------------------- |
| Google Maps  | `comgooglemaps://?daddr=…&directionsmode=driving` | `https://www.google.com/maps/dir/…` |
| Apple Karten | `maps://?daddr=…&dirflg=d`                        | `https://maps.apple.com/…`          |

`App.js` prüft mit `Linking.canOpenURL`, ob die App installiert ist, und
nimmt sonst die Web-Adresse. **Wichtig:** `canOpenURL` liefert auf iOS
für fremde Schemata immer `false`, solange sie nicht unter
`LSApplicationQueriesSchemes` in `app.json` stehen. Fehlt der Eintrag,
landet man stillschweigend immer im Rückfall.

## Widgets

Drei Widgets: **Nächste Reise** (Countdown, während des Aufenthalts der
Tag, dazu der Packstand als Ring), **Vorrat & Pflege** (was bald abläuft,
was fällig ist) und **Zum Abhaken** (siehe unten). Die ersten beiden gibt
es klein und mittel, das Reise-Widget zusätzlich für den Sperrbildschirm;
das dritte mittel und gross.

**Das Widget bekommt Text, keine Daten.** Eine Widget-Erweiterung ist ein
eigener Prozess ohne Zugriff auf die Übersetzungen der Web-App, ohne
`Intl` und ohne `shared/`. Bekäme sie Zahlen und Datumsangaben, müsste
die halbe App in Swift entstehen – vier Sprachen, Pluralformen,
Datumsformate –, und beim nächsten Textwechsel driften die Fassungen
auseinander, ohne dass es jemand merkt. Stattdessen rechnet und
formuliert `shared/widgetData.ts` fertig; Swift malt nur noch.

Der Preis: Nach einem Sprachwechsel steht der alte Text im Widget, bis
die App das nächste Mal offen war. Das ist verkraftbar.

**Der Weg der Daten:**

1. `components/WidgetSync.tsx` baut die Nutzlast (nur in der nativen App)
   und schickt sie über die Brücke, wenn sich am SICHTBAREN Text etwas
   ändert. iOS führt ein Budget an Widget-Aktualisierungen; wer ohne
   Grund nachlädt, wird gedrosselt.
2. `App.js` legt sie über `ExtensionStorage` in der App-Gruppe ab und
   ruft `reloadWidget()`.
3. `targets/widgets/index.swift` liest sie beim nächsten Zeichnen.

**Drei Stellen müssen übereinstimmen** – App-Gruppe, Speicher-Schlüssel
und Fassungsnummer. Passt eine nicht, gibt es KEINE Fehlermeldung: Die
App schreibt in einen Ordner, den das Widget nicht liest, und das Widget
zeigt ewig seinen Platzhalter. `server/widgetBridge.test.ts` vergleicht
die drei Dateien deshalb als Text.

**Antippen** öffnet `campmesser://open?path=/tagebuch/7`. Der Pfad geht
denselben Weg wie eine angetippte Mitteilung.

## Abhaken IM Widget

Seit iOS 17 kann ein Widget etwas tun, statt nur die App zu öffnen: Ein
`AppIntent` hinter einem Schalter läuft in der Erweiterung, ohne dass die
App startet (`targets/widgets/TaskIntent.swift`). Das Widget **Zum
Abhaken** zeigt vor der Reise die offenen Punkte der verknüpften
Packliste, während der Reise die heutigen Ämtli.

**Die Erweiterung erreicht den Server nicht.** Sie hat die Sitzung der App
nicht, und Zugangsdaten in die App-Gruppe zu legen wäre ein zweiter
Anmeldeweg, den niemand sieht und den man beim Abmelden vergisst. Der Weg
ist deshalb derselbe wie im Funkloch (#303): merken und nachschicken.

| Schritt | Wo                            | Was                                                         |
| ------- | ----------------------------- | ----------------------------------------------------------- |
| 1       | `TaskIntent.swift`            | `WidgetStore.remember(…)` legt das Häkchen in die Gruppe    |
| 2       | `WidgetData.swift` `load()`   | legt Gemerktes über den Stand aus der App (`merge`)         |
| 3       | `App.js` `flushWidgetActions` | liest die Sammlung beim Start/Zurückkehren, leert sie       |
| 4       | `WidgetSync.tsx`              | schiebt sie in `offlineQueue`, von dort geht sie zum Server |

Schritt 2 ist der unscheinbare, aber wichtige: Ohne ihn spränge der
Schalter zurück, sobald das Widget neu zeichnet – und nichts wirkt
kaputter als ein Schalter, der nicht bleibt.

**Der Preis, offen gesagt:** Zwischen dem Häkchen im Widget und dem
Häkchen auf dem Server liegt die Zeit bis zum nächsten App-Start. Auf
einem zweiten Gerät taucht es erst dann auf. Für Packlisten und Ämtli ist
das verkraftbar – beides erledigt man alleine.

**Ein zweiter Schlüssel** in derselben App-Gruppe
(`campmesserWidgetActions`) und die Obergrenze der Warteschlange müssen
auf beiden Seiten gleich sein; `server/widgetBridge.test.ts` prüft auch
das als Text.

## Bauen

```sh
cd expo-app
npx eas-cli@latest build --platform ios --profile production
```

**Kein macOS nötig.** `/ios` ist gitignored – das Projekt läuft im
Managed-Workflow mit Continuous Native Generation. EAS Build führt
`expo prebuild` auf seiner eigenen macOS-Maschine aus, samt aller
Config-Plugins; das Widget-Ziel entsteht dort aus
`targets/widgets/expo-target.config.js`. Ein lokales `expo prebuild`
ist nicht nötig und auf einem Linux-Rechner ohnehin unvollständig
(CocoaPods fehlt).

Die Abhängigkeiten stehen samt Lockfile im Repo; EAS installiert sie
selbst. Ein lokales `npm install` braucht es nur, wenn eine
Abhängigkeit dazukommt.

**Beim ERSTEN Build mit dem Widget fragt EAS nach:** Das Widget ist ein
zweites Ziel mit eigener Bundle-Id, es braucht also ein neues
Provisioning-Profil, und die App-Gruppe `group.ch.campmesser.app` muss
im Apple-Developer-Konto existieren. EAS legt beides an, wenn man es
lässt – deshalb den ersten Lauf NICHT mit `--non-interactive` starten.

`npx expo install` statt `npm install <paket>`: Expo wählt damit die
Version, die zur installierten SDK gehört, und schreibt sie in
`package.json`. Der Eintrag dort ist nur der Ausgangspunkt.

Nach dem Build muss die App neu installiert werden – Kurzbefehle und
Mitteilungs-Verhalten stecken im nativen Teil, nicht im WebView. Änderungen
an der Web-App dagegen sind sofort da, ohne neues Build.
