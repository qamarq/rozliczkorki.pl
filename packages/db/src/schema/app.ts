import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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
export const lessonModeEnum = pgEnum("lesson_mode", ["in_person", "remote"]);
export const payoutFrequencyEnum = pgEnum("payout_frequency", [
  "monthly",
  "biweekly",
  "weekly",
  "per_lesson",
]);

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  contactName: text("contact_name"),
  email: text("email"),
  payoutFrequency: payoutFrequencyEnum("payout_frequency").notNull().default("monthly"),
  payoutDay: integer("payout_day"),
  payoutAnchor: date("payout_anchor", { mode: "string" }),
  notes: text("notes"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const schoolPayouts = pgTable(
  "school_payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    periodKey: text("period_key").notNull(),
    periodStart: date("period_start", { mode: "string" }).notNull(),
    periodEnd: date("period_end", { mode: "string" }).notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    receivedOn: date("received_on", { mode: "string" }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    schoolPeriodUnique: uniqueIndex("school_payouts_school_period_unique").on(
      table.schoolId,
      table.periodKey,
    ),
  }),
);

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
  type: studentTypeEnum("type").notNull().default("private"),
  defaultMode: lessonModeEnum("default_mode").notNull().default("in_person"),
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
  mode: lessonModeEnum("mode").notNull().default("in_person"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vacations = pgTable("vacations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  note: text("note"),
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
  mode: lessonModeEnum("mode").notNull().default("in_person"),
  vacationId: uuid("vacation_id").references(() => vacations.id, {
    onDelete: "set null",
  }),
  schoolPayoutId: uuid("school_payout_id").references(() => schoolPayouts.id, {
    onDelete: "set null",
  }),
  studentNotified: boolean("student_notified").notNull().default(false),
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

export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  platform: text("platform"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
