'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { WizardStepProfile } from './wizard-step-profile';
import { WizardStepCv } from './wizard-step-cv';
import { WizardStepLetter } from './wizard-step-letter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApplyWizardProps {
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  cvAnalysisId: string;
  trigger: React.ReactNode;
}

interface ApplicationData {
  id: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Steps metadata
// ---------------------------------------------------------------------------

const STEPS = [
  { number: 1, label: 'Profil' },
  { number: 2, label: 'CV' },
  { number: 3, label: 'Lettre' },
  { number: 4, label: 'Dossier' },
  { number: 5, label: 'Pret' },
] as const;

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Etapes de candidature" className="flex items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((step, idx) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;

        return (
          <div key={step.number} className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  isActive && 'bg-indigo-600 text-white',
                  isCompleted && 'bg-indigo-100 text-indigo-700',
                  !isActive && !isCompleted && 'bg-gray-100 text-gray-400'
                )}
              >
                {step.number}
              </div>
              <span
                className={cn(
                  'text-xs hidden sm:block',
                  isActive && 'font-medium text-indigo-600',
                  isCompleted && 'text-indigo-600',
                  !isActive && !isCompleted && 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-6 sm:w-10',
                  step.number < currentStep ? 'bg-indigo-300' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main wizard component
// ---------------------------------------------------------------------------

export function ApplyWizard({
  jobId,
  jobTitle,
  jobCompany,
  cvAnalysisId,
  trigger,
}: ApplyWizardProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Create draft application via API
  const createDraft = useCallback(async () => {
    if (applicationId) {
      // Already created — just advance
      setCurrentStep(2);
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, cvAnalysisId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la creation.');
      }

      const { application } = await res.json();
      setApplicationId(application.id);
      setApplicationData(application);
      setCurrentStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur inattendue.');
    } finally {
      setIsCreating(false);
    }
  }, [applicationId, jobId, cvAnalysisId]);

  // Step navigation
  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(1, s - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(5, s + 1));
  }, []);

  // Render current step content
  function renderStep() {
    switch (currentStep) {
      case 1:
        return (
          <WizardStepProfile
            onNext={createDraft}
            isCreating={isCreating}
          />
        );
      case 2:
        return applicationId ? (
          <WizardStepCv
            applicationId={applicationId}
            onNext={goNext}
            onBack={goBack}
          />
        ) : null;
      case 3:
        return applicationId ? (
          <WizardStepLetter
            applicationId={applicationId}
            onNext={goNext}
            onBack={goBack}
          />
        ) : null;
      case 4:
        return (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            Step 4 - Assembly (Coming soon)
          </div>
        );
      case 5:
        return (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            Step 5 - Ready (Coming soon)
          </div>
        );
      default:
        return null;
    }
  }

  const stepTitle = STEPS.find((s) => s.number === currentStep)?.label ?? '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton
        className={cn(
          "h-[100dvh] max-h-[100dvh] w-full max-w-full rounded-none border-0 sm:h-[90dvh] sm:max-h-[90dvh] sm:rounded-lg sm:border",
          currentStep === 2 ? "sm:max-w-6xl" : "sm:max-w-3xl"
        )}
      >
        {/* Accessible dialog title */}
        <DialogTitle className="sr-only">
          Candidature : {jobTitle} — {jobCompany}
        </DialogTitle>

        <div className="flex h-full flex-col overflow-hidden">
          {/* Header: step indicator */}
          <div className="shrink-0 border-b px-4 py-4">
            <StepIndicator currentStep={currentStep} />
          </div>

          {/* Sub-header: back button + step title */}
          <div className="flex shrink-0 items-center gap-3 px-6 py-3">
            {currentStep > 1 ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={goBack}
                aria-label="Etape precedente"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <div className="h-9 w-9" /> // spacer
            )}
            <div>
              <h2 className="text-lg font-semibold">{stepTitle}</h2>
              <p className="text-sm text-muted-foreground">
                {jobTitle} — {jobCompany}
              </p>
            </div>
          </div>

          {/* Content area */}
          <div className={cn(
            "flex-1 px-6 py-4 min-h-0",
            currentStep === 2 ? "overflow-hidden flex flex-col" : "overflow-y-auto"
          )}>
            {renderStep()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
