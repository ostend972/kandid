'use client';

import { useState, useTransition } from 'react';
import { ArrowRight, Plus, X } from 'lucide-react';
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

const CANTONS = [
  { code: 'GE', label: 'Genève' },
  { code: 'VD', label: 'Vaud' },
  { code: 'VS', label: 'Valais' },
  { code: 'NE', label: 'Neuchâtel' },
  { code: 'FR', label: 'Fribourg' },
  { code: 'JU', label: 'Jura' },
  { code: 'BE', label: 'Berne' },
];

const CECR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const SALARY_BRACKETS = [
  { value: '<60000', label: 'Moins de 60 000 CHF' },
  { value: '60000-80000', label: '60 000 – 80 000 CHF' },
  { value: '80000-100000', label: '80 000 – 100 000 CHF' },
  { value: '100000-120000', label: '100 000 – 120 000 CHF' },
  { value: '>120000', label: 'Plus de 120 000 CHF' },
];

const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Junior', hint: '0–2 ans' },
  { value: 'mid', label: 'Confirmé', hint: '3–7 ans' },
  { value: 'senior', label: 'Senior', hint: '8–14 ans' },
  { value: 'executive', label: 'Dirigeant', hint: '15+ ans' },
];

const AVAILABILITY = [
  { value: 'immediate', label: 'Immédiate' },
  { value: '1_month', label: '1 mois' },
  { value: '3_months', label: '3 mois' },
  { value: 'negotiable', label: 'Négociable' },
];

const CONTRACT_TYPES = ['CDI', 'CDD', 'Temporaire', 'Freelance'];

function SectionLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
      {required ? <span className="ml-1 text-foreground">*</span> : null}
    </p>
  );
}

function FieldError({ errors, field }: { errors: Record<string, string[]>; field: string }) {
  const msgs = errors[field];
  if (!msgs || msgs.length === 0) return null;
  return (
    <p className="mt-2 text-xs text-red-600">{msgs[0]}</p>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
    />
  );
}

function TextareaInput({
  id,
  value,
  onChange,
  maxLength,
  placeholder,
  rows = 4,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
      />
      {maxLength ? (
        <p className="mt-1.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
          {value.length} / {maxLength}
        </p>
      ) : null}
    </div>
  );
}

