import {
  boolean,
  date,
  double,
  float,
  index,
  int,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  /** Passwort-Hash (scrypt, Format: salt:hash) für die eigenständige E-Mail-Anmeldung */
  passwordHash: varchar("passwordHash", { length: 256 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  /** Zeitpunkt der E-Mail-Bestätigung; null = Adresse (noch) unbestätigt */
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /**
   * Zufalls-Schlüssel für das Kalender-Abo (#377). null = noch nie
   * abonniert; er entsteht erst, wenn jemand den Link holt.
   *
   * DER SCHLÜSSEL IST DAS PASSWORT. Kalender-Programme können sich nicht
   * anmelden – sie holen eine Adresse, sonst nichts. Deshalb steht er
   * unique in einer eigenen Spalte und lässt sich im Profil neu
   * erzeugen: Damit ist ein einmal weitergegebener Link sofort wertlos.
   */
  calendarToken: varchar("calendarToken", { length: 32 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Gespeicherte Zeltplatz-Favoriten für Wetter- und Sonnenstand-Abruf im Voraus */
export const campSpots = mysqlTable(
  "campSpots",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    latitude: double("latitude").notNull(),
    longitude: double("longitude").notNull(),
    note: text("note"),
    /** Platz-Eigenschaften als JSON-Objekt {schluessel: wert} – Katalog in shared/spotAttributes.ts */
    attributesJson: text("attributesJson"),
    /** Telefonnummer der Rezeption – im Dossier als tel:-Link. */
    receptionPhone: varchar("receptionPhone", { length: 40 }),
    /** Check-in-/Check-out-Zeiten als Freitext (z. B. «Check-in 14–18 Uhr»). */
    checkinInfo: varchar("checkinInfo", { length: 120 }),
    /** Parzellen-/Stellplatz-Nummer. */
    parcelNumber: varchar("parcelNumber", { length: 40 }),
    /**
     * Preis pro Nacht in RAPPEN (Muster Reisekasse/Inventar – Ganzzahl statt
     * Kommazahl, damit keine Rundungsfehler entstehen); null = nicht erfasst.
     */
    pricePerNightRappen: int("pricePerNightRappen"),
    /**
     * Kurtaxe und Nebenkosten pro Nacht in RAPPEN (Strom, Duschmarken …);
     * null = nicht erfasst. Wird für den Vergleich zum Preis addiert.
     */
    extraPerNightRappen: int("extraPerNightRappen"),
    /**
     * Weitere Tarife als JSON (#369): eine Liste benannter Tarife mit je
     * eigenen Zeilen – «Nebensaison» mit Erwachsen/Kind, «Hauptsaison» mit
     * eigenen Sätzen. null = keine erfasst.
     *
     * WARUM JSON UND KEINE TABELLE: Die Tarife gehören ausschliesslich zu
     * ihrem Platz, werden nur als Ganzes gelesen und nie einzeln gesucht
     * oder verknüpft – dasselbe Muster wie `spotAttributesJson` daneben.
     * Zwei Tabellen mit Fremdschlüsseln würden hier nichts kaufen.
     *
     * Die Felder `pricePerNightRappen`/`extraPerNightRappen` bleiben, was
     * sie sind: der EINE Preis, mit dem die Statistik die Plätze
     * vergleicht. Ein Vergleich über sechs Tarife wäre keiner mehr.
     */
    tariffsJson: text("tariffsJson"),
    /**
     * Höhe über Meer in Metern; null = noch nicht ermittelt. Der Client holt
     * den Wert einmalig bei der Open-Meteo-Elevation-API und speichert ihn.
     */
    elevationM: int("elevationM"),
    /**
     * Eigene Bewertung nach Kriterien (#278), je 1–5 Sterne; null = nicht
     * bewertet. Bewusst vier Spalten statt einer Tabelle: Es gibt genau
     * eine Bewertung pro Platz (Plätze gehören ohnehin einem Konto), und
     * ein leeres Kriterium ist ein gültiger Zustand, kein fehlender Satz.
     */
    ratingSanitary: tinyint("ratingSanitary"),
    ratingQuiet: tinyint("ratingQuiet"),
    ratingShade: tinyint("ratingShade"),
    ratingKids: tinyint("ratingKids"),
    /**
     * Stellplatz-Skizze als JSON (#382): Platzmass und Rechtecke für Zelt,
     * Vordach, Auto, Tisch, Strom-Säule und Baum – Format in
     * shared/pitchSketch.ts. null = keine Skizze erfasst.
     *
     * BEWUSST AM PLATZ, nicht an der Reise: Die Parzellennummer und das
     * WLAN-Passwort wechseln bei jedem Besuch und stehen deshalb an der
     * Reise (#252). Die Skizze ist das Gegenteil – sie nützt genau dann,
     * wenn man WIEDERKOMMT, und wer sie an der Reise vom vorletzten
     * Sommer suchen müsste, findet sie nie.
     *
     * JSON und keine Tabelle aus demselben Grund wie bei tariffsJson
     * daneben: Die Rechtecke gehören ausschliesslich zu ihrem Platz,
     * werden nur als Ganzes gelesen und nie einzeln gesucht.
     */
    pitchSketchJson: text("pitchSketchJson"),
    /**
     * «Beim nächsten Mal»-Merker als JSON-Liste kurzer Zeilen (#396):
     * «Kabeltrommel 25 m», «Parzelle 12 meiden». Format und Begründung in
     * shared/nextTime.ts; JSON statt Tabelle aus demselben Grund wie bei
     * tariffsJson. null = kein Zettel.
     */
    nextTimeJson: text("nextTimeJson"),
    /** Öffentlicher Teil-Token: Wer den Link kennt, sieht das Platz-Dossier (nur lesend). */
    shareToken: varchar("shareToken", { length: 32 }),
    /** Ablauf des Teil-Links (UTC); null = unbegrenzt gültig. */
    shareExpiresAt: timestamp("shareExpiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("campSpots_userId").on(table.userId),
    index("campSpots_shareToken").on(table.shareToken),
  ]
);

export type CampSpot = typeof campSpots.$inferSelect;
export type InsertCampSpot = typeof campSpots.$inferInsert;

/** Packlisten: eine Liste pro Nutzer*in, basierend auf einem Szenario oder leer gestartet. */
export const packLists = mysqlTable(
  "packLists",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    scenario: varchar("scenario", { length: 60 }).notNull().default("custom"),
    /** Gewichts-Budget in Gramm – null = kein Budget gesetzt. */
    weightBudgetGrams: int("weightBudgetGrams"),
    /**
     * Personen der Liste als JSON-Array von Namen (max. 10, je ≤ 80 Zeichen);
     * null = keine Personen-Bereiche. Parser in shared/packPersons.ts.
     */
    personsJson: text("personsJson"),
    /** Öffentlicher Teil-Token: Wer den Link kennt, kann die Liste sehen und abhaken. */
    shareToken: varchar("shareToken", { length: 32 }),
    /** Ablauf des Teil-Links (UTC); null = unbegrenzt gültig. */
    shareExpiresAt: timestamp("shareExpiresAt"),
    /**
     * Archiviert seit (#194); null = aktive Liste. Archivierte Listen bleiben
     * mit allen Einträgen erhalten, erscheinen in der Übersicht aber nur im
     * eingeklappten Archiv und tauchen in Auswahl-Listen nicht mehr auf.
     */
    archivedAt: timestamp("archivedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("packLists_userId").on(table.userId),
    index("packLists_shareToken").on(table.shareToken),
  ]
);

export type PackList = typeof packLists.$inferSelect;
export type InsertPackList = typeof packLists.$inferInsert;

/** Einzelne Einträge einer Packliste, abhakbar. */
export const packItems = mysqlTable(
  "packItems",
  {
    id: int("id").autoincrement().primaryKey(),
    listId: int("listId").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    category: varchar("category", { length: 80 })
      .notNull()
      .default("Allgemein"),
    quantity: int("quantity").notNull().default(1),
    checked: boolean("checked").notNull().default(false),
    /** Wer packt das? Freier Name einer Person – null = niemandem zugeordnet. */
    assignee: varchar("assignee", { length: 80 }),
    sortOrder: int("sortOrder").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    /**
     * Wer den Eintrag zuletzt angelegt/abgehakt/geändert hat – nur für die
     * «Zuletzt geändert von»-Anzeige bei gemeinsamen Reisen. Massen-Aktionen
     * (uncheckAll, reorder) lassen das Feld bewusst unverändert.
     */
    updatedByUserId: int("updatedByUserId"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("packItems_listId").on(table.listId)]
);

export type PackItem = typeof packItems.$inferSelect;
export type InsertPackItem = typeof packItems.$inferInsert;

/**
 * Eigene Packlisten-Vorlagen: eine gespeicherte Liste als wiederverwendbare
 * Vorlage. Die Einträge liegen als JSON-Array von {name, category, quantity}
 * im Textfeld (gleiches Muster wie customRecipes.ingredientsJson).
 */
export const packTemplatesCustom = mysqlTable(
  "packTemplatesCustom",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    /** Einträge als JSON-Array von {name, category, quantity} */
    itemsJson: text("itemsJson").notNull(),
    /** Öffentlicher Teil-Token: Wer den Link kennt, kann die Vorlage sehen und übernehmen. */
    shareToken: varchar("shareToken", { length: 64 }).unique(),
    /** Ablauf des Teil-Links (UTC); null = unbegrenzt gültig. */
    shareExpiresAt: timestamp("shareExpiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("packTemplatesCustom_userId").on(table.userId)]
);

export type PackTemplateCustom = typeof packTemplatesCustom.$inferSelect;
export type InsertPackTemplateCustom = typeof packTemplatesCustom.$inferInsert;

/** Inventar: vorhandenes Campingmaterial mit Gewicht (g) und Volumen (l). */
export const inventoryItems = mysqlTable(
  "inventoryItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    category: varchar("category", { length: 80 })
      .notNull()
      .default("Allgemein"),
    weightGrams: int("weightGrams").notNull().default(0),
    volumeLiters: float("volumeLiters").notNull().default(0),
    quantity: int("quantity").notNull().default(1),
    notes: text("notes"),
    /** Dateiname des Fotos unter uploads/inventory/ (genau EIN Foto pro Gegenstand). */
    imageFileName: varchar("imageFileName", { length: 64 }),
    /** Kaufpreis in Rappen (Ganzzahl, Muster weightGrams); null = nicht erfasst. */
    priceRappen: int("priceRappen"),
    /** Kaufdatum (ISO YYYY-MM-DD); null = nicht erfasst. */
    purchaseDate: date("purchaseDate", { mode: "string" }),
    /** Garantiedauer in Monaten ab Kaufdatum; null = nicht erfasst. */
    warrantyMonths: int("warrantyMonths"),
    /** An wen der Gegenstand verliehen ist; null = nicht verliehen. */
    lentTo: varchar("lentTo", { length: 80 }),
    /** Seit wann verliehen (ISO YYYY-MM-DD); null = nicht verliehen. */
    lentAt: date("lentAt", { mode: "string" }),
    /** Dateiname des Belegs unter uploads/receipts/ (genau EIN Beleg pro Gegenstand). */
    receiptFileName: varchar("receiptFileName", { length: 64 }),
    /**
     * In welcher Kiste der Gegenstand liegt (storageBoxes.id, #276);
     * null = nicht eingeräumt. Bewusst EINE Kiste je Gegenstand: Ein Topf
     * liegt in genau einer Box, und «teilweise in zwei Kisten» hilft beim
     * Suchen niemandem.
     */
    boxId: int("boxId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("inventoryItems_userId").on(table.userId),
    uniqueIndex("inventoryItems_receiptFileName").on(table.receiptFileName),
  ]
);

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

/**
 * Transportkisten und Taschen (#276): «In welcher Box ist der Gaskocher?»
 *
 * Jede Kiste bekommt eine kurze, sprechende Kennung (`code`, z. B. «K3»),
 * die auf dem gedruckten Etikett gross steht und im QR-Code steckt. Der
 * QR-Code führt auf /kisten/<code> – gescannt mit der Handy-Kamera landet
 * man also direkt auf dem Inhalt dieser Kiste, ohne Suchen in der App.
 *
 * Der Code ist je Konto eindeutig, nicht global: Zwei Haushalte dürfen
 * beide eine «K1» haben. Deshalb hängt das Nachschlagen am angemeldeten
 * Konto und nicht an einem Zufalls-Token – ein Etikett auf einer Kiste
 * ist kein Geheimnis, aber der Inhalt gehört trotzdem nur dir.
 */
/**
 * Kleiner Schlüssel-Wert-Speicher für Zustände des Servers selbst – nicht
 * für Nutzerdaten.
 *
 * Erster und bislang einziger Zweck (#314): der Zeitpunkt des letzten
 * erfolgreichen Cron-Laufs. Am Cronjob hängen Unwetter-Warnungen,
 * MHD-Erinnerungen, Trip-Countdown, Papierkorb-Aufräumen und die
 * Erneuerung des MeteoAlarm-Abos. Fiel er aus – gelöscht, falsches
 * Geheimnis, Hoster verschluckt sich –, hörte das alles LAUTLOS auf, und
 * gemerkt hätte man es erst, wenn eine erwartete Sturmwarnung ausbleibt.
 * Ein Zeitstempel genügt, um daraus einen sichtbaren Zustand zu machen.
 */
export const systemState = mysqlTable("systemState", {
  /** Schlüssel, z. B. "lastPushCheck". */
  stateKey: varchar("stateKey", { length: 64 }).primaryKey(),
  value: varchar("value", { length: 255 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemState = typeof systemState.$inferSelect;

export const storageBoxes = mysqlTable(
  "storageBoxes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Kurze Kennung auf dem Etikett, je Konto eindeutig (z. B. "K3"). */
    code: varchar("code", { length: 12 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    /** Wo die Kiste zuhause steht – Keller, Estrich, Garage … */
    location: varchar("location", { length: 80 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("storageBoxes_userId").on(table.userId),
    uniqueIndex("storageBoxes_userId_code").on(table.userId, table.code),
  ]
);

export type StorageBox = typeof storageBoxes.$inferSelect;
export type InsertStorageBox = typeof storageBoxes.$inferInsert;

/** Energie-Verbraucher für den Energie-Budget-Rechner. */
export const powerConsumers = mysqlTable(
  "powerConsumers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    watts: float("watts").notNull().default(0),
    hoursPerDay: float("hoursPerDay").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    /** 230-V-Gerät am Wechselrichter – kostet den Umwandlungsverlust (#405). */
    inverter: boolean("inverter").notNull().default(false),
    /** Kühlgerät: Laufzeit kommt aus der Wetterprognose (#405). */
    cooling: boolean("cooling").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("powerConsumers_userId").on(table.userId)]
);

export type PowerConsumer = typeof powerConsumers.$inferSelect;
export type InsertPowerConsumer = typeof powerConsumers.$inferInsert;

/**
 * Lebensmittel-Vorrat für Rezeptvorschläge und MHD-Erinnerungen.
 *
 * Seit #233 liegen BEIDE Lager in dieser Tabelle: `storage` unterscheidet die
 * gekühlten Vorräte («cooled», Kühlbox) vom Trockenvorrat-Schrank («dry»,
 * Konserven, Teigwaren, Kaffee, Gewürze). Eine zweite Tabelle hätte
 * Einkaufsliste, MHD-Push, Resteverwertung und Vorlagen verdoppelt –
 * bestehende Einträge sind mit dem Spalten-Standard «cooled» gekühlt.
 */
export const foodItems = mysqlTable(
  "foodItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    quantity: varchar("quantity", { length: 80 }),
    /** Lagerort: cooled (Kühlbox) | dry (Trockenvorrat) – Schlüssel aus shared/food.ts */
    storage: varchar("storage", { length: 10 }).notNull().default("cooled"),
    /** Einheiten-Schlüssel zur Menge (piece|pack|g|kg|ml|l|can|bottle); null = Freitext-Menge */
    unit: varchar("unit", { length: 16 }),
    /** Vorrats-Kategorie (Schlüssel aus shared/food.ts); null = ohne Kategorie */
    category: varchar("category", { length: 24 }),
    /** Mindesthaltbarkeitsdatum (optional) für «Verbrauche zuerst»-Hinweise */
    expiryDate: date("expiryDate", { mode: "string" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("foodItems_userId").on(table.userId)]
);

export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = typeof foodItems.$inferInsert;

/**
 * Kühlbox-Vorlagen («Standardfüllung»): eine gespeicherte Füllung als
 * wiederverwendbare Vorlage. Die Einträge liegen als JSON-Array von
 * {name, expiryDays?} im Textfeld (gleiches Muster wie
 * packTemplatesCustom.itemsJson) – expiryDays ist die Restlaufzeit in Tagen
 * und wird beim Laden in ein konkretes MHD (heute + X Tage) umgerechnet.
 */
export const foodTemplates = mysqlTable(
  "foodTemplates",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    /** Einträge als JSON-Array von {name, expiryDays?} */
    itemsJson: text("itemsJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("foodTemplates_userId").on(table.userId)]
);

export type FoodTemplate = typeof foodTemplates.$inferSelect;
export type InsertFoodTemplate = typeof foodTemplates.$inferInsert;

/** Reise-Tagebuch: ein Eintrag pro Camping-Aufenthalt, optional mit Zeltplatz-Favorit verknüpft. */
export const tripLogs = mysqlTable(
  "tripLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Verknüpfter Zeltplatz-Favorit; null bei frei eingetragenem Ort */
    spotId: int("spotId"),
    /** Freitext-Ort, falls kein Favorit verknüpft ist */
    location: varchar("location", { length: 140 }),
    title: varchar("title", { length: 140 }),
    notes: text("notes"),
    /** Anreise (erster Abend) */
    /** Verknüpfte Packliste (optional) – für den Pack-Fortschritt geplanter Trips */
    packListId: int("packListId"),
    /**
     * Buchungsbestätigung als Foto oder PDF (#279); Datei liegt unter
     * uploads/reservations/<fileName>. null = keine hinterlegt.
     */
    reservationFileName: varchar("reservationFileName", { length: 64 }),
    startDate: date("startDate", { mode: "string" }).notNull(),
    /** Abreise – Nächte ergeben sich aus der Differenz der beiden Daten */
    endDate: date("endDate", { mode: "string" }).notNull(),
    /** Sterne-Bewertung 1–5; null = (noch) nicht bewertet */
    rating: tinyint("rating"),
    /** Geplante Ankunftszeit «HH:MM»; null = keine Angabe */
    arrivalTime: varchar("arrivalTime", { length: 5 }),
    /** Geplante Abreisezeit «HH:MM»; null = keine Angabe */
    departureTime: varchar("departureTime", { length: 5 }),
    /**
     * Wetterarchiv des Aufenthalts als JSON {tMax, tMin, rainDays, totalPrecip}
     * (shared/tripWeather.ts) – wird nach der Heimkehr einmalig aus dem
     * Open-Meteo-Archiv befüllt; null = (noch) kein Archiv.
     */
    weatherJson: text("weatherJson"),
    /** Titelbild des Eintrags (tripPhotos.id); null = kein Titelbild */
    coverPhotoId: int("coverPhotoId"),
    /**
     * Stellplatz-Details des Aufenthalts (#252): Was am Platz nur für DIESEN
     * Aufenthalt gilt – die Parzellennummer, das WLAN-Passwort, wo der
     * Stromkasten steht. Bewusst an der Reise und nicht am Zeltplatz-Favoriten:
     * die Nummer wechselt bei jedem Besuch, das Passwort ändert die Rezeption.
     */
    /**
     * Reise-Budget in Rappen (#256); null = kein Budget gesetzt. Bewusst an
     * der Reise und nicht als globale Einstellung: Ein Wochenende und drei
     * Wochen Frankreich haben nichts miteinander zu tun.
     */
    budgetRappen: int("budgetRappen"),
    pitchNumber: varchar("pitchNumber", { length: 40 }),
    wifiName: varchar("wifiName", { length: 80 }),
    wifiPassword: varchar("wifiPassword", { length: 80 }),
    pitchNotes: text("pitchNotes"),
    /**
     * Öffentlicher Teil-Token des Reise-Hubs: Wer den Link kennt, sieht die
     * Reise samt Platz-Basisdaten, Menüplan und Packliste (ohne Fotos).
     * Unabhängig von den Reise-Mitgliedern (tripMembers); null = nicht geteilt.
     */
    shareToken: varchar("shareToken", { length: 64 }).unique(),
    /** Ablauf des Teil-Links (UTC); null = unbegrenzt gültig. */
    shareExpiresAt: timestamp("shareExpiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("tripLogs_userId").on(table.userId)]
);

export type TripLog = typeof tripLogs.$inferSelect;
export type InsertTripLog = typeof tripLogs.$inferInsert;

/**
 * Mitreisende einer Reise: eingeladene Konten dürfen den Eintrag samt
 * Fotos, Menüplan und verknüpfter Packliste sehen und bearbeiten.
 * Die Besitzerin/der Besitzer bleibt implizit tripLogs.userId (ohne Zeile
 * hier); Zeilen tragen die Rolle "member". Löschen/Einladen bleibt Owner-only.
 */
export const tripMembers = mysqlTable(
  "tripMembers",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Zugehöriger Tagebuch-/Trip-Eintrag (tripLogs.id) */
    tripId: int("tripId").notNull(),
    /** Eingeladenes Konto (users.id) */
    userId: int("userId").notNull(),
    role: varchar("role", { length: 20 }).notNull().default("member"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("tripMembers_trip_user").on(table.tripId, table.userId),
    index("tripMembers_tripId").on(table.tripId),
    index("tripMembers_userId").on(table.userId),
  ]
);

export type TripMember = typeof tripMembers.$inferSelect;
export type InsertTripMember = typeof tripMembers.$inferInsert;

/**
 * Gästebuch pro Reise (#254): Grüsse zur Reise – von Mitreisenden aus der
 * App und von Bekannten über den Teil-Link. Der einzige Ort, an dem ohne
 * Konto geschrieben werden darf; deshalb steht die Herkunft in `userId`
 * (null = Gast) und nicht bloss im selbst gewählten Namen.
 */
export const tripGuestbook = mysqlTable(
  "tripGuestbook",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Zugehörige Reise (tripLogs.id) */
    tripId: int("tripId").notNull(),
    /** Konto der Verfasserin/des Verfassers; null = Gast über den Teil-Link */
    userId: int("userId"),
    /** Selbst gewählter Anzeigename – beweist nichts, siehe userId */
    authorName: varchar("authorName", { length: 60 }).notNull(),
    message: varchar("message", { length: 500 }).notNull(),
    /**
     * Angehängtes Foto aus der Reise-Galerie (tripPhotos.id); null = ohne.
     * Bewusst eine Auswahl aus BESTEHENDEN Fotos statt eines eigenen
     * Uploads – ein anonymer Upload-Pfad wäre eine offene Tür.
     */
    photoId: int("photoId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("tripGuestbook_tripId").on(table.tripId)]
);

export type TripGuestbookEntry = typeof tripGuestbook.$inferSelect;
export type InsertTripGuestbookEntry = typeof tripGuestbook.$inferInsert;

/**
 * Termin-Finder (#253): Datums-Vorschläge zu einer Reise, über die die
 * Mitreisenden abstimmen. Bewusst an der bestehenden Reise und nicht als
 * eigenes Gebilde: Wer abstimmen darf, steht damit schon fest
 * (tripMembers), und der gewählte Termin wandert per Knopfdruck in
 * startDate/endDate derselben Reise.
 */
export const tripDateOptions = mysqlTable(
  "tripDateOptions",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Zugehörige Reise (tripLogs.id) */
    tripId: int("tripId").notNull(),
    startDate: date("startDate", { mode: "string" }).notNull(),
    endDate: date("endDate", { mode: "string" }).notNull(),
    /** Freitext zum Vorschlag, z. B. «Brückentag, Zelt ist frei» */
    note: varchar("note", { length: 140 }),
    /** Wer den Vorschlag eingebracht hat (users.id) */
    createdByUserId: int("createdByUserId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("tripDateOptions_tripId").on(table.tripId)]
);

export type TripDateOption = typeof tripDateOptions.$inferSelect;
export type InsertTripDateOption = typeof tripDateOptions.$inferInsert;

/**
 * Stimmen zum Termin-Finder: eine Zeile je Vorschlag und Konto
 * («yes» | «maybe» | «no»). Umstimmen ersetzt die Zeile, statt eine
 * zweite anzulegen – der unique-Index erzwingt das.
 */
export const tripDateVotes = mysqlTable(
  "tripDateVotes",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Zugehöriger Vorschlag (tripDateOptions.id) */
    optionId: int("optionId").notNull(),
    /** Abstimmendes Konto (users.id) */
    userId: int("userId").notNull(),
    vote: varchar("vote", { length: 10 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("tripDateVotes_option_user").on(table.optionId, table.userId),
    index("tripDateVotes_optionId").on(table.optionId),
    index("tripDateVotes_userId").on(table.userId),
  ]
);

export type TripDateVote = typeof tripDateVotes.$inferSelect;
export type InsertTripDateVote = typeof tripDateVotes.$inferInsert;

/**
 * Einladungs-Links für Reisen: EIN aktiver Link pro Trip (unique tripId) –
 * erneuern ersetzt den Token, widerrufen löscht die Zeile.
 */
export const tripInvites = mysqlTable(
  "tripInvites",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Zugehöriger Tagebuch-/Trip-Eintrag (tripLogs.id), genau ein Link pro Trip */
    tripId: int("tripId").notNull(),
    inviteToken: varchar("inviteToken", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("tripInvites_tripId").on(table.tripId),
    uniqueIndex("tripInvites_token").on(table.inviteToken),
  ]
);

export type TripInvite = typeof tripInvites.$inferSelect;
export type InsertTripInvite = typeof tripInvites.$inferInsert;

/**
 * Fotos zum Reise-Tagebuch: die Datei liegt unter uploads/trips/<fileName>
 * auf dem Webspace (server/photoStorage.ts), hier nur die Metadaten.
 */
export const tripPhotos = mysqlTable(
  "tripPhotos",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Zugehöriger Tagebuch-/Trip-Eintrag (tripLogs.id) */
    tripId: int("tripId").notNull(),
    /** Serverseitig generierter Dateiname (nanoid + .jpg/.png/.webp) */
    fileName: varchar("fileName", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("tripPhotos_userId").on(table.userId),
    index("tripPhotos_tripId").on(table.tripId),
    uniqueIndex("tripPhotos_fileName").on(table.fileName),
  ]
);

export type TripPhoto = typeof tripPhotos.$inferSelect;
export type InsertTripPhoto = typeof tripPhotos.$inferInsert;

/**
 * Fotos zu Zeltplatz-Favoriten: die Datei liegt unter uploads/spots/<fileName>
 * auf dem Webspace (server/photoStorage.ts), hier nur die Metadaten.
 * Bewusst privat – die geteilte Ansicht (/platz/:token) zeigt keine Fotos.
 */
export const spotPhotos = mysqlTable(
  "spotPhotos",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Zugehöriger Zeltplatz-Favorit (campSpots.id) */
    spotId: int("spotId").notNull(),
    /** Serverseitig generierter Dateiname (nanoid + .jpg/.png/.webp) */
    fileName: varchar("fileName", { length: 64 }).notNull(),
    /**
     * «foto» = Galerie-Bild (#82), «plan» = der Campingplatz-Plan (#401).
     * Vom Plan gibt es höchstens EINEN pro Platz – ein neuer ersetzt den
     * alten. Eine eigene Tabelle für ein einzelnes Bild wäre Overhead;
     * Ablage und Aufräumen (Konto-Löschung, Papierkorb) laufen so über
     * dieselben Wege wie die Galerie.
     */
    kind: varchar("kind", { length: 12 }).notNull().default("foto"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("spotPhotos_userId").on(table.userId),
    index("spotPhotos_spotId").on(table.spotId),
    uniqueIndex("spotPhotos_fileName").on(table.fileName),
  ]
);

export type SpotPhoto = typeof spotPhotos.$inferSelect;
export type InsertSpotPhoto = typeof spotPhotos.$inferInsert;

/**
 * Heim-Standort: genau ein Ort pro Nutzer*in (userId unique) für
 * Unwetter-Warnungen und Sternschnuppen-Tipps auch ohne gespeicherten
 * Zeltplatz. Bewusst ohne Teilen/Fotos – schlankes Muster nach campSpots.
 */
export const homeLocations = mysqlTable(
  "homeLocations",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    latitude: double("latitude").notNull(),
    longitude: double("longitude").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("homeLocations_userId").on(table.userId)]
);

export type HomeLocation = typeof homeLocations.$inferSelect;
export type InsertHomeLocation = typeof homeLocations.$inferInsert;

/** Web-Push-Abos für Unwetter-Warnungen an gespeicherten Zeltplätzen. */
export const pushSubscriptions = mysqlTable(
  "pushSubscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Push-Endpoint des Browsers (eindeutig pro Gerät/Browser) */
    endpoint: varchar("endpoint", { length: 500 }).notNull(),
    p256dh: varchar("p256dh", { length: 255 }).notNull(),
    auth: varchar("auth", { length: 255 }).notNull(),
    /** Mitteilungs-Einstellung dieses Geräts: Unwetter-Warnungen an gespeicherten Plätzen */
    wantsWeather: boolean("wantsWeather").notNull().default(true),
    /** Mitteilungs-Einstellung dieses Geräts: MHD-Erinnerungen der Kühlbox */
    wantsFood: boolean("wantsFood").notNull().default(true),
    /** Mitteilungs-Einstellung dieses Geräts: Trip-Countdown vor der Anreise */
    wantsTrips: boolean("wantsTrips").notNull().default(true),
    /** Mitteilungs-Einstellung dieses Geräts: Sternschnuppen-Tipp bei klarer Nacht */
    wantsAstro: boolean("wantsAstro").notNull().default(true),
    /** Mitteilungs-Einstellung dieses Geräts: Erinnerung an fällige Ausrüstungs-Pflege */
    wantsGear: boolean("wantsGear").notNull().default(true),
    /** Mitteilungs-Einstellung dieses Geräts: Sonnencreme & Trinken an heissen Tagen (#260/#261) */
    wantsHeat: boolean("wantsHeat").notNull().default(true),
    /**
     * Sprache dieses Geräts für die Mitteilungs-Texte (#313). Pro ABO und
     * nicht pro Konto: Wer das Handy auf Französisch und das Tablet auf
     * Deutsch nutzt, bekommt jede Meldung passend zum Gerät. Alte Abos
     * bleiben auf «de», bis sich das Gerät neu anmeldet.
     */
    lang: varchar("lang", { length: 2 }).notNull().default("de"),
    /** Eigene Wind-Schwelle für den Unwetter-Push in km/h (null = Standard 90) */
    windThresholdKmh: int("windThresholdKmh"),
    /** Eigene Regen-Schwelle für den Unwetter-Push in mm/h (null = Standard 15) */
    rainThresholdMm: int("rainThresholdMm"),
    /** Schlüssel der zuletzt gemeldeten Warnlage (verhindert Doppel-Pushes) */
    lastAlertKey: varchar("lastAlertKey", { length: 255 }),
    /** Schlüssel der letzten MHD-Erinnerung («food:YYYY-MM-DD»): max. 1 Kühlbox-Push pro Tag */
    lastFoodKey: varchar("lastFoodKey", { length: 64 }),
    /** Schlüssel des zuletzt gemeldeten Trip-Countdowns («trip:<tripId>»): max. 1 Erinnerung pro Trip */
    lastTripKey: varchar("lastTripKey", { length: 64 }),
    /** Schlüssel der letzten Trocknungs-Erinnerung («dry:<tripId>»): max. 1 Erinnerung pro Heimkehr */
    lastDryKey: varchar("lastDryKey", { length: 64 }),
    /** Schlüssel des letzten Sternschnuppen-Tipps («astro:YYYY-MM-DD»): max. 1 pro Nacht */
    lastAstroKey: varchar("lastAstroKey", { length: 64 }),
    /** Schlüssel der letzten Pflege-Erinnerung («gear:YYYY-MM»): max. 1 pro Monat */
    lastGearKey: varchar("lastGearKey", { length: 64 }),
    /** Schlüssel des letzten Vorabend-Checks («evepack:<tripId>»): max. 1 pro Reise */
    lastEvePackKey: varchar("lastEvePackKey", { length: 64 }),
    /** Schlüssel der letzten Hitze-Erinnerung («heat:YYYY-MM-DD»): max. 1 pro Tag */
    lastHeatKey: varchar("lastHeatKey", { length: 64 }),
    lastNotifiedAt: timestamp("lastNotifiedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("pushSubscriptions_userId").on(table.userId),
    uniqueIndex("pushSubscriptions_endpoint").on(table.endpoint),
  ]
);

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/** Eigene Campingrezepte aus dem Editor im Rezeptbuch. */
export const customRecipes = mysqlTable(
  "customRecipes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    /** Zubereitungsart: Gaskocher, Offenes Feuer oder Beides */
    method: varchar("method", { length: 40 }).notNull().default("Gaskocher"),
    timeMinutes: int("timeMinutes").notNull().default(30),
    servings: int("servings").notNull().default(4),
    difficulty: varchar("difficulty", { length: 20 })
      .notNull()
      .default("einfach"),
    onePot: boolean("onePot").notNull().default(false),
    kidFriendly: boolean("kidFriendly").notNull().default(false),
    /** Zutaten als JSON-Array von Strings */
    ingredientsJson: text("ingredientsJson").notNull(),
    /** Zubereitungsschritte als JSON-Array von Strings */
    stepsJson: text("stepsJson").notNull(),
    tip: text("tip"),
    /** Dateiname des Rezept-Fotos unter uploads/recipes/ (server/photoStorage.ts) */
    imageFileName: varchar("imageFileName", { length: 64 }),
    /**
     * Öffentlicher Teil-Token: Wer den Link kennt, sieht das Rezept und kann
     * es übernehmen. Das private Rezept-Foto wird bewusst NICHT mitgeteilt.
     */
    shareToken: varchar("shareToken", { length: 64 }).unique(),
    /** Ablauf des Teil-Links (UTC); null = unbegrenzt gültig. */
    shareExpiresAt: timestamp("shareExpiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("customRecipes_userId").on(table.userId)]
);

export type CustomRecipe = typeof customRecipes.$inferSelect;
export type InsertCustomRecipe = typeof customRecipes.$inferInsert;

/** Eigene Schnitzeljagden aus dem Editor im Familien-Modus. */
export const customHunts = mysqlTable(
  "customHunts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 140 }).notNull(),
    ageHint: varchar("ageHint", { length: 80 }),
    durationMinutes: int("durationMinutes").notNull().default(30),
    /** Rahmengeschichte / Mission */
    intro: text("intro").notNull(),
    /** Vorbereitung für die Erwachsenen (optional) */
    preparation: text("preparation"),
    /** Stationen als JSON-Array (Titel, Geschichte, Aufgabe, Hinweis, Buchstabe) */
    stationsJson: text("stationsJson").notNull(),
    /** Lösungswort – automatisch aus den Stations-Buchstaben gebildet */
    solutionWord: varchar("solutionWord", { length: 40 }),
    /** Abschluss-Erlebnis (Schatz/Belohnung) */
    finale: text("finale").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("customHunts_userId").on(table.userId)]
);

export type CustomHunt = typeof customHunts.$inferSelect;
export type InsertCustomHunt = typeof customHunts.$inferInsert;

/** Eigene Quizze aus dem Editor im Familien-Modus. */
export const customQuizzes = mysqlTable(
  "customQuizzes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 140 }).notNull(),
    /** Fragen als JSON-Array ({question, options[], correctIndex, explanation?}) */
    questionsJson: text("questionsJson").notNull(),
    /** Öffentlicher Teil-Token: Wer den Link kennt, kann das Quiz sehen und übernehmen. */
    shareToken: varchar("shareToken", { length: 64 }).unique(),
    /** Ablauf des Teil-Links (UTC); null = unbegrenzt gültig. */
    shareExpiresAt: timestamp("shareExpiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("customQuizzes_userId").on(table.userId)]
);

export type CustomQuiz = typeof customQuizzes.$inferSelect;
export type InsertCustomQuiz = typeof customQuizzes.$inferInsert;

/**
 * Menüplan pro Trip: ein Eintrag pro Tag und Mahlzeit eines geplanten
 * Aufenthalts (tripId → tripLogs.id). Entweder ein statisches Rezept
 * (recipeId), ein eigenes Rezept (customRecipeId) oder Freitext.
 */
export const menuEntries = mysqlTable(
  "menuEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Verknüpfter Tagebuch-/Trip-Eintrag (tripLogs.id) */
    tripId: int("tripId").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    meal: mysqlEnum("meal", ["breakfast", "lunch", "dinner", "snack"])
      .notNull()
      .default("dinner"),
    /** Statische Rezept-Id aus dem Rezeptbuch (client/src/data/recipes.ts) */
    recipeId: varchar("recipeId", { length: 80 }),
    /** Eigenes Rezept (customRecipes.id) */
    customRecipeId: int("customRecipeId"),
    /** Freitext, wenn kein Rezept verknüpft ist */
    freeText: varchar("freeText", { length: 200 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    /**
     * Wer den Slot zuletzt gesetzt hat – nur für die «von <Name>»-Anzeige
     * bei gemeinsamen Reisen (null bei Alt-Einträgen).
     */
    updatedByUserId: int("updatedByUserId"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("menuEntries_userId").on(table.userId),
    index("menuEntries_tripId").on(table.tripId),
    uniqueIndex("menuEntries_trip_day_meal").on(
      table.tripId,
      table.day,
      table.meal
    ),
  ]
);

export type MenuEntry = typeof menuEntries.$inferSelect;
export type InsertMenuEntry = typeof menuEntries.$inferInsert;

/**
 * Tages-Notiz im Menüplan: eine kurze Freitext-Notiz pro Reise und Tag
 * (z. B. «Pizzeria-Abend»). Genau eine Notiz pro Tag (unique tripId+day);
 * gelöscht wird durch Entfernen der Zeile. Kein userId – die Notiz gehört
 * zur Reise (Muster tripShoppingItems), die Berechtigung prüft der Router
 * via canAccessTrip.
 */
export const menuDayNotes = mysqlTable(
  "menuDayNotes",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Verknüpfter Tagebuch-/Trip-Eintrag (tripLogs.id) */
    tripId: int("tripId").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    note: varchar("note", { length: 200 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("menuDayNotes_tripId").on(table.tripId),
    uniqueIndex("menuDayNotes_trip_day").on(table.tripId, table.day),
  ]
);

export type MenuDayNote = typeof menuDayNotes.$inferSelect;
export type InsertMenuDayNote = typeof menuDayNotes.$inferInsert;

/**
 * Tages-Journal einer Reise (#192): ein Freitext-Eintrag pro Reise und Tag
 * («Was war heute los?»). Genau ein Eintrag pro Tag (unique tripId+day);
 * gelöscht wird durch Entfernen der Zeile. Wie menuDayNotes gehört der
 * Eintrag zur REISE – die Berechtigung prüft der Router via canAccessTrip,
 * damit Mitreisende mitschreiben dürfen. createdByUserId hält fest, WER den
 * Eintrag zuletzt geschrieben hat («von <Name>» bei gemeinsamen Reisen).
 */
export const tripJournal = mysqlTable(
  "tripJournal",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Verknüpfte Reise (tripLogs.id) */
    tripId: int("tripId").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    text: varchar("text", { length: 2000 }).notNull(),
    /** Konto, das den Eintrag zuletzt geschrieben hat; null = unbekannt */
    createdByUserId: int("createdByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("tripJournal_tripId").on(table.tripId),
    uniqueIndex("tripJournal_trip_day").on(table.tripId, table.day),
  ]
);

export type TripJournalEntry = typeof tripJournal.$inferSelect;
export type InsertTripJournalEntry = typeof tripJournal.$inferInsert;

/**
 * Reisekasse (#219): eine Ausgabe pro Zeile. Wie tripJournal gehört der
 * Eintrag zur REISE – die Berechtigung prüft der Router via canAccessTrip,
 * damit Mitreisende mitschreiben dürfen. `userId` hält fest, WER erfasst hat
 * (nicht zwingend die Person, die bezahlt hat – das steht in `paidBy`).
 *
 * Der Betrag steht als Ganzzahl in RAPPEN (Muster inventoryItems.priceRappen):
 * mit Fliesskommazahlen ginge beim Aufteilen sonst ein Rappen verloren.
 * Eine Währungsspalte gibt es bewusst nicht – das Projekt rechnet durchgehend
 * in CHF (client/src/lib/money.ts).
 */
export const tripExpenses = mysqlTable(
  "tripExpenses",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Verknüpfte Reise (tripLogs.id) */
    tripId: int("tripId").notNull(),
    /** Konto, das die Ausgabe erfasst hat */
    userId: int("userId").notNull(),
    /** Betrag in Rappen (immer positiv) */
    amountRappen: int("amountRappen").notNull(),
    /** Kategorie-Schlüssel: camping | essen | sprit | freizeit | sonstiges */
    category: varchar("category", { length: 20 }).notNull(),
    /** Kurze Beschreibung («Znacht Migros»); leer erlaubt */
    description: varchar("description", { length: 160 }),
    /** Tag der Ausgabe */
    day: date("day", { mode: "string" }).notNull(),
    /** Wer bezahlt hat – freier Name, Grundlage für «wer schuldet wem» */
    paidBy: varchar("paidBy", { length: 80 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("tripExpenses_tripId").on(table.tripId),
    index("tripExpenses_userId").on(table.userId),
  ]
);

export type TripExpense = typeof tripExpenses.$inferSelect;
export type InsertTripExpense = typeof tripExpenses.$inferInsert;

/**
 * Pinnwand einer Reise (#245): kurze Zurufe an die Mitreisenden
 * («Bringe noch Holzkohle mit») und einfache Aufgaben zum Abhaken
 * («Brot holen»). Wie Journal und Reisekasse gehört ein Zettel zur REISE –
 * die Berechtigung prüft der Router via canAccessTrip, damit jedes Mitglied
 * anpinnen und abhaken darf. `userId` hält fest, WER angepinnt hat
 * (Anzeige «von <Name>»); löscht dieses Konto sich, bleibt der Zettel in
 * FREMDEN Reisen bewusst stehen – die Namensanzeige fällt dann einfach weg.
 *
 * `kind` unterscheidet Nachricht und Aufgabe (Schlüssel aus
 * shared/tripBoard.ts). Nur Aufgaben tragen `done`; `doneByUserId`/`doneAt`
 * sind gesetzt, sobald jemand abhakt, und werden beim Zurücksetzen wieder
 * geleert.
 */
export const tripBoardNotes = mysqlTable(
  "tripBoardNotes",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Zugehörige Reise (tripLogs.id) */
    tripId: int("tripId").notNull(),
    /** Konto, das den Zettel angepinnt hat (users.id) – nur für die Anzeige */
    userId: int("userId").notNull(),
    /** Art des Zettels: message | task (shared/tripBoard.ts) */
    kind: varchar("kind", { length: 16 }).notNull().default("message"),
    text: varchar("text", { length: 500 }).notNull(),
    /** Nur bei Aufgaben von Bedeutung; Nachrichten bleiben immer false */
    done: boolean("done").notNull().default(false),
    /** Konto, das abgehakt hat (users.id); null = offen */
    doneByUserId: int("doneByUserId"),
    /** Zeitpunkt des Abhakens (UTC); null = offen */
    doneAt: timestamp("doneAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("tripBoardNotes_tripId").on(table.tripId),
    index("tripBoardNotes_userId").on(table.userId),
  ]
);

export type TripBoardNote = typeof tripBoardNotes.$inferSelect;
export type InsertTripBoardNote = typeof tripBoardNotes.$inferInsert;

/**
 * Persönliche Einkaufslisten (#215): pro Konto beliebig viele benannte
 * Listen («Wocheneinkauf», «Camping»). Die Reihenfolge im Umschalter steckt
 * in position (0..n); gelöscht wird eine Liste samt ihren Einträgen.
 */
export const shoppingLists = mysqlTable(
  "shoppingLists",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    position: int("position").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("shoppingLists_userId").on(table.userId)]
);

export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingList = typeof shoppingLists.$inferInsert;

/** Einkaufsliste: abhakbare Einträge pro Nutzer*in (manuell oder aus Rezepten). */
export const shoppingItems = mysqlTable(
  "shoppingItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /**
     * Zugehörige Liste (shoppingLists.id). Nullable als Übergang für Bestände
     * aus der Zeit der EINEN Liste – beim ersten Zugriff hängt
     * ensureDefaultShoppingList() diese Einträge an die Standard-Liste.
     */
    listId: int("listId"),
    name: varchar("name", { length: 160 }).notNull(),
    checked: boolean("checked").notNull().default(false),
    position: int("position").notNull().default(0),
    /** Laden-Kategorie (Schlüssel aus shared/shopping.ts); null = ohne Kategorie */
    category: varchar("category", { length: 40 }),
    /** Freitext-Menge («2×», «500 g»); null = ohne Mengenangabe */
    quantity: varchar("quantity", { length: 40 }),
    /** Kurze Notiz zum Eintrag («Aktion», «laktosefrei»); null = keine */
    note: varchar("note", { length: 160 }),
    /**
     * Preis in RAPPEN (#234, Muster inventoryItems.priceRappen); null = kein
     * Preis erfasst. Grundlage der laufenden Summe und der Übernahme in die
     * Reisekasse.
     */
    priceRappen: int("priceRappen"),
    /**
     * Verbuchungs-Merker (#234): Id der tripExpenses-Zeile, in der dieser
     * Eintrag als Ausgabe steckt; null = noch nicht übernommen. Verbuchte
     * Einträge werden nie ein zweites Mal gezählt. Wird die Ausgabe später
     * gelöscht, bleibt der Merker bewusst stehen – der Einkauf war ja
     * einmal verbucht, und die tote Referenz stört nirgends.
     */
    bookedExpenseId: int("bookedExpenseId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("shoppingItems_userId").on(table.userId),
    index("shoppingItems_listId").on(table.listId),
  ]
);

export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type InsertShoppingItem = typeof shoppingItems.$inferInsert;

/**
 * Teil-Links der Einkaufslisten: seit #215 wird PRO LISTE geteilt, also
 * höchstens eine Teil-Zeile je (userId, listId). listId ist nullable, damit
 * Alt-Zeilen aus der Zeit der einen Liste erhalten bleiben –
 * ensureDefaultShoppingList() trägt dort die Standard-Liste nach.
 * Wer den Token kennt, kann die Liste sehen und mit abhaken.
 */
export const shoppingShares = mysqlTable(
  "shoppingShares",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Geteilte Liste (shoppingLists.id); null = Alt-Zeile vor #215 */
    listId: int("listId"),
    shareToken: varchar("shareToken", { length: 64 }).notNull(),
    /** Ablauf des Teil-Links (UTC); null = unbegrenzt gültig. */
    shareExpiresAt: timestamp("shareExpiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("shoppingShares_user_list").on(table.userId, table.listId),
    uniqueIndex("shoppingShares_shareToken").on(table.shareToken),
  ]
);

export type ShoppingShare = typeof shoppingShares.$inferSelect;
export type InsertShoppingShare = typeof shoppingShares.$inferInsert;

/**
 * Gemeinsame Einkaufsliste pro Reise: Besitzerin/Besitzer und Mitreisende
 * (tripMembers) teilen sich die Liste – die Berechtigung prüft der Router
 * über canAccessTrip, nicht über eine userId-Spalte. createdByUserId dient
 * nur der Anzeige «von <Name>»; löscht ein Mitglied sein Konto, bleiben
 * seine Einträge in fremden Reisen bewusst erhalten (tote Referenz ist ok,
 * die Anzeige fällt dann einfach weg).
 */
export const tripShoppingItems = mysqlTable(
  "tripShoppingItems",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Zugehöriger Tagebuch-/Trip-Eintrag (tripLogs.id) */
    tripId: int("tripId").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    /** Freitext-Menge («2×», «500 g»); null = ohne Mengenangabe */
    quantity: varchar("quantity", { length: 40 }),
    /** Kurze Notiz zum Eintrag («Aktion», «laktosefrei»); null = keine */
    note: varchar("note", { length: 160 }),
    /** Laden-Kategorie (Schlüssel aus shared/shopping.ts); null = ohne Kategorie */
    category: varchar("category", { length: 40 }),
    checked: boolean("checked").notNull().default(false),
    position: int("position").notNull().default(0),
    /** Preis in RAPPEN (#234); null = kein Preis erfasst */
    priceRappen: int("priceRappen"),
    /**
     * Verbuchungs-Merker (#234): Id der tripExpenses-Zeile, in der dieser
     * Eintrag als Ausgabe steckt; null = noch nicht übernommen.
     */
    bookedExpenseId: int("bookedExpenseId"),
    /** Konto, das den Eintrag angelegt hat (users.id) – nur für die Anzeige */
    createdByUserId: int("createdByUserId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("tripShoppingItems_tripId").on(table.tripId)]
);

export type TripShoppingItem = typeof tripShoppingItems.$inferSelect;
export type InsertTripShoppingItem = typeof tripShoppingItems.$inferInsert;

/**
 * Passwort-Reset per E-Mail: pro Anfrage ein Token (32 Zufallsbytes, hex),
 * von dem nur der sha256-Hash gespeichert wird – der Klartext steht
 * ausschliesslich im E-Mail-Link. 60 Minuten gültig, einmalig verwendbar.
 */
export const passwordResetTokens = mysqlTable(
  "passwordResetTokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** sha256-Hex des Tokens (64 Zeichen) */
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    /** Zeitpunkt der Nutzung bzw. Entwertung; null = noch offen */
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("passwordResetTokens_userId").on(table.userId),
    uniqueIndex("passwordResetTokens_tokenHash").on(table.tokenHash),
  ]
);

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * E-Mail-Bestätigung nach Registrierung bzw. Adress-Änderung: pro Versand ein
 * Token (32 Zufallsbytes, hex), von dem nur der sha256-Hash gespeichert wird –
 * der Klartext steht ausschliesslich im E-Mail-Link. 48 Stunden gültig,
 * bei erfolgreicher Bestätigung werden alle Tokens des Kontos gelöscht.
 */
export const emailVerifyTokens = mysqlTable(
  "emailVerifyTokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** sha256-Hex des Tokens (64 Zeichen) */
    tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("emailVerifyTokens_userId").on(table.userId),
    uniqueIndex("emailVerifyTokens_tokenHash").on(table.tokenHash),
  ]
);

export type EmailVerifyToken = typeof emailVerifyTokens.$inferSelect;
export type InsertEmailVerifyToken = typeof emailVerifyTokens.$inferInsert;

/**
 * Kinder-Profile im Familien-Modus: pro Konto mehrere Kinder, die bei
 * Schnitzeljagden und Quizzen Abzeichen sammeln. Nur der Name – bewusst
 * ohne weitere personenbezogene Daten.
 */
export const familyChildren = mysqlTable(
  "familyChildren",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 60 }).notNull(),
    /**
     * Sammelt diese Person Punkte im Ämtli-Plan? (#370)
     *
     * Ämtli machen auch die Erwachsenen – der Punktestand ist aber der
     * Wettbewerb der Kinder. Wer mitverteilt wird, ohne mitzuzählen,
     * steht hier auf `false` und taucht in der Rangliste nicht auf.
     * Standard `true`, damit bestehende Profile bleiben, wie sie sind.
     */
    earnsPoints: boolean("earnsPoints").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("familyChildren_userId").on(table.userId)]
);

export type FamilyChild = typeof familyChildren.$inferSelect;
export type InsertFamilyChild = typeof familyChildren.$inferInsert;

/**
 * Belohnungs-Ziele im Familien-Modus (#399): «Glacé am Kiosk – 20 Punkte».
 * Die Punkte kommen aus dem Ämtli-Plan (#270); hier steht, was man damit
 * MACHEN kann. Ohne Ziel ist die Rangliste nur eine Tabelle.
 */
export const familyRewards = mysqlTable(
  "familyRewards",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 80 }).notNull(),
    /** Preis in Ämtli-Punkten. */
    points: int("points").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("familyRewards_userId").on(table.userId)]
);

export type FamilyReward = typeof familyRewards.$inferSelect;
export type InsertFamilyReward = typeof familyRewards.$inferInsert;

/**
 * Eingelöste Belohnungen (#399): Titel und Punkte als SCHNAPPSCHUSS, denn
 * das Ziel darf später gelöscht oder teurer werden, ohne dass sich die
 * Geschichte umschreibt – eingelöst ist eingelöst.
 */
export const familyRedemptions = mysqlTable(
  "familyRedemptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Kind, das eingelöst hat (familyChildren.id). */
    childId: int("childId").notNull(),
    title: varchar("title", { length: 80 }).notNull(),
    points: int("points").notNull(),
    redeemedAt: timestamp("redeemedAt").defaultNow().notNull(),
  },
  table => [
    index("familyRedemptions_userId").on(table.userId),
    index("familyRedemptions_childId").on(table.childId),
  ]
);

export type FamilyRedemption = typeof familyRedemptions.$inferSelect;
export type InsertFamilyRedemption = typeof familyRedemptions.$inferInsert;

/**
 * Verdiente Abzeichen pro Kind: badgeId verweist auf den Katalog in
 * shared/badges.ts. Einmal verdient bleibt verdient (unique childId+badgeId,
 * Vergabe idempotent).
 */
export const childBadges = mysqlTable(
  "childBadges",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Zugehöriges Kind (familyChildren.id) */
    childId: int("childId").notNull(),
    /** Abzeichen-Schlüssel aus dem Katalog (shared/badges.ts) */
    badgeId: varchar("badgeId", { length: 40 }).notNull(),
    earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  },
  table => [
    index("childBadges_userId").on(table.userId),
    uniqueIndex("childBadges_child_badge").on(table.childId, table.badgeId),
  ]
);

export type ChildBadge = typeof childBadges.$inferSelect;
export type InsertChildBadge = typeof childBadges.$inferInsert;

/**
 * Zähler pro Kind für die Abzeichen-Bedingungen (Jagden/Quizze gespielt,
 * beste Antwort-Serie) – atomar per Upsert gepflegt, eine Zeile pro Kind.
 */
export const childStats = mysqlTable(
  "childStats",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Zugehöriges Kind (familyChildren.id), genau eine Zeile pro Kind */
    childId: int("childId").notNull(),
    /** Abgeschlossene Schnitzeljagden */
    huntsCompleted: int("huntsCompleted").default(0).notNull(),
    /** Fertig gespielte Quizze */
    quizzesCompleted: int("quizzesCompleted").default(0).notNull(),
    /** Längste Serie richtig beantworteter Fragen */
    bestStreak: int("bestStreak").default(0).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("childStats_userId").on(table.userId),
    uniqueIndex("childStats_childId").on(table.childId),
  ]
);

export type ChildStats = typeof childStats.$inferSelect;
export type InsertChildStats = typeof childStats.$inferInsert;

/**
 * Reisepass: «diese Person war auf dieser Reise NICHT dabei».
 *
 * GESPEICHERT WIRD DIE ABWESENHEIT, NICHT DIE ANWESENHEIT. Eine Familie
 * fährt zusammen weg – «alle waren dabei» ist der Normalfall und braucht
 * keine Zeile. Andersherum müsste jede neue Reise für jede Person eine
 * Zeile anlegen, sonst stünde am nächsten Morgen ein leerer Pass da.
 * Begründung ausführlich in shared/passport.ts.
 */
export const passportAbsences = mysqlTable(
  "passportAbsences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Person (familyChildren.id) */
    childId: int("childId").notNull(),
    /** Reise (trips.id) */
    tripId: int("tripId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("passportAbsences_userId").on(table.userId),
    uniqueIndex("passportAbsences_child_trip").on(table.childId, table.tripId),
  ]
);

export type PassportAbsenceRow = typeof passportAbsences.$inferSelect;
export type InsertPassportAbsence = typeof passportAbsences.$inferInsert;

/**
 * Ausrüstungs-Pflege-Aufgaben: wiederkehrende Wartung (z. B. Zelt
 * imprägnieren) mit Intervall in Monaten. lastDoneAt = zuletzt erledigt
 * (null = noch nie; dann zählt das Anlage-Datum als Basis) – die
 * Fälligkeits-Logik liegt in shared/gearTasks.ts.
 */
export const gearTasks = mysqlTable(
  "gearTasks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    /** Wartungs-Intervall in Monaten (1–120) */
    intervalMonths: int("intervalMonths").notNull(),
    /** Zuletzt erledigt (ISO-Datum); null = noch nie */
    lastDoneAt: date("lastDoneAt", { mode: "string" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("gearTasks_userId").on(table.userId)]
);

export type GearTask = typeof gearTasks.$inferSelect;
export type InsertGearTask = typeof gearTasks.$inferInsert;

/**
 * Zeckenstich-Merker (#179): erfasste Stiche pro Konto, damit die
 * Einstichstelle rund zwei Wochen beobachtet werden kann. Die reine
 * Fristen-Logik liegt in shared/tickBites.ts; die App bewertet nichts
 * medizinisch, sie erinnert nur ans Nachschauen.
 */
export const tickBites = mysqlTable(
  "tickBites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Datum des Stichs (ISO) */
    bitAt: date("bitAt", { mode: "string" }).notNull(),
    /** Körperstelle als Freitext («Kniekehle links»); null = ohne Angabe */
    bodyPart: varchar("bodyPart", { length: 80 }),
    /** Kurze Notiz («Zecke vollständig entfernt»); null = keine */
    note: varchar("note", { length: 500 }),
    /** Beobachtung abgeschlossen am (ISO); null = noch offen */
    resolvedAt: date("resolvedAt", { mode: "string" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("tickBites_userId").on(table.userId)]
);

export type TickBite = typeof tickBites.$inferSelect;
export type InsertTickBite = typeof tickBites.$inferInsert;

/**
 * Natur-Beobachtungen: persönliches Sichtungs-Tagebuch im Natur-Modul.
 * Optional mit Verweis auf einen Wissens-Eintrag (client/src/data/nature.ts),
 * Standort-Koordinaten (erscheinen als Pins auf /karte) und genau EINEM Foto
 * als Datei unter uploads/sightings/ (Muster inventoryItems.imageFileName).
 */
export const natureSightings = mysqlTable(
  "natureSightings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    /** Id eines Wissens-Eintrags aus data/nature.ts; null = freie Beobachtung */
    entryId: varchar("entryId", { length: 60 }),
    /** Beobachtungs-Datum (ISO) */
    sightedAt: date("sightedAt", { mode: "string" }).notNull(),
    /** Standort der Sichtung; null = ohne Koordinaten (kein Karten-Pin) */
    lat: double("lat"),
    lon: double("lon"),
    note: varchar("note", { length: 500 }),
    /** Dateiname des Fotos unter uploads/sightings/ (genau EIN Foto pro Sichtung) */
    fileName: varchar("fileName", { length: 64 }).unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("natureSightings_userId").on(table.userId)]
);

export type NatureSighting = typeof natureSightings.$inferSelect;
export type InsertNatureSighting = typeof natureSightings.$inferInsert;

/**
 * Fangbuch (#236): ein Angel-Fang pro Zeile.
 *
 * Bewusst NICHT in `natureSightings` mitgeführt: ein Fang trägt Länge,
 * Gewicht, Gewässer, Köder/Methode, Uhrzeit und «zurückgesetzt» – Felder,
 * die einer Natur-Beobachtung nichts nützen, und das Sichtungs-Tagebuch
 * hätte für jede Auswertung erst die Fänge herausfiltern müssen.
 *
 * `speciesId` verweist auf `FISH_SPECIES` aus shared/fishing.ts (Grundlage
 * der Schonzeit- und Mindestmass-Prüfung); null = frei erfasste Art.
 * `speciesName` steht immer da, damit die Liste ohne Datensatz lesbar bleibt.
 * Datum und Uhrzeit liegen getrennt (Muster `tripLogs.arrivalTime`), die
 * Uhrzeit ist optional. Genau EIN Foto als Datei unter uploads/catches/.
 */
export const fishCatches = mysqlTable(
  "fishCatches",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Id einer Art aus shared/fishing.ts; null = frei erfasst */
    speciesId: varchar("speciesId", { length: 60 }),
    /** Angezeigter Arten-Name (aus dem Datensatz übernommen oder Freitext) */
    speciesName: varchar("speciesName", { length: 120 }).notNull(),
    /** Länge in cm; null = nicht gemessen */
    lengthCm: double("lengthCm"),
    /** Gewicht in kg; null = nicht gewogen */
    weightKg: double("weightKg"),
    /** Gewässer als Freitext («Zürichsee», «Sihl bei Langnau») */
    water: varchar("water", { length: 120 }).notNull(),
    /** Fangdatum (ISO) */
    caughtAt: date("caughtAt", { mode: "string" }).notNull(),
    /** Uhrzeit «HH:MM»; null = ohne Angabe */
    caughtTime: varchar("caughtTime", { length: 5 }),
    /** Köder oder Methode («Nymphe», «Gummifisch 10 cm») */
    method: varchar("method", { length: 120 }),
    /** true = schonend zurückgesetzt */
    released: boolean("released").default(false).notNull(),
    note: varchar("note", { length: 500 }),
    /** Dateiname des Fotos unter uploads/catches/ (genau EIN Foto pro Fang) */
    fileName: varchar("fileName", { length: 64 }).unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("fishCatches_userId").on(table.userId)]
);

export type FishCatch = typeof fishCatches.$inferSelect;
export type InsertFishCatch = typeof fishCatches.$inferInsert;

/**
 * Aufgezeichnete Wanderungen (#220): eine Zeile pro Track.
 *
 * Die Punktreihe steht als KOMPAKTES JSON-Tupel-Array in `pointsJson`
 * (`[[lat, lon, ele|null, t], …]`, Format in shared/track.ts) – eine eigene
 * Punkte-Tabelle wäre bei mehreren tausend Zeilen pro Wanderung reine
 * Schreiblast, gelesen wird ein Track ohnehin immer als Ganzes.
 * Die Spalte ist `mediumtext` (16 MB): `text` mit 64 KB reicht für eine
 * Tageswanderung nicht zuverlässig.
 *
 * Die Statistik (Strecke, Dauer, Höhenmeter) liegt bewusst als Spalte daneben,
 * obwohl sie sich aus den Punkten ergibt: die Liste zeigt Dutzende Tracks und
 * müsste sonst jedes Mal alle Punktreihen parsen. Berechnet wird sie
 * ausschliesslich serverseitig mit `trackStats()`.
 *
 * `tripId` ist optional – eine Wanderung kann zu einer Reise gehören, muss
 * aber nicht. Beim Löschen der Reise bleibt der Track erhalten und verliert
 * nur die Zuordnung.
 */
export const hikeTracks = mysqlTable(
  "hikeTracks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Zugeordnete Reise (tripLogs.id); null = ohne Reise */
    tripId: int("tripId"),
    name: varchar("name", { length: 80 }).notNull(),
    /** Zeitpunkt des ersten und des letzten Punkts */
    startedAt: timestamp("startedAt").notNull(),
    endedAt: timestamp("endedAt").notNull(),
    /** Statistik aus shared/track.ts – serverseitig berechnet */
    distanceM: int("distanceM").notNull().default(0),
    durationS: int("durationS").notNull().default(0),
    ascentM: int("ascentM").notNull().default(0),
    descentM: int("descentM").notNull().default(0),
    /** Punktreihe als kompaktes Tupel-JSON (shared/track.ts) */
    pointsJson: mediumtext("pointsJson").notNull(),
    /**
     * Öffentlicher Teil-Token (#282): Wer den Link kennt, sieht Karte,
     * Eckdaten und Höhenprofil der Wanderung – ohne Konto und ohne Namen
     * der wandernden Person. null = nicht geteilt.
     */
    shareToken: varchar("shareToken", { length: 64 }).unique(),
    /** Ablauf des Teil-Links (UTC); null = unbegrenzt gültig. */
    shareExpiresAt: timestamp("shareExpiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("hikeTracks_userId").on(table.userId),
    index("hikeTracks_tripId").on(table.tripId),
  ]
);

export type HikeTrack = typeof hikeTracks.$inferSelect;
export type InsertHikeTrack = typeof hikeTracks.$inferInsert;

/**
 * Vorher gezeichnete Routen (#281): eine Zeile pro geplanter Wanderung.
 *
 * Bewusst NEBEN `hikeTracks` und nicht darin: Eine Planung hat keine Zeit
 * und keine Aufzeichnung, dafür eine geschätzte Gehzeit – sie in dieselbe
 * Tabelle zu pressen hiesse, `startedAt`/`endedAt` mit erfundenen Werten
 * zu füllen und in jeder Abfrage «echt oder geplant?» mitzuführen.
 *
 * `waypointsJson` hält NUR die gesetzten Wegpunkte (`[[lat, lon, ele|null],
 * …]`, Format in shared/routePlan.ts) – die Stützstellen zwischendrin
 * werden beim Anzeigen neu gerechnet, sie sind reine Ableitung. Deshalb
 * genügt hier `text`.
 *
 * Länge, Höhenmeter und Gehzeit stehen als Spalte daneben, damit die Liste
 * nicht für jede Route rechnen muss; berechnet werden sie serverseitig.
 */
export const plannedRoutes = mysqlTable(
  "plannedRoutes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Zugeordnete Reise (tripLogs.id); null = ohne Reise */
    tripId: int("tripId"),
    name: varchar("name", { length: 80 }).notNull(),
    /** Wegpunkte als kompaktes Tupel-JSON (shared/routePlan.ts) */
    waypointsJson: text("waypointsJson").notNull(),
    distanceM: int("distanceM").notNull().default(0),
    ascentM: int("ascentM").notNull().default(0),
    descentM: int("descentM").notNull().default(0),
    /** Geschätzte Gehzeit ohne Pausen, in Minuten */
    minutes: int("minutes").notNull().default(0),
    /** Gewähltes Tempo: slow | normal | fast */
    pace: varchar("pace", { length: 10 }).notNull().default("normal"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("plannedRoutes_userId").on(table.userId),
    index("plannedRoutes_tripId").on(table.tripId),
  ]
);

export type PlannedRoute = typeof plannedRoutes.$inferSelect;
export type InsertPlannedRoute = typeof plannedRoutes.$inferInsert;

/**
 * «Hier bin ich»-Standort-Links (#221): höchstens EIN aktiver Link pro Konto
 * (uniqueIndex auf userId). Dadurch bleibt derselbe Link gültig, während der
 * Standort nachgeführt wird – Mitreisende müssen nichts Neues öffnen –, und
 * es kann niemand versehentlich ein Dutzend Links im Umlauf haben.
 *
 * `shareExpiresAt` ist hier NOT NULL: ein Standort ist etwas anderes als eine
 * Packliste und darf nicht unbegrenzt offen liegen (erlaubte Dauern in
 * shared/sharing.ts: 1, 4 oder 24 Stunden). «Link deaktivieren» löscht die
 * Zeile, abgelaufene Links verhalten sich wie unbekannte Tokens.
 *
 * `capturedAt` ist der Zeitpunkt der MESSUNG (für «Standort von … vor 5
 * Minuten»), nicht der des Speicherns – die beiden können bei schlechtem
 * Empfang deutlich auseinanderliegen.
 */
export const locationShares = mysqlTable(
  "locationShares",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    shareToken: varchar("shareToken", { length: 64 }).notNull(),
    latitude: double("latitude").notNull(),
    longitude: double("longitude").notNull(),
    /** Horizontale Genauigkeit in Metern; null = vom Gerät nicht geliefert */
    accuracyM: int("accuracyM"),
    /** Zeitpunkt der Messung (Geolocation-Zeitstempel) */
    capturedAt: timestamp("capturedAt").notNull(),
    /** Ablauf des Links (UTC) – immer gesetzt, siehe Kommentar oben */
    shareExpiresAt: timestamp("shareExpiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("locationShares_userId").on(table.userId),
    uniqueIndex("locationShares_shareToken").on(table.shareToken),
  ]
);

export type LocationShare = typeof locationShares.$inferSelect;
export type InsertLocationShare = typeof locationShares.$inferInsert;

/**
 * Passkeys (WebAuthn): pro Konto beliebig viele Anmelde-Credentials als
 * Alternative zum Passwort. Gespeichert werden die Base64URL-codierte
 * Credential-Id des Authenticators, der öffentliche Schlüssel (COSE) und der
 * Signatur-Zähler (Schutz vor geklonten Authenticators) – niemals private
 * Schlüssel. Die kurzlebigen Challenges leben in-memory (server/passkeys.ts).
 */
export const passkeys = mysqlTable(
  "passkeys",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Base64URL-codierte Credential-Id des Authenticators (weltweit eindeutig) */
    credentialId: varchar("credentialId", { length: 255 }).notNull(),
    /** Base64URL-codierter öffentlicher Schlüssel (COSE-Format) */
    publicKey: text("publicKey").notNull(),
    /** Signatur-Zähler des Authenticators (0 bei Geräten ohne Zähler) */
    counter: int("counter").notNull().default(0),
    /** Transports des Authenticators als Komma-Liste (z. B. «internal,hybrid») */
    transports: varchar("transports", { length: 255 }),
    /** Frei wählbarer Anzeigename, z. B. der Gerätename */
    name: varchar("name", { length: 80 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("passkeys_userId").on(table.userId),
    uniqueIndex("passkeys_credentialId").on(table.credentialId),
  ]
);

export type Passkey = typeof passkeys.$inferSelect;
export type InsertPasskey = typeof passkeys.$inferInsert;

/**
 * Geräteübergreifend synchronisierte Client-Einstellungen: pro Nutzer*in und
 * Schlüssel ein JSON-serialisierter Wert (z. B. Kachel-Reihenfolge, Hindernis-Profil).
 */
export const userSettings = mysqlTable(
  "userSettings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    key: varchar("key", { length: 64 }).notNull(),
    /** JSON-serialisierter Wert */
    value: text("value").notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("userSettings_user_key").on(table.userId, table.key)]
);

export type UserSetting = typeof userSettings.$inferSelect;
export type InsertUserSetting = typeof userSettings.$inferInsert;

/**
 * Benachrichtigungs-Verlauf (#201): jede erfolgreich versendete Push-Meldung
 * wird hier EINMAL pro Konto festgehalten (nicht pro Gerät), damit man im
 * Profil nachlesen kann, was man verpasst hat. `kind` ist eine der
 * Mitteilungs-Arten (weather|food|trip|drying|astro|gear|evepack), `url` die
 * hinterlegte Route der Meldung. Der Verlauf ist bewusst kurz: server/push.ts
 * behält pro Konto nur die PUSH_LOG_LIMIT neuesten Einträge.
 */
export const pushLog = mysqlTable(
  "pushLog",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Art der Meldung (weather|food|trip|drying|astro|gear|evepack) */
    kind: varchar("kind", { length: 20 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    body: varchar("body", { length: 500 }).notNull(),
    /** Route, die der Klick öffnet (z. B. «/wetter»); null = keine */
    url: varchar("url", { length: 200 }),
    sentAt: timestamp("sentAt").defaultNow().notNull(),
  },
  table => [index("pushLog_user_sentAt").on(table.userId, table.sentAt)]
);

export type PushLogEntry = typeof pushLog.$inferSelect;
export type InsertPushLogEntry = typeof pushLog.$inferInsert;

/**
 * Freie Notizen (#246): das Auffangbecken für alles, was in kein anderes
 * Modul passt – ein Gedanke zum nächsten Sommer, die Nummer des
 * Platzwarts, der Trick mit dem Heringszieher. Titel ist optional, der
 * Text trägt den Inhalt.
 *
 * Die Stichwörter stehen als KOMMAGETRENNTER Text in `tags`, nicht als
 * JSON: es ist eine flache Liste kurzer Wörter ohne Struktur, und so bleibt
 * sie auch mit einem einfachen LIKE durchsuchbar. Gesäubert (getrimmt,
 * entdoppelt, gekappt) wird ausschliesslich über shared/notes.ts, damit
 * Client und Router dieselbe Fassung schreiben.
 */
export const userNotes = mysqlTable(
  "userNotes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Überschrift der Notiz; null = ohne Titel (dann trägt der Text sie) */
    title: varchar("title", { length: 140 }),
    text: text("text").notNull(),
    /** Stichwörter, kommagetrennt und normalisiert (shared/notes.ts) */
    tags: varchar("tags", { length: 300 }).notNull().default(""),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("userNotes_userId").on(table.userId)]
);

export type UserNote = typeof userNotes.$inferSelect;
export type InsertUserNote = typeof userNotes.$inferInsert;

/**
 * GPS-Schatzsuche (#267): Wegpunkte, die Erwachsene am Platz verstecken
 * und Kinder mit dem Handy suchen.
 *
 * Die Koordinaten stehen am Wegpunkt und nicht an einem Zeltplatz-Favoriten:
 * Eine Schatzsuche wird dort angelegt, wo man gerade steht – das kann der
 * Campingplatz sein, muss aber nicht.
 *
 * `foundAt` ist der ganze Spielstand. Damit lässt sich eine Suche für die
 * nächste Kindergruppe zurücksetzen, ohne die Verstecke neu einzumessen –
 * genau das ist der Unterschied zu einer Wanderung, die man einmal geht.
 */
export const treasureHunts = mysqlTable(
  "treasureHunts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 60 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("treasureHunts_userId").on(table.userId)]
);

export const treasurePoints = mysqlTable(
  "treasurePoints",
  {
    id: int("id").autoincrement().primaryKey(),
    huntId: int("huntId").notNull(),
    name: varchar("name", { length: 60 }).notNull(),
    /** Hinweis, der zu diesem Versteck führt; null = ohne Hinweis. */
    hint: varchar("hint", { length: 200 }),
    latitude: double("latitude").notNull(),
    longitude: double("longitude").notNull(),
    /** Spielreihenfolge – die Stationen werden streng nacheinander gesucht. */
    sortIndex: int("sortIndex").notNull().default(0),
    /** Wann der Punkt gefunden wurde; null = noch versteckt. */
    foundAt: timestamp("foundAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("treasurePoints_huntId").on(table.huntId)]
);

export type TreasureHunt = typeof treasureHunts.$inferSelect;
export type InsertTreasureHunt = typeof treasureHunts.$inferInsert;
export type TreasurePoint = typeof treasurePoints.$inferSelect;
export type InsertTreasurePoint = typeof treasurePoints.$inferInsert;

/**
 * Ämtli-Plan im Camp (#270): Aufgaben mit Punkten und ihre Zuteilung pro
 * Tag. Die Kinder kommen aus dem Familien-Modus (`familyChildren`) – ein
 * zweites Namensverzeichnis wollte niemand pflegen.
 *
 * Die Zuteilung hängt am TAG und nicht an der Reise: Ämtli fallen auch
 * zu Hause im Garten an, und eine Reise ist beim Abwasch keine
 * notwendige Bedingung.
 */
export const campChores = mysqlTable(
  "campChores",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 60 }).notNull(),
    /** Punkte, die das erledigte Ämtli einbringt (1–10). */
    points: int("points").notNull().default(1),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("campChores_userId").on(table.userId)]
);

export const choreAssignments = mysqlTable(
  "choreAssignments",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    choreId: int("choreId").notNull(),
    /** Zugeteiltes Kind (familyChildren.id); null = noch offen. */
    childId: int("childId"),
    /** Tag als ISO-Datum (YYYY-MM-DD). */
    day: varchar("day", { length: 10 }).notNull(),
    /** Wann abgehakt wurde; null = noch offen. Erst dann gibt es Punkte. */
    doneAt: timestamp("doneAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("choreAssignments_userId").on(table.userId),
    index("choreAssignments_userId_day").on(table.userId, table.day),
  ]
);

export type CampChore = typeof campChores.$inferSelect;
export type InsertCampChore = typeof campChores.$inferInsert;
export type ChoreAssignment = typeof choreAssignments.$inferSelect;
export type InsertChoreAssignment = typeof choreAssignments.$inferInsert;

/**
 * Papierkorb (#295): Schnappschuss einer gelöschten Sache samt ihrer
 * Kinder, 30 Tage lang wiederherstellbar.
 *
 * KEINE «deletedAt»-SPALTE IN DEN FACHTABELLEN. Der übliche Weg wäre,
 * jeder Tabelle so eine Spalte zu geben und jede Abfrage zu filtern –
 * und genau daran gehen Papierkörbe kaputt: EINE vergessene Bedingung,
 * und eine gelöschte Reise steht wieder in der Liste. Deshalb bleibt das
 * Löschen ein echtes DELETE, und was verschwindet, liegt vorher hier als
 * JSON. Alle bestehenden Abfragen bleiben unverändert.
 *
 * `payload` enthält die Zeilen nach Tabellen gruppiert, `files` die
 * Namen der zugehörigen Dateien auf dem Webspace – die bleiben liegen,
 * bis der Eintrag abläuft. Eine Reise ohne ihre Fotos
 * wiederherzustellen wäre keine Wiederherstellung.
 */
export const deletedItems = mysqlTable(
  "deletedItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /** Art der gelöschten Sache (shared/trash.ts: TRASH_KINDS). */
    kind: varchar("kind", { length: 20 }).notNull(),
    /** Was in der Liste steht – Name der Reise, Titel der Notiz usw. */
    label: varchar("label", { length: 200 }).notNull(),
    /**
     * Zweite Zeile, SPRACHNEUTRAL (ISO-Datum, Ortsname) – null, wenn es
     * nichts gibt. Übersetzbare Wörter dürfen hier nicht stehen: Was auf
     * Deutsch gelöscht wurde, kann auf Französisch wiederhergestellt
     * werden.
     */
    detail: varchar("detail", { length: 200 }),
    /** Anzahl mitgelöschter Zeilen (ohne die Hauptzeile) – die UI übersetzt. */
    itemCount: int("itemCount").notNull().default(0),
    /** Zeilen nach Tabellennamen gruppiert, als JSON. */
    payload: mediumtext("payload").notNull(),
    /** Dateien auf dem Webspace: [{storage, fileName}], als JSON. */
    files: text("files").notNull().default("[]"),
    deletedAt: timestamp("deletedAt").defaultNow().notNull(),
  },
  table => [
    index("deletedItems_userId").on(table.userId),
    index("deletedItems_deletedAt").on(table.deletedAt),
  ]
);

export type DeletedItem = typeof deletedItems.$inferSelect;
export type InsertDeletedItem = typeof deletedItems.$inferInsert;

/**
 * Änderungsverlauf pro Reise (#296): wer hat wann was geändert.
 *
 * EREIGNISSE, KEIN FELD-DIFF. Festgehalten wird die ART der Änderung –
 * Bereich, Aktion und woran –, nicht der alte und der neue Wert jedes
 * Feldes. Ein vollständiger Diff über zehn Tabellen wäre ein Vielfaches
 * an Daten und liest sich für niemanden.
 *
 * DER NAME STEHT NICHT HIER. Gespeichert wird die userId; den Namen holt
 * die Ansicht beim Lesen. Wer sich umbenennt, steht sonst mit zwei Namen
 * in derselben Liste.
 *
 * `label` ist NUTZERTEXT (Titel einer Ausgabe, Tag im Journal) und bleibt
 * bewusst unübersetzt – übersetzt wird nur, was die App selbst benennt.
 */
/**
 * Rückmeldung nach der Reise (#381): Was war nicht nötig, was hat
 * gefehlt?
 *
 * EINE ZEILE JE MELDUNG, nicht je Gegenstand: Dieselbe Regenhose kann
 * über Jahre mehrfach auffallen, und genau das Zählen macht aus einer
 * Beobachtung einen Hinweis. Zusammengefasst wird beim Lesen
 * (`shared/packFeedback.ts`), nicht beim Schreiben.
 *
 * Der Name steht als TEXT drin und nicht als Verweis auf `packItems`:
 * Die Liste einer vergangenen Reise wird gelöscht, archiviert oder
 * umgeschrieben – die Erfahrung soll das überleben.
 */
export const packFeedback = mysqlTable(
  "packFeedback",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    tripId: int("tripId").notNull(),
    /** «unused» = war nicht nötig, «missing» = hat gefehlt */
    kind: mysqlEnum("kind", ["unused", "missing"]).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("packFeedback_userId").on(table.userId),
    index("packFeedback_tripId").on(table.tripId),
  ]
);

export type PackFeedback = typeof packFeedback.$inferSelect;
export type InsertPackFeedback = typeof packFeedback.$inferInsert;

export const tripChanges = mysqlTable(
  "tripChanges",
  {
    id: int("id").autoincrement().primaryKey(),
    tripId: int("tripId").notNull(),
    /** Wer die Änderung gemacht hat (users.id). */
    userId: int("userId").notNull(),
    /** Bereich – shared/tripHistory.ts: CHANGE_AREAS. */
    area: varchar("area", { length: 20 }).notNull(),
    /** add | edit | remove – shared/tripHistory.ts: CHANGE_ACTIONS. */
    action: varchar("action", { length: 10 }).notNull(),
    /** Woran genau; null, wenn es nichts Benennbares gibt. */
    label: varchar("label", { length: 160 }),
    at: timestamp("at").defaultNow().notNull(),
  },
  table => [
    index("tripChanges_tripId").on(table.tripId),
    index("tripChanges_tripId_at").on(table.tripId, table.at),
  ]
);

export type TripChange = typeof tripChanges.$inferSelect;
export type InsertTripChange = typeof tripChanges.$inferInsert;
