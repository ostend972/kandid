import { getUserById } from '@/lib/db/kandid-queries';

const SALARY_MEDIAN_BY_CANTON: Record<string, number> = {
  GE: 105000,
  VD: 98000,
  VS: 85000,
  NE: 82000,
  FR: 84000,
  JU: 78000,
  BE: 88000,
};

const CANTON_LABELS: Record<string, string> = {
  GE: 'Genève',
  VD: 'Vaud',
  VS: 'Valais',
  NE: 'Neuchâtel',
  FR: 'Fribourg',
  JU: 'Jura',
  BE: 'Berne',
};

const SALARY_RANGES: Record<string, [number, number]> = {
  'Moins de 60 000 CHF': [0, 60000],
  '60 000 – 80 000 CHF': [60000, 80000],
  '80 000 – 100 000 CHF': [80000, 100000],
  '100 000 – 120 000 CHF': [100000, 120000],
  'Plus de 120 000 CHF': [120000, 250000],
};

function formatCHF(value: number): string {
  return new Intl.NumberFormat('fr-CH', {
    maximumFractionDigits: 0,
  }).format(value);
}

export async function FrontalierContext({ userId }: { userId: string }) {
  const user = await getUserById(userId);
  const cantons = (user?.targetCantons ?? []) as string[];
  const expectation = user?.salaryExpectation as string | undefined;

  if (cantons.length === 0) {
    return null;
  }

  const primaryCanton = cantons[0];
  const median = SALARY_MEDIAN_BY_CANTON[primaryCanton];
  if (!median) return null;

  const userRange = expectation ? SALARY_RANGES[expectation] : null;
  let alignment: 'below' | 'aligned' | 'above' | 'unknown' = 'unknown';
  if (userRange) {
    const [min, max] = userRange;
    if (max < median * 0.9) alignment = 'below';
    else if (min > median * 1.1) alignment = 'above';
    else alignment = 'aligned';
  }

  const cantonLabel = CANTON_LABELS[primaryCanton] ?? primaryCanton;
  const extraCount = cantons.length - 1;

  const alignmentCopy = {
    aligned: `Votre fourchette ${expectation?.replace(' CHF', '')} est alignée sur le marché.`,
    below: `Votre fourchette ${expectation?.replace(' CHF', '')} est en-dessous du marché — vous pourriez négocier plus haut.`,
    above: `Votre fourchette ${expectation?.replace(' CHF', '')} dépasse la médiane — prévoyez un profil senior ou un secteur niche.`,
    unknown: 'Indiquez votre fourchette salariale pour un positionnement précis.',
  }[alignment];

  return (
    <section className="rounded-3xl bg-[#f7f7f7] p-6 sm:p-8 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Contexte {cantonLabel}
        {extraCount > 0 ? ` · +${extraCount} canton${extraCount > 1 ? 's' : ''}` : ''}
      </p>
      <div className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-end sm:gap-10">
        <div>
          <p className="text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
            {formatCHF(median)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Salaire médian {cantonLabel} · secteur IT
          </p>
        </div>
        <p className="max-w-md text-sm leading-relaxed sm:text-base">{alignmentCopy}</p>
      </div>
    </section>
  );
}
