import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type HeroCtaProps = {
  hasActiveCv: boolean;
  firstName: string;
};

export function HeroCta({ hasActiveCv, firstName }: HeroCtaProps) {
  if (!hasActiveCv) {
    return (
      <section className="rounded-3xl bg-black p-8 text-white sm:p-12 dark:bg-white dark:text-black">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60 dark:text-black/60">
          Étape 1 sur 3
        </p>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
          Bonjour {firstName}. Votre CV français ne passera pas les filtres ATS suisses.
        </h1>
        <p className="mt-5 max-w-xl text-base text-white/70 sm:text-lg dark:text-black/70">
          Kandid l&apos;analyse, repère les écarts photo / diplômes / CECR / terminologie, et vous
          remet un CV 2 pages prêt pour Genève et Vaud.
        </p>
        <Link
          href="/dashboard/cv-analysis"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-[#e2e2e2] dark:bg-black dark:text-white dark:hover:bg-[#1a1a1a]"
        >
          Analyser mon CV
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-background p-8 sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Bienvenue, {firstName}
      </p>
      <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight sm:text-4xl">
        Votre CV est prêt. Continuez vers les offres qui correspondent à votre profil.
      </h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:opacity-90"
        >
          Parcourir les offres
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/dashboard/cv-analysis"
          className="inline-flex items-center gap-2 rounded-full bg-[#efefef] px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-[#e2e2e2] dark:bg-white/10 dark:hover:bg-white/20"
        >
          Analyser un autre CV
        </Link>
      </div>
    </section>
  );
}
