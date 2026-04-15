import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { updateSavedSearch, deleteSavedSearch } from '@/lib/db/kandid-queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Non autorise.' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, filters, emailAlertEnabled } = body;

  const data: { name?: string; filters?: Record<string, unknown>; emailAlertEnabled?: boolean } = {};
  if (typeof name === 'string') data.name = name;
  if (typeof filters === 'object' && filters !== null) data.filters = filters;
  if (typeof emailAlertEnabled === 'boolean') data.emailAlertEnabled = emailAlertEnabled;

  const updated = await updateSavedSearch(id, userId, data);
  if (!updated) {
    return NextResponse.json({ error: 'Recherche non trouvee.' }, { status: 404 });
  }

  return NextResponse.json({ search: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Non autorise.' }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteSavedSearch(id, userId);
  if (!deleted) {
    return NextResponse.json({ error: 'Recherche non trouvee.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
