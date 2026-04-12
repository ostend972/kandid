CREATE TYPE "public"."application_status" AS ENUM('draft', 'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TABLE "application_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" text NOT NULL,
	"to_status" text NOT NULL,
	"triggered_by" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."application_status";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE "public"."application_status" USING "status"::"public"."application_status";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "last_status_changed_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "next_follow_up_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "follow_up_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "last_reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "application_transitions" ADD CONSTRAINT "application_transitions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_application_transitions_app" ON "application_transitions" USING btree ("application_id");