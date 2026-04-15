import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, BellOff, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSavedSearches } from '@/lib/db/kandid-queries';
import { SavedSearchActions } from './saved-searches-client';

export default async function SavedSearchesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const searches = await getSavedSearches(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Recherches sauvegardees
          </h1>
          <p className="text-muted-foreground">
            Retrouvez vos criteres de recherche et activez les alertes email.
          </p>
        </div>
      </div>

      {searches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">
              Aucune recherche sauvegardee
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Allez sur la page{' '}
              <Link href="/dashboard/jobs" className="text-primary underline">
                Emplois
              </Link>{' '}
              et sauvegardez vos filtres pour les retrouver ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {searches.map((search) => {
            const filters = (search.filters ?? {}) as Record<string, unknown>;
            const filterParams = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
              if (Array.isArray(value)) {
                value.forEach((v) => filterParams.append(key, String(v)));
              } else if (value != null && value !== '') {
                filterParams.set(key, String(value));
              }
            }
            const searchUrl = `/dashboard/jobs?${filterParams.toString()}`;

            return (
              <Card key={search.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{search.name}</h3>
                      {search.emailAlertEnabled && (
                        <Badge variant="secondary" className="shrink-0 gap-1">
                          <Bell className="h-3 w-3" />
                          Alerte
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(filters).map(([key, value]) => {
                        const label = Array.isArray(value)
                          ? value.join(', ')
                          : String(value);
                        if (!label) return null;
                        return (
                          <Badge
                            key={key}
                            variant="outline"
                            className="text-xs"
                          >
                            {key}: {label}
                          </Badge>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cree le{' '}
                      {new Date(search.createdAt).toLocaleDateString('fr-CH')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <SavedSearchActions
                      searchId={search.id}
                      emailAlertEnabled={search.emailAlertEnabled}
                    />
                    <Link href={searchUrl}>
                      <Badge
                        variant="default"
                        className="cursor-pointer gap-1"
                      >
                        Rechercher
                        <ArrowRight className="h-3 w-3" />
                      </Badge>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
