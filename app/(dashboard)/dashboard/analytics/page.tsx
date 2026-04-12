import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getApplicationStatusFunnel,
  getApplicationsByCanton,
  getApplicationsByContractType,
  getApplicationWeeklyTrend,
  getTopSkillGaps,
  getConversionStats,
  countApplicationsByUser,
} from '@/lib/db/kandid-queries';
import { StatusFunnelChart } from '@/components/analytics/status-funnel-chart';
import { CantonChart } from '@/components/analytics/canton-chart';
import { ContractTypeChart } from '@/components/analytics/contract-type-chart';
import { WeeklyTrendChart } from '@/components/analytics/weekly-trend-chart';
import { SkillGapsChart } from '@/components/analytics/skill-gaps-chart';
import { ConversionStats } from '@/components/analytics/conversion-stats';

export const metadata = { title: 'Statistiques | Kandid' };

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const totalCount = await countApplicationsByUser(userId);

  if (totalCount < 5) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <BarChart3 className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Pas encore assez de données</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Vous avez besoin d&apos;au moins 5 candidatures pour voir vos statistiques.
        </p>
        <Button asChild>
          <Link href="/dashboard/jobs">Parcourir les offres</Link>
        </Button>
      </div>
    );
  }

  const [funnel, cantons, contracts, trend, skills, conversion] =
    await Promise.all([
      getApplicationStatusFunnel(userId),
      getApplicationsByCanton(userId),
      getApplicationsByContractType(userId),
      getApplicationWeeklyTrend(userId),
      getTopSkillGaps(userId),
      getConversionStats(userId),
    ]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Statistiques</h1>

      <ConversionStats data={conversion} />

      <StatusFunnelChart data={funnel} />

      <div className="grid gap-6 md:grid-cols-2">
        <CantonChart data={cantons} />
        <ContractTypeChart data={contracts} />
      </div>

      <WeeklyTrendChart data={trend} />

      {skills.length > 0 && <SkillGapsChart data={skills} />}
    </div>
  );
}
