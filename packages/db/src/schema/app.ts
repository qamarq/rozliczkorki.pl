import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const studentTypeEnum = pgEnum("student_type", ["private", "school"]);
export const lessonStatusEnum = pgEnum("lesson_status", [
  "scheduled",
  "completed",
  "cancelled",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "transfer"]);

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  type: studentTypeEnum("type").notNull().default("private"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const studentRates = pgTable("student_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("PLN"),
  effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recurringRules = pgTable("recurring_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  recurringRuleId: uuid("recurring_rule_id").references(() => recurringRules.id, {
    onDelete: "set null",
  }),
  startsAt: timestamp("starts_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  prorate: boolean("prorate").notNull().default(false),
  status: lessonStatusEnum("status").notNull().default("scheduled"),
  paid: boolean("paid").notNull().default(false),
  paymentMethod: paymentMethodEnum("payment_method"),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }),
  priceOverride: numeric("price_override", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const iosWaitlistVotes = pgTable("ios_waitlist_votes", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  platform: text("platform"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
