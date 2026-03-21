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
  candidateDocuments,
  candidateReferences,
  applications,
} from '@/lib/db/schema';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import {
  createCandidateReference,
  updateCandidateReference,
  deleteCandidateReference,
  countCandidateReferences,
  getCandidateDocuments,
} from '@/lib/db/kandid-queries';
import {
  deleteProfileDocument,
  deleteProfilePhoto,
  deleteApplicationFiles,
} from '@/lib/storage/cv-upload';

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
    // 1. Clean up profile documents from Storage
    const docs = await getCandidateDocuments(userId);
    for (const doc of docs) {
      try {
        await deleteProfileDocument(doc.fileUrl);
      } catch {
        // Ignore individual file deletion errors during account cleanup
      }
    }

    // 2. Delete profile photo from Storage
    try {
      await deleteProfilePhoto(userId);
    } catch {
      // Ignore photo deletion errors during account cleanup
    }

    // 3. Clean up application files from Storage
    const userApplications = await db
      .select({ id: applications.id })
      .from(applications)
      .where(eq(applications.userId, userId));

    for (const app of userApplications) {
      try {
        await deleteApplicationFiles(userId, app.id);
      } catch {
        // Ignore individual application file deletion errors during account cleanup
      }
    }

    // 4. Fetch all CV file paths for this user
    const analyses = await db
      .select({ fileUrl: cvAnalyses.fileUrl })
      .from(cvAnalyses)
      .where(eq(cvAnalyses.userId, userId));

    // 5. Delete CV files from Supabase Storage
    if (analyses.length > 0) {
      const supabase = getSupabaseAdmin();
      const filePaths = analyses.map((a) => a.fileUrl);
      await supabase.storage.from('cv-files').remove(filePaths);
    }

    // 6. Delete all related rows (CASCADE should handle this, but be explicit)
    await db.delete(applications).where(eq(applications.userId, userId));
    await db.delete(candidateDocuments).where(eq(candidateDocuments.userId, userId));
    await db.delete(candidateReferences).where(eq(candidateReferences.userId, userId));
    await db.delete(jobMatches).where(eq(jobMatches.userId, userId));
    await db.delete(savedJobs).where(eq(savedJobs.userId, userId));
    await db.delete(cvAnalyses).where(eq(cvAnalyses.userId, userId));

    // 7. Delete the user row
    await db.delete(users).where(eq(users.id, userId));

    // 8. Delete the user from Clerk
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);
  } catch (error) {
    console.error('Account deletion failed:', error);
    return {
      error:
        'Une erreur est survenue lors de la suppression de votre compte. Veuillez reessayer ou contacter le support.',
    };
  }

  // 9. Redirect to landing page (outside try/catch because redirect throws)
  redirect('/');
}

// =============================================================================
// References CRUD
// =============================================================================

export async function createReferenceAction(data: {
  fullName: string;
  jobTitle: string;
  company: string;
  phone?: string;
  email?: string;
  relationship?: string;
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Non authentifie');
  }

  const total = await countCandidateReferences(userId);
  if (total >= 10) {
    throw new Error('Vous avez atteint la limite de 10 references.');
  }

  await createCandidateReference({ userId, ...data });

  revalidatePath('/dashboard/settings');
}

export async function updateReferenceAction(
  id: string,
  data: {
    fullName?: string;
    jobTitle?: string;
    company?: string;
    phone?: string;
    email?: string;
    relationship?: string;
  }
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Non authentifie');
  }

  await updateCandidateReference(id, userId, data);

  revalidatePath('/dashboard/settings');
}

export async function deleteReferenceAction(id: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Non authentifie');
  }

  await deleteCandidateReference(id, userId);

  revalidatePath('/dashboard/settings');
}
