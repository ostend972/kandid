'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { updateUserActiveCv } from '@/lib/db/kandid-queries';

export async function setActiveCvAction(cvAnalysisId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Non authentifie');
  }

  await updateUserActiveCv(userId, cvAnalysisId);
  revalidatePath('/dashboard');
}
