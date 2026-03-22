import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function requireAdmin(): Promise<string | NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata as Record<string, unknown>)?.role;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Erreur verification admin' }, { status: 500 });
  }

  return userId;
}
