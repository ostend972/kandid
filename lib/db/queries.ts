/**
 * Legacy queries from next-saas-starter boilerplate.
 * Updated to use Clerk auth instead of custom session tokens.
 */
import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import {
  legacyActivityLogs as activityLogs,
  legacyTeamMembers as teamMembers,
  legacyTeams as teams,
  legacyUsers as users,
} from './schema';
import { auth } from '@clerk/nextjs/server';

export async function getUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  // Legacy users table uses numeric IDs — this function is kept for
  // backward compatibility with the boilerplate UI components that
  // still reference it, but will not match Clerk user IDs.
  return null;
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Legacy activity logs use numeric user IDs — return empty for now
  return [] as {
    id: number;
    action: string;
    timestamp: Date;
    ipAddress: string | null;
    userName: string | null;
  }[];
}

export async function getTeamForUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  // Legacy teams use numeric user IDs — return null for now
  return null;
}
