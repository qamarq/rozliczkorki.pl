CREATE TYPE "public"."lesson_mode" AS ENUM('in_person', 'remote');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vacations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "mode" "lesson_mode" DEFAULT 'in_person' NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "vacation_id" uuid;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "student_notified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_rules" ADD COLUMN "mode" "lesson_mode" DEFAULT 'in_person' NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "default_mode" "lesson_mode" DEFAULT 'in_person' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vacations" ADD CONSTRAINT "vacations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lessons" ADD CONSTRAINT "lessons_vacation_id_vacations_id_fk" FOREIGN KEY ("vacation_id") REFERENCES "public"."vacations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
