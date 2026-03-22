import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  users,
  cvAnalyses,
  applications,
  candidateDocuments,
} from '@/lib/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { id } = await params;

  // ---------------------------------------------------------------------------
  // Fetch user
  // ---------------------------------------------------------------------------
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      plan: users.plan,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: 'Utilisateur introuvable' },
      { status: 404 }
    );
  }

  // ---------------------------------------------------------------------------
  // Parallel queries: analyses, applications, documents count
  // ---------------------------------------------------------------------------
  const [analyses, userApplications, [{ value: documentsCount }]] =
    await Promise.all([
      db
        .select({
          id: cvAnalyses.id,
          fileName: cvAnalyses.fileName,
          overallScore: cvAnalyses.overallScore,
          createdAt: cvAnalyses.createdAt,
        })
        .from(cvAnalyses)
        .where(eq(cvAnalyses.userId, id))
        .orderBy(desc(cvAnalyses.createdAt)),
      db
        .select({
          id: applications.id,
          jobTitle: applications.jobTitle,
          jobCompany: applications.jobCompany,
          status: applications.status,
          createdAt: applications.createdAt,
        })
        .from(applications)
        .where(eq(applications.userId, id))
        .orderBy(desc(applications.createdAt)),
      db
        .select({ value: count() })
        .from(candidateDocuments)
        .where(eq(candidateDocuments.userId, id)),
    ]);

  return NextResponse.json({
    user,
    analyses,
    applications: userApplications,
    documentsCount,
  });
}
