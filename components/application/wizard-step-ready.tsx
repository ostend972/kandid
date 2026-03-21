'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Download,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WizardStepReadyProps {
  applicationId: string;
  jobSourceUrl: string;
  onBack: () => void;
  onComplete: () => void;
}

interface EmailData {
  subject: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WizardStepReady({
  applicationId,
  jobSourceUrl,
  onBack,
  onComplete,
}: WizardStepReadyProps) {
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch or generate email data on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadEmailData() {
      setLoadingEmail(true);
      setEmailError(null);

      try {
        // First, check if email data already exists on the application
        const appRes = await fetch(`/api/applications/${applicationId}`);
        if (!appRes.ok) {
          throw new Error('Erreur lors du chargement de la candidature.');
        }

        const { application } = await appRes.json();

        if (application.emailSubject && application.emailBody) {
          // Email already generated
          if (!cancelled) {
            setEmailData({
              subject: application.emailSubject,
              body: application.emailBody,
            });
          }
        } else {
          // Generate email via API
          const emailRes = await fetch(
            `/api/applications/${applicationId}/generate-email`,
            { method: 'POST' }
          );

          if (!emailRes.ok) {
            const data = await emailRes.json().catch(() => ({}));
            throw new Error(
              data.error || "Erreur lors de la generation de l'email."
            );
          }

          const { emailData: generated } = await emailRes.json();
          if (!cancelled) {
            setEmailData({
              subject: generated.subject,
              body: generated.body,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setEmailError(
            err instanceof Error ? err.message : 'Erreur inattendue.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingEmail(false);
        }
      }
    }

    loadEmailData();

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  // ---------------------------------------------------------------------------
  // Copy to clipboard
  // ---------------------------------------------------------------------------

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copie !');
    } catch {
      toast.error('Impossible de copier dans le presse-papiers.');
    }
  }

  // ---------------------------------------------------------------------------
  // Mark as completed
  // ---------------------------------------------------------------------------

  async function handleComplete() {
    setCompleting(true);

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la mise a jour.');
      }

      toast.success('Candidature marquee comme envoyee');
      onComplete();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur inattendue.'
      );
    } finally {
      setCompleting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h3 className="text-xl font-semibold">
          Votre dossier de candidature est pret !
        </h3>
      </div>

      <Separator />

      {/* Email section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email de candidature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingEmail ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              <span className="text-sm text-muted-foreground">
                Generation de l&apos;email...
              </span>
            </div>
          ) : emailError ? (
            <div className="flex items-center gap-3 py-4 text-sm text-amber-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{emailError}</span>
            </div>
          ) : emailData ? (
            <>
              {/* Subject */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Objet
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border px-3 py-2 text-sm bg-muted/50">
                    {emailData.subject}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(emailData.subject)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copier le sujet
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Corps du message
                </Label>
                <div className="rounded-md border px-3 py-2 text-sm bg-muted/50 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {emailData.body}
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(emailData.body)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copier le texte
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Download section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Telecharger
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              window.open(
                `/api/applications/${applicationId}/download?mode=pdf`,
                '_blank'
              )
            }
          >
            <Download className="h-4 w-4 mr-2" />
            Telecharger le dossier (PDF)
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              window.open(
                `/api/applications/${applicationId}/download?mode=zip`,
                '_blank'
              )
            }
          >
            <Download className="h-4 w-4 mr-2" />
            Telecharger les fichiers (ZIP)
          </Button>
        </CardContent>
      </Card>

      {/* Job link */}
      {jobSourceUrl && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open(jobSourceUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Voir l&apos;annonce originale
        </Button>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={completing}>
          Retour
        </Button>
        <Button
          onClick={handleComplete}
          disabled={completing}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Marquer comme postule
        </Button>
      </div>
    </div>
  );
}
