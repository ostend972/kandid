/**
 * Script interactif pour piloter le scraper Kandid.
 *
 * Usage :
 *   npx tsx scripts/scrape.ts
 *   npm run scrape
 */

import { config as loadEnv } from 'dotenv';
import path from 'path';

// Charger les deux fichiers env (.env.local prioritaire, puis .env)
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '.env') });

import postgres from 'postgres';
import { spawn } from 'child_process';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

// ─── Couleurs terminal (pas de dependance) ─────────────────────────────────
const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// ─── DB connection (lazy) ──────────────────────────────────────────────────
let _sql: ReturnType<typeof postgres> | null = null;
function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL manquante dans .env');
    }
    _sql = postgres(process.env.DATABASE_URL, { max: 5 });
  }
  return _sql;
}

// ─── Scraper path ──────────────────────────────────────────────────────────
const SCRAPER_DIR = path.resolve(process.cwd(), '..', 'kandid-scraper');

// ─── Helpers d'affichage ───────────────────────────────────────────────────
function hr() {
  console.log(c.gray + '─'.repeat(60) + c.reset);
}

function header(title: string) {
  console.clear();
  console.log(c.cyan + c.bold + '╔' + '═'.repeat(58) + '╗' + c.reset);
  console.log(c.cyan + c.bold + '║  ' + title.padEnd(56) + '║' + c.reset);
  console.log(c.cyan + c.bold + '╚' + '═'.repeat(58) + '╝' + c.reset);
  console.log();
}

function fmt(n: number | bigint): string {
  return Number(n).toLocaleString('fr-CH');
}

// ─── Actions ───────────────────────────────────────────────────────────────

async function showStats() {
  header('Statistiques actuelles');
  const sql = getSql();

  const [{ count: active }] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE status = 'active'`;
  const [{ count: expired }] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE status = 'expired'`;
  const [{ count: reposted }] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE status = 'reposted'`;
  const [{ last_scrape }] = await sql`SELECT MAX(last_seen_at) as last_scrape FROM jobs`;

  const sources = await sql<{ source: string; count: number }[]>`
    SELECT source, COUNT(*)::int as count FROM jobs
    WHERE status = 'active'
    GROUP BY source ORDER BY count DESC
  `;

  const tiers = await sql<{ legitimacy_tier: string; count: number }[]>`
    SELECT legitimacy_tier, COUNT(*)::int as count FROM jobs
    WHERE status = 'active' AND legitimacy_tier IS NOT NULL
    GROUP BY legitimacy_tier ORDER BY count DESC
  `;

  const added24h = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int as count FROM jobs
    WHERE created_at > NOW() - INTERVAL '24 hours'
  `;

  console.log(c.green + c.bold + '  Actives       : ' + c.reset + fmt(active));
  console.log(c.yellow + c.bold + '  Expirees      : ' + c.reset + fmt(expired));
  console.log(c.blue + c.bold + '  Repostees     : ' + c.reset + fmt(reposted));
  console.log(c.magenta + c.bold + '  Nouvelles 24h : ' + c.reset + fmt(added24h[0].count));
  console.log(c.gray + '  Dernier scrape: ' + c.reset + (last_scrape ? new Date(last_scrape).toLocaleString('fr-CH') : 'jamais'));

  hr();
  console.log(c.bold + '  Sources (actives) :' + c.reset);
  for (const s of sources) {
    console.log(`    ${s.source.padEnd(15)} ${fmt(s.count)}`);
  }

  if (tiers.length > 0) {
    hr();
    console.log(c.bold + '  Legitimite (actives) :' + c.reset);
    for (const t of tiers) {
      const color = t.legitimacy_tier === 'trusted' ? c.green
        : t.legitimacy_tier === 'verified' ? c.cyan
        : t.legitimacy_tier === 'suspicious' ? c.yellow
        : c.red;
      console.log(`    ${color}${t.legitimacy_tier.padEnd(12)}${c.reset} ${fmt(t.count)}`);
    }
  }

  console.log();
}

