ALTER TABLE "jobs" ADD COLUMN "benefit_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "employment_position_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "industry_id" integer;