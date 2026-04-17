import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/db/kandid-queries';
import OnboardingForm from './onboarding-form';
import { SyncExistingUser } from './sync-existing-user';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await getUserById(userId);

  if (user?.onboardingCompletedAt) {
    return <SyncExistingUser />;
  }

  const initialStep = user?.onboardingStep === 1 ? 2 : 1;

  return <OnboardingForm initialStep={initialStep} />;
}
