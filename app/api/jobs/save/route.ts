import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { saveJob, unsaveJob } from '@/lib/db/kandid-queries';

// =============================================================================
// POST /api/jobs/save — Save a job for the current user
// Body: { jobId: string }
// =============================================================================

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Non authentifie' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { jobId } = body;

  if (!jobId || typeof jobId !== 'string') {
    return NextResponse.json(
      { error: 'jobId requis' },
      { status: 400 }
    );
  }

  try {
    await saveJob(userId, jobId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/jobs/save — Unsave a job for the current user
// Body: { jobId: string }
// =============================================================================

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Non authentifie' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { jobId } = body;

  if (!jobId || typeof jobId !== 'string') {
    return NextResponse.json(
      { error: 'jobId requis' },
      { status: 400 }
    );
  }

  try {
    await unsaveJob(userId, jobId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsaving job:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
