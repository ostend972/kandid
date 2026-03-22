"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CircleDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const chartData = [
    { Users: 35 },
    { Users: 48 },
    { Users: 58 },
    { Users: 50 },
    { Users: 38 },
    { Users: 45 },
    { Users: 62 },
    { Users: 55 },
    { Users: 42 },
    { Users: 58 },
    { Users: 75 },
    { Users: 68 },
    { Users: 60 },
];

const chartConfig = {
    Users: {
        label: "Users",
        color: "#2DD4BF",
    },
} satisfies ChartConfig;

const MonthlyEarning = () => {
    return (

        <Card className="w-full gap-6 shadow-xs border-border rounded-xl py-6">
            <CardHeader className="flex flex-col gap-2 px-6">
                <div className="flex justify-between w-full">
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Monthly earnings
                    </CardTitle>
                    <span className="p-3 shrink-0 flex items-center justify-center bg-sky-400/10 rounded-lg">
                        <CircleDollarSign className="text-blue-500" size={16} />
                    </span>
                </div>
                <div className="flex flex-col gap-0.5">
                    <p className="text-xl font-semibold text-foreground">$6,820</p>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-red-500/10 text-muted-foreground hover:bg-red-500/20 border-none font-normal px-2 py-0.5 text-xs">
                            -9%
                        </Badge>
                        <p className="text-sm font-normal text-muted-foreground">than last year</p>
                    </div>
                </div>
            </CardHeader>

            {/* Sparkline Chart */}
            <CardContent className="px-6">
                <ChartContainer config={chartConfig} className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                        >
                            <XAxis hide />
                            <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                            <Area
                                type="monotone"
                                dataKey="Users"
                                stroke="#38BDF8"
                                fill="#38BDF833"
                                fillOpacity={0.2}
                                strokeWidth={2}
                                strokeLinecap="round"
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>

    );
};

export default MonthlyEarning;
