import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getUserById } from '@/lib/db/kandid-queries';

const CANTON_LABELS: Record<string, string> = {
  GE: 'Genève',
  VD: 'Vaud',
  VS: 'Valais',
  NE: 'Neuchâtel',
  FR: 'Fribourg',
  JU: 'Jura',
  BE: 'Berne',
};

function formatCantons(cantons: string[]): string {
  if (cantons.length === 0) return '';
  const labels = cantons.map((c) => CANTON_LABELS[c] ?? c);
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return labels.join(' et ');
  return `${labels.slice(0, -1).join(', ')} et ${labels[labels.length - 1]}`;
}

interface JobsHeroSlotProps {
  userId: string;
}

/**
 * Server-side slot : précharge le profil user pour la vue initiale du hero.
 * Le client (JobsHero) reçoit ces données et les enrichit avec le alignedCount
 * arrivant via SWR depuis /api/jobs.
 */
export async function JobsHeroSlot({ userId }: JobsHeroSlotProps) {
  const user = await getUserById(userId);
  const cantons = ((user?.targetCantons ?? []) as string[]).filter(Boolean);
  const sector = (user?.sector as string | null) ?? null;
  const hasActiveCv = Boolean(user?.activeCvAnalysisId);
  const firstName = user?.fullName?.split(' ')[0] ?? null;

  return (
    <JobsHeroClient
      cantons={cantons}
      sector={sector}
      hasActiveCv={hasActiveCv}
      firstName={firstName}
    />
  );
}

interface JobsHeroClientProps {
  cantons: string[];
  sector: string | null;
  hasActiveCv: boolean;
  firstName: string | null;
}

export function JobsHeroClient({
  cantons,
  sector,
  hasActiveCv,
}: JobsHeroClientProps) {
  if (!hasActiveCv) {
    return (
      <section className="rounded-3xl bg-foreground text-background p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/60">
          Marché frontalier · sans CV
        </p>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
          Explorez librement. Uploadez votre CV pour voir vos alignements.
        </h1>
        <p className="mt-5 max-w-xl text-base text-background/70 sm:text-lg">
          Sans CV actif, Kandid vous laisse parcourir les offres en Suisse romande — sans score,
          sans matching, sans personnalisation. Dès que votre CV est prêt, les offres alignées
          remontent en tête.
        </p>
        <Link
          href="/dashboard/cv-analysis"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:opacity-90"
        >
          Analyser mon CV
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  const cantonLabel = formatCantons(cantons);
  const scope =
    cantons.length > 0 && sector
      ? `${sector} · ${cantonLabel}`
      : cantons.length > 0
        ? cantonLabel
        : sector
          ? sector
          : 'Suisse romande';

  return (
    <section className="rounded-3xl bg-foreground text-background p-8 sm:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/60">
        Marché frontalier · {scope}
      </p>
      <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
        Les offres qui vous correspondent, en tête.
      </h1>
      <p className="mt-5 max-w-xl text-base text-background/70 sm:text-lg">
        Kandid trie toutes les offres de Suisse romande selon votre profil. Plus le score est
        élevé, plus l&apos;offre est alignée sur votre parcours et vos cantons cibles.
      </p>
    </section>
  );
}