async function showLatestJobs(limit = 10) {
  header(`${limit} dernieres offres scrapees`);
  const sql = getSql();

  const jobs = await sql<
    { title: string; company: string; canton: string; source: string; created_at: Date }[]
  >`
    SELECT title, company, canton, source, created_at FROM jobs
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  if (jobs.length === 0) {
    console.log(c.gray + '  Aucune offre.' + c.reset);
    return;
  }

  for (const j of jobs) {
    const when = new Date(j.created_at).toLocaleString('fr-CH', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
    console.log(
      `  ${c.gray}${when}${c.reset}  ` +
      `${c.bold}${(j.title || '').slice(0, 45).padEnd(45)}${c.reset}  ` +
      `${c.cyan}${(j.company || '').slice(0, 22).padEnd(22)}${c.reset}  ` +
      `${c.yellow}${(j.canton || '—').padEnd(4)}${c.reset}  ` +
      `${c.magenta}${j.source}${c.reset}`
    );
  }
  console.log();
}

function runScraper(): Promise<number> {
  return new Promise((resolve) => {
    header('Lancement du scraper');
    console.log(c.gray + `  ${SCRAPER_DIR}` + c.reset);
    hr();

    const child = spawn('npx', ['tsx', 'cron.ts'], {
      cwd: SCRAPER_DIR,
      shell: true,
      stdio: 'inherit',
      env: { ...process.env },
    });

    child.on('close', (code) => {
      hr();
      if (code === 0) {
        console.log(c.green + c.bold + `  Scraper termine (code ${code})` + c.reset);
      } else {
        console.log(c.red + c.bold + `  Scraper termine avec erreur (code ${code})` + c.reset);
      }
      resolve(code ?? 0);
    });

    child.on('error', (err) => {
      console.log(c.red + `  Erreur lancement : ${err.message}` + c.reset);
      resolve(1);
    });
  });
}

async function purgeExpired(rl: readline.Interface) {
  header('Purge des offres expirees');
  const sql = getSql();

  const [{ count: expiredCount }] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE status = 'expired'`;
  const [{ count: savedCount }] = await sql`
    SELECT COUNT(*)::int as count FROM saved_jobs sj
    INNER JOIN jobs j ON j.id = sj.job_id
    WHERE j.status = 'expired'
  `;
  const [{ count: matchCount }] = await sql`
    SELECT COUNT(*)::int as count FROM job_matches jm
    INNER JOIN jobs j ON j.id = jm.job_id
    WHERE j.status = 'expired'
  `;

  console.log(`  Offres expirees     : ${c.yellow}${fmt(expiredCount)}${c.reset}`);
  console.log(`  Sauvegardes liees   : ${c.yellow}${fmt(savedCount)}${c.reset}`);
  console.log(`  Matches lies        : ${c.yellow}${fmt(matchCount)}${c.reset}`);
  console.log(c.red + '\n  Ces suppressions sont irreversibles.' + c.reset);

  if (expiredCount === 0) {
    console.log(c.gray + '  Rien a purger.' + c.reset);
    return;
  }

  const confirm = (await rl.question(c.bold + '\n  Confirmer la purge ? (oui/non) : ' + c.reset)).trim().toLowerCase();
  if (confirm !== 'oui' && confirm !== 'o' && confirm !== 'y' && confirm !== 'yes') {
    console.log(c.gray + '  Annule.' + c.reset);
    return;
  }

  const result = await sql`DELETE FROM jobs WHERE status = 'expired'`;
  console.log(c.green + c.bold + `\n  ${fmt(result.count)} offres supprimees.` + c.reset);
}

async function searchJobs(rl: readline.Interface) {
  header('Rechercher dans les offres scrapees');
  const sql = getSql();

  const q = (await rl.question('  Mot-cle (titre ou entreprise) : ')).trim();
  if (!q) {
    console.log(c.gray + '  Annule.' + c.reset);
    return;
  }

  const pattern = `%${q}%`;
  const jobs = await sql<
    { title: string; company: string; canton: string; source: string; status: string }[]
  >`
    SELECT title, company, canton, source, status FROM jobs
    WHERE title ILIKE ${pattern} OR company ILIKE ${pattern}
    ORDER BY created_at DESC
    LIMIT 30
  `;

  console.log(c.gray + `\n  ${jobs.length} resultat(s)\n` + c.reset);
  for (const j of jobs) {
    const statusColor = j.status === 'active' ? c.green : j.status === 'expired' ? c.yellow : c.blue;
    console.log(
      `  ${statusColor}●${c.reset} ${c.bold}${(j.title || '').slice(0, 45).padEnd(45)}${c.reset}  ` +
      `${c.cyan}${(j.company || '').slice(0, 22).padEnd(22)}${c.reset}  ` +
      `${c.yellow}${(j.canton || '—').padEnd(4)}${c.reset}  ` +
      `${c.magenta}${j.source}${c.reset}`
    );
  }
}

// ─── Menu ──────────────────────────────────────────────────────────────────

const MENU = [
  { key: '1', label: 'Voir les statistiques', action: 'stats' },
  { key: '2', label: 'Lancer un scrape complet', action: 'run' },
  { key: '3', label: 'Voir les 10 dernieres offres', action: 'latest' },
  { key: '4', label: 'Rechercher une offre', action: 'search' },
  { key: '5', label: 'Purger les offres expirees', action: 'purge' },
  { key: 'q', label: 'Quitter', action: 'quit' },
] as const;

function renderMenu() {
  header('Kandid Scraper — Console interactive');
  console.log(c.bold + '  Que voulez-vous faire ?' + c.reset + '\n');
  for (const item of MENU) {
    console.log(`    ${c.cyan}${c.bold}[${item.key}]${c.reset}  ${item.label}`);
  }
  console.log();
}

// ─── Main loop ─────────────────────────────────────────────────────────────

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    while (true) {
      renderMenu();
      const choice = (await rl.question(c.bold + '  Choix : ' + c.reset)).trim().toLowerCase();
      const item = MENU.find((m) => m.key === choice);

      if (!item) {
        console.log(c.red + '  Choix invalide.' + c.reset);
        await rl.question(c.gray + '\n  Entree pour continuer...' + c.reset);
        continue;
      }

      try {
        switch (item.action) {
          case 'stats':
            await showStats();
            break;
          case 'run':
            await runScraper();
            break;
          case 'latest':
            await showLatestJobs(10);
            break;
          case 'search':
            await searchJobs(rl);
            break;
          case 'purge':
            await purgeExpired(rl);
            break;
          case 'quit':
            console.log(c.gray + '\n  A bientot.' + c.reset);
            return;
        }
      } catch (err) {
        console.log(c.red + `\n  Erreur : ${(err as Error).message}` + c.reset);
      }

      await rl.question(c.gray + '\n  Entree pour revenir au menu...' + c.reset);
    }
  } finally {
    rl.close();
    if (_sql) await _sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(c.red + 'FATAL :', err, c.reset);
  process.exit(1);
});
