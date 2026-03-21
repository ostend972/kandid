'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  users,
  cvAnalyses,
  jobMatches,
  savedJobs,
} from '@/lib/db/schema';
import { getSupabaseAdmin } from '@/lib/supabase/client';

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

export async function deleteAccountAction(): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Non authentifie' };
  }

  try {
    // 1. Fetch all CV file paths for this user
    const analyses = await db
      .select({ fileUrl: cvAnalyses.fileUrl })
      .from(cvAnalyses)
      .where(eq(cvAnalyses.userId, userId));

    // 2. Delete CV files from Supabase Storage
    if (analyses.length > 0) {
      const supabase = getSupabaseAdmin();
      const filePaths = analyses.map((a) => a.fileUrl);
      await supabase.storage.from('cv-files').remove(filePaths);
    }

    // 3. Delete all related rows (CASCADE should handle this, but be explicit)
    await db.delete(jobMatches).where(eq(jobMatches.userId, userId));
    await db.delete(savedJobs).where(eq(savedJobs.userId, userId));
    await db.delete(cvAnalyses).where(eq(cvAnalyses.userId, userId));

    // 4. Delete the user row
    await db.delete(users).where(eq(users.id, userId));

    // 5. Delete the user from Clerk
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);
  } catch (error) {
    console.error('Account deletion failed:', error);
    return {
      error:
        'Une erreur est survenue lors de la suppression de votre compte. Veuillez reessayer ou contacter le support.',
    };
  }

  // 6. Redirect to landing page (outside try/catch because redirect throws)
  redirect('/');
}
