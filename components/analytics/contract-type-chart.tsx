'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(173, 80%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(346, 77%, 50%)',
];

export function ContractTypeChart({
  data,
}: {
  data: { contractType: string; count: number }[];
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Type de contrat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="contractType"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              label={({ contractType, percent }) =>
                `${contractType} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {data.map((_, i) => (
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
