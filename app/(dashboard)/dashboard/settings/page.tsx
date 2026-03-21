import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getUserById } from '@/lib/db/kandid-queries';
import { SettingsPreferencesForm } from './preferences-form';
import { DeleteAccountSection } from './delete-account-section';

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await getUserById(userId);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parametres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerez votre profil et vos preferences.
        </p>
      </div>

      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>
            Votre profil est gere par Clerk. Cliquez sur votre avatar en haut a
            droite pour modifier vos informations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Nom</p>
              <p className="text-sm text-gray-900">
                {user?.fullName ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-900">
                {user?.email ?? '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences section */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Personnalisez votre experience sur Kandid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsPreferencesForm
            initialCantons={user?.preferredCantons ?? []}
            initialActivityRate={user?.preferredActivityRate ?? null}
            initialWeeklyDigest={user?.weeklyDigestEnabled ?? false}
          />
        </CardContent>
      </Card>

      {/* Subscription section */}
      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              Beta gratuite
            </Badge>
            <p className="text-sm text-gray-600">
              Acces complet a toutes les fonctionnalites
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zone dangereuse</CardTitle>
          <CardDescription>
            Actions irreversibles sur votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountSection />
        </CardContent>
      </Card>
    </div>
  );
}
