CREATE TYPE "public"."payout_frequency" AS ENUM('monthly', 'biweekly', 'weekly', 'per_lesson');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"school_id" uuid NOT NULL,
	"period_key" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"received_on" date NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"contact_name" text,
	"email" text,
	"payout_frequency" "payout_frequency" DEFAULT 'monthly' NOT NULL,
	"payout_day" integer,
	"payout_anchor" date,
	"notes" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "school_payout_id" uuid;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "school_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_payouts" ADD CONSTRAINT "school_payouts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "school_payouts" ADD CONSTRAINT "school_payouts_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schools" ADD CONSTRAINT "schools_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "school_payouts_school_period_unique" ON "school_payouts" USING btree ("school_id","period_key");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lessons" ADD CONSTRAINT "lessons_school_payout_id_school_payouts_id_fk" FOREIGN KEY ("school_payout_id") REFERENCES "public"."school_payouts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "students" ADD CONSTRAINT "students_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
