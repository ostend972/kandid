'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  MapPin,
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
import { cn } from '@/lib/utils';

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

export function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for keyword input (debounced)
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [cantonDropdownOpen, setCantonDropdownOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const cantonRef = useRef<HTMLDivElement>(null);

  // Read current filter values from URL
  const selectedCantons = searchParams.getAll('canton');
  const contractType = searchParams.get('contractType') || '';
  const sort = searchParams.get('sort') || 'date';

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

      // Always reset to page 1 when filters change
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

  function toggleCanton(canton: string) {
    const newCantons = selectedCantons.includes(canton)
      ? selectedCantons.filter((c) => c !== canton)
      : [...selectedCantons, canton];
    updateFilters({ canton: newCantons.length > 0 ? newCantons : null });
  }

  function handleContractTypeChange(value: string) {
    updateFilters({ contractType: value === 'all' ? null : value });
  }

  function handleSortChange(value: string) {
    updateFilters({ sort: value === 'date' ? null : value });
  }

  function resetFilters() {
    setKeyword('');
    router.push('/dashboard/jobs', { scroll: false });
  }

  const hasActiveFilters =
    selectedCantons.length > 0 || contractType || keyword || sort === 'relevance';

  // Canton dropdown content (shared between desktop & mobile)
  const cantonCheckboxes = (
    <div className="space-y-1">
      {CANTONS.map((canton) => (
        <label
          key={canton}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm"
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

  return (
    <div className="space-y-3">
      {/* Desktop filter bar */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        {/* Keyword search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Rechercher par mot-cle..."
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

        {/* Canton multi-select dropdown */}
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
            <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-md border bg-popover p-2 shadow-md">
              {cantonCheckboxes}
            </div>
          )}
        </div>

        {/* Contract type select */}
        <Select
          value={contractType || 'all'}
          onValueChange={handleContractTypeChange}
        >
          <SelectTrigger className="w-[130px] h-9" size="sm">
            <SelectValue placeholder="Contrat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="CDI">CDI</SelectItem>
            <SelectItem value="CDD">CDD</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort select */}
        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[170px] h-9" size="sm">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date de publication</SelectItem>
            <SelectItem value="relevance">Pertinence</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset button */}
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

      {/* Mobile filter bar */}
      <div className="md:hidden space-y-3">
        {/* Search + toggle */}
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
          </Button>
        </div>

        {/* Collapsible filters */}
        {mobileFiltersOpen && (
          <div className="space-y-3 rounded-lg border bg-card p-3">
            {/* Cantons */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Canton
              </p>
              <div className="grid grid-cols-2 gap-1">
                {CANTONS.map((canton) => (
                  <label
                    key={canton}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={selectedCantons.includes(canton)}
                      onCheckedChange={() => toggleCanton(canton)}
                    />
                    {canton}
                  </label>
                ))}
              </div>
            </div>

            {/* Contract type */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Type de contrat
              </p>
              <Select
                value={contractType || 'all'}
                onValueChange={handleContractTypeChange}
              >
                <SelectTrigger className="w-full h-9" size="sm">
                  <SelectValue placeholder="Contrat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Trier par
              </p>
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full h-9" size="sm">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date de publication</SelectItem>
                  <SelectItem value="relevance">Pertinence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="w-full text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Reinitialiser les filtres
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Active filter badges (both desktop & mobile) */}
      {selectedCantons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCantons.map((canton) => (
            <Badge
              key={canton}
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => toggleCanton(canton)}
            >
              {canton}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
