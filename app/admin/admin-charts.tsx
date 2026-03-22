'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/* -------------------------------------------------------------------------- */
/*  Colour palette for the pie chart                                          */
/* -------------------------------------------------------------------------- */

const COLORS = [
  'hsl(221, 83%, 53%)', // blue-600
  'hsl(262, 83%, 58%)', // violet-500
  'hsl(173, 80%, 40%)', // teal-600
  'hsl(38, 92%, 50%)',  // amber-500
  'hsl(346, 77%, 50%)', // rose-600
  'hsl(142, 71%, 45%)', // green-600
  'hsl(199, 89%, 48%)', // sky-500
  'hsl(24, 95%, 53%)',  // orange-500
  'hsl(280, 67%, 50%)', // purple-600
  'hsl(47, 96%, 53%)',  // yellow-400
];

/* -------------------------------------------------------------------------- */
/*  Signups bar chart                                                         */
/* -------------------------------------------------------------------------- */

export function SignupsChart({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">
          Inscriptions (7 derniers jours)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <XAxis
              dataKey="day"
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
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Canton pie chart                                                          */
/* -------------------------------------------------------------------------- */

export function CantonChart({
  data,
}: {
  data: { canton: string; count: number }[];
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Offres par canton</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="canton"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ canton, percent }) =>
                `${canton} (${(percent * 100).toFixed(0)}%)`
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
