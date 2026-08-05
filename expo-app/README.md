# CampMesser – native App

Ein dünner nativer Rahmen um dieselbe Web-App (`https://campmesser.ch`).
Alles Sichtbare kommt aus dem WebView. Hier steht nur, was der Browser im
WebView nicht kann.

## Was der Rahmen beisteuert

| Fähigkeit                        | Warum nicht im Web                                           |
| -------------------------------- | ------------------------------------------------------------ |
| Push-Mitteilungen                | iOS liefert Web Push nur an installierte PWAs, unzuverlässig |
| Sprung zur Meldung beim Antippen | Der WebView weiss nichts vom Antippen einer Systemmeldung    |
| Zahl am App-Icon                 | `navigator.setAppBadge` gibt es im WebView nicht             |
| Kurzbefehle (langes Drücken)     | iOS ignoriert `shortcuts` im PWA-Manifest vollständig        |

## Die Brücke

Web → nativ läuft über `window.ReactNativeWebView.postMessage` mit einem
JSON-Objekt `{ type, ... }`. Die Namen stehen in
`client/src/lib/nativeBridge.ts` und müssen zu `App.js` passen:

| `type`               | Inhalt                  | Wirkung                            |
| -------------------- | ----------------------- | ---------------------------------- |
| `THEME_UPDATE`       | `value: "light"/"dark"` | Farbe des Rands um den WebView     |
| `REQUEST_PUSH_TOKEN` | –                       | Berechtigung fragen, Token liefern |
| `SET_BADGE`          | `count: number`         | Zahl am App-Icon (0 = weg)         |
| `SET_QUICK_ACTIONS`  | `items: Action[]`       | Kurzbefehle in der App-Sprache     |

Nativ → Web läuft über `injectJavaScript` und ein `CustomEvent`:

| Ereignis                     | Inhalt             | Ausgelöst durch                      |
| ---------------------------- | ------------------ | ------------------------------------ |
| `ExpoPushToken`              | Token als `detail` | Antwort auf `REQUEST_PUSH_TOKEN`     |
| `ExpoPushTokenError`         | –                  | Berechtigung verweigert / kein Gerät |
| `campmesser:native-navigate` | Pfad als `detail`  | Mitteilung angetippt, Kurzbefehl     |

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

## Bauen

```sh
cd expo-app
npm install
npx expo install expo-quick-actions   # setzt die zur SDK passende Version
npx eas build --platform ios --profile production
```

`npx expo install` statt `npm install <paket>`: Expo wählt damit die
Version, die zur installierten SDK gehört, und schreibt sie in
`package.json`. Der Eintrag dort ist nur der Ausgangspunkt.

Nach dem Build muss die App neu installiert werden – Kurzbefehle und
Mitteilungs-Verhalten stecken im nativen Teil, nicht im WebView. Änderungen
an der Web-App dagegen sind sofort da, ohne neues Build.
