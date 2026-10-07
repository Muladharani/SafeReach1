import {
  boolean,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("safereach_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sheltersTable = pgTable("safereach_shelters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  capacity: integer("capacity").notNull(),
  occupied: integer("occupied").notNull().default(0),
  status: text("status").notNull().default("open"),
  type: text("type").notNull().default("government"),
  phone: text("phone").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const facilitiesTable = pgTable("safereach_facilities", {
  id: serial("id").primaryKey(),
  shelterId: integer("shelter_id")
    .notNull()
    .unique()
    .references(() => sheltersTable.id, { onDelete: "cascade" }),
  food: boolean("food").notNull().default(false),
  water: boolean("water").notNull().default(false),
  medical: boolean("medical").notNull().default(false),
  toilet: boolean("toilet").notNull().default(false),
  electricity: boolean("electricity").notNull().default(false),
  wheelchair: boolean("wheelchair").notNull().default(false),
  childcare: boolean("childcare").notNull().default(false),
  womenFacility: boolean("women_facility").notNull().default(false),
  petFriendly: boolean("pet_friendly").notNull().default(false),
});

export const disastersTable = pgTable("safereach_disasters", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  location: text("location").notNull(),
  severity: text("severity").notNull(),
  startTime: timestamp("start_time", { withTimezone: true })
    .notNull()
    .defaultNow(),
  endTime: timestamp("end_time", { withTimezone: true }),
  status: text("status").notNull().default("active"),
});

export const alertsTable = pgTable("safereach_alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  radiusKm: real("radius_km").notNull().default(10),
  recommendedAction: text("recommended_action").notNull(),
  sirenEnabled: boolean("siren_enabled").notNull().default(false),
  notificationEnabled: boolean("notification_enabled").notNull().default(true),
  status: text("status").notNull().default("draft"),
  isDemo: boolean("is_demo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notificationsTable = pgTable("safereach_notifications", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => alertsTable.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  isDemo: boolean("is_demo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reportsTable = pgTable("safereach_reports", {
  id: serial("id").primaryKey(),
  shelterId: integer("shelter_id")
    .notNull()
    .references(() => sheltersTable.id, { onDelete: "cascade" }),
  problemType: text("problem_type").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adminsTable = pgTable("safereach_admins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  authProviderId: text("auth_provider_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
