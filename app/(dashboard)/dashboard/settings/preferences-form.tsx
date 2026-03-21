'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Check } from 'lucide-react';
import { updatePreferencesAction } from './actions';

const CANTONS = [
  'Geneve',
  'Vaud',
  'Neuchatel',
  'Valais',
  'Bale',
  'Zurich',
  'Berne',
  'Fribourg',
];

const ACTIVITY_RATES = [
  { value: '50', label: '50%' },
  { value: '60', label: '60%' },
  { value: '80', label: '80%' },
  { value: '100', label: '100%' },
  { value: '0', label: 'Peu importe' },
];

interface SettingsPreferencesFormProps {
  initialCantons: string[];
  initialActivityRate: number | null;
  initialWeeklyDigest: boolean;
}

export function SettingsPreferencesForm({
  initialCantons,
  initialActivityRate,
  initialWeeklyDigest,
}: SettingsPreferencesFormProps) {
  const [selectedCantons, setSelectedCantons] =
    useState<string[]>(initialCantons);
  const [activityRate, setActivityRate] = useState<string>(
    initialActivityRate !== null ? String(initialActivityRate) : ''
  );
  const [weeklyDigest, setWeeklyDigest] = useState(initialWeeklyDigest);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleCanton(canton: string) {
    setSelectedCantons((prev) =>
      prev.includes(canton)
        ? prev.filter((c) => c !== canton)
        : [...prev, canton]
    );
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await updatePreferencesAction({
        preferredCantons: selectedCantons,
        preferredActivityRate: activityRate ? Number(activityRate) : null,
        weeklyDigestEnabled: weeklyDigest,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Cantons */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Cantons preferes</Label>
        <div className="grid grid-cols-2 gap-2">
          {CANTONS.map((canton) => (
            <label
              key={canton}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selectedCantons.includes(canton)}
                onCheckedChange={() => toggleCanton(canton)}
              />
              <span className="text-sm">{canton}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Activity rate */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Taux d'activite prefere
        </Label>
        <Select
          value={activityRate}
          onValueChange={(val) => {
            setActivityRate(val);
            setSaved(false);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selectionnez un taux" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_RATES.map((rate) => (
              <SelectItem key={rate.value} value={rate.value}>
                {rate.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Weekly digest */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">
            Newsletter hebdomadaire
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recevez un resume des meilleures offres chaque semaine.
          </p>
        </div>
        <Switch
          checked={weeklyDigest}
          onCheckedChange={(checked) => {
            setWeeklyDigest(checked);
            setSaved(false);
          }}
        />
      </div>

      {/* Save button */}
      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : saved ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Enregistre
          </>
        ) : (
          'Enregistrer les preferences'
        )}
      </Button>
    </div>
  );
}
