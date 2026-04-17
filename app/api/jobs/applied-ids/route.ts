import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getAppliedJobIds } from '@/lib/db/kandid-queries';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Non autorise.' }, { status: 401 });
  }

  try {
    const ids = await getAppliedJobIds(userId);
    return NextResponse.json({ ids });
  } catch (error) {
    console.error('Error fetching applied job IDs:', error);
    return NextResponse.json({ ids: [] });
  }
}
