ALTER TABLE "ai_generations_log" ADD COLUMN "prompt_tokens" integer;--> statement-breakpoint
ALTER TABLE "ai_generations_log" ADD COLUMN "completion_tokens" integer;--> statement-breakpoint
ALTER TABLE "ai_generations_log" ADD COLUMN "total_tokens" integer;--> statement-breakpoint
ALTER TABLE "ai_generations_log" ADD COLUMN "cost_usd" text;