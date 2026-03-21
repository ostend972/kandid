'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CvTemplate } from '@/lib/pdf/cv-template';
import type { GeneratedCvData } from '@/lib/ai/generate-cv';

// ---------------------------------------------------------------------------
// Dynamic import of PDFViewer (SSR disabled)
// ---------------------------------------------------------------------------

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-sm text-muted-foreground">
          Chargement de l&apos;apercu...
        </span>
      </div>
    ),
  }
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CvPreviewProps {
  data: GeneratedCvData;
  photoBase64?: string;
}

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    timer.current = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, delay]);

  return debounced;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CvPreview({ data, photoBase64 }: CvPreviewProps) {
  const debouncedData = useDebounced(data, 300);

  // Mobile toggle
  const [showPreview, setShowPreview] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);

    function handleChange(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
    }
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  // Memoize the document so it only re-renders when debounced data changes
  const document = useMemo(
    () => <CvTemplate data={debouncedData} photoBase64={photoBase64} />,
    [debouncedData, photoBase64]
  );

  // Mobile: collapsible
  if (isMobile) {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Masquer l&apos;apercu
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Voir l&apos;apercu
            </>
          )}
        </Button>
        {showPreview && (
          <div className="h-[500px] rounded-lg border overflow-hidden">
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              {document}
            </PDFViewer>
          </div>
        )}
      </div>
    );
  }

  // Desktop: full height
  return (
    <div className="h-full rounded-lg border overflow-hidden">
      <PDFViewer width="100%" height="100%" showToolbar={false}>
        {document}
      </PDFViewer>
    </div>
  );
}
