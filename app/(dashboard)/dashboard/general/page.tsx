'use client';

import { UserProfile } from '@clerk/nextjs';

export default function GeneralPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-bold tracking-tight text-foreground mb-6">
        Param&egrave;tres g&eacute;n&eacute;raux
      </h1>
      <UserProfile />
    </section>
  );
}
