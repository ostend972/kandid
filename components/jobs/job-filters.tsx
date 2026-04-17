'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  MapPin,
  Building2,
  Home,
  Target,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  { id: 3, label: 'Employe' },
] as const;

const INDUSTRIES: Record<number, string> = {
  3: 'Commerce / Distribution',
  4: 'Immobilier / Construction',
  6: 'Transport / Logistique',
  8: 'Industrie / Production',
  9: 'Hotellerie / Restauration',
  15: 'Sante / Pharma',
  16: 'Education / Formation',
  20: 'Services / Conseil',
  22: 'Finance / Banque / Assurance',
  27: 'Communication / Marketing',
  28: 'Informatique / Tech',
  29: 'Administration publique',
  32: 'Energie / Environnement',
  33: 'Juridique / RH',
  35: 'Art / Culture / Media',
  38: 'Agriculture / Agroalimentaire',
};

const PUBLISHED_SINCE = [
  { value: '24h', label: 'Dernieres 24h' },
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
] as const;

const MATCH_SCORE_OPTIONS = [
  { value: '0', label: 'Tous les scores' },
  { value: '50', label: '>= 50% (correct)' },
  { value: '70', label: '>= 70% (bon)' },
  { value: '85', label: '>= 85% (excellent)' },
] as const;

