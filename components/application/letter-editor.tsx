'use client';

import { Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LetterEditorProps {
  text: string;
  onChange: (text: string) => void;
  instructions: string;
  onInstructionsChange: (instructions: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LetterEditor({
  text,
  onChange,
  instructions,
  onInstructionsChange,
  onRegenerate,
  isRegenerating,
}: LetterEditorProps) {
  return (
    <div className="space-y-4">
      {/* Letter text */}
      <div className="space-y-2">
        <Label htmlFor="letter-text">Lettre de motivation</Label>
        <Textarea
          id="letter-text"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[300px] resize-y font-mono text-sm leading-relaxed"
          placeholder="Le contenu de votre lettre apparaitra ici..."
        />
      </div>

      {/* Supplementary instructions */}
      <div className="space-y-2">
        <Label htmlFor="letter-instructions">
          Instructions supplementaires (optionnel)
        </Label>
        <Input
          id="letter-instructions"
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          placeholder="Ex: insiste sur mon experience en logistique"
        />
      </div>

      {/* Regenerate button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRegenerate}
        disabled={isRegenerating}
      >
        {isRegenerating ? (
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
        )}
        Regenerer
      </Button>
    </div>
  );
}
