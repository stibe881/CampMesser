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
    sortOrder: int("sortOrder").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("packItems_listId").on(table.listId)]
);

export type PackItem = typeof packItems.$inferSelect;
export type InsertPackItem = typeof packItems.$inferInsert;

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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("tripLogs_userId").on(table.userId)]
);

export type TripLog = typeof tripLogs.$inferSelect;
export type InsertTripLog = typeof tripLogs.$inferInsert;

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
    /** Schlüssel der zuletzt gemeldeten Warnlage (verhindert Doppel-Pushes) */
    lastAlertKey: varchar("lastAlertKey", { length: 255 }),
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

/** Einkaufsliste: abhakbare Einträge pro Nutzer*in (manuell oder aus Rezepten). */
export const shoppingItems = mysqlTable(
  "shoppingItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    checked: boolean("checked").notNull().default(false),
    position: int("position").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("shoppingItems_userId").on(table.userId)]
);

export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type InsertShoppingItem = typeof shoppingItems.$inferInsert;

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