export function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [companySearch, setCompanySearch] = useState(searchParams.get('company') || '');
  const [cantonDropdownOpen, setCantonDropdownOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const cantonRef = useRef<HTMLDivElement>(null);

  // Read current filter values from URL
  const selectedCantons = searchParams.getAll('canton');
  const contractType = searchParams.get('contractType') || '';
  const sort = searchParams.get('sort') || 'relevance';
  const publishedSince = searchParams.get('publishedSince') || '';
  const remoteOnly = searchParams.get('remoteOnly') === 'true';
  const selectedPositions = searchParams.getAll('positionId').map(Number);
  const industryId = searchParams.get('industryId') || '';
  const language = searchParams.get('language') || 'all';
  const minMatchScore = searchParams.get('minMatchScore') || '0';

  // Close canton dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cantonRef.current && !cantonRef.current.contains(e.target as Node)) {
        setCantonDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build new search params and navigate
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

  // Debounced keyword search
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get('q') || '';
      if (keyword !== currentQ) {
        updateFilters({ q: keyword || null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced company search
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentCompany = searchParams.get('company') || '';
      if (companySearch !== currentCompany) {
        updateFilters({ company: companySearch || null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [companySearch]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCanton(canton: string) {
    const newCantons = selectedCantons.includes(canton)
      ? selectedCantons.filter((c) => c !== canton)
      : [...selectedCantons, canton];
    updateFilters({ canton: newCantons.length > 0 ? newCantons : null });
  }

  function togglePosition(posId: number) {
    const current = selectedPositions;
    const newPositions = current.includes(posId)
      ? current.filter((p) => p !== posId)
      : [...current, posId];
    updateFilters({
      positionId: newPositions.length > 0 ? newPositions.map(String) : null,
    });
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
    sort === 'relevance' ||
    publishedSince ||
    remoteOnly ||
    selectedPositions.length > 0 ||
    industryId ||
    (language && language !== 'all') ||
    minMatchScore !== '0';

  const activeFilterCount = [
    selectedCantons.length > 0,
    contractType,
    keyword,
    companySearch,
    publishedSince,
    remoteOnly,
    selectedPositions.length > 0,
    industryId,
    minMatchScore !== '0',
  ].filter(Boolean).length;

  // ── Shared filter components ──────────────────────────────────────────

  const cantonCheckboxes = (
    <div className="space-y-1">
      {CANTONS.map((canton) => (
        <label
          key={canton}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent cursor-pointer text-sm"
        >
          <Checkbox
            checked={selectedCantons.includes(canton)}
            onCheckedChange={() => toggleCanton(canton)}
          />
          {canton}
        </label>
      ))}
    </div>
  );

  const positionCheckboxes = (
    <div className="space-y-1">
      {POSITIONS.map((pos) => (
        <label
          key={pos.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent cursor-pointer text-sm"
        >
          <Checkbox
            checked={selectedPositions.includes(pos.id)}
            onCheckedChange={() => togglePosition(pos.id)}
          />
          {pos.label}
        </label>
      ))}
    </div>
  );

  // ── Desktop ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* ── Row 1 : Recherche principale — QUOI + OU ──────────────────── */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {/* Keyword search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Mot-cle (metier, competence...)"
            className="pl-9 h-9"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Company search */}
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            placeholder="Entreprise..."
            className="pl-9 h-9 w-[180px]"
          />
        </div>

        {/* Canton dropdown */}
        <div className="relative" ref={cantonRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCantonDropdownOpen(!cantonDropdownOpen)}
            className="h-9 gap-1.5"
          >
            <MapPin className="h-4 w-4" />
            {selectedCantons.length > 0
              ? `${selectedCantons.length} canton${selectedCantons.length > 1 ? 's' : ''}`
              : 'Canton'}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
          {cantonDropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-lg border bg-popover p-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              {cantonCheckboxes}
            </div>
          )}
        </div>

        {/* Remote toggle */}
        <div className="flex items-center gap-2 px-2 h-9 rounded-md border bg-background">
          <Home className="h-4 w-4 text-muted-foreground" />
          <Switch
            checked={remoteOnly}
            onCheckedChange={(checked) =>
              updateFilters({ remoteOnly: checked ? 'true' : null })
            }
          />
          <Label className="text-sm cursor-pointer">Teletravail</Label>
        </div>
      </div>

      {/* ── Row 2 : Criteres detailles — TYPE DE POSTE ─────────────────── */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {/* Contract type */}
        <Select
          value={contractType || 'all'}
          onValueChange={(v) => updateFilters({ contractType: v === 'all' ? null : v })}
        >
          <SelectTrigger className="w-[120px] h-9" size="sm">
            <SelectValue placeholder="Contrat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous contrats</SelectItem>
            <SelectItem value="CDI">CDI</SelectItem>
            <SelectItem value="CDD">CDD</SelectItem>
          </SelectContent>
        </Select>

        {/* Industry */}
        <Select
          value={industryId || 'all'}
          onValueChange={(v) => updateFilters({ industryId: v === 'all' ? null : v })}
        >
          <SelectTrigger className="w-[200px] h-9" size="sm">
            <SelectValue placeholder="Secteur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous secteurs</SelectItem>
            {Object.entries(INDUSTRIES).map(([id, label]) => (
              <SelectItem key={id} value={id}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Language */}
        <Select
          value={language}
          onValueChange={(v) => updateFilters({ language: v })}
        >
          <SelectTrigger className="w-[130px] h-9" size="sm">
            <SelectValue placeholder="Langue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">Francais</SelectItem>
            <SelectItem value="de">Allemand</SelectItem>
            <SelectItem value="en">Anglais</SelectItem>
            <SelectItem value="all">Toutes langues</SelectItem>
          </SelectContent>
        </Select>

        {/* Published since */}
        <Select
          value={publishedSince || 'all'}
          onValueChange={(v) => updateFilters({ publishedSince: v === 'all' ? null : v })}
        >
          <SelectTrigger className="w-[150px] h-9" size="sm">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes dates</SelectItem>
            {PUBLISHED_SINCE.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Position checkboxes inline */}
        <div className="flex items-center gap-3 pl-2 border-l">
          <span className="text-sm text-muted-foreground">Niveau :</span>
          {POSITIONS.map((pos) => (
            <label
              key={pos.id}
              className="flex items-center gap-1.5 cursor-pointer text-sm"
            >
              <Checkbox
                checked={selectedPositions.includes(pos.id)}
                onCheckedChange={() => togglePosition(pos.id)}
              />
              {pos.label}
            </label>
          ))}
        </div>
      </div>

      {/* ── Row 3 : Matching + Tri + Actions ──────────────────────────── */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {/* Min match score (requires CV) */}
        <Select
          value={minMatchScore}
          onValueChange={(v) => updateFilters({ minMatchScore: v === '0' ? null : v })}
        >
          <SelectTrigger className="w-[190px] h-9" size="sm">
            <Target className="h-4 w-4 text-muted-foreground mr-1" />
            <SelectValue placeholder="Matching" />
          </SelectTrigger>
          <SelectContent>
            {MATCH_SCORE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => updateFilters({ sort: v === 'relevance' ? null : v })}>
          <SelectTrigger className="w-[180px] h-9" size="sm">
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Meilleur matching</SelectItem>
            <SelectItem value="date">Date (recent)</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* Save search */}
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

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9 text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Reinitialiser
          </Button>
        )}
      </div>

      {/* ── Mobile ───────────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 h-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className={cn('h-9 w-9 shrink-0', mobileFiltersOpen && 'bg-accent')}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black text-[10px] text-white dark:bg-white dark:text-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {mobileFiltersOpen && (
          <div className="space-y-4 rounded-lg border bg-card p-3">
            {/* Canton */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Canton</p>
              <div className="grid grid-cols-2 gap-1">{cantonCheckboxes}</div>
            </div>

            {/* Contract */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Type de contrat</p>
              <Select value={contractType || 'all'} onValueChange={(v) => updateFilters({ contractType: v === 'all' ? null : v })}>
                <SelectTrigger className="w-full h-9" size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Langue</p>
              <Select value={language} onValueChange={(v) => updateFilters({ language: v })}>
                <SelectTrigger className="w-full h-9" size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Francais</SelectItem>
                  <SelectItem value="de">Allemand</SelectItem>
                  <SelectItem value="en">Anglais</SelectItem>
                  <SelectItem value="all">Toutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Published since */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Publie depuis</p>
              <Select value={publishedSince || 'all'} onValueChange={(v) => updateFilters({ publishedSince: v === 'all' ? null : v })}>
                <SelectTrigger className="w-full h-9" size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes dates</SelectItem>
                  {PUBLISHED_SINCE.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Industry */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Secteur</p>
              <Select value={industryId || 'all'} onValueChange={(v) => updateFilters({ industryId: v === 'all' ? null : v })}>
                <SelectTrigger className="w-full h-9" size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous secteurs</SelectItem>
                  {Object.entries(INDUSTRIES).map(([id, label]) => (
                    <SelectItem key={id} value={id}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Entreprise</p>
              <Input
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Nom de l'entreprise..."
                className="h-9"
              />
            </div>

            {/* Position */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Position</p>
              {positionCheckboxes}
            </div>

            {/* Remote */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">Teletravail possible</Label>
              <Switch
                checked={remoteOnly}
                onCheckedChange={(checked) => updateFilters({ remoteOnly: checked ? 'true' : null })}
              />
            </div>

            {/* Min match score */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Matching CV minimum</p>
              <Select
                value={minMatchScore}
                onValueChange={(v) => updateFilters({ minMatchScore: v === '0' ? null : v })}
              >
                <SelectTrigger className="w-full h-9" size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATCH_SCORE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Trier par</p>
              <Select value={sort} onValueChange={(v) => updateFilters({ sort: v === 'relevance' ? null : v })}>
                <SelectTrigger className="w-full h-9" size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Meilleur matching</SelectItem>
                  <SelectItem value="date">Date (recent)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Reinitialiser les filtres
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Active filter badges */}
      {(selectedCantons.length > 0 || selectedPositions.length > 0 || remoteOnly) && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCantons.map((canton) => (
            <Badge key={canton} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleCanton(canton)}>
              {canton} <X className="h-3 w-3" />
            </Badge>
          ))}
          {selectedPositions.map((pid) => (
            <Badge key={pid} variant="secondary" className="gap-1 cursor-pointer" onClick={() => togglePosition(pid)}>
              {POSITIONS.find((p) => p.id === pid)?.label} <X className="h-3 w-3" />
            </Badge>
          ))}
          {remoteOnly && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateFilters({ remoteOnly: null })}>
              Teletravail <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
