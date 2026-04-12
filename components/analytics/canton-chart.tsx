'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CANTON_LABELS: Record<string, string> = {
  GE: 'Genève',
  VD: 'Vaud',
  VS: 'Valais',
  FR: 'Fribourg',
  NE: 'Neuchâtel',
  JU: 'Jura',
  BE: 'Berne',
  ZH: 'Zurich',
  BS: 'Bâle-Ville',
  LU: 'Lucerne',
  TI: 'Tessin',
  AG: 'Argovie',
  SG: 'Saint-Gall',
  SO: 'Soleure',
  TG: 'Thurgovie',
  BL: 'Bâle-Campagne',
};

const COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(173, 80%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(346, 77%, 50%)',
  'hsl(142, 71%, 45%)',
  'hsl(199, 89%, 48%)',
  'hsl(24, 95%, 53%)',
  'hsl(280, 67%, 50%)',
  'hsl(47, 96%, 53%)',
];

export function CantonChart({
  data,
}: {
  data: { canton: string; count: number; avgScore: number | null }[];
}) {
  const mapped = data.map((d) => ({
    ...d,
    label: CANTON_LABELS[d.canton] ?? d.canton,
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Candidatures par canton</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={mapped}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ label, percent }) =>
                `${label} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {mapped.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={COLORS[i % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
