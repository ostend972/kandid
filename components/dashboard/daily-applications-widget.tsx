import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDailyApplicationStats } from '@/lib/db/kandid-queries';

export async function DailyApplicationsWidget({
  userId,
}: {
  userId: string;
}) {
  const { todayCount, streak } = await getDailyApplicationStats(userId);
  const progressPercent = Math.min(100, (todayCount / 5) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Objectif du jour</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{todayCount}</span>
          <span className="text-lg text-muted-foreground">/5</span>
        </div>

        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {todayCount >= 5
              ? 'Objectif atteint !'
              : `Encore ${5 - todayCount} candidature${5 - todayCount > 1 ? 's' : ''} pour atteindre l'objectif`}
          </p>
        </div>

        {streak > 0 ? (
          <p className="text-sm font-medium">
            🔥 {streak} jour{streak > 1 ? 's' : ''} consécutif
            {streak > 1 ? 's' : ''}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Postulez à 5 offres aujourd&apos;hui pour démarrer une série !
          </p>
        )}
      </CardContent>
    </Card>
  );
}
