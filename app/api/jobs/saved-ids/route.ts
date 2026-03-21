import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSavedJobIds } from '@/lib/db/kandid-queries';

// =============================================================================
// GET /api/jobs/saved-ids — Returns saved job IDs for the current user
// =============================================================================

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ids: [] });
  }

  try {
    const ids = await getSavedJobIds(userId);
    return NextResponse.json({ ids });
  } catch (error) {
    console.error('Error fetching saved job IDs:', error);
    return NextResponse.json({ ids: [] });
  }
}
