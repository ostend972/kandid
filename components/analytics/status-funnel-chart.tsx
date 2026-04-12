'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  applied: 'Postulée',
  screening: 'Sélection',
  interview: 'Entretien',
  offer: 'Offre',
  accepted: 'Acceptée',
  rejected: 'Rejetée',
  withdrawn: 'Retirée',
};

export function StatusFunnelChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  const mapped = data.map((d) => ({
    ...d,
    label: STATUS_LABELS[d.status] ?? d.status,
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Entonnoir des statuts</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={mapped}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <Tooltip />
            <Bar
              dataKey="count"
              fill="hsl(221, 83%, 53%)"
              radius={[4, 4, 0, 0]}
              name="Candidatures"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
