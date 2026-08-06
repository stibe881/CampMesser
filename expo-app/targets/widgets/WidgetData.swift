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

/// Eine Zeile der Liste zum Abhaken (#327).
///
/// `kind` unterscheidet Packliste und Ämtli. Beide zählen ihre Nummern
/// getrennt – ohne die Unterscheidung würde ein Häkchen auf Packlisten-
/// Eintrag 7 unterwegs zum Ämtli 7 werden.
struct WidgetTask: Codable, Identifiable {
  let id: Int
  let kind: String
  let title: String
  let checked: Bool
}

struct WidgetPayload: Codable {
  let version: Int
  let builtAt: String
  let trip: WidgetPanel
  let packing: WidgetProgress?
  let supplies: WidgetPanel
  let tasksTitle: String
  let tasksEmpty: String
  let tasksUrl: String
  let tasks: [WidgetTask]
}

/// Ein im Widget gesetztes Häkchen, das noch nicht beim Server ist (#327).
///
/// Die Erweiterung hat die Sitzung der App nicht und kann den Server
/// weder fragen noch ihm etwas sagen. Sie legt das Häkchen deshalb im
/// gemeinsamen Ordner ab; die App liest es beim nächsten Start aus und
/// schiebt es in ihre bestehende Warteschlange. Die Gegenstelle steht in
/// `shared/widgetActions.ts` – wer hier ein Feld ändert, muss dort hin.
struct PendingAction: Codable {
  let kind: String
  let itemId: Int
  let checked: Bool
  /// Millisekunden seit 1970 – entscheidet, welcher Wert gewinnt.
  let at: Double
}

extension WidgetPayload {
  /// Fassung, die dieser Widget-Stand versteht.
  static let supportedVersion = 2

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
    ),
    tasksTitle: "Zum Abhaken",
    tasksEmpty: "App öffnen für aktuelle Daten",
    tasksUrl: "/packlisten",
    tasks: []
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
  /// Zweiter Schlüssel: die im Widget gesetzten Häkchen (#327). Er muss
  /// zu `WIDGET_ACTIONS_KEY` in `expo-app/App.js` passen.
  static let actionsKey = "campmesserWidgetActions"
  /// Wie `PENDING_LIMIT` in `shared/widgetActions.ts`.
  static let pendingLimit = 100

  private static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroup)
  }

  /// Die zuletzt geschriebene Nutzlast lesen.
  ///
  /// Bei allem, was nicht passt – kein Eintrag, kaputtes JSON, eine
  /// Fassung aus der Zukunft – kommt der Platzhalter zurück. Ein Widget
  /// darf nie abstürzen: Es läuft im Auftrag des Systems, und ein
  /// Absturz kostet das Aktualisierungs-Budget der ganzen App.
  ///
  /// ÜBER DEN STAND AUS DER APP LEGT SICH, WAS IM WIDGET GETIPPT WURDE:
  /// Die App weiss davon erst beim nächsten Start. Ohne diese Überlagerung
  /// spränge der Schalter zurück, sobald das Widget neu zeichnet – und
  /// nichts wirkt kaputter als ein Schalter, der nicht bleibt.
  static func load() -> WidgetPayload {
    guard
      let raw = defaults?.string(forKey: key),
      let data = raw.data(using: .utf8),
      let payload = try? JSONDecoder().decode(WidgetPayload.self, from: data),
      payload.version == WidgetPayload.supportedVersion
    else {
      return .placeholder
    }
    return payload.withTasks(merge(payload.tasks, pending()))
  }

  /// Die vorgemerkten Häkchen lesen (Unsinn zählt als leer).
  static func pending() -> [PendingAction] {
    guard
      let raw = defaults?.string(forKey: actionsKey),
      let data = raw.data(using: .utf8),
      let queue = try? JSONDecoder().decode([PendingAction].self, from: data)
    else {
      return []
    }
    return queue
  }

  /// Ein im Widget gesetztes Häkchen vormerken.
  ///
  /// Mehrfaches Umschalten desselben Eintrags ergibt EINEN Eintrag mit dem
  /// zuletzt gewählten Wert – genau wie `addPending` in
  /// `shared/widgetActions.ts`.
  static func remember(kind: String, itemId: Int, checked: Bool) {
    let target = pendingKey(kind, itemId)
    var queue = pending().filter { pendingKey($0.kind, $0.itemId) != target }
    queue.append(
      PendingAction(
        kind: kind,
        itemId: itemId,
        checked: checked,
        at: Date().timeIntervalSince1970 * 1000
      )
    )
    if queue.count > pendingLimit {
      queue.removeFirst(queue.count - pendingLimit)
    }
    guard
      let data = try? JSONEncoder().encode(queue),
      let text = String(data: data, encoding: .utf8)
    else { return }
    defaults?.set(text, forKey: actionsKey)
  }

  /// Gegenstelle zu `mergePending`: Bei mehreren Einträgen zum selben Ziel
  /// gewinnt der jüngste – deshalb nach `at` sortiert und nicht nach
  /// Reihenfolge im Speicher.
  static func merge(_ tasks: [WidgetTask], _ pending: [PendingAction])
    -> [WidgetTask]
  {
    guard !pending.isEmpty else { return tasks }
    var latest: [String: PendingAction] = [:]
    for entry in pending.sorted(by: { $0.at < $1.at }) {
      latest[pendingKey(entry.kind, entry.itemId)] = entry
    }
    return tasks.map { task in
      guard let hit = latest[pendingKey(task.kind, task.id)] else { return task }
      return WidgetTask(
        id: task.id,
        kind: task.kind,
        title: task.title,
        checked: hit.checked
      )
    }
  }

  /// Eine Zeile pro Listeneintrag – Packliste und Ämtli zählen getrennt.
  private static func pendingKey(_ kind: String, _ itemId: Int) -> String {
    "\(kind):\(itemId)"
  }
}

extension WidgetPayload {
  /// Dieselbe Nutzlast mit ausgetauschter Liste.
  func withTasks(_ replacement: [WidgetTask]) -> WidgetPayload {
    WidgetPayload(
      version: version,
      builtAt: builtAt,
      trip: trip,
      packing: packing,
      supplies: supplies,
      tasksTitle: tasksTitle,
      tasksEmpty: tasksEmpty,
      tasksUrl: tasksUrl,
      tasks: replacement
    )
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
