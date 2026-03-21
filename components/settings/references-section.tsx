'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { CandidateReference } from '@/lib/db/schema';
import {
  createReferenceAction,
  updateReferenceAction,
  deleteReferenceAction,
} from '@/app/(dashboard)/dashboard/settings/actions';

interface ReferencesSectionProps {
  initialReferences: CandidateReference[];
}

interface ReferenceFormData {
  fullName: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  relationship: string;
}

const emptyForm: ReferenceFormData = {
  fullName: '',
  jobTitle: '',
  company: '',
  phone: '',
  email: '',
  relationship: '',
};

export function ReferencesSection({
  initialReferences,
}: ReferencesSectionProps) {
  const [references, setReferences] =
    useState<CandidateReference[]>(initialReferences);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReferenceFormData>(emptyForm);
  const [isPending, startTransition] = useTransition();

  function openAddDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(ref: CandidateReference) {
    setEditingId(ref.id);
    setForm({
      fullName: ref.fullName,
      jobTitle: ref.jobTitle,
      company: ref.company,
      phone: ref.phone ?? '',
      email: ref.email ?? '',
      relationship: ref.relationship ?? '',
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.fullName.trim() || !form.jobTitle.trim() || !form.company.trim()) {
      toast.error('Veuillez remplir les champs obligatoires.');
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          fullName: form.fullName.trim(),
          jobTitle: form.jobTitle.trim(),
          company: form.company.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          relationship: form.relationship.trim() || undefined,
        };

        if (editingId) {
          await updateReferenceAction(editingId, payload);
          toast.success('Reference mise a jour.');
        } else {
          await createReferenceAction(payload);
          toast.success('Reference ajoutee.');
        }

        setDialogOpen(false);
        window.location.reload();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Une erreur est survenue.';
        toast.error(message);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteReferenceAction(id);

        // Optimistic removal
        setReferences((prev) => prev.filter((r) => r.id !== id));
        toast.success('Reference supprimee.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Une erreur est survenue.';
        toast.error(message);
      }
    });
  }

  function updateField(field: keyof ReferenceFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>References professionnelles</CardTitle>
            <CardDescription>
              {references.length}/10 references
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={openAddDialog}
            disabled={references.length >= 10}
          >
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {references.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune reference ajoutee.
            </p>
          ) : (
            <ul className="divide-y">
              {references.map((ref) => (
                <li
                  key={ref.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {ref.fullName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ref.jobTitle} &mdash; {ref.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(ref)}
                      disabled={isPending}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(ref.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier la reference' : 'Ajouter une reference'}
            </DialogTitle>
            <DialogDescription>
              Les champs marques d&apos;un * sont obligatoires.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ref-fullName">Nom complet *</Label>
              <Input
                id="ref-fullName"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                placeholder="Jean Dupont"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ref-jobTitle">Poste *</Label>
              <Input
                id="ref-jobTitle"
                value={form.jobTitle}
                onChange={(e) => updateField('jobTitle', e.target.value)}
                placeholder="Directeur technique"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ref-company">Entreprise *</Label>
              <Input
                id="ref-company"
                value={form.company}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="Acme SA"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ref-phone">Telephone</Label>
                <Input
                  id="ref-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+41 79 123 45 67"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ref-email">Email</Label>
                <Input
                  id="ref-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="jean@acme.ch"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ref-relationship">Relation</Label>
              <Input
                id="ref-relationship"
                value={form.relationship}
                onChange={(e) => updateField('relationship', e.target.value)}
                placeholder="Ancien superieur direct"
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? 'Enregistrement...'
                  : editingId
                    ? 'Mettre a jour'
                    : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
