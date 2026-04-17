'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
} from '@/lib/validations/onboarding';
import {
  updateUserOnboardingStep1,
  updateUserOnboardingStep2,
} from '@/lib/db/kandid-queries';
import { ensureCurrentUser } from '@/lib/auth/ensure-user';
import { signBridgeCookie } from '@/lib/bridge-cookie';

type ActionResult =
  | { success: true }
  | { error: string; fieldErrors: Record<string, string[]> };

export async function syncExistingUserOnboarding(): Promise<{ synced: boolean }> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { onboardingComplete: true },
    });
  } catch {}

  const cookieStore = await cookies();
  cookieStore.set('onboarding_complete', await signBridgeCookie(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  });

  return { synced: true };
}

export async function saveStep1Action(formData: FormData): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  await ensureCurrentUser(userId);

  const raw = {
    sector: formData.get('sector') as string,
    position: formData.get('position') as string,
    experienceLevel: formData.get('experienceLevel') as string,
    targetCantons: formData.getAll('targetCantons') as string[],
    languages: JSON.parse((formData.get('languages') as string) || '[]'),
    salaryExpectation: formData.get('salaryExpectation') as string,
    availability: formData.get('availability') as string,
    contractTypes: formData.getAll('contractTypes') as string[],
  };

  const result = onboardingStep1Schema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0]?.toString() ?? '_root';
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { error: 'Validation échouée', fieldErrors };
  }

  try {
    await updateUserOnboardingStep1(userId, result.data);
    return { success: true };
  } catch {
    return { error: 'Erreur lors de la sauvegarde', fieldErrors: {} };
  }
}

export async function saveStep2Action(formData: FormData): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  await ensureCurrentUser(userId);

  const raw = {
    careerSummary: formData.get('careerSummary') as string,
    strengths: [
      formData.get('strength1') as string,
      formData.get('strength2') as string,
      formData.get('strength3') as string,
    ],
    motivation: formData.get('motivation') as string,
    differentiator: formData.get('differentiator') as string,
  };

  const result = onboardingStep2Schema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0]?.toString() ?? '_root';
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { error: 'Validation échouée', fieldErrors };
  }

  try {
    await updateUserOnboardingStep2(userId, result.data);
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { onboardingComplete: true },
    });
    // Bridge cookie: the Clerk JWT won't contain the new metadata until
    // the session is refreshed. This cookie lets the middleware skip the
    // onboarding gate for the first navigation after completion.
    const cookieStore = await cookies();
    cookieStore.set('onboarding_complete', await signBridgeCookie(userId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
      path: '/',
    });
    return { success: true };
  } catch {
    return { error: 'Erreur lors de la sauvegarde', fieldErrors: {} };
  }
}
