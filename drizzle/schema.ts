import { boolean, date, double, float, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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
export const campSpots = mysqlTable("campSpots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampSpot = typeof campSpots.$inferSelect;
export type InsertCampSpot = typeof campSpots.$inferInsert;

/** Packlisten: eine Liste pro Nutzer*in, basierend auf einem Szenario oder leer gestartet. */
export const packLists = mysqlTable("packLists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  scenario: varchar("scenario", { length: 60 }).notNull().default("custom"),
  /** Öffentlicher Teil-Token: Wer den Link kennt, kann die Liste sehen und abhaken. */
  shareToken: varchar("shareToken", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PackList = typeof packLists.$inferSelect;
export type InsertPackList = typeof packLists.$inferInsert;

/** Einzelne Einträge einer Packliste, abhakbar. */
export const packItems = mysqlTable("packItems", {
  id: int("id").autoincrement().primaryKey(),
  listId: int("listId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).notNull().default("Allgemein"),
  quantity: int("quantity").notNull().default(1),
  checked: boolean("checked").notNull().default(false),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PackItem = typeof packItems.$inferSelect;
export type InsertPackItem = typeof packItems.$inferInsert;

/** Inventar: vorhandenes Campingmaterial mit Gewicht (g) und Volumen (l). */
export const inventoryItems = mysqlTable("inventoryItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).notNull().default("Allgemein"),
  weightGrams: int("weightGrams").notNull().default(0),
  volumeLiters: float("volumeLiters").notNull().default(0),
  quantity: int("quantity").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

/** Energie-Verbraucher für den Energie-Budget-Rechner. */
export const powerConsumers = mysqlTable("powerConsumers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  watts: float("watts").notNull().default(0),
  hoursPerDay: float("hoursPerDay").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PowerConsumer = typeof powerConsumers.$inferSelect;
export type InsertPowerConsumer = typeof powerConsumers.$inferInsert;

/** Lebensmittel-Inventar (Kühlbox) für Rezeptvorschläge. */
export const foodItems = mysqlTable("foodItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  quantity: varchar("quantity", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FoodItem = typeof foodItems.$inferSelect;
export type InsertFoodItem = typeof foodItems.$inferInsert;

/** Reise-Tagebuch: ein Eintrag pro Camping-Aufenthalt, optional mit Zeltplatz-Favorit verknüpft. */
export const tripLogs = mysqlTable("tripLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Verknüpfter Zeltplatz-Favorit; null bei frei eingetragenem Ort */
  spotId: int("spotId"),
  /** Freitext-Ort, falls kein Favorit verknüpft ist */
  location: varchar("location", { length: 140 }),
  title: varchar("title", { length: 140 }),
  notes: text("notes"),
  /** Anreise (erster Abend) */
  startDate: date("startDate", { mode: "string" }).notNull(),
  /** Abreise – Nächte ergeben sich aus der Differenz der beiden Daten */
  endDate: date("endDate", { mode: "string" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TripLog = typeof tripLogs.$inferSelect;
export type InsertTripLog = typeof tripLogs.$inferInsert;

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
  table => [uniqueIndex("userSettings_user_key").on(table.userId, table.key)],
);

export type UserSetting = typeof userSettings.$inferSelect;
export type InsertUserSetting = typeof userSettings.$inferInsert;
