import { db } from '@/lib/db/drizzle';
import { jobs } from '@/lib/db/schema';
import { computeLegitimacyScore } from '@/lib/jobs/legitimacy-score';
import { isNull, eq } from 'drizzle-orm';

const BATCH_SIZE = 50;

async function main() {
  const unscoredJobs = await db
    .select()
    .from(jobs)
    .where(isNull(jobs.legitimacyTier));

  const total = unscoredJobs.length;
  if (total === 0) {
    console.log('No unscored jobs found — nothing to backfill.');
    return;
  }

  console.log(`Found ${total} jobs with null legitimacy_tier. Starting backfill...`);

  const tierCounts = { high: 0, caution: 0, suspicious: 0 };
  let processed = 0;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = unscoredJobs.slice(i, i + BATCH_SIZE);

    for (const job of batch) {
      const result = computeLegitimacyScore({
        publishedAt: job.publishedAt,
        expiresAt: job.expiresAt,
        description: job.description,
        skills: job.skills,
        salary: job.salary,
        contractType: job.contractType,
        activityRate: job.activityRate,
        status: job.status,
        email: job.email,
        languageSkills: job.languageSkills as unknown[] | null,
        categories: job.categories as unknown[] | null,
      });

      await db
        .update(jobs)
        .set({
          legitimacyTier: result.tier,
          legitimacyScore: result.score,
          legitimacySignals: result.signals,
        })
        .where(eq(jobs.id, job.id));

      tierCounts[result.tier]++;
    }

    processed += batch.length;
    console.log(`Scored ${processed}/${total} jobs...`);
  }

  console.log(
    `Backfill complete: ${tierCounts.high} high, ${tierCounts.caution} caution, ${tierCounts.suspicious} suspicious`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
