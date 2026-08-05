import SwiftUI
import WidgetKit

/// Die Widgets von CampMesser (#325).
///
/// ZWEI STÜCK, NICHT SECHS: Ein Widget wird im Vorbeigehen angeschaut,
/// nicht gelesen. Es beantwortet je eine Frage – «wann geht es los und
/// bin ich bereit» und «muss ich etwas aufbrauchen oder pflegen». Alles
/// Weitere gehört in die App, wo Platz dafür ist.
///
/// KEIN NETZWERK: Beide zeichnen aus dem gemeinsamen Ordner, den die App
/// beschreibt. Eine Widget-Erweiterung hat die Sitzung der App nicht und
/// müsste sich sonst selbst anmelden – ein zweiter Weg, der kaputtgehen
/// kann, für zwei Zahlen.

// MARK: - Zeitplan

/// Ein einziger Eintrag, gültig bis auf Weiteres.
///
/// WARUM KEIN ZEITPLAN MIT MEHREREN EINTRÄGEN: Die angezeigten Texte
/// entstehen in der Web-App, nicht hier – dieses Teil kann «noch 3 Tage»
/// nicht selbst zu «noch 2 Tage» weiterzählen. Aktualisiert wird deshalb
/// dann, wenn die App neue Texte liefert (`reloadAllTimelines`), plus
/// einmal täglich kurz nach Mitternacht als Sicherheitsnetz, falls die
/// App länger nicht offen war.
struct Entry: TimelineEntry {
  let date: Date
  let payload: WidgetPayload
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> Entry {
    Entry(date: Date(), payload: .placeholder)
  }

  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
    completion(Entry(date: Date(), payload: WidgetStore.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let entry = Entry(date: Date(), payload: WidgetStore.load())
    let tomorrow =
      Calendar.current.nextDate(
        after: Date(),
        matching: DateComponents(hour: 0, minute: 5),
        matchingPolicy: .nextTime
      ) ?? Date().addingTimeInterval(6 * 3600)
    completion(Timeline(entries: [entry], policy: .after(tomorrow)))
  }
}

// MARK: - Bausteine

/// Die grosse Zahl. Sie schrumpft, statt umzubrechen: «heute» ist
/// länger als «3», und ein Umbruch mitten im Blickfang sieht kaputt aus.
private struct BigValue: View {
  let text: String
  var body: some View {
    Text(text)
      .font(.system(size: 44, weight: .bold, design: .rounded))
      .minimumScaleFactor(0.4)
      .lineLimit(1)
      .foregroundStyle(.tint)
  }
}

private struct PanelText: View {
  let title: String
  let subtitle: String
  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      Text(title)
        .font(.headline)
        .lineLimit(1)
      Text(subtitle)
        .font(.caption)
        .foregroundStyle(.secondary)
        .lineLimit(2)
    }
  }
}

/// Der Packstand als Ring.
private struct ProgressRing: View {
  let progress: WidgetProgress
  var body: some View {
    ZStack {
      Circle().stroke(.tint.opacity(0.2), lineWidth: 6)
      Circle()
        .trim(from: 0, to: max(0.01, min(1, progress.ratio)))
        .stroke(.tint, style: StrokeStyle(lineWidth: 6, lineCap: .round))
        .rotationEffect(.degrees(-90))
      Text("\(Int((progress.ratio * 100).rounded()))")
        .font(.system(size: 15, weight: .semibold, design: .rounded))
    }
  }
}

// MARK: - Reise-Widget

struct TripWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: Entry

  var body: some View {
    let panel = entry.payload.trip
    switch family {
    case .accessoryCircular:
      // Sperrbildschirm: Platz für genau eine Zahl.
      Gauge(value: entry.payload.packing?.ratio ?? 0) {
        Text(panel.value)
      } currentValueLabel: {
        Text(panel.value)
      }
      .gaugeStyle(.accessoryCircularCapacity)

    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 0) {
        Text(panel.title).font(.headline).lineLimit(1)
        Text(panel.subtitle).font(.caption).lineLimit(1)
        if let packing = entry.payload.packing {
          Text(packing.label).font(.caption2).lineLimit(1)
        }
      }

    case .systemMedium:
      HStack(spacing: 14) {
        BigValue(text: panel.value)
        PanelText(title: panel.title, subtitle: panel.subtitle)
        Spacer(minLength: 0)
        if let packing = entry.payload.packing {
          VStack(spacing: 4) {
            ProgressRing(progress: packing).frame(width: 52, height: 52)
            Text(packing.label)
              .font(.caption2)
              .foregroundStyle(.secondary)
              .lineLimit(1)
              .minimumScaleFactor(0.7)
          }
        }
      }

    default:
      VStack(alignment: .leading, spacing: 6) {
        BigValue(text: panel.value)
        PanelText(title: panel.title, subtitle: panel.subtitle)
        Spacer(minLength: 0)
      }
    }
  }
}

struct TripWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "campmesser.trip", provider: Provider()) { entry in
      TripWidgetView(entry: entry)
        .containerBackground(.fill.tertiary, for: .widget)
        .widgetURL(widgetURL(entry.payload.trip.url))
    }
    .configurationDisplayName("Nächste Reise")
    .description("Countdown zur Anreise und Packstand – während des Aufenthalts der Tag.")
    .supportedFamilies([
      .systemSmall,
      .systemMedium,
      .accessoryCircular,
      .accessoryRectangular,
    ])
  }
}

// MARK: - Vorrat-Widget

struct SupplyWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: Entry

  var body: some View {
    let panel = entry.payload.supplies
    switch family {
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 0) {
        Text(panel.title).font(.headline).lineLimit(1)
        Text(panel.subtitle).font(.caption).lineLimit(2)
      }

    case .systemMedium:
      HStack(spacing: 14) {
        BigValue(text: panel.value)
        PanelText(title: panel.title, subtitle: panel.subtitle)
        Spacer(minLength: 0)
      }

    default:
      VStack(alignment: .leading, spacing: 6) {
        BigValue(text: panel.value)
        PanelText(title: panel.title, subtitle: panel.subtitle)
        Spacer(minLength: 0)
      }
    }
  }
}

struct SupplyWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "campmesser.supplies", provider: Provider()) { entry in
      SupplyWidgetView(entry: entry)
        .containerBackground(.fill.tertiary, for: .widget)
        .widgetURL(widgetURL(entry.payload.supplies.url))
    }
    .configurationDisplayName("Vorrat & Pflege")
    .description("Was in der Kühlbox bald abläuft und welche Pflege fällig ist.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
  }
}

// MARK: - Bündel

@main
struct CampMesserWidgets: WidgetBundle {
  var body: some Widget {
    TripWidget()
    SupplyWidget()
  }
}
