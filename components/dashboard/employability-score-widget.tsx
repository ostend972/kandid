import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getUserById,
  getCvAnalysisById,
  getEmployabilityScoreData,
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

function ScoreBar({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      {hint && (
        <p className="text-xs text-amber-600">
          <Link href={hint} className="hover:underline">
            {label.includes('CV')
              ? 'Analysez votre CV →'
              : 'Complétez votre profil →'}
          </Link>
        </p>
      )}
    </div>
  );
}

export async function EmployabilityScoreWidget({
  userId,
}: {
  userId: string;
}) {
  const [user, cadenceData] = await Promise.all([
    getUserById(userId),
    getEmployabilityScoreData(userId),
  ]);

  let cvQuality = 0;
  if (user?.activeCvAnalysisId) {
    const cv = await getCvAnalysisById(user.activeCvAnalysisId);
    cvQuality = cv?.overallScore ?? 0;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Score Employabilité</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{compositeScore}</span>
          <span className="text-lg text-muted-foreground">/100</span>
        </div>

        <div className="space-y-3">
          <ScoreBar
            label="Profil"
            value={profileCompleteness}
            hint={profileCompleteness < 100 ? '/dashboard/profile' : undefined}
          />
          <ScoreBar
            label="Qualité CV"
            value={cvQuality}
            hint={cvQuality === 0 ? '/dashboard/cv-analysis' : undefined}
          />
          <ScoreBar
            label="Cadence"
            value={cadence}
            hint={cadence < 50 ? '/dashboard/jobs' : undefined}
          />
        </div>
      </CardContent>
    </Card>
  );
}
