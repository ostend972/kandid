import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function requireAdmin(): Promise<string | NextResponse> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }
  const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined;
  if (metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
  }
  return userId;
}
