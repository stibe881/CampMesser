import Foundation

/// Die Nutzlast, wie sie die Web-App über die Brücke schickt.
///
/// SIE ENTHÄLT TEXT, KEINE DATEN – und das ist Absicht. Ein Widget hat
/// keinen Zugriff auf die Übersetzungen der Web-App und auf nichts aus
/// `shared/`. Bekäme es Zahlen und Datumsangaben, müsste hier die halbe
/// App noch einmal entstehen: vier Sprachen, Pluralformen, Datumsformate.
/// Stattdessen rechnet und formuliert die Web-App fertig, und dieser Teil
/// malt nur. Die Gegenseite steht in `shared/widgetData.ts`; wer hier ein
/// Feld ändert, muss dort ebenfalls hin.
struct WidgetPanel: Codable {
  /// Blickfang – Zahl oder kurzes Zeichen («3», «✓», «–»).
  let value: String
  /// Worum es geht («Seeblick», «Kühlbox»).
  let title: String
  /// Ergänzung in klein («noch 3 Tage»).
  let subtitle: String
  /// Ziel beim Antippen – ein Pfad der App («/tagebuch/7»).
  let url: String
}

/// Fortschritts-Ring, 0–1.
struct WidgetProgress: Codable {
  let ratio: Double
  let label: String
}

struct WidgetPayload: Codable {
  let version: Int
  let builtAt: String
  let trip: WidgetPanel
  let packing: WidgetProgress?
  let supplies: WidgetPanel
}

extension WidgetPayload {
  /// Fassung, die dieser Widget-Stand versteht.
  static let supportedVersion = 1

  /// Was angezeigt wird, solange die App noch nie gelaufen ist.
  ///
  /// EIN WIDGET IST NIE LEER: Es wird in der Galerie als Vorschau
  /// gezeigt, bevor überhaupt Daten existieren, und es steht auf dem
  /// Bildschirm, wenn jemand die App nach dem Neustart des Geräts noch
  /// nicht geöffnet hat. Ein weisses Rechteck sähe dann nach einem
  /// Fehler aus. Die Texte sind deutsch, weil hier keine Sprache bekannt
  /// ist – sobald die App einmal offen war, kommen sie in der
  /// eingestellten Sprache von dort.
  static let placeholder = WidgetPayload(
    version: supportedVersion,
    builtAt: "",
    trip: WidgetPanel(
      value: "–",
      title: "CampMesser",
      subtitle: "App öffnen für aktuelle Daten",
      url: "/"
    ),
    packing: nil,
    supplies: WidgetPanel(
      value: "–",
      title: "Vorräte",
      subtitle: "App öffnen für aktuelle Daten",
      url: "/kuehlbox"
    )
  )
}

/// Der gemeinsame Ordner von App und Widget.
///
/// Die Kennung MUSS zu `app.json` passen (`ios.entitlements`). Stimmen
/// die beiden nicht überein, schreibt die App in einen Ordner, den das
/// Widget nicht liest – ohne Fehlermeldung, das Widget zeigt einfach
/// ewig den Platzhalter. Deshalb steht sie hier an genau einer Stelle.
enum WidgetStore {
  static let appGroup = "group.ch.campmesser.app"
  static let key = "campmesserWidget"

  /// Die zuletzt geschriebene Nutzlast lesen.
  ///
  /// Bei allem, was nicht passt – kein Eintrag, kaputtes JSON, eine
  /// Fassung aus der Zukunft – kommt der Platzhalter zurück. Ein Widget
  /// darf nie abstürzen: Es läuft im Auftrag des Systems, und ein
  /// Absturz kostet das Aktualisierungs-Budget der ganzen App.
  static func load() -> WidgetPayload {
    guard
      let defaults = UserDefaults(suiteName: appGroup),
      let raw = defaults.string(forKey: key),
      let data = raw.data(using: .utf8),
      let payload = try? JSONDecoder().decode(WidgetPayload.self, from: data),
      payload.version == WidgetPayload.supportedVersion
    else {
      return .placeholder
    }
    return payload
  }
}

/// Adresse, die beim Antippen geöffnet wird.
///
/// `campmesser://öffnen?pfad=/tagebuch/7` – das Schema steht in
/// `app.json`, die Gegenstelle in `expo-app/App.js`. Nur Pfade mit
/// führendem «/» werden gebaut; alles andere führt auf die Startseite.
func widgetURL(_ path: String) -> URL? {
  guard path.hasPrefix("/"), !path.hasPrefix("//") else {
    return URL(string: "campmesser://open?path=/")
  }
  var components = URLComponents()
  components.scheme = "campmesser"
  components.host = "open"
  components.queryItems = [URLQueryItem(name: "path", value: path)]
  return components.url
}
