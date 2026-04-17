'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { syncExistingUserOnboarding } from './actions';

export function SyncExistingUser() {
  const router = useRouter();

  useEffect(() => {
    syncExistingUserOnboarding().then(() => {
      router.replace('/dashboard');
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirection en cours...</p>
    </div>
  );
}
