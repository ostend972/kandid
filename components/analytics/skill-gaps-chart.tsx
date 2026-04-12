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

export function SkillGapsChart({
  data,
}: {
  data: { skill: string; frequency: number }[];
}) {
  const mapped = data.map((d) => ({
    ...d,
    label: d.skill.length > 30 ? d.skill.slice(0, 27) + '…' : d.skill,
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">
          Compétences manquantes les plus fréquentes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={mapped} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              type="number"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={160}
            />
            <Tooltip />
            <Bar
              dataKey="frequency"
              fill="hsl(346, 77%, 50%)"
              radius={[0, 4, 4, 0]}
              name="Fréquence"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
