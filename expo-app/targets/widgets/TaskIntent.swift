import AppIntents

/// Abhaken direkt im Widget (#327).
///
/// SEIT iOS 17 kann ein Widget etwas TUN, statt nur die App zu öffnen: Ein
/// `AppIntent` hinter einem Schalter läuft in der Widget-Erweiterung, ohne
/// dass die App startet. Genau das macht ein Packlisten-Widget erst
/// brauchbar – man steht vor dem Schrank, hakt ab, fertig. Ein Widget, das
/// nur die App aufmacht, ist eine Verknüpfung mit Zwischenschritt.
///
/// `SetValueIntent` ist die Form, die SwiftUI für `Toggle(isOn:intent:)`
/// verlangt: Das System schreibt den NEUEN Zustand nach `value` und führt
/// den Intent aus. Hier deshalb kein eigenes Umdrehen – täte man das
/// zusätzlich, käme der alte Wert heraus.
///
/// WAS HIER NICHT PASSIERT: der Weg zum Server. Die Erweiterung hat die
/// Sitzung der App nicht; sie legt das Häkchen im gemeinsamen Ordner ab,
/// und die App schiebt es beim nächsten Start in ihre Warteschlange
/// (`client/src/lib/offlineQueue.ts`). Zugangsdaten in den gemeinsamen
/// Ordner zu legen wäre ein zweiter Anmeldeweg, den niemand sieht und den
/// man beim Abmelden vergisst.
struct ToggleTaskIntent: AppIntent, SetValueIntent {
  static var title: LocalizedStringResource { "Eintrag abhaken" }

  /// Nicht in der Kurzbefehle-App anbieten: Der Intent ist ohne die Nummer
  /// eines Eintrags sinnlos, und niemand kennt sie auswendig.
  static var isDiscoverable: Bool { false }

  /// «packing» oder «chore» – siehe `WidgetTaskKind` in
  /// `shared/widgetActions.ts`.
  @Parameter(title: "Liste")
  var kind: String

  @Parameter(title: "Nummer")
  var itemId: Int

  /// Der neue Zustand, den das System setzt.
  @Parameter(title: "Erledigt")
  var value: Bool

  init() {}

  init(kind: String, itemId: Int) {
    self.kind = kind
    self.itemId = itemId
    self.value = false
  }

  func perform() async throws -> some IntentResult {
    WidgetStore.remember(kind: kind, itemId: itemId, checked: value)
    // Kein `reloadTimelines` nötig: Das System zeichnet das Widget nach
    // einem Intent von sich aus neu, und `WidgetStore.load()` legt die
    // Vormerkung dann über den Stand aus der App.
    return .result()
  }
}
