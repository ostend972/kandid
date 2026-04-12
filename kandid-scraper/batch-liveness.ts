import { chromium, type Page } from "playwright";
import postgres from "postgres";
import dotenv from "dotenv";
import { classifyLiveness } from "./liveness-check";
import { computeLegitimacyScore, type LegitimacyInput } from "./legitimacy-score";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../.env.local" });

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("[batch-liveness] DATABASE_URL or POSTGRES_URL not set");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 5 });

const BATCH_LIMIT = 200;
const NAV_TIMEOUT = 15_000;
const SPA_HYDRATION_WAIT = 2_000;
const INTER_NAV_DELAY = 500;
const PAGE_RESTART_INTERVAL = 100;

interface CandidateJob {
  id: string;
  source_url: string;
  legitimacy_signals: unknown;
  published_at: string | null;
  expires_at: string | null;
  description: string | null;
  skills: string[] | null;
  salary: string | null;
  contract_type: string | null;
  activity_rate: string | null;
  status: string | null;
  email: string | null;
  language_skills: unknown[] | null;
  categories: unknown[] | null;
}

async function checkUrl(
  page: Page,
  url: string,
): ReturnType<typeof classifyLiveness> {
  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT,
    });

    const status = response?.status() ?? 0;
    await page.waitForTimeout(SPA_HYDRATION_WAIT);

    const finalUrl = page.url();
    const bodyText = await page.evaluate(
      () => document.body?.innerText ?? "",
    );
    const applyControls: string[] = await page.evaluate(() => {
      const candidates = Array.from(
        document.querySelectorAll(
          'a, button, input[type="submit"], input[type="button"], [role="button"]',
        ),
      );

      return candidates
        .filter((element) => {
          if (element.closest("nav, header, footer")) return false;
          if (element.closest('[aria-hidden="true"]')) return false;

          const style = window.getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden")
            return false;
          if (!element.getClientRects().length) return false;

          return Array.from(element.getClientRects()).some(
            (rect) => rect.width > 0 && rect.height > 0,
          );
        })
        .map((element) => {
          const el = element as HTMLElement & { value?: string };
          const label = [
            el.innerText,
            el.value,
            el.getAttribute("aria-label"),
            el.getAttribute("title"),
          ]
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          return label;
        })
        .filter(Boolean);
    });

    return classifyLiveness({ status, finalUrl, bodyText, applyControls });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message.split("\n")[0] : String(err);
    return { result: "expired", reason: `navigation error: ${msg}` };
  }
}

async function main() {
  const startTime = Date.now();
  console.log("[batch-liveness] Starting liveness batch check...");

  // Verify Chromium is available
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[batch-liveness] Chromium not installed or failed to launch: ${msg}`,
    );
    console.error(
      "[batch-liveness] Run: npx playwright install chromium",
    );
    await sql.end();
    process.exit(1);
  }

  let jobs: CandidateJob[];
  try {
    jobs = await sql<CandidateJob[]>`
      SELECT id, source_url, legitimacy_signals,
             published_at, expires_at, description, skills, salary,
             contract_type, activity_rate, status, email,
             language_skills, categories
      FROM jobs
      WHERE status IN ('active', 'reposted')
        AND (
          legitimacy_tier IN ('caution', 'suspicious')
          OR last_checked_at IS NULL
          OR last_checked_at < NOW() - INTERVAL '7 days'
        )
      LIMIT ${BATCH_LIMIT}
    `;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[batch-liveness] DB query failed: ${msg}`);
    await browser.close();
    await sql.end();
    process.exit(1);
  }

  console.log(`[batch-liveness] Found ${jobs.length} jobs to check`);

  if (jobs.length === 0) {
    await browser.close();
    await sql.end();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[batch-liveness] No jobs to check. Duration: ${duration}s`,
    );
    return;
  }

  let page = await browser.newPage();
  const counts = { active: 0, expired: 0, uncertain: 0, error: 0 };

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];

    // Restart page every N URLs to prevent memory leaks
    if (i > 0 && i % PAGE_RESTART_INTERVAL === 0) {
      await page.close();
      page = await browser.newPage();
      console.log(
        `[batch-liveness] Page restarted at URL #${i}`,
      );
    }

    const { result, reason } = await checkUrl(page, job.source_url);
    counts[result]++;

    const livenessSignal = {
      signal: "liveness_check",
      finding: result,
      reason,
      checked_at: new Date().toISOString(),
    };

    const existingSignals = Array.isArray(job.legitimacy_signals)
      ? job.legitimacy_signals
      : [];
    const updatedSignals = [...existingSignals, livenessSignal];

    const scoringInput: LegitimacyInput = {
      publishedAt: job.published_at,
      expiresAt: job.expires_at,
      description: job.description,
      skills: job.skills,
      salary: job.salary,
      contractType: job.contract_type,
      activityRate: job.activity_rate,
      status: job.status,
      email: job.email,
      languageSkills: job.language_skills,
      categories: job.categories,
    };
    const scored = computeLegitimacyScore(scoringInput, undefined, result);

    try {
      await sql`
        UPDATE jobs
        SET legitimacy_signals = ${JSON.stringify(updatedSignals)}::jsonb,
            last_checked_at = NOW(),
            legitimacy_tier = ${scored.tier},
            legitimacy_score = ${scored.score}
        WHERE id = ${job.id}
      `;
    } catch (err) {
      counts.error++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[batch-liveness] DB update failed for job ${job.id}: ${msg}`,
      );
    }

    const icon = { active: "\u2705", expired: "\u274C", uncertain: "\u26A0\uFE0F" }[result];
    console.log(
      `[batch-liveness] ${icon} ${result.padEnd(10)} ${job.source_url} — ${reason}`,
    );

    // Delay between navigations to avoid rate limiting
    if (i < jobs.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, INTER_NAV_DELAY));
    }
  }

  await page.close();
  await browser.close();
  await sql.end();

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `[batch-liveness] Done. active=${counts.active} expired=${counts.expired} uncertain=${counts.uncertain} errors=${counts.error} duration=${duration}s`,
  );
}

main().catch((err) => {
  console.error(`[batch-liveness] Fatal: ${err.message}`);
  sql.end().finally(() => process.exit(1));
});
