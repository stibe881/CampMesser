/**
 * Brücke zur nativen App (#315/#316).
 *
 * WAS DIE NATIVE APP IST: ein dünner Rahmen um dieselbe Web-App
 * (`expo-app/App.js`, ein WebView auf meinreisekompass.ch). Alles Sichtbare kommt
 * aus dem Web; nur was der Browser im WebView NICHT kann, macht der Rahmen –
 * echte Push-Mitteilungen von Apple, die Zahl am App-Icon und das lange
 * Drücken auf das Icon.
 *
 * WARUM ES DIESE DATEI BRAUCHT: Diese drei Dinge müssen in beide Richtungen
 * sprechen. Bisher gab es dafür an drei Stellen je einen `"ReactNativeWebView"
 * in window`-Test mit einem handgeschriebenen `postMessage`. Das ist die Art
 * Verkabelung, die still bricht: Ein Tippfehler im Nachrichten-Namen fällt
 * nicht auf, weil im Browser ohnehin nichts passiert – und in der App fällt
 * er erst auf, wenn jemand ein neues Build installiert.
 *
 * Die Nachrichten-Namen stehen deshalb hier, einmal, als Konstanten. Die
 * native Seite kennt dieselben Namen (siehe `expo-app/App.js`); wer einen
 * ändert, muss beide Dateien anfassen.
 */

/** Läuft die Web-App im WebView der nativen App? */
export function isNativeApp(): boolean {
  return typeof window !== "undefined" && "ReactNativeWebView" in window;
}

/** Nachrichten Web → nativ. */
export const NATIVE_MESSAGES = {
  /** Hintergrundfarbe hinter dem WebView an das Design anpassen. */
  theme: "THEME_UPDATE",
  /** Push-Token anfordern (die Antwort kommt als `ExpoPushToken`-Event). */
  requestPushToken: "REQUEST_PUSH_TOKEN",
  /** Zahl am App-Icon setzen (`count: number`, 0 = weg). */
  setBadge: "SET_BADGE",
  /** Kurzbefehle fürs lange Drücken setzen (`items: Action[]`). */
  setQuickActions: "SET_QUICK_ACTIONS",
  /** Daten für die Home-Bildschirm-Widgets (`payload: WidgetPayload`). */
  setWidgetData: "SET_WIDGET_DATA",
  /**
   * Route in der Karten-App öffnen (`appUrl`, `webUrl`). Zwei Adressen,
   * weil die App-Adresse nur wirkt, wenn die App installiert ist – der
   * native Rahmen prüft das und nimmt sonst die Web-Adresse.
   */
  openDirections: "OPEN_DIRECTIONS",
} as const;

/** Ereignis nativ → Web: die App möchte, dass wir zu `detail` navigieren. */
export const NATIVE_NAVIGATE_EVENT = "campmesser:native-navigate";

/**
 * Ereignis nativ → Web: im Widget gesetzte Häkchen (`detail` ist eine
 * Liste von `PendingAction`). Die Widget-Erweiterung kann den Server
 * nicht erreichen; sie merkt sie im gemeinsamen Ordner, und die App
 * reicht sie beim Start herüber (#327).
 */
export const WIDGET_ACTIONS_EVENT = "campmesser:widget-actions";

/**
 * Nachricht an den nativen Rahmen schicken. Im normalen Browser passiert
 * nichts – die Aufrufer müssen also nicht selbst prüfen, wo sie laufen.
 */
export function postToNative(type: string, payload?: Record<string, unknown>) {
  if (!isNativeApp()) return;
  try {
    (
      window as unknown as {
        ReactNativeWebView: { postMessage: (data: string) => void };
      }
    ).ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
  } catch {
    // Die Brücke ist Zusatz, kein Fundament – ein Fehler darf nichts stören.
  }
}
