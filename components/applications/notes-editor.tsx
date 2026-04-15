'use client';

import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';

export function NotesEditor({
  applicationId,
  initialNotes,
}: {
  applicationId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silent fail — user can retry on next blur
    }
  }, [applicationId, notes]);

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        placeholder="Ajoutez vos notes ici..."
        rows={4}
        className="resize-y"
      />
      {saved && (
        <p className="text-xs text-green-600">Sauvegardé</p>
      )}
    </div>
  );
}
