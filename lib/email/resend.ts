import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Kandid <noreply@kandid.ch>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kandid.ch";

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
