import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getApplicationById, updateApplicationEmailStatus } from '@/lib/db/kandid-queries';
import { getApplicationFileBuffer } from '@/lib/storage/cv-upload';
import { sendDossierEmail } from '@/lib/email/resend';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 4000, 16000];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;

  let body: { recipientEmail?: string; subject?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { recipientEmail, subject, body: emailBody } = body;

  if (!recipientEmail || typeof recipientEmail !== 'string' || !EMAIL_REGEX.test(recipientEmail.trim())) {
    return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
  }

  const application = await getApplicationById(id, user.id);
  if (!application) {
    return NextResponse.json({ error: 'Candidature non trouvée' }, { status: 404 });
  }

  if (!application.dossierUrl) {
    return NextResponse.json(
      { error: 'Aucun dossier généré pour cette candidature' },
      { status: 400 }
    );
  }

  await updateApplicationEmailStatus(id, user.id, 'pending', recipientEmail.trim());

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await getApplicationFileBuffer(application.dossierUrl);
  } catch (err) {
    console.error('Failed to download dossier PDF:', err);
    await updateApplicationEmailStatus(id, user.id, 'failed', recipientEmail.trim(), 0);
    return NextResponse.json(
      { error: 'Impossible de télécharger le dossier', emailSendStatus: 'failed' },
      { status: 500 }
    );
  }

  const candidateName = user.fullName || user.firstName || 'Candidat';
  const pdfFilename = `dossier-${(application.jobTitle || 'candidature').replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçœæ -]/gi, '_')}.pdf`;

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await sendDossierEmail({
        to: recipientEmail.trim(),
        candidateName,
        jobTitle: application.jobTitle || 'Poste',
        company: application.jobCompany || 'Entreprise',
        subject: subject || undefined,
        body: emailBody || undefined,
        pdfBuffer,
        pdfFilename,
      });

      await updateApplicationEmailStatus(id, user.id, 'sent', recipientEmail.trim(), attempt);
      return NextResponse.json({ success: true, emailSendStatus: 'sent' });
    } catch (err) {
      lastError = err;
      console.error(`Resend attempt ${attempt}/${MAX_RETRIES} failed:`, err);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 1]));
      }
    }
  }

  console.error('All Resend attempts exhausted:', lastError);
  await updateApplicationEmailStatus(id, user.id, 'failed', recipientEmail.trim(), MAX_RETRIES);
  return NextResponse.json(
    { error: "Échec de l'envoi après 3 tentatives", emailSendStatus: 'failed' },
    { status: 500 }
  );
}
