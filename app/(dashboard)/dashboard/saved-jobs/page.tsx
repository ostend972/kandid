import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, Briefcase, MapPin, Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSavedJobs } from '@/lib/db/kandid-queries';
import { UnsaveJobButton } from './unsave-job-button';

export default async function SavedJobsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const savedJobs = await getSavedJobs(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Offres sauvegardees
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Retrouvez toutes les offres que vous avez mises de cote.
        </p>
      </div>

      {savedJobs.length > 0 ? (
        <div className="space-y-3">
          {savedJobs.map(({ savedJob, job }) => (
            <Card key={savedJob.id}>
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.canton}
                    </span>
                    {job.contractType && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {job.contractType}
                      </span>
                    )}
                    {job.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(job.publishedAt).toLocaleDateString('fr-CH')}
                      </span>
                    )}
                  </div>
                </div>
                <UnsaveJobButton jobId={job.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Bookmark className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Aucune offre sauvegardee
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-600">
              Sauvegardez des offres pour les retrouver ici.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/jobs">
                <Briefcase className="mr-2 h-4 w-4" />
                Chercher des offres
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
