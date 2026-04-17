'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaveSearchButton } from '@/components/jobs/save-search-button';

const CANTONS = [
  'Geneve',
  'Vaud',
  'Neuchatel',
  'Valais',
  'Bale',
  'Zurich',
  'Berne',
  'Fribourg',
] as const;

const POSITIONS = [
  { id: 1, label: 'Management / Direction' },
  { id: 2, label: 'Cadre moyen' },
  { id: 3, label: 'Employé' },
] as const;

const INDUSTRIES: Record<number, string> = {
  3: 'Commerce / Distribution',
  4: 'Immobilier / Construction',
  6: 'Transport / Logistique',
  8: 'Industrie / Production',
  9: 'Hôtellerie / Restauration',
  15: 'Santé / Pharma',
  16: 'Éducation / Formation',
  20: 'Services / Conseil',
  22: 'Finance / Banque / Assurance',
  27: 'Communication / Marketing',
  28: 'Informatique / Tech',
  29: 'Administration publique',
  32: 'Énergie / Environnement',
  33: 'Juridique / RH',
  35: 'Art / Culture / Média',
  38: 'Agriculture / Agroalimentaire',
};

const PUBLISHED_SINCE = [
  { value: '24h', label: 'Dernières 24h' },
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
] as const;

const MATCH_SCORE_OPTIONS = [
  { value: '0', label: 'Tous les scores' },
  { value: '50', label: '≥ 50 % correct' },
  { value: '70', label: '≥ 70 % bon' },
  { value: '85', label: '≥ 85 % excellent' },
] as const;

const CONTRACT_OPTIONS = [
  { value: 'all', label: 'Tous contrats' },
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'Toutes langues' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Allemand' },
  { value: 'en', label: 'Anglais' },
] as const;

const DATE_OPTIONS = [
  { value: 'all', label: 'Toutes dates' },
  ...PUBLISHED_SINCE.map((p) => ({ value: p.value, label: p.label })),
] as const;

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Meilleur matching' },
  { value: 'date', label: 'Plus récent' },
] as const;

// ─── Shared pill styles ──────────────────────────────────────────────────────

const pillBase =
  'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors';
const pillIdle = 'border-border bg-background text-foreground hover:border-foreground';
const pillActive = 'border-foreground bg-foreground text-background';

// ─── Pill select (inline dropdown, headless) ─────────────────────────────────

function PillSelect({
  label,
  value,
  options,
  onChange,
  isActive,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (v: string) => void;
  isActive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const selected = options.find((o) => o.value === value);
  const displayLabel = isActive && selected ? selected.label : label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(pillBase, isActive ? pillActive : pillIdle)}
      >
        {displayLabel}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform',
            open && 'rotate-180',
            isActive ? 'opacity-80' : 'opacity-60'
          )}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-background p-1 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <span>{o.label}</span>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Cantons dropdown multi-select ───────────────────────────────────────────

