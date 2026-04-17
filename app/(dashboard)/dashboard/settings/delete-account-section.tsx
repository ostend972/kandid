'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { deleteAccountAction } from './actions';

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    const result = await deleteAccountAction();

    // If we get here, redirect didn't happen — there was an error
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Supprimer mon compte</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Supprimer votre compte
          </DialogTitle>
          <DialogDescription>
            Cette action est{' '}
            <span className="font-semibold text-destructive">irreversible</span>.
            Toutes vos donnees seront definitivement supprimees, y compris :
          </DialogDescription>
        </DialogHeader>

        <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
          <li>Vos analyses de CV et fichiers importes</li>
          <li>Vos offres d&apos;emploi sauvegardees</li>
          <li>Vos resultats de matching</li>
          <li>Vos preferences et parametres</li>
          <li>Votre compte utilisateur</li>
        </ul>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression en cours...
              </>
            ) : (
              'Confirmer la suppression'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
