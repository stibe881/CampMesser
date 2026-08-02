import {
  boolean,
  date,
  double,
  float,
  index,
  int,
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
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
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
    /** Öffentlicher Teil-Token: Wer den Link kennt, sieht das Platz-Dossier (nur lesend). */
    shareToken: varchar("shareToken", { length: 32 }),
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
    /** Öffentlicher Teil-Token: Wer den Link kennt, kann die Liste sehen und abhaken. */
    shareToken: varchar("shareToken", { length: 32 }),
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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("inventoryItems_userId").on(table.userId)]
);

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("powerConsumers_userId").on(table.userId)]
);

export type PowerConsumer = typeof powerConsumers.$inferSelect;
export type InsertPowerConsumer = typeof powerConsumers.$inferInsert;

/** Lebensmittel-Inventar (Kühlbox) für Rezeptvorschläge. */
export const foodItems = mysqlTable(
  "foodItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    quantity: varchar("quantity", { length: 80 }),
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
    startDate: date("startDate", { mode: "string" }).notNull(),
    /** Abreise – Nächte ergeben sich aus der Differenz der beiden Daten */
    endDate: date("endDate", { mode: "string" }).notNull(),
    /** Sterne-Bewertung 1–5; null = (noch) nicht bewertet */
    rating: tinyint("rating"),
    /**
     * Wetterarchiv des Aufenthalts als JSON {tMax, tMin, rainDays, totalPrecip}
     * (shared/tripWeather.ts) – wird nach der Heimkehr einmalig aus dem
     * Open-Meteo-Archiv befüllt; null = (noch) kein Archiv.
     */
    weatherJson: text("weatherJson"),
    /** Titelbild des Eintrags (tripPhotos.id); null = kein Titelbild */
    coverPhotoId: int("coverPhotoId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("tripLogs_userId").on(table.userId)]
);

export type TripLog = typeof tripLogs.$inferSelect;
export type InsertTripLog = typeof tripLogs.$inferInsert;

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

/** Einkaufsliste: abhakbare Einträge pro Nutzer*in (manuell oder aus Rezepten). */
export const shoppingItems = mysqlTable(
  "shoppingItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    checked: boolean("checked").notNull().default(false),
    position: int("position").notNull().default(0),
    /** Laden-Kategorie (Schlüssel aus shared/shopping.ts); null = ohne Kategorie */
    category: varchar("category", { length: 40 }),
    /** Freitext-Menge («2×», «500 g»); null = ohne Mengenangabe */
    quantity: varchar("quantity", { length: 40 }),
    /** Kurze Notiz zum Eintrag («Aktion», «laktosefrei»); null = keine */
    note: varchar("note", { length: 160 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("shoppingItems_userId").on(table.userId)]
);

export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type InsertShoppingItem = typeof shoppingItems.$inferInsert;

/**
 * Teil-Links der Einkaufsliste: die Liste ist EINE Liste pro Nutzer*in,
 * deshalb genau eine Teil-Zeile pro Konto (userId unique). Wer den Token
 * kennt, kann die Liste sehen und mit abhaken.
 */
export const shoppingShares = mysqlTable(
  "shoppingShares",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    shareToken: varchar("shareToken", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("shoppingShares_userId").on(table.userId),
    uniqueIndex("shoppingShares_shareToken").on(table.shareToken),
  ]
);

export type ShoppingShare = typeof shoppingShares.$inferSelect;
export type InsertShoppingShare = typeof shoppingShares.$inferInsert;

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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("familyChildren_userId").on(table.userId)]
);

export type FamilyChild = typeof familyChildren.$inferSelect;
export type InsertFamilyChild = typeof familyChildren.$inferInsert;

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
