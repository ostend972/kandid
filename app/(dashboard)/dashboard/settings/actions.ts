'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';

export async function updatePreferencesAction(data: {
  preferredCantons: string[];
  preferredActivityRate: number | null;
  weeklyDigestEnabled: boolean;
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Non authentifie');
  }

  await db
    .update(users)
    .set({
      preferredCantons: data.preferredCantons,
      preferredActivityRate: data.preferredActivityRate,
      weeklyDigestEnabled: data.weeklyDigestEnabled,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath('/dashboard/settings');
}
