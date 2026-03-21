'use client';

import { UserProfile } from '@clerk/nextjs';

export default function SecurityPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        S&eacute;curit&eacute;
      </h1>
      <p className="text-gray-600 mb-4">
        La gestion de votre mot de passe et de la s&eacute;curit&eacute; est
        assur&eacute;e par Clerk.
      </p>
      <UserProfile />
    </section>
  );
}
