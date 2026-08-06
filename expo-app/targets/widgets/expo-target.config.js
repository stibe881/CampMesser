/**
 * Ziel-Beschreibung für die Widget-Erweiterung (#325).
 *
 * Die App-Gruppe wird aus `app.json` gespiegelt (`ios.entitlements`), das
 * Plugin übernimmt sie automatisch – sie ist der einzige Weg, auf dem die
 * App und das Widget Daten teilen: zwei getrennte Prozesse mit je eigenem
 * Sandkasten, aber einem gemeinsamen Ordner.
 *
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
module.exports = {
  type: "widget",
  name: "CampMesserWidgets",
  displayName: "CampMesser",
  icon: "../../assets/icon.png",
  colors: {
    // Die Akzentfarbe der App (siehe client/src/index.css, --primary)
    $accent: { color: "#2F6F4E", darkColor: "#7FC79B" },
  },
  // AppIntents braucht es für das Abhaken direkt im Widget (#327) –
  // ohne das Framework findet der Compiler `SetValueIntent` nicht.
  frameworks: ["SwiftUI", "WidgetKit", "AppIntents"],
  // iOS 17 ist die Untergrenze für `containerBackground`, das seit
  // iOS 17 für jedes Widget verlangt wird.
  deploymentTarget: "17.0",
};
