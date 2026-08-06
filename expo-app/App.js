import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Notifications from "expo-notifications";
import * as QuickActions from "expo-quick-actions";
import * as Device from "expo-device";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { ExtensionStorage } from "@bacons/apple-targets";

/**
 * Der native Rahmen um die Web-App.
 *
 * Alles Sichtbare kommt aus dem WebView. Hier steht nur, was der Browser im
 * WebView nicht kann: echte Push-Mitteilungen von Apple, die Zahl am
 * App-Icon, die Kurzbefehle beim langen Drücken auf das Icon und die
 * Widgets für den Home-Bildschirm.
 *
 * Die Nachrichten-Namen unten müssen zu `client/src/lib/nativeBridge.ts`
 * passen – wer einen ändert, muss beide Dateien anfassen.
 */

// Basis-URL der Web-App
const CAMP_URL = "https://campmesser.ch";

/**
 * Der gemeinsame Ordner mit der Widget-Erweiterung (#325).
 *
 * MUSS zu `app.json` (`ios.entitlements`) und zu `WidgetStore.appGroup`
 * in `targets/widgets/WidgetData.swift` passen. Stimmen die drei nicht
 * überein, schreibt die App in einen Ordner, den das Widget nicht liest –
 * ohne Fehlermeldung. Das Widget zeigt dann ewig seinen Platzhalter, und
 * man sucht an der falschen Stelle.
 */
const APP_GROUP = "group.ch.campmesser.app";
const WIDGET_KEY = "campmesserWidget";
/**
 * Zweiter Schlüssel: die Häkchen, die IM WIDGET gesetzt wurden (#327).
 * Muss zu `WidgetStore.actionsKey` in `targets/widgets/WidgetData.swift`
 * passen. Geschrieben wird er von der Erweiterung, geleert von hier.
 */
const WIDGET_ACTIONS_KEY = "campmesserWidgetActions";
const widgetStorage = new ExtensionStorage(APP_GROUP);

/**
 * WIE EINE MITTEILUNG AUSSIEHT, WÄHREND DIE APP OFFEN IST.
 *
 * `shouldShowAlert` ist seit SDK 53 abgelöst und wird ignoriert – es hiess
 * hier also «zeig sie an», und angezeigt wurde trotzdem nichts. Wer die App
 * gerade offen hatte, bekam von der Warnung schlicht nichts mit. Die
 * Nachfolger sind zwei getrennte Schalter: das Band oben am Bildschirm
 * (`shouldShowBanner`) und der Eintrag in der Mitteilungszentrale
 * (`shouldShowList`), damit eine Meldung nicht spurlos verschwindet, wenn
 * man das Band wegwischt.
 *
 * `shouldSetBadge: false` bleibt Absicht: Die Zahl am Icon zählt fällige
 * Sachen (ablaufende Lebensmittel, anstehende Pflege) und wird von der
 * Web-App gesetzt – nicht die Zahl ungelesener Mitteilungen.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return null;
    }
    // Wichtig für EAS Build
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
  }

  return token;
}

/**
 * Route in der KARTEN-APP öffnen, nicht im WebView (#326).
 *
 * `comgooglemaps://` bzw. `maps://` sprechen die installierte App direkt
 * an. Ist sie nicht da, meldet `canOpenURL` das, und wir nehmen die
 * Web-Adresse – die öffnet dann Safari bzw. bei Apple-Karten-Links doch
 * noch die Karten-App.
 *
 * WICHTIG FÜR iOS: `canOpenURL` liefert für fremde Schemata IMMER false,
 * solange sie nicht unter `LSApplicationQueriesSchemes` in `app.json`
 * stehen. Fehlt der Eintrag, landet man stillschweigend immer im
 * Rückfall – die App-Adresse wäre dann totes Gewicht.
 */
async function openMaps(appUrl, webUrl) {
  try {
    if (appUrl && (await Linking.canOpenURL(appUrl))) {
      await Linking.openURL(appUrl);
      return;
    }
  } catch {
    // Weiter zum Rückfall – ein nicht öffenbares Schema ist kein Fehler.
  }
  if (webUrl) await Linking.openURL(webUrl).catch(() => {});
}

