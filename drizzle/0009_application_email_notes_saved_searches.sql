CREATE TABLE "linkedin_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"profile_id" uuid NOT NULL,
	"week_number" integer NOT NULL,
	"day_of_week" text NOT NULL,
	"content_type" text NOT NULL,
	"title" text NOT NULL,
	"draft_content" text NOT NULL,
	"user_content" text,
	"generation_batch" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linkedin_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source" text NOT NULL,
	"raw_text" text,
	"file_url" text,
	"file_name" text,
	"structured" jsonb NOT NULL,
	"headline" text,
	"summary" text,
	"audit_score" integer,
	"audit_result" jsonb,
	"optimized_headline" text,
	"optimized_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb NOT NULL,
	"email_alert_enabled" boolean DEFAULT false NOT NULL,
	"last_alert_at" timestamp,
	"last_alert_job_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "email_sent_to" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "email_send_status" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "email_send_attempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_step" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sector" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "experience_level" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "target_cantons" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "languages" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "salary_expectation" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "availability" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contract_types" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "career_summary" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "strengths" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "motivation" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "differentiator" text;--> statement-breakpoint
ALTER TABLE "linkedin_posts" ADD CONSTRAINT "linkedin_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linkedin_posts" ADD CONSTRAINT "linkedin_posts_profile_id_linkedin_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."linkedin_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linkedin_profiles" ADD CONSTRAINT "linkedin_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_linkedin_posts_user" ON "linkedin_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_linkedin_posts_profile" ON "linkedin_posts" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_linkedin_posts_batch" ON "linkedin_posts" USING btree ("generation_batch");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_linkedin_profiles_user" ON "linkedin_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_linkedin_profiles_user_id" ON "linkedin_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_searches_user" ON "saved_searches" USING btree ("user_id");