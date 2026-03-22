"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

const chartData = [
    { year: "2022", revenue: 275, fill: "var(--color-blue-500)" },
    { year: "2023", revenue: 200, fill: "#3b82f680" },
    { year: "current", revenue: 187, fill: "var(--color-current)" },
];

const chartConfig = {
    revenue: {
        label: "Revenue",
    },
    y2022: {
        label: "2022",
        color: "var(--color-blue-500)",
    },
    y2023: {
        label: "2023",
        color: "#3b82f680",
    },
    current: {
        label: "Current",
        color: "#3b82f61a",
    },
} satisfies ChartConfig;

const YearlyBreakup = () => {
    return (
        <Card className="w-full py-6 ring-border shadow-none">
            <CardContent className="flex items-center gap-6 px-6">
                <div className="flex flex-col items-start justify-between gap-6 grow">
                    <p className="text-lg font-semibold text-card-foreground">
                        Yearly Backup
                    </p>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-xl font-semibold text-card-foreground">
                            $36,358
                        </p>
                        <div className="flex items-center gap-1">
                            <Badge className="font-normal bg-teal-400/10 text-muted-foreground">
                                +9%
                            </Badge>
                            <p className="text-sm text-muted-foreground">last year</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <p className="text-sm text-muted-foreground">2022</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500/50" />
                            <p className="text-sm text-muted-foreground">2023</p>
                        </div>
                    </div>
                </div>
                {/* chart */}
                <ChartContainer config={chartConfig} className="w-32 h-32">
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="revenue"
                            nameKey="year"
                            innerRadius={35}
                            strokeWidth={0}
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>

    );
};

export default YearlyBreakup;
