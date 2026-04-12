ALTER TABLE "jobs" ADD COLUMN "legitimacy_tier" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "legitimacy_score" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "legitimacy_signals" jsonb;--> statement-breakpoint
CREATE INDEX "idx_jobs_legitimacy_tier" ON "jobs" USING btree ("legitimacy_tier");