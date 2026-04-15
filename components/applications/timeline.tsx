'use client';

import { StatusBadge } from '@/components/applications/status-badge';
import type { ApplicationStatus } from '@/lib/db/schema';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Transition {
  id: string;
  fromStatus: string;
  toStatus: string;
  triggeredBy: string;
  note: string | null;
  createdAt: Date | string;
}

export function Timeline({ transitions }: { transitions: Transition[] }) {
  if (!transitions.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Aucune transition enregistrée
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
      {transitions.map((t) => {
        const date =
          typeof t.createdAt === 'string' ? new Date(t.createdAt) : t.createdAt;
        return (
          <div key={t.id} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-2 ring-background" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={t.fromStatus as ApplicationStatus} />
                <span className="text-xs text-muted-foreground">→</span>
                <StatusBadge status={t.toStatus as ApplicationStatus} />
                <span className="text-xs text-muted-foreground">
                  · {t.triggeredBy === 'user' ? 'Utilisateur' : 'Système'}
                </span>
              </div>
              {t.note && (
                <p className="text-sm text-muted-foreground">{t.note}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(date, { addSuffix: true, locale: fr })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
