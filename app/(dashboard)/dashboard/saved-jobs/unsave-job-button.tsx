'use client';

import { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { unsaveJobAction } from './actions';

interface UnsaveJobButtonProps {
  jobId: string;
}

export function UnsaveJobButton({ jobId }: UnsaveJobButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleUnsave() {
    startTransition(async () => {
      await unsaveJobAction(jobId);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleUnsave}
      disabled={isPending}
      className="text-gray-400 hover:text-red-600 shrink-0"
      title="Retirer des offres sauvegardees"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
