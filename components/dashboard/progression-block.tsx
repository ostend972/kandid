import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  getUserById,
  getCvAnalysisById,
  getEmployabilityScoreData,
  getDailyApplicationStats,
} from '@/lib/db/kandid-queries';

const PROFILE_FIELDS = [
  'sector',
  'position',
  'experienceLevel',
  'targetCantons',
  'languages',
  'salaryExpectation',
  'availability',
  'contractTypes',
  'careerSummary',
  'strengths',
  'motivation',
  'differentiator',
] as const;

function computeProfileCompleteness(user: Record<string, unknown>): number {
  let filled = 0;
  for (const field of PROFILE_FIELDS) {
    const val = user[field];
    if (val === null || val === undefined || val === '') continue;
    if (Array.isArray(val) && val.length === 0) continue;
    filled++;
  }
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

type RowProps = {
  index: string;
  label: string;
  value: string;
  progress: number;
  href: string;
  hint: string;
};

function Row({ index, label, value, progress, href, hint }: RowProps) {
  return (
    <Link
      href={href}
      className="group -mx-2 flex items-center gap-5 rounded-2xl px-2 py-4 transition-colors hover:bg-[#f7f7f7] dark:hover:bg-white/5"
    >
      <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">{index}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm tabular-nums text-muted-foreground">{value}</p>
        </div>
        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#efefef] dark:bg-white/10">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-500"
            style={{ width: `${Math.max(2, progress)}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

export async function ProgressionBlock({ userId }: { userId: string }) {
  const [user, cadenceData, daily] = await Promise.all([
    getUserById(userId),
    getEmployabilityScoreData(userId),
    getDailyApplicationStats(userId),
  ]);

  let cvQuality = 0;
  let activeCvName: string | null = null;
  if (user?.activeCvAnalysisId) {
    const cv = await getCvAnalysisById(user.activeCvAnalysisId);
    cvQuality = cv?.overallScore ?? 0;
    activeCvName = cv?.fileName ?? null;
  }

  const profileCompleteness = user
    ? computeProfileCompleteness(user as unknown as Record<string, unknown>)
    : 0;
  const cadence = Math.min(
    100,
    Math.round((cadenceData.recentApplicationsCount / 150) * 100)
  );
  const compositeScore = Math.round(
    profileCompleteness * 0.3 + cvQuality * 0.4 + cadence * 0.3
  );

  const profileHint =
    profileCompleteness === 100
      ? 'Profil complet'
      : `${PROFILE_FIELDS.length - Math.round((profileCompleteness / 100) * PROFILE_FIELDS.length)} champs à remplir`;

  const cvHint = activeCvName
    ? `Dossier actif : ${activeCvName}`
    : 'Aucun CV analysé — priorité absolue';

  const cadenceHint =
    cadenceData.recentApplicationsCount === 0
      ? `Aujourd'hui : ${daily.todayCount}/5 candidatures`
      : `${cadenceData.recentApplicationsCount} candidatures sur 30 jours`;

  return (
    <section className="rounded-3xl border border-border bg-background p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Employabilité
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">
              {compositeScore}
            </span>
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">
          Moyenne pondérée de votre profil, de la qualité de votre CV et de votre cadence de
          candidatures.
        </p>
      </div>

      <div className="mt-6 border-t border-border pt-2">
        <Row
          index="01"
          label="Qualité CV"
          value={cvQuality > 0 ? `${cvQuality}/100` : '—'}
          progress={cvQuality}
          href="/dashboard/cv-analysis"
          hint={cvHint}
        />
        <Row
          index="02"
          label="Profil"
          value={`${profileCompleteness}%`}
          progress={profileCompleteness}
          href="/dashboard/settings"
          hint={profileHint}
        />
        <Row
          index="03"
          label="Cadence"
          value={`${cadence}%`}
          progress={cadence}
          href="/dashboard/jobs"
          hint={cadenceHint}
        />
      </div>
    </section>
  );
}
