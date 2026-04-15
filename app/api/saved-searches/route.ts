import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSavedSearches, createSavedSearch } from '@/lib/db/kandid-queries';

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

  const body = await request.json();
  const { name, filters } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Nom requis.' }, { status: 400 });
  }

  if (!filters || typeof filters !== 'object') {
    return NextResponse.json({ error: 'Filtres requis.' }, { status: 400 });
  }

  const search = await createSavedSearch(userId, name.trim(), filters);
  return NextResponse.json({ search }, { status: 201 });
}