function CantonsPill({
  selected,
  toggle,
}: {
  selected: string[];
  toggle: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const label =
    selected.length === 0
      ? 'Cantons'
      : selected.length === 1
        ? selected[0]
        : `${selected.length} cantons`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(pillBase, selected.length > 0 ? pillActive : pillIdle)}
      >
        {label}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform',
            open && 'rotate-180',
            selected.length > 0 ? 'opacity-80' : 'opacity-60'
          )}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-56 rounded-2xl border border-border bg-background p-1 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          {CANTONS.map((c) => {
            const on = selected.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors',
                  on
                    ? 'bg-foreground text-background'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <span>{c}</span>
                {on && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Remote toggle pill ──────────────────────────────────────────────────────

function TogglePill({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(pillBase, active ? pillActive : pillIdle)}
    >
      {label}
    </button>
  );
}

// ─── Main filter component ───────────────────────────────────────────────────

export function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [companySearch, setCompanySearch] = useState(searchParams.get('company') || '');
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedCantons = searchParams.getAll('canton');
  const contractType = searchParams.get('contractType') || '';
  const sort = searchParams.get('sort') || 'relevance';
  const publishedSince = searchParams.get('publishedSince') || '';
  const remoteOnly = searchParams.get('remoteOnly') === 'true';
  const selectedPositions = searchParams.getAll('positionId').map(Number);
  const industryId = searchParams.get('industryId') || '';
  const language = searchParams.get('language') || 'all';
  const minMatchScore = searchParams.get('minMatchScore') || '0';

  const updateFilters = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.delete(key);
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
      router.push(`/dashboard/jobs?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (keyword !== (searchParams.get('q') || '')) {
        updateFilters({ q: keyword || null });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [keyword]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => {
      if (companySearch !== (searchParams.get('company') || '')) {
        updateFilters({ company: companySearch || null });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [companySearch]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCanton(c: string) {
    const next = selectedCantons.includes(c)
      ? selectedCantons.filter((v) => v !== c)
      : [...selectedCantons, c];
    updateFilters({ canton: next.length > 0 ? next : null });
  }

  function togglePosition(pid: number) {
    const next = selectedPositions.includes(pid)
      ? selectedPositions.filter((v) => v !== pid)
      : [...selectedPositions, pid];
    updateFilters({ positionId: next.length > 0 ? next.map(String) : null });
  }

  function resetFilters() {
    setKeyword('');
    setCompanySearch('');
    router.push('/dashboard/jobs', { scroll: false });
  }

  const hasActiveFilters =
    selectedCantons.length > 0 ||
    contractType ||
    keyword ||
    companySearch ||
    publishedSince ||
    remoteOnly ||
    selectedPositions.length > 0 ||
    industryId ||
    (language && language !== 'all') ||
    minMatchScore !== '0' ||
    sort !== 'relevance';

  const advancedActiveCount = [
    industryId,
    selectedPositions.length > 0,
    language !== 'all',
    minMatchScore !== '0',
    sort !== 'relevance',
    companySearch,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Keyword input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Poste, compétence, mot-clé…"
          className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
        />
        {keyword && (
          <button
            type="button"
            onClick={() => setKeyword('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Pill row */}
      <div className="flex flex-wrap items-center gap-2">
        <CantonsPill selected={selectedCantons} toggle={toggleCanton} />

        <TogglePill
          label="Télétravail"
          active={remoteOnly}
          onToggle={() =>
            updateFilters({ remoteOnly: remoteOnly ? null : 'true' })
          }
        />

        <PillSelect
          label="Contrat"
          value={contractType || 'all'}
          options={CONTRACT_OPTIONS}
          onChange={(v) => updateFilters({ contractType: v === 'all' ? null : v })}
          isActive={Boolean(contractType)}
        />

        <PillSelect
          label="Date"
          value={publishedSince || 'all'}
          options={DATE_OPTIONS}
          onChange={(v) => updateFilters({ publishedSince: v === 'all' ? null : v })}
          isActive={Boolean(publishedSince)}
        />

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            pillBase,
            advancedActiveCount > 0 ? pillActive : pillIdle
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Plus de filtres
          {advancedActiveCount > 0 && (
            <span
              className={cn(
                'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                'bg-background text-foreground'
              )}
            >
              {advancedActiveCount}
            </span>
          )}
        </button>

        <div className="flex-1 min-w-0" />

        <SaveSearchButton
          currentFilters={{
            q: keyword || null,
            canton: selectedCantons.length > 0 ? selectedCantons : null,
            contractType: contractType || null,
            publishedSince: publishedSince || null,
            remoteOnly: remoteOnly ? 'true' : null,
            positionId: selectedPositions.length > 0 ? selectedPositions.map(String) : null,
            industryId: industryId || null,
            company: companySearch || null,
            language: language && language !== 'all' ? language : null,
            minMatchScore: minMatchScore !== '0' ? minMatchScore : null,
          }}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Active chips row (secondary signal when user selected cantons) */}
      {(selectedCantons.length > 0 || selectedPositions.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedCantons.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCanton(c)}
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground bg-foreground px-3 py-1 text-xs font-medium text-background transition-opacity hover:opacity-80"
            >
              {c}
              <X className="h-3 w-3" />
            </button>
          ))}
          {selectedPositions.map((pid) => {
            const label = POSITIONS.find((p) => p.id === pid)?.label;
            if (!label) return null;
            return (
              <button
                key={pid}
                type="button"
                onClick={() => togglePosition(pid)}
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground bg-foreground px-3 py-1 text-xs font-medium text-background transition-opacity hover:opacity-80"
              >
                {label}
                <X className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      )}

      {/* Advanced sheet */}
      {sheetOpen && (
        <AdvancedSheet
          onClose={() => setSheetOpen(false)}
          sort={sort}
          minMatchScore={minMatchScore}
          industryId={industryId}
          language={language}
          companySearch={companySearch}
          setCompanySearch={setCompanySearch}
          selectedPositions={selectedPositions}
          togglePosition={togglePosition}
          onChange={updateFilters}
        />
      )}
    </div>
  );
}

// ─── Advanced sheet (side drawer) ─────────────────────────────────────────────

interface AdvancedSheetProps {
  onClose: () => void;
  sort: string;
  minMatchScore: string;
  industryId: string;
  language: string;
  companySearch: string;
  setCompanySearch: (s: string) => void;
  selectedPositions: number[];
  togglePosition: (pid: number) => void;
  onChange: (u: Record<string, string | string[] | null>) => void;
}

function AdvancedSheet({
  onClose,
  sort,
  minMatchScore,
  industryId,
  language,
  companySearch,
  setCompanySearch,
  selectedPositions,
  togglePosition,
  onChange,
}: AdvancedSheetProps) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        aria-label="Fermer le panneau"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-hidden bg-foreground text-background shadow-[0_0_40px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between border-b border-background/10 px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-background/60">
              Affinage
            </p>
            <h2 className="mt-1 text-xl font-bold">Plus de filtres</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-background/20 transition-colors hover:bg-background/10"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <SheetSection label="Compatibilité CV">
            <SheetRadioGroup
              value={minMatchScore}
              options={MATCH_SCORE_OPTIONS}
              onChange={(v) =>
                onChange({ minMatchScore: v === '0' ? null : v })
              }
            />
          </SheetSection>

          <SheetSection label="Tri">
            <SheetRadioGroup
              value={sort}
              options={SORT_OPTIONS}
              onChange={(v) =>
                onChange({ sort: v === 'relevance' ? null : v })
              }
            />
          </SheetSection>

          <SheetSection label="Niveau de poste">
            <div className="space-y-1.5">
              {POSITIONS.map((p) => {
                const on = selectedPositions.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePosition(p.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors',
                      on
                        ? 'border-background bg-background text-foreground'
                        : 'border-background/20 text-background hover:border-background/60'
                    )}
                  >
                    <span>{p.label}</span>
                    {on && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </SheetSection>

          <SheetSection label="Secteur">
            <SheetSelect
              value={industryId || 'all'}
              options={[
                { value: 'all', label: 'Tous secteurs' },
                ...Object.entries(INDUSTRIES).map(([id, label]) => ({
                  value: id,
                  label,
                })),
              ]}
              onChange={(v) =>
                onChange({ industryId: v === 'all' ? null : v })
              }
            />
          </SheetSection>

          <SheetSection label="Langue de l'offre">
            <SheetRadioGroup
              value={language}
              options={LANGUAGE_OPTIONS}
              onChange={(v) => onChange({ language: v })}
            />
          </SheetSection>

          <SheetSection label="Entreprise">
            <input
              type="text"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              placeholder="Nom de l'entreprise…"
              className="h-11 w-full rounded-2xl border border-background/20 bg-transparent px-4 text-sm text-background outline-none transition-colors placeholder:text-background/40 focus:border-background"
            />
          </SheetSection>
        </div>

        <div className="border-t border-background/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-background px-6 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
          >
            Voir les offres
          </button>
        </div>
      </aside>
    </div>
  );
}

function SheetSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-background/60">
        {label}
      </p>
      {children}
    </div>
  );
}

function SheetRadioGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors',
              on
                ? 'border-background bg-background text-foreground'
                : 'border-background/20 text-background hover:border-background/60'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SheetSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-2xl border border-background/20 bg-transparent px-4 pr-10 text-sm text-background outline-none transition-colors focus:border-background"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-foreground text-background">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-background/60" />
    </div>
  );
}
