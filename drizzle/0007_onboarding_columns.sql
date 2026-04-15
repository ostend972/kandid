ALTER TABLE "users" ADD COLUMN "onboarding_step" integer;
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp;
ALTER TABLE "users" ADD COLUMN "sector" text;
ALTER TABLE "users" ADD COLUMN "position" text;
ALTER TABLE "users" ADD COLUMN "experience_level" text;
ALTER TABLE "users" ADD COLUMN "target_cantons" text[] DEFAULT '{}'::text[];
ALTER TABLE "users" ADD COLUMN "languages" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "users" ADD COLUMN "salary_expectation" text;
ALTER TABLE "users" ADD COLUMN "availability" text;
ALTER TABLE "users" ADD COLUMN "contract_types" text[] DEFAULT '{}'::text[];
ALTER TABLE "users" ADD COLUMN "career_summary" text;
ALTER TABLE "users" ADD COLUMN "strengths" text[] DEFAULT '{}'::text[];
ALTER TABLE "users" ADD COLUMN "motivation" text;
ALTER TABLE "users" ADD COLUMN "differentiator" text;
-- Mark existing users as onboarding-complete so they are NOT redirected
UPDATE "users" SET "onboarding_step" = 2, "onboarding_completed_at" = NOW() WHERE "onboarding_step" IS NULL;
