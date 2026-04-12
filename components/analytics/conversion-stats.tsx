'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ConversionData = {
  total: number;
  applied: number;
  screening: number;
  interviews: number;
  offers: number;
  accepted: number;
  rejected: number;
};

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return '—';
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export function ConversionStats({ data }: { data: ConversionData }) {
  const responded = data.screening + data.interviews + data.offers + data.accepted;

  const stats = [
    {
      label: 'Total candidatures',
      value: data.total.toString(),
    },
    {
      label: 'Taux de réponse',
      value: pct(responded, data.applied),
    },
    {
      label: "Taux d'entretien",
      value: pct(data.interviews, data.applied),
    },
    {
      label: "Taux d'offre",
      value: pct(data.offers, data.applied),
    },
    {
      label: 'Acceptées',
      value: data.accepted.toString(),
    },
    {
      label: 'Rejetées',
      value: data.rejected.toString(),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {s.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
