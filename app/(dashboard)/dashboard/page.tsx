import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Briefcase,
  BarChart3,
  Bookmark,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getUserById,
  getUserStats,
  getCvAnalysesByUserId,
} from '@/lib/db/kandid-queries';
import { ActiveCvSelector } from '@/components/dashboard/active-cv-selector';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const [user, stats, analyses] = await Promise.all([
    getUserById(userId),
    getUserStats(userId),
    getCvAnalysesByUserId(userId),
  ]);

  const firstName = user?.fullName?.split(' ')[0] ?? 'Candidat';
  const activeCv = analyses.find((a) => a.id === user?.activeCvAnalysisId);

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Bonjour {firstName}</CardTitle>
          <CardDescription>
            Bienvenue sur votre tableau de bord Kandid. Analysez votre CV et
            trouvez les meilleures offres en Suisse romande.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Dernier score CV
                </p>
                <p className="text-2xl font-bold">
                  {stats.lastScore !== null ? `${stats.lastScore}/100` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Analyses effectuees
                </p>
                <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Bookmark className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Offres sauvegardees
                </p>
                <p className="text-2xl font-bold">{stats.savedJobsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick action buttons */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/cv-analysis">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Analyser un CV</p>
                  <p className="text-sm text-muted-foreground">
                    Obtenez votre score ATS
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/jobs">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Chercher des offres</p>
                  <p className="text-sm text-muted-foreground">
                    Parcourez les offres en Suisse romande
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Active CV card or empty state */}
      {analyses.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Profil actif</CardTitle>
              <ActiveCvSelector
                analyses={analyses.map((a) => ({
                  id: a.id,
                  fileName: a.fileName,
                  overallScore: a.overallScore,
                  createdAt: a.createdAt,
                }))}
                activeCvId={user?.activeCvAnalysisId ?? null}
              />
            </div>
          </CardHeader>
          <CardContent>
            {activeCv ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="font-medium">{activeCv.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Analyse le{' '}
                    {activeCv.createdAt
                      ? new Date(activeCv.createdAt).toLocaleDateString('fr-CH')
                      : '—'}{' '}
                    — Score : {activeCv.overallScore}/100
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun CV actif selectionne. Cliquez sur "Changer" pour en
                choisir un.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <FileText className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Commencez par analyser votre CV
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-600">
              Commencez par analyser votre CV pour decouvrir votre score ATS et
              obtenir des recommandations personnalisees.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/cv-analysis">
                <FileText className="mr-2 h-4 w-4" />
                Analyser mon CV
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
