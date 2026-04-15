CREATE TABLE IF NOT EXISTS "linkedin_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS "linkedin_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "profile_id" uuid NOT NULL REFERENCES "linkedin_profiles"("id") ON DELETE CASCADE,
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

CREATE UNIQUE INDEX IF NOT EXISTS "idx_linkedin_profiles_user" ON "linkedin_profiles" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_linkedin_profiles_user_id" ON "linkedin_profiles" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_linkedin_posts_user" ON "linkedin_posts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_linkedin_posts_profile" ON "linkedin_posts" ("profile_id");
CREATE INDEX IF NOT EXISTS "idx_linkedin_posts_batch" ON "linkedin_posts" ("generation_batch");
