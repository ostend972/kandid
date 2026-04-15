'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SavedSearchActionsProps {
  searchId: string;
  emailAlertEnabled: boolean;
}

export function SavedSearchActions({
  searchId,
  emailAlertEnabled,
}: SavedSearchActionsProps) {
  const router = useRouter();
  const [alertEnabled, setAlertEnabled] = useState(emailAlertEnabled);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggleAlert() {
    setToggling(true);
    try {
      const res = await fetch(`/api/saved-searches/${searchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAlertEnabled: !alertEnabled }),
      });
      if (res.ok) {
        setAlertEnabled(!alertEnabled);
        router.refresh();
      }
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/saved-searches/${searchId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={toggleAlert}
        disabled={toggling}
        title={alertEnabled ? 'Desactiver alerte' : 'Activer alerte email'}
      >
        {toggling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : alertEnabled ? (
          <Bell className="h-4 w-4 text-primary" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={handleDelete}
        disabled={deleting}
        title="Supprimer"
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}
