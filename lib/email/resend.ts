import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Kandid <noreply@kandid.ch>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kandid.ch";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =============================================================================
// Send Functions
// =============================================================================

export async function sendWelcomeEmail(to: string, firstName: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject:
        "Bienvenue sur Kandid — Analysez votre CV pour le marche suisse",
      html: buildWelcomeHtml(firstName),
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    // Don't throw — email failure shouldn't break the flow
  }
}

export async function sendAnalysisCompleteEmail(
  to: string,
  firstName: string,
  score: number,
  analysisId: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Votre score ATS: ${score}/100 — Resultats de l'analyse`,
      html: buildAnalysisCompleteHtml(firstName, score, analysisId),
    });
  } catch (error) {
    console.error("Failed to send analysis email:", error);
  }
}

export interface FollowUpApplication {
  jobTitle: string;
  jobCompany: string;
  urgency: 'urgent' | 'overdue' | 'waiting' | 'cold';
  daysSinceLastAction: number;
  nextFollowUpDate: string;
}

export async function sendFollowUpReminderEmail(
  to: string,
  firstName: string,
  applications: FollowUpApplication[]
) {
  try {
    const count = applications.length;
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Kandid — ${count} candidature${count > 1 ? "s" : ""} nécessitent votre attention`,
      html: buildFollowUpReminderHtml(firstName, applications),
    });
  } catch (error) {
    console.error("Failed to send follow-up reminder email:", error);
    throw error;
  }
}

export async function sendDossierEmail(params: {
  to: string;
  candidateName: string;
  jobTitle: string;
  company: string;
  subject?: string;
  body?: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject:
      params.subject ||
      `Candidature ${params.candidateName} — ${params.jobTitle}`,
    html: buildDossierEmailHtml(params),
    attachments: [
      { filename: params.pdfFilename, content: params.pdfBuffer },
    ],
  });
}

export async function sendSearchAlertEmail(params: {
  to: string;
  firstName: string;
  searchName: string;
  newJobs: Array<{ title: string; company: string; canton: string; url?: string }>;
}) {
  try {
    const count = params.newJobs.length;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `${count} nouvelle${count > 1 ? "s" : ""} offre${count > 1 ? "s" : ""} pour "${params.searchName}"`,
      html: buildSearchAlertHtml(params),
    });
  } catch (error) {
    console.error("Failed to send search alert email:", error);
    throw error;
  }
}

// =============================================================================
// HTML Template Builders
// =============================================================================

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e"; // green
  if (score >= 60) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function getVerdict(score: number): string {
  if (score >= 80)
    return "Excellent ! Votre CV est bien optimise pour le marche suisse.";
  if (score >= 60)
    return "Bon debut ! Quelques ameliorations vous permettront de vous demarquer.";
  return "Des ameliorations importantes sont necessaires pour maximiser vos chances.";
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kandid</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Kandid</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#fafafa;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;line-height:1.6;">
                Kandid SA — Suisse<br />
                Vous recevez cet email car vous avez un compte Kandid.<br />
                <a href="${APP_URL}/legal/privacy" style="color:#71717a;text-decoration:underline;">Politique de confidentialite</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildWelcomeHtml(firstName: string): string {
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#18181b;">
      ${greeting}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Bienvenue sur Kandid ! Vous avez fait le premier pas vers votre emploi en Suisse.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Analysez votre CV en 30 secondes et decouvrez comment l'adapter au marche suisse.
      Notre IA evalue votre CV selon les criteres ATS utilises par les recruteurs suisses
      et vous donne des recommandations concretes.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:#18181b;border-radius:8px;">
          <a href="${APP_URL}/dashboard/cv-analysis"
             style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
            Analyser mon CV
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
      Si vous n'avez pas cree de compte sur Kandid, vous pouvez ignorer cet email.
    </p>`;

  return emailWrapper(content);
}

function buildAnalysisCompleteHtml(
  firstName: string,
  score: number,
  analysisId: string
): string {
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";
  const scoreColor = getScoreColor(score);
  const verdict = getVerdict(score);

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#18181b;">
      ${greeting}
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Votre analyse CV est terminee ! Voici votre score ATS :
    </p>
    <!-- Score Display -->
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 16px;">
      <tr>
        <td style="text-align:center;padding:20px 40px;border:3px solid ${scoreColor};border-radius:12px;">
          <span style="font-size:48px;font-weight:800;color:${scoreColor};line-height:1;">
            ${score}
          </span>
          <span style="font-size:20px;font-weight:600;color:${scoreColor};">/100</span>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;text-align:center;line-height:1.6;">
      ${verdict}
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:#18181b;border-radius:8px;">
          <a href="${APP_URL}/dashboard/cv-analysis/${analysisId}"
             style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
            Voir mes resultats
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
      Consultez vos resultats detailles pour decouvrir comment ameliorer votre CV
      et augmenter vos chances aupres des recruteurs suisses.
    </p>`;

  return emailWrapper(content);
}

function buildDossierEmailHtml(params: {
  candidateName: string;
  jobTitle: string;
  company: string;
  body?: string;
}): string {
  const safeCandidate = escapeHtml(params.candidateName);
  const safeJobTitle = escapeHtml(params.jobTitle);
  const safeCompany = escapeHtml(params.company);
  const bodyText = params.body
    ? escapeHtml(params.body)
    : `Veuillez trouver ci-joint le dossier de candidature de ${safeCandidate} pour le poste de ${safeJobTitle} chez ${safeCompany}.`;

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#18181b;">
      Candidature — ${safeJobTitle}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
      ${bodyText}
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;width:100%;">
      <tr>
        <td style="padding:12px 16px;background-color:#f4f4f5;border-radius:8px;">
          <p style="margin:0 0 4px;font-size:13px;color:#71717a;">Candidat</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#18181b;">${safeCandidate}</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background-color:#f4f4f5;border-radius:8px;">
          <p style="margin:0 0 4px;font-size:13px;color:#71717a;">Poste</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#18181b;">${safeJobTitle} — ${safeCompany}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
      Le dossier complet est joint en pièce jointe (PDF).
    </p>`;

  return emailWrapper(content);
}

function buildFollowUpReminderHtml(
  firstName: string,
  apps: FollowUpApplication[]
): string {
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  const urgentApps = apps.filter((a) => a.urgency === 'urgent');
  const overdueApps = apps.filter((a) => a.urgency === 'overdue');
  const otherApps = apps.filter((a) => a.urgency !== 'urgent' && a.urgency !== 'overdue');

  function renderSection(title: string, color: string, items: FollowUpApplication[]): string {
    if (items.length === 0) return '';
    const rows = items
      .map(
        (a) => `
      <tr>
        <td style="padding:8px 12px;font-size:14px;color:#18181b;border-bottom:1px solid #e4e4e7;">
          <strong>${a.jobTitle}</strong> — ${a.jobCompany}<br />
          <span style="font-size:12px;color:#71717a;">${a.daysSinceLastAction}j depuis la dernière action</span>
        </td>
      </tr>`
      )
      .join('');
    return `
      <h2 style="margin:24px 0 8px;font-size:16px;font-weight:600;color:${color};">
        ${title} (${items.length})
      </h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
        ${rows}
      </table>`;
  }

  const sections = [
    renderSection('🔴 Urgent', '#ef4444', urgentApps),
    renderSection('🟠 En retard', '#f97316', overdueApps),
    renderSection('📋 Autres rappels', '#3b82f6', otherApps),
  ].join('');

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#18181b;">
      ${greeting}
    </h1>
    <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Vous avez <strong>${apps.length} candidature${apps.length > 1 ? "s" : ""}</strong> qui nécessitent votre attention.
    </p>
    ${sections}
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto;">
      <tr>
        <td style="background-color:#18181b;border-radius:8px;">
          <a href="${APP_URL}/dashboard/applications"
             style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
            Voir mes candidatures
          </a>
        </td>
      </tr>
    </table>`;

  return emailWrapper(content);
}

function buildSearchAlertHtml(params: {
  firstName: string;
  searchName: string;
  newJobs: Array<{ title: string; company: string; canton: string; url?: string }>;
}): string {
  const safeFirstName = params.firstName ? escapeHtml(params.firstName) : "";
  const greeting = safeFirstName ? `Bonjour ${safeFirstName},` : "Bonjour,";
  const count = params.newJobs.length;

  const jobRows = params.newJobs
    .slice(0, 10)
    .map(
      (job) => {
        const safeTitle = escapeHtml(job.title);
        const safeCompany = escapeHtml(job.company);
        const safeCanton = escapeHtml(job.canton);
        return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e4e4e7;">
          <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#18181b;">
            ${job.url ? `<a href="${APP_URL}${escapeHtml(job.url)}" style="color:#18181b;text-decoration:none;">${safeTitle}</a>` : safeTitle}
          </p>
          <p style="margin:0;font-size:13px;color:#71717a;">${safeCompany} — ${safeCanton}</p>
        </td>
      </tr>`;
      }
    )
    .join("");

  const moreText =
    count > 10
      ? `<p style="margin:8px 0 0;font-size:13px;color:#71717a;text-align:center;">…et ${count - 10} autre${count - 10 > 1 ? "s" : ""} offre${count - 10 > 1 ? "s" : ""}</p>`
      : "";

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#18181b;">
      ${greeting}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.6;">
      <strong>${count} nouvelle${count > 1 ? "s" : ""} offre${count > 1 ? "s" : ""}</strong> correspondent à votre recherche sauvegardée <strong>"${escapeHtml(params.searchName)}"</strong>.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;margin:0 0 16px;">
      ${jobRows}
    </table>
    ${moreText}
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto;">
      <tr>
        <td style="background-color:#18181b;border-radius:8px;">
          <a href="${APP_URL}/dashboard/jobs"
             style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
            Voir les offres
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;text-align:center;">
      Vous recevez cette alerte car vous avez activé les notifications pour cette recherche.<br />
      <a href="${APP_URL}/dashboard/saved-searches" style="color:#71717a;text-decoration:underline;">Gérer mes alertes</a>
    </p>`;

  return emailWrapper(content);
}
