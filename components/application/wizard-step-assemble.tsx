'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  GraduationCap,
  Shield,
  Users,
  FileCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WizardStepAssembleProps {
  applicationId: string;
  onNext: () => void;
  onBack: () => void;
}

interface DocumentCounts {
  certificate: number;
  diploma: number;
  permit: number;
  recommendation: number;
}

interface ApplicationInfo {
  referencesPageUrl: string | null;
  generatedCvUrl: string | null;
  coverLetterUrl: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WizardStepAssemble({
  applicationId,
  onNext,
  onBack,
}: WizardStepAssembleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assembling, setAssembling] = useState(false);

  // Mode selection
  const [mode, setMode] = useState<'pdf' | 'zip'>('pdf');

  // Document counts from profile
  const [docCounts, setDocCounts] = useState<DocumentCounts>({
    certificate: 0,
    diploma: 0,
    permit: 0,
    recommendation: 0,
  });

  // Application info (references, etc.)
  const [appInfo, setAppInfo] = useState<ApplicationInfo>({
    referencesPageUrl: null,
    generatedCvUrl: null,
    coverLetterUrl: null,
  });

  // Inclusion checkboxes for optional documents
  const [includeReferences, setIncludeReferences] = useState(true);
  const [includeCertificates, setIncludeCertificates] = useState(true);
  const [includeDiplomas, setIncludeDiplomas] = useState(true);
  const [includePermits, setIncludePermits] = useState(true);

  // ---------------------------------------------------------------------------
  // Fetch document counts + application data on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [docsRes, appRes] = await Promise.all([
          fetch('/api/profile/documents'),
          fetch(`/api/applications/${applicationId}`),
        ]);

        if (!docsRes.ok) {
          throw new Error('Erreur lors du chargement des documents.');
        }
        if (!appRes.ok) {
          throw new Error('Erreur lors du chargement de la candidature.');
        }

        const { documents } = await docsRes.json();
        const { application } = await appRes.json();

        // Count documents by category
        const counts: DocumentCounts = {
          certificate: 0,
          diploma: 0,
          permit: 0,
          recommendation: 0,
        };

        if (Array.isArray(documents)) {
          for (const doc of documents) {
            if (doc.category in counts) {
              counts[doc.category as keyof DocumentCounts]++;
            }
          }
        }

        if (!cancelled) {
          setDocCounts(counts);
          setAppInfo({
            referencesPageUrl: application.referencesPageUrl ?? null,
            generatedCvUrl: application.generatedCvUrl ?? null,
            coverLetterUrl: application.coverLetterUrl ?? null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Erreur inattendue.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  // ---------------------------------------------------------------------------
  // Assemble dossier
  // ---------------------------------------------------------------------------

  async function handleAssemble() {
    setAssembling(true);

    try {
      const res = await fetch(
        `/api/applications/${applicationId}/assemble-dossier`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            includeReferences,
            includeCertificates,
            includeDiplomas,
            includePermits,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "Erreur lors de l'assemblage du dossier."
        );
      }

      toast.success('Dossier assemble avec succes !');
      onNext();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur inattendue.'
      );
    } finally {
      setAssembling(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-muted-foreground">
          Chargement des documents...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reessayer
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Document list items
  // ---------------------------------------------------------------------------

  const hasReferences = !!appInfo.referencesPageUrl;
  const hasCertificates = docCounts.certificate > 0;
  const hasDiplomas = docCounts.diploma > 0;
  const hasPermits = docCounts.permit > 0;

  const documentItems = [
    {
      number: 1,
      label: 'CV suisse (2 pages)',
      icon: FileText,
      required: true,
      included: true,
      available: !!appInfo.generatedCvUrl,
    },
    {
      number: 2,
      label: 'Lettre de motivation',
      icon: FileText,
      required: true,
      included: true,
      available: !!appInfo.coverLetterUrl,
    },
    {
      number: 3,
      label: 'Page de references',
      icon: Users,
      required: false,
      included: includeReferences && hasReferences,
      available: hasReferences,
      checked: includeReferences,
      onToggle: setIncludeReferences,
      count: null,
    },
    {
      number: 4,
      label: 'Certificats de travail',
      icon: FileCheck,
      required: false,
      included: includeCertificates && hasCertificates,
      available: hasCertificates,
      checked: includeCertificates,
      onToggle: setIncludeCertificates,
      count: docCounts.certificate,
    },
    {
      number: 5,
      label: 'Diplomes',
      icon: GraduationCap,
      required: false,
      included: includeDiplomas && hasDiplomas,
      available: hasDiplomas,
      checked: includeDiplomas,
      onToggle: setIncludeDiplomas,
      count: docCounts.diploma,
    },
    {
      number: 6,
      label: 'Permis',
      icon: Shield,
      required: false,
      included: includePermits && hasPermits,
      available: hasPermits,
      checked: includePermits,
      onToggle: setIncludePermits,
      count: docCounts.permit,
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Mode selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Format du dossier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as 'pdf' | 'zip')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="pdf" id="mode-pdf" />
              <Label htmlFor="mode-pdf" className="cursor-pointer">
                PDF unique{' '}
                <Badge variant="secondary" className="ml-1 text-xs">
                  recommande
                </Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="zip" id="mode-zip" />
              <Label htmlFor="mode-zip" className="cursor-pointer">
                Fichiers separes (ZIP)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Document order preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Documents inclus dans le dossier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {documentItems.map((item, idx) => (
              <li key={item.number}>
                <div className="flex items-center gap-3">
                  {/* Number badge */}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                    {item.number}
                  </span>

                  {/* Icon */}
                  <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />

                  {/* Checkbox or check icon */}
                  {item.required ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  ) : item.available ? (
                    <Checkbox
                      id={`doc-${item.number}`}
                      checked={item.checked}
                      onCheckedChange={(checked) =>
                        item.onToggle?.(checked === true)
                      }
                    />
                  ) : null}

                  {/* Label */}
                  <span
                    className={
                      !item.available && !item.required
                        ? 'text-sm text-muted-foreground'
                        : 'text-sm'
                    }
                  >
                    {item.label}
                    {item.count !== undefined && item.count !== null && (
                      <span className="ml-1 text-muted-foreground">
                        ({item.count})
                      </span>
                    )}
                    {!item.available && !item.required && (
                      <span className="ml-1 text-muted-foreground italic">
                        (aucun)
                      </span>
                    )}
                  </span>
                </div>
                {idx < documentItems.length - 1 && (
                  <Separator className="mt-3" />
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={assembling}>
          Retour
        </Button>
        <Button
          onClick={handleAssemble}
          disabled={assembling}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {assembling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generer le dossier
        </Button>
      </div>
    </div>
  );
}