/**
 * Bleibt diese Adresse in der App, oder gehört sie nach draussen (#326)?
 *
 * DAS PROBLEM DAHINTER war grösser als die Route: Ein WebView lädt
 * ALLES, was man antippt – auch einen Link auf OpenStreetMap, eine
 * Telefonnummer oder eine fremde Seite. Ohne diese Weiche landet man in
 * einer fremden Webseite INNERHALB von CampMesser, ohne Adresszeile und
 * ohne Zurück-Knopf. Das ist die häufigste Art, wie sich eine
 * WebView-App wie eine Bastelei anfühlt.
 */
function staysInApp(url) {
  if (!url) return true;
  if (url.startsWith("about:") || url.startsWith("data:")) return true;
  // Alles auf unserer eigenen Adresse bleibt drin – Unterseiten
  // eingeschlossen.
  return url.startsWith(CAMP_URL);
}

/**
 * Nur eigene Pfade zulassen. Das Ziel kommt aus einer Mitteilung oder einem
 * Kurzbefehl; beides ist unsere eigene Quelle, aber der WebView soll auch
 * bei einem Fehler nie irgendwohin geschickt werden können.
 */
function safePath(value) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export default function App() {
  const webViewRef = useRef(null);
  const [themeBg, setThemeBg] = useState("#09090b");
  // Ein Ziel, das eintraf, BEVOR die Seite fertig geladen war. Genau das
  // passiert beim Antippen einer Mitteilung aus dem geschlossenen Zustand:
  // Die App startet, das Ereignis kommt sofort – und der WebView zeigt noch
  // gar nichts. Ohne diesen Merker landet man auf der Startseite und die
  // Mitteilung führt ins Leere.
  const pendingPath = useRef(null);
  const initialActionDone = useRef(false);
  const [webReady, setWebReady] = useState(false);

  /** Im WebView zu einem Pfad springen (ohne Neuladen, über den Router). */
  const navigateWebView = useCallback(
    path => {
      const target = safePath(path);
      if (!target) return;
      if (!webReady || !webViewRef.current) {
        pendingPath.current = target;
        return;
      }
      webViewRef.current.injectJavaScript(
        `window.dispatchEvent(new CustomEvent(${JSON.stringify(
          "campmesser:native-navigate"
        )}, { detail: ${JSON.stringify(target)} })); true;`
      );
    },
    [webReady]
  );

  // Sobald die Seite steht: ein gemerktes Ziel nachholen.
  useEffect(() => {
    if (webReady && pendingPath.current) {
      const target = pendingPath.current;
      pendingPath.current = null;
      navigateWebView(target);
    }
  }, [webReady, navigateWebView]);

  /**
   * ANTIPPEN EINER MITTEILUNG. Der Server legt zu jeder Meldung die
   * passende Adresse bei (`data.url`) – bisher wurde sie nie gelesen. Eine
   * Warnung für einen bestimmten Platz führte also auf die Startseite, und
   * man musste den Platz von Hand suchen. Das ist der halbe Zweck einer
   * Mitteilung.
   */
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      response => {
        const url = response?.notification?.request?.content?.data?.url;
        navigateWebView(url);
      }
    );
    return () => sub.remove();
  }, [navigateWebView]);

  /**
   * KURZBEFEHLE beim langen Drücken auf das App-Icon. Die feste Liste in
   * `app.json` gilt bis zum ersten Start; danach schickt die Web-App sie in
   * der eingestellten Sprache. Beim Antippen steht das Ziel in `params.url`.
   */
  useEffect(() => {
    // Nur beim allerersten Durchlauf: `initial` bleibt stehen, der Effekt
    // läuft aber erneut, sobald die Seite geladen ist – sonst spränge die
    // App ein zweites Mal dorthin, während man schon woanders liest.
    if (QuickActions.initial && !initialActionDone.current) {
      initialActionDone.current = true;
      navigateWebView(QuickActions.initial.params?.url);
    }
    const sub = QuickActions.addListener(action => {
      navigateWebView(action.params?.url);
    });
    return () => sub.remove();
  }, [navigateWebView]);

  /**
   * Antippen eines Widgets (#325).
   *
   * Das Widget öffnet `campmesser://open?path=/tagebuch/7`. Der Pfad
   * geht denselben Weg wie eine angetippte Mitteilung – über
   * `navigateWebView`, das ihn prüft und nur eigene Pfade zulässt.
   * `getInitialURL` deckt den Start aus dem geschlossenen Zustand ab,
   * der Listener das Antippen bei laufender App.
   */
  useEffect(() => {
    const handle = url => {
      if (!url) return;
      const parsed = Linking.parse(url);
      navigateWebView(parsed.queryParams?.path);
    };
    Linking.getInitialURL()
      .then(handle)
      .catch(() => {});
    const sub = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => sub.remove();
  }, [navigateWebView]);

  /**
   * Die im WIDGET gesetzten Häkchen abholen (#327).
   *
   * Die Widget-Erweiterung hat die Sitzung der App nicht und erreicht den
   * Server nicht. Sie legt jedes Häkchen im gemeinsamen Ordner ab; hier
   * wird die Sammlung an die Web-App gereicht, die sie in ihre bestehende
   * Warteschlange schiebt (`client/src/lib/offlineQueue.ts`).
   *
   * WANN: sobald die Seite steht und jedes Mal, wenn die App wieder nach
   * vorne kommt. Ein Tipp im Widget startet die App NICHT – ohne den
   * Blick beim Zurückkehren bliebe das Häkchen liegen, bis die App aus
   * einem anderen Grund geöffnet wird.
   */
  const flushWidgetActions = useCallback(() => {
    if (!webReady || !webViewRef.current) return;
    let actions;
    try {
      const raw = widgetStorage.get(WIDGET_ACTIONS_KEY);
      if (!raw) return;
      actions = JSON.parse(raw);
    } catch {
      // Halb geschriebenes JSON: wegwerfen statt daran hängenbleiben.
      widgetStorage.remove(WIDGET_ACTIONS_KEY);
      return;
    }
    if (!Array.isArray(actions) || actions.length === 0) return;
    // Erst leeren, dann schicken – käme die App zwischendurch ein zweites
    // Mal nach vorne, landete sonst dasselbe Häkchen zweimal in der
    // Warteschlange.
    widgetStorage.remove(WIDGET_ACTIONS_KEY);
    webViewRef.current.injectJavaScript(
      `window.dispatchEvent(new CustomEvent(${JSON.stringify(
        "campmesser:widget-actions"
      )}, { detail: ${JSON.stringify(actions)} })); true;`
    );
  }, [webReady]);

  useEffect(() => {
    flushWidgetActions();
    const sub = AppState.addEventListener("change", state => {
      if (state === "active") flushWidgetActions();
    });
    return () => sub.remove();
  }, [flushWidgetActions]);

  const onMessage = async event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "THEME_UPDATE") {
        setThemeBg(data.value === "light" ? "#ffffff" : "#09090b");
      }
      if (data.type === "SET_BADGE") {
        // Die Badging API des Browsers gibt es im WebView nicht – ohne
        // diese Zeile hätte die native App als einzige Variante nie eine
        // Zahl am Icon.
        const count = Number(data.count);
        await Notifications.setBadgeCountAsync(
          Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
        ).catch(() => {});
      }
      if (data.type === "SET_QUICK_ACTIONS" && Array.isArray(data.items)) {
        await QuickActions.setItems(data.items).catch(() => {});
      }
      if (data.type === "OPEN_DIRECTIONS") {
        await openMaps(data.appUrl, data.webUrl);
      }
      if (data.type === "SET_WIDGET_DATA" && data.payload) {
        // Als Zeichenkette ablegen und erst DANACH neu zeichnen lassen –
        // umgekehrt läse das Widget noch den alten Stand und zeigte ihn
        // bis zur nächsten Änderung.
        widgetStorage.set(WIDGET_KEY, JSON.stringify(data.payload));
        ExtensionStorage.reloadWidget();
      }
      if (data.type === "REQUEST_PUSH_TOKEN") {
        const token = await registerForPushNotificationsAsync();
        if (token && webViewRef.current) {
          // Send the token back to the web view
          webViewRef.current.injectJavaScript(
            `window.dispatchEvent(new CustomEvent("ExpoPushToken", { detail: ${JSON.stringify(
              token
            )} })); true;`
          );
        } else if (webViewRef.current) {
          // Error or denied
          webViewRef.current.injectJavaScript(
            `window.dispatchEvent(new CustomEvent("ExpoPushTokenError")); true;`
          );
        }
      }
    } catch (e) {
      console.log("Error parsing message from webview", e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeBg }]}>
      <WebView
        ref={webViewRef}
        source={{ uri: CAMP_URL }}
        style={styles.webview}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onMessage={onMessage}
        onLoadEnd={() => setWebReady(true)}
        onShouldStartLoadWithRequest={request => {
          if (staysInApp(request.url)) return true;
          // Fremdes Ziel: nach draussen geben und den WebView anhalten.
          Linking.openURL(request.url).catch(() => {});
          return false;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
});
