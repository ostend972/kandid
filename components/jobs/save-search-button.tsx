'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SaveSearchButtonProps {
  currentFilters: Record<string, string | string[] | null>;
}

export function SaveSearchButton({ currentFilters }: SaveSearchButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasFilters = Object.values(currentFilters).some(
    (v) => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
  );

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(currentFilters).filter(
          ([, v]) => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
        )
      );
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), filters: cleanFilters }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setOpen(false);
          setSaved(false);
          setName('');
        }, 1200);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1.5"
        disabled={!hasFilters}
        onClick={() => setOpen(true)}
      >
        <Bookmark className="h-4 w-4" />
        Sauvegarder
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sauvegarder cette recherche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="search-name">Nom de la recherche</Label>
              <Input
                id="search-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: CDI Geneve IT..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving}>
              {saved ? 'Sauvegarde !' : saving ? 'Enregistrement...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