function PillGroup({
  options,
  value,
  onChange,
  layout = 'wrap',
}: {
  options: { value: string; label: string; hint?: string }[];
  value: string | string[];
  onChange: (v: string) => void;
  layout?: 'wrap' | 'grid-2' | 'grid-4';
}) {
  const isMulti = Array.isArray(value);
  const cls =
    layout === 'grid-2'
      ? 'grid gap-2 grid-cols-1 sm:grid-cols-2'
      : layout === 'grid-4'
        ? 'grid gap-2 grid-cols-2 sm:grid-cols-4'
        : 'flex flex-wrap gap-2';

  return (
    <div className={cls} role="group">
      {options.map((opt) => {
        const active = isMulti ? value.includes(opt.value) : value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`group flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-colors ${
              active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-foreground hover:border-foreground/40'
            }`}
          >
            <span className="text-sm font-medium leading-tight">{opt.label}</span>
            {opt.hint ? (
              <span
                className={`mt-0.5 text-xs leading-tight ${
                  active ? 'text-background/60' : 'text-muted-foreground'
                }`}
              >
                {opt.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function SelectInput({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full appearance-none rounded-2xl border border-border bg-background px-4 pr-10 text-base outline-none transition-colors focus:border-foreground ${
          value ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        <option value="" disabled>
          {placeholder ?? 'Sélectionner'}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-foreground">
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

function StepHeader({
  step,
  total,
  eyebrow,
  title,
  lede,
}: {
  step: number;
  total: number;
  eyebrow: string;
  title: string;
  lede: string;
}) {
  const progress = (step / total) * 100;
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-background/60">
          {eyebrow}
        </span>
        <div className="h-px flex-1 bg-background/15" />
        <span className="font-mono text-xs tabular-nums text-background/60">
          {step.toString().padStart(2, '0')} / {total.toString().padStart(2, '0')}
        </span>
      </div>
      <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
        {title}
      </h1>
      <p className="max-w-md text-base leading-relaxed text-background/70 sm:text-lg">
        {lede}
      </p>
      <div className="mt-auto">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-background/15">
          <div
            className="h-full rounded-full bg-background transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-background/60">
          Les informations sont privées et servent uniquement à personnaliser vos candidatures.
        </p>
      </div>
    </div>
  );
}

export default function OnboardingForm({ initialStep }: { initialStep: number }) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');

  // Step 1
  const [sector, setSector] = useState('');
  const [position, setPosition] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [targetCantons, setTargetCantons] = useState<string[]>([]);
  const [languages, setLanguages] = useState<{ lang: string; level: string }[]>([
    { lang: '', level: 'C2' },
  ]);
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [availability, setAvailability] = useState('');
  const [contractTypes, setContractTypes] = useState<string[]>([]);

  // Step 2
  const [careerSummary, setCareerSummary] = useState('');
  const [strengths, setStrengths] = useState(['', '', '']);
  const [motivation, setMotivation] = useState('');
  const [differentiator, setDifferentiator] = useState('');

  function toggleInList<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((v) => v !== item) : [...list, item];
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
      fd.set(
        'languages',
        JSON.stringify(languages.filter((l) => l.lang.trim() && l.level))
      );
      fd.set('salaryExpectation', salaryExpectation);
      fd.set('availability', availability);
      for (const ct of contractTypes) fd.append('contractTypes', ct);

      const result = await saveStep1Action(fd);
      if ('success' in result) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const headerProps =
    currentStep === 1
      ? {
          step: 1,
          total: 2,
          eyebrow: 'Étape 1 sur 2',
          title: 'Votre cible suisse.',
          lede: 'Secteur, poste, cantons. Kandid aligne sur le marché local et repère les postes qui correspondent à votre profil frontalier.',
        }
      : {
          step: 2,
          total: 2,
          eyebrow: 'Étape 2 sur 2',
          title: 'Votre signature, hors ATS.',
          lede: 'Ces quatre paragraphes personnalisent vos lettres de motivation et votre pitch — invisibles aux filtres automatiques, mais décisifs côté recruteur.',
        };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      {/* Narration panel */}
      <aside className="bg-foreground text-background px-8 py-10 sm:px-12 sm:py-14 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:gap-0 lg:px-16 lg:py-16">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-background" />
          <span className="text-lg font-bold tracking-tight">Kandid</span>
        </div>
        <StepHeader {...headerProps} />
      </aside>

      {/* Form panel */}
      <main className="bg-background px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
        <div className="mx-auto flex max-w-xl flex-col gap-10">
          {globalError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              {globalError}
            </div>
          ) : null}

          {currentStep === 1 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <SectionLabel required>Secteur</SectionLabel>
                  <SelectInput
                    id="sector"
                    value={sector}
                    onChange={setSector}
                    options={SECTORS.map((s) => ({ value: s, label: s }))}
                    placeholder="Choisir un secteur"
                  />
                  <FieldError errors={errors} field="sector" />
                </div>

                <div className="space-y-2.5">
                  <SectionLabel required>Poste recherché</SectionLabel>
                  <TextInput
                    id="position"
                    value={position}
                    onChange={setPosition}
                    placeholder="ex. Développeur Full-Stack"
                  />
                  <FieldError errors={errors} field="position" />
                </div>
              </div>

              <div className="space-y-3">
                <SectionLabel required>Niveau d&apos;expérience</SectionLabel>
                <PillGroup
                  options={EXPERIENCE_LEVELS}
                  value={experienceLevel}
                  onChange={setExperienceLevel}
                  layout="grid-2"
                />
                <FieldError errors={errors} field="experienceLevel" />
              </div>

              <div className="space-y-3">
                <SectionLabel required>Cantons cibles</SectionLabel>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez les cantons où vous êtes prêt à travailler.
                </p>
                <div className="flex flex-wrap gap-2">
                  {CANTONS.map((canton) => {
                    const active = targetCantons.includes(canton.code);
                    return (
                      <button
                        key={canton.code}
                        type="button"
                        onClick={() =>
                          setTargetCantons((prev) => toggleInList(prev, canton.code))
                        }
                        className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          active
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background text-foreground hover:border-foreground/40'
                        }`}
                      >
                        <span
                          className={`font-mono text-xs tracking-wider ${
                            active ? 'text-background/70' : 'text-muted-foreground'
                          }`}
                        >
                          {canton.code}
                        </span>
                        {canton.label}
                      </button>
                    );
                  })}
                </div>
                <FieldError errors={errors} field="targetCantons" />
              </div>

              <div className="space-y-3">
                <SectionLabel required>Langues parlées</SectionLabel>
                <p className="text-sm text-muted-foreground">
                  Le français et l&apos;allemand sont exigés dans la majorité des offres bilingues.
                </p>
                <div className="space-y-2">
                  {languages.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1">
                        <TextInput
                          value={entry.lang}
                          onChange={(v) =>
                            setLanguages((prev) =>
                              prev.map((l, j) => (j === i ? { ...l, lang: v } : l))
                            )
                          }
                          placeholder="Langue (ex. Français)"
                        />
                      </div>
                      <div className="w-28">
                        <SelectInput
                          value={entry.level}
                          onChange={(v) =>
                            setLanguages((prev) =>
                              prev.map((l, j) => (j === i ? { ...l, level: v } : l))
                            )
                          }
                          options={CECR_LEVELS.map((lv) => ({ value: lv, label: lv }))}
                          placeholder="Niveau"
                        />
                      </div>
                      {languages.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setLanguages((prev) => prev.filter((_, j) => j !== i))
                          }
                          aria-label="Supprimer cette langue"
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setLanguages((prev) => [...prev, { lang: '', level: 'B2' }])}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter une langue
                </button>
                <FieldError errors={errors} field="languages" />
              </div>

              <div className="space-y-3">
                <SectionLabel required>Prétentions salariales</SectionLabel>
                <SelectInput
                  id="salary"
                  value={salaryExpectation}
                  onChange={setSalaryExpectation}
                  options={SALARY_BRACKETS}
                  placeholder="Fourchette salariale annuelle brute"
                />
                <FieldError errors={errors} field="salaryExpectation" />
              </div>

              <div className="space-y-3">
                <SectionLabel required>Disponibilité</SectionLabel>
                <PillGroup
                  options={AVAILABILITY}
                  value={availability}
                  onChange={setAvailability}
                  layout="grid-4"
                />
                <FieldError errors={errors} field="availability" />
              </div>

              <div className="space-y-3">
                <SectionLabel required>Types de contrat</SectionLabel>
                <PillGroup
                  options={CONTRACT_TYPES.map((c) => ({ value: c, label: c }))}
                  value={contractTypes}
                  onChange={(v) => setContractTypes((prev) => toggleInList(prev, v))}
                />
                <FieldError errors={errors} field="contractTypes" />
              </div>

              <div className="sticky bottom-0 -mx-6 mt-4 flex justify-end border-t border-border bg-background/95 px-6 py-4 backdrop-blur sm:-mx-10 sm:px-10 lg:mx-0 lg:border-none lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
                <button
                  type="button"
                  onClick={handleStep1Submit}
                  disabled={isPending}
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? 'Sauvegarde…' : 'Continuer'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <SectionLabel>Résumé de carrière</SectionLabel>
                <p className="text-sm text-muted-foreground">
                  En 3–4 phrases : parcours, produits/secteurs touchés, résultats marquants.
                </p>
                <TextareaInput
                  id="careerSummary"
                  value={careerSummary}
                  onChange={setCareerSummary}
                  maxLength={500}
                  rows={5}
                  placeholder="Décrivez votre parcours professionnel en quelques phrases…"
                />
                <FieldError errors={errors} field="careerSummary" />
              </div>

              <div className="space-y-3">
                <SectionLabel>Vos trois forces principales</SectionLabel>
                <p className="text-sm text-muted-foreground">
                  Des compétences précises, pas des adjectifs génériques.
                </p>
                <div className="space-y-2">
                  {strengths.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 font-mono text-xs text-muted-foreground">
                        {(i + 1).toString().padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <TextInput
                          value={s}
                          onChange={(v) =>
                            setStrengths((prev) =>
                              prev.map((val, j) => (j === i ? v : val))
                            )
                          }
                          placeholder={
                            i === 0
                              ? 'ex. Architecture back-end distribuée'
                              : i === 1
                                ? 'ex. Prise de parole exécutive'
                                : 'ex. Conduite du changement'
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <FieldError errors={errors} field="strengths" />
              </div>

              <div className="space-y-3">
                <SectionLabel>Motivation</SectionLabel>
                <p className="text-sm text-muted-foreground">
                  Pourquoi la Suisse romande, pourquoi maintenant ?
                </p>
                <TextareaInput
                  id="motivation"
                  value={motivation}
                  onChange={setMotivation}
                  maxLength={300}
                  rows={3}
                  placeholder="Qu'est-ce qui vous motive dans votre recherche ?"
                />
                <FieldError errors={errors} field="motivation" />
              </div>

              <div className="space-y-3">
                <SectionLabel>Ce qui vous différencie</SectionLabel>
                <p className="text-sm text-muted-foreground">
                  Une combinaison rare, un parcours atypique, une expertise de niche.
                </p>
                <TextareaInput
                  id="differentiator"
                  value={differentiator}
                  onChange={setDifferentiator}
                  maxLength={300}
                  rows={3}
                  placeholder="Qu'est-ce qui vous rend unique ?"
                />
                <FieldError errors={errors} field="differentiator" />
              </div>

              <div className="sticky bottom-0 -mx-6 mt-4 flex items-center justify-between gap-4 border-t border-border bg-background/95 px-6 py-4 backdrop-blur sm:-mx-10 sm:px-10 lg:mx-0 lg:border-none lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Retour
                </button>
                <button
                  type="button"
                  onClick={handleStep2Submit}
                  disabled={isPending}
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? 'Finalisation…' : 'Accéder au dashboard'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
