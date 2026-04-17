import { currentUser } from '@clerk/nextjs/server';
import { upsertUser, getUserById } from '@/lib/db/kandid-queries';

/**
 * Garantit qu'une row users existe en DB pour l'utilisateur Clerk courant.
 * Le webhook Clerk (/api/webhooks/clerk) ne fonctionne qu'avec une URL publique
 * (svix verify). En dev local sans tunnel, aucun user n'est créé — cette fonction
 * comble ce trou en sync-ant à la demande depuis Clerk.
 */
export async function ensureCurrentUser(userId: string) {
  const existing = await getUserById(userId);
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser || clerkUser.id !== userId) {
    throw new Error('Clerk user mismatch or absent during ensureCurrentUser');
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error('Clerk user has no email address');
  }

  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

  await upsertUser({
    id: userId,
    email,
    fullName,
    avatarUrl: clerkUser.imageUrl || null,
  });

  return await getUserById(userId);
}
