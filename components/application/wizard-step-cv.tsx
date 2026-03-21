'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { CvSectionEditor } from './cv-section-editor';
import { CvPreview } from './cv-preview';
import type { GeneratedCvData } from '@/lib/ai/generate-cv';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WizardStepCvProps {
  applicationId: string;
  onNext: () => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Helper: fetch user photo as base64
// ---------------------------------------------------------------------------

async function fetchPhotoBase64(): Promise<string | undefined> {
  try {
    const photoRes = await fetch('/api/profile/photo');
    if (!photoRes.ok) return undefined;

    const { signedUrl } = await photoRes.json();
    if (!signedUrl) return undefined;

    // Fetch the actual image and convert to base64
    const imgRes = await fetch(signedUrl);
    if (!imgRes.ok) return undefined;

    const blob = await imgRes.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    // Photo is optional — fail silently
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WizardStepCv({
  applicationId,
  onNext,
  onBack,
}: WizardStepCvProps) {
  // State
  const [cvData, setCvData] = useState<GeneratedCvData | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>();
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // On mount: check if CV data already exists on the application
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);

      try {
        // Fetch application data and photo in parallel
        const [appRes, photo] = await Promise.all([
          fetch(`/api/applications/${applicationId}`),
          fetchPhotoBase64(),
        ]);

        if (cancelled) return;
        setPhotoBase64(photo);

        if (appRes.ok) {
          const { application } = await appRes.json();
          if (application?.generatedCvData) {
            setCvData(application.generatedCvData as GeneratedCvData);
          }
        }
      } catch {
        // Ignore — user will just see the generate button
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  // ---------------------------------------------------------------------------
  // Generate CV via AI
  // ---------------------------------------------------------------------------

  const generateCv = useCallback(async () => {
    setIsGenerating(true);

    try {
      const res = await fetch(
        `/api/applications/${applicationId}/generate-cv`,
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

      const { cvData: generated } = await res.json();
      setCvData(generated as GeneratedCvData);
      toast.success('CV genere avec succes.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la generation.'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [applicationId, instructions]);

  // ---------------------------------------------------------------------------
  // Validate: generate PDF client-side, upload, save data, advance
  // ---------------------------------------------------------------------------

  const validateCv = useCallback(async () => {
    if (!cvData) return;

    setIsValidating(true);

    try {
      // 1. Generate PDF blob client-side (dynamic import to avoid SSR issues)
      const { pdf } = await import('@react-pdf/renderer');
      const { CvTemplate } = await import('@/lib/pdf/cv-template');
      const blob = await pdf(
        <CvTemplate data={cvData} photoBase64={photoBase64} />
      ).toBlob();

      // 2. Upload PDF via the upload-pdf endpoint
      const formData = new FormData();
      formData.append('file', blob, 'cv.pdf');
      formData.append('type', 'cv');

      const uploadRes = await fetch(
        `/api/applications/${applicationId}/upload-pdf`,
        { method: 'POST', body: formData }
      );

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(
          data.error || 'Erreur lors de l\'envoi du PDF.'
        );
      }

      // 3. Save the edited CV data to the application
      const patchRes = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedCvData: cvData }),
      });

      if (!patchRes.ok) {
        const data = await patchRes.json().catch(() => ({}));
        throw new Error(
          data.error || 'Erreur lors de la sauvegarde des donnees.'
        );
      }

      toast.success('CV valide et sauvegarde.');
      onNext();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la validation.'
      );
    } finally {
      setIsValidating(false);
    }
  }, [cvData, photoBase64, applicationId, onNext]);

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
  // Pre-generation state: show generation prompt
  // ---------------------------------------------------------------------------

  if (!cvData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6 max-w-md mx-auto">
        <div className="text-center space-y-2">
          <Sparkles className="h-10 w-10 text-indigo-500 mx-auto" />
          <h3 className="text-lg font-semibold">Generer votre CV</h3>
          <p className="text-sm text-muted-foreground">
            L&apos;IA va creer un CV suisse optimise a partir de votre profil et
            de l&apos;offre d&apos;emploi.
          </p>
        </div>

        <div className="w-full space-y-2">
          <Label htmlFor="cv-instructions">
            Instructions supplementaires (optionnel)
          </Label>
          <Textarea
            id="cv-instructions"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="ex: Mets en avant mon experience en gestion de projet, insiste sur les certifications..."
          />
        </div>

        <Button
          onClick={generateCv}
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
              Generer le CV
            </>
          )}
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Post-generation state: editor + preview split view
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={generateCv}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
          )}
          Regenerer
        </Button>

        <Button
          onClick={validateCv}
          disabled={isValidating}
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
              Valider le CV
            </>
          )}
        </Button>
      </div>

      {/* Split view: editor (left) + preview (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Editor (scrollable) */}
        <div className="overflow-y-auto max-h-[60vh] md:max-h-none">
          <CvSectionEditor data={cvData} onChange={setCvData} />
        </div>

        {/* Preview */}
        <div className="min-h-[400px] md:min-h-0">
          <CvPreview data={cvData} photoBase64={photoBase64} />
        </div>
      </div>
    </div>
  );
}
