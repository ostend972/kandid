'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { saveStep1Action, saveStep2Action } from './actions';

const SECTORS = [
  'IT',
  'Finance',
  'Santé',
  'Ingénierie',
  'Marketing',
  'RH',
  'Juridique',
  'Consulting',
  'Autre',
];

const CANTONS = ['GE', 'VD', 'VS', 'NE', 'FR', 'JU', 'BE'];

const CECR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const SALARY_BRACKETS = [
  { value: '<60000', label: 'Moins de 60 000 CHF' },
  { value: '60000-80000', label: '60 000 – 80 000 CHF' },
  { value: '80000-100000', label: '80 000 – 100 000 CHF' },
  { value: '100000-120000', label: '100 000 – 120 000 CHF' },
  { value: '>120000', label: 'Plus de 120 000 CHF' },
];

const CONTRACT_TYPES = ['CDI', 'CDD', 'Temporaire', 'Freelance'];

function FieldError({ errors, field }: { errors: Record<string, string[]>; field: string }) {
  const msgs = errors[field];
  if (!msgs || msgs.length === 0) return null;
  return (
    <div className="mt-1">
      {msgs.map((m, i) => (
        <p key={i} className="text-sm text-red-600">{m}</p>
      ))}
    </div>
  );
}

export default function OnboardingForm({ initialStep }: { initialStep: number }) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');

  // Step 1 state
  const [sector, setSector] = useState('');
  const [position, setPosition] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [targetCantons, setTargetCantons] = useState<string[]>([]);
  const [languages, setLanguages] = useState<{ lang: string; level: string }[]>([
    { lang: '', level: '' },
  ]);
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [availability, setAvailability] = useState('');
  const [contractTypes, setContractTypes] = useState<string[]>([]);

  // Step 2 state
  const [careerSummary, setCareerSummary] = useState('');
  const [strengths, setStrengths] = useState(['', '', '']);
  const [motivation, setMotivation] = useState('');
  const [differentiator, setDifferentiator] = useState('');

  function toggleCanton(canton: string) {
    setTargetCantons((prev) =>
      prev.includes(canton) ? prev.filter((c) => c !== canton) : [...prev, canton]
    );
  }

  function toggleContractType(ct: string) {
    setContractTypes((prev) =>
      prev.includes(ct) ? prev.filter((c) => c !== ct) : [...prev, ct]
    );
  }

  function updateLanguage(index: number, field: 'lang' | 'level', value: string) {
    setLanguages((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function addLanguage() {
    setLanguages((prev) => [...prev, { lang: '', level: '' }]);
  }

  function removeLanguage(index: number) {
    setLanguages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleStep1Submit() {
    setErrors({});
    setGlobalError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('sector', sector);
      fd.set('position', position);
      fd.set('experienceLevel', experienceLevel);
      for (const c of targetCantons) fd.append('targetCantons', c);
      fd.set('languages', JSON.stringify(languages));
      fd.set('salaryExpectation', salaryExpectation);
      fd.set('availability', availability);
      for (const ct of contractTypes) fd.append('contractTypes', ct);

      const result = await saveStep1Action(fd);
      if ('success' in result) {
        setCurrentStep(2);
      } else {
        setGlobalError(result.error);
        setErrors(result.fieldErrors);
      }
    });
  }

  function handleStep2Submit() {
    setErrors({});
    setGlobalError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('careerSummary', careerSummary);
      fd.set('strength1', strengths[0]);
      fd.set('strength2', strengths[1]);
      fd.set('strength3', strengths[2]);
      fd.set('motivation', motivation);
      fd.set('differentiator', differentiator);

      const result = await saveStep2Action(fd);
      if ('success' in result) {
        window.location.href = '/dashboard';
      } else {
        setGlobalError(result.error);
        setErrors(result.fieldErrors);
      }
    });
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Bienvenue sur Kandid</CardTitle>
        <CardDescription>Configurez votre profil en 2 étapes</CardDescription>
        <div className="flex items-center gap-3 pt-4">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              currentStep === 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            1
          </div>
          <div className="h-0.5 w-8 bg-muted" />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              currentStep === 2
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            2
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {globalError && (
          <p className="mb-4 text-sm text-red-600">{globalError}</p>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sector">Secteur</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger id="sector">
                  <SelectValue placeholder="Choisir un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors} field="sector" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Poste recherché</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="ex. Développeur Full-Stack"
              />
              <FieldError errors={errors} field="position" />
            </div>

            <div className="space-y-2">
              <Label>Niveau d&apos;expérience</Label>
              <RadioGroup value={experienceLevel} onValueChange={setExperienceLevel}>
                {[
                  { value: 'junior', label: 'Junior' },
                  { value: 'mid', label: 'Confirmé' },
                  { value: 'senior', label: 'Senior' },
                  { value: 'executive', label: 'Dirigeant' },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`exp-${opt.value}`} />
                    <Label htmlFor={`exp-${opt.value}`}>{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
              <FieldError errors={errors} field="experienceLevel" />
            </div>

            <div className="space-y-2">
              <Label>Cantons cibles</Label>
              <div className="grid grid-cols-4 gap-2">
                {CANTONS.map((canton) => (
                  <div key={canton} className="flex items-center space-x-2">
                    <Checkbox
                      id={`canton-${canton}`}
                      checked={targetCantons.includes(canton)}
                      onCheckedChange={() => toggleCanton(canton)}
                    />
                    <Label htmlFor={`canton-${canton}`} className="text-sm">
                      {canton}
                    </Label>
                  </div>
                ))}
              </div>
              <FieldError errors={errors} field="targetCantons" />
            </div>

            <div className="space-y-2">
              <Label>Langues</Label>
              {languages.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Langue"
                    value={entry.lang}
                    onChange={(e) => updateLanguage(i, 'lang', e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={entry.level}
                    onValueChange={(v) => updateLanguage(i, 'level', v)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {CECR_LEVELS.map((lv) => (
                        <SelectItem key={lv} value={lv}>
                          {lv}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {languages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLanguage(i)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addLanguage}>
                + Ajouter une langue
              </Button>
              <FieldError errors={errors} field="languages" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Prétentions salariales</Label>
              <Select value={salaryExpectation} onValueChange={setSalaryExpectation}>
                <SelectTrigger id="salary">
                  <SelectValue placeholder="Fourchette salariale" />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_BRACKETS.map((sb) => (
                    <SelectItem key={sb.value} value={sb.value}>
                      {sb.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors} field="salaryExpectation" />
            </div>

            <div className="space-y-2">
              <Label>Disponibilité</Label>
              <RadioGroup value={availability} onValueChange={setAvailability}>
                {[
                  { value: 'immediate', label: 'Immédiate' },
                  { value: '1_month', label: '1 mois' },
                  { value: '3_months', label: '3 mois' },
                  { value: 'negotiable', label: 'Négociable' },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`avail-${opt.value}`} />
                    <Label htmlFor={`avail-${opt.value}`}>{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
              <FieldError errors={errors} field="availability" />
            </div>

            <div className="space-y-2">
              <Label>Types de contrat</Label>
              <div className="flex flex-wrap gap-4">
                {CONTRACT_TYPES.map((ct) => (
                  <div key={ct} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ct-${ct}`}
                      checked={contractTypes.includes(ct)}
                      onCheckedChange={() => toggleContractType(ct)}
                    />
                    <Label htmlFor={`ct-${ct}`} className="text-sm">
                      {ct}
                    </Label>
                  </div>
                ))}
              </div>
              <FieldError errors={errors} field="contractTypes" />
            </div>

            <Button onClick={handleStep1Submit} disabled={isPending} className="w-full">
              {isPending ? 'Sauvegarde...' : 'Continuer →'}
            </Button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="careerSummary">Résumé de carrière</Label>
              <Textarea
                id="careerSummary"
                value={careerSummary}
                onChange={(e) => setCareerSummary(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Décrivez votre parcours professionnel en quelques phrases..."
              />
              <p className="text-xs text-muted-foreground">{careerSummary.length}/500</p>
              <FieldError errors={errors} field="careerSummary" />
            </div>

            <div className="space-y-2">
              <Label>Vos 3 forces principales</Label>
              {strengths.map((s, i) => (
                <div key={i}>
                  <Input
                    placeholder={`Force ${i + 1}`}
                    value={s}
                    onChange={(e) =>
                      setStrengths((prev) =>
                        prev.map((v, j) => (j === i ? e.target.value : v))
                      )
                    }
                  />
                </div>
              ))}
              <FieldError errors={errors} field="strengths" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">Motivation</Label>
              <Textarea
                id="motivation"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Qu'est-ce qui vous motive dans votre recherche ?"
              />
              <p className="text-xs text-muted-foreground">{motivation.length}/300</p>
              <FieldError errors={errors} field="motivation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="differentiator">Ce qui vous différencie</Label>
              <Textarea
                id="differentiator"
                value={differentiator}
                onChange={(e) => setDifferentiator(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Qu'est-ce qui vous rend unique ?"
              />
              <p className="text-xs text-muted-foreground">{differentiator.length}/300</p>
              <FieldError errors={errors} field="differentiator" />
            </div>

            <Button onClick={handleStep2Submit} disabled={isPending} className="w-full">
              {isPending ? 'Finalisation...' : 'Terminer et accéder au dashboard'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
