import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSavedSearches, createSavedSearch } from '@/lib/db/kandid-queries';
import { z } from 'zod';

const createSearchSchema = z.object({
  name: z.string().min(1).max(200),
  filters: z.record(z.unknown()),
  alertEnabled: z.boolean().optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Non autorise.' }, { status: 401 });
  }

  const searches = await getSavedSearches(userId);
  return NextResponse.json({ searches });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Non autorise.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const parsed = createSearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees invalides.', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, filters } = parsed.data;
  const search = await createSavedSearch(userId, name.trim(), filters);
  return NextResponse.json({ search }, { status: 201 });
}
