'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { auth } from '@clerk/nextjs/server';

export async function checkoutAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const priceId = formData.get('priceId') as string;
  await createCheckoutSession({ team: null, priceId });
}

export async function customerPortalAction() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Portal session requires a team with Stripe customer — stub for now
  redirect('/dashboard');
}
