'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';

import { Button } from '@/components/ui/button';
import { LetterTemplate } from '@/lib/pdf/letter-template';
import { LetterEditor } from './letter-editor';

import type { GeneratedLetterData } from '@/lib/ai/generate-letter';
import type { GeneratedCvData } from '@/lib/ai/generate-cv';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WizardStepLetterProps {
  applicationId: string;
  onNext: () => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Helper: assemble full text from structured letter data
// ---------------------------------------------------------------------------

function assembleLetterText(data: GeneratedLetterData): string {
  return [
    data.greeting,
    '',
    data.body.vous,
    '',
    data.body.moi,
    '',
    data.body.nous,
    '',
    data.closing,
    '',
    data.signature,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WizardStepLetter({
  applicationId,
  onNext,
}: WizardStepLetterProps) {
  // State
  const [letterText, setLetterText] = useState('');
  const [letterData, setLetterData] = useState<GeneratedLetterData | null>(null);
  const [cvData, setCvData] = useState<GeneratedCvData | null>(null);
  const [jobCompany, setJobCompany] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // ---------------------------------------------------------------------------
  // On mount: fetch application to check for existing letter + CV data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/applications/${applicationId}`);
        if (!res.ok) return;

        const { application } = await res.json();
        if (cancelled) return;

        // Store CV data for PDF generation (candidate identity)
        if (application?.generatedCvData) {
          setCvData(application.generatedCvData as GeneratedCvData);
        }

        // Store company name for PDF
        if (application?.jobCompany) {
          setJobCompany(application.jobCompany);
        }

        // Resume existing letter if present
        if (application?.coverLetterText) {
          setLetterText(application.coverLetterText);
        }

        // Resume instructions if present
        if (application?.coverLetterInstructions) {
          setInstructions(application.coverLetterInstructions);
        }
      } catch {
        // Ignore — user will just see the generate button
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [applicationId]);

  // ---------------------------------------------------------------------------
  // Generate letter via AI
  // ---------------------------------------------------------------------------

  const generateLetter = useCallback(async () => {
    setIsGenerating(true);

    try {
      const res = await fetch(
        `/api/applications/${applicationId}/generate-letter`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructions: instructions.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la generation.');
      }

      const { letterData: generated } = await res.json();
      const typedData = generated as GeneratedLetterData;
      setLetterData(typedData);
      setLetterText(assembleLetterText(typedData));
      toast.success('Lettre generee avec succes.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la generation.'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [applicationId, instructions]);

  // ---------------------------------------------------------------------------
  // Validate: generate PDF client-side, upload, save, advance
  // ---------------------------------------------------------------------------

  const validateLetter = useCallback(async () => {
    if (!letterText.trim()) return;

    setIsValidating(true);

    try {
      // Build letter data for PDF from current letterData or parse from text
      const pdfLetterData = letterData ?? buildLetterDataFromText(letterText);

      // Candidate identity from CV data
      const identity = cvData?.identity;
      const candidateName = identity
        ? `${identity.firstName} ${identity.lastName}`
        : '';
      const candidateAddress = identity?.address ?? '';
      const candidatePhone = identity?.phone ?? '';
      const candidateEmail = identity?.email ?? '';

      // Format date
      const now = new Date();
      const dateStr = now.toLocaleDateString('fr-CH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // 1. Generate PDF blob client-side
      const blob = await pdf(
        <LetterTemplate
          data={pdfLetterData}
          candidateName={candidateName}
          candidateAddress={candidateAddress}
          candidatePhone={candidatePhone}
          candidateEmail={candidateEmail}
          companyName={jobCompany}
          date={dateStr}
        />
      ).toBlob();

      // 2. Upload PDF via upload-pdf endpoint
      const formData = new FormData();
      formData.append('file', blob, 'lettre.pdf');
      formData.append('type', 'letter');

      const uploadRes = await fetch(
        `/api/applications/${applicationId}/upload-pdf`,
        { method: 'POST', body: formData }
      );

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de l'envoi du PDF.");
      }

      // 3. Save cover letter text via PATCH
      const patchRes = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetterText: letterText,
          coverLetterInstructions: instructions.trim() || null,
        }),
      });

      if (!patchRes.ok) {
        const data = await patchRes.json().catch(() => ({}));
        throw new Error(
          data.error || 'Erreur lors de la sauvegarde des donnees.'
        );
      }

      toast.success('Lettre validee et sauvegardee.');
      onNext();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la validation.'
      );
    } finally {
      setIsValidating(false);
    }
  }, [letterText, letterData, cvData, jobCompany, instructions, applicationId, onNext]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Pre-generation state
  // ---------------------------------------------------------------------------

  if (!letterText) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6 max-w-md mx-auto">
        <div className="text-center space-y-2">
          <Sparkles className="h-10 w-10 text-indigo-500 mx-auto" />
          <h3 className="text-lg font-semibold">
            Generer la lettre de motivation
          </h3>
          <p className="text-sm text-muted-foreground">
            L&apos;IA va rediger une lettre en methode VOUS-MOI-NOUS, adaptee au
            poste et a votre profil.
          </p>
        </div>

        <Button
          onClick={generateLetter}
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generation en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generer la lettre de motivation
            </>
          )}
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Post-generation state: editor + validate
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* Editor */}
      <LetterEditor
        text={letterText}
        onChange={setLetterText}
        instructions={instructions}
        onInstructionsChange={setInstructions}
        onRegenerate={generateLetter}
        isRegenerating={isGenerating}
      />

      {/* Validate button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={validateLetter}
          disabled={isValidating || !letterText.trim()}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validation...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Valider la lettre
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: reconstruct letter data from plain text (for PDF when user edited)
// ---------------------------------------------------------------------------

function buildLetterDataFromText(text: string): GeneratedLetterData {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  // Best-effort parsing: first paragraph = greeting, last = closing+signature, middle = body
  const greeting = paragraphs[0] ?? '';
  const signature = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] ?? '' : '';
  const closing = paragraphs.length > 2 ? paragraphs[paragraphs.length - 2] ?? '' : '';

  // Body paragraphs (everything between greeting and closing/signature)
  const bodyParagraphs = paragraphs.slice(
    1,
    Math.max(1, paragraphs.length - 2)
  );

  // Split body into vous/moi/nous (best effort: thirds)
  const third = Math.ceil(bodyParagraphs.length / 3);
  const vous = bodyParagraphs.slice(0, third).join('\n\n');
  const moi = bodyParagraphs.slice(third, third * 2).join('\n\n');
  const nous = bodyParagraphs.slice(third * 2).join('\n\n');

  return {
    subject: '',
    greeting,
    body: {
      vous: vous || (bodyParagraphs[0] ?? ''),
      moi: moi || '',
      nous: nous || '',
    },
    closing,
    signature,
  };
}
