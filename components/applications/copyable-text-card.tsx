'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CopyableTextCard({
  title,
  icon,
  subtitle,
  text,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const needsExpand = text.length > 300;

  async function handleCopy() {
    const content = subtitle ? `${subtitle}\n\n${text}` : text;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2 text-muted-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Copié
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copier
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {subtitle && <p className="text-sm font-medium">{subtitle}</p>}
        <p
          className={`text-sm text-muted-foreground whitespace-pre-line select-text ${
            !expanded && needsExpand ? 'line-clamp-6' : ''
          }`}
        >
          {text}
        </p>
        {needsExpand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 px-2 text-xs text-muted-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Réduire
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Voir tout
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
