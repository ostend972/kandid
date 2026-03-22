"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { Grip } from 'lucide-react';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

const RevenueUpdate = () => {
    const [selectedMonth, setSelectedMonth] = useState("Year 2026");

    const chartDataByMonth: Record<string, any[]> = {
        "Year 2026": [
            { month: "16/08", Earnings: 1500, Expense: -1800, },
            { month: "17/08", Earnings: 2700, Expense: -1100 },
            { month: "18/08", Earnings: 2200, Expense: -2500 },
            { month: "19/08", Earnings: 3000, Expense: -1500 },
            { month: "20/08", Earnings: 1500, Expense: -600 },
            { month: "21/08", Earnings: 1000, Expense: -1800 },
            { month: "22/08", Earnings: 1400, Expense: -1200 },
        ],
        "Year 2025": [
            { month: "16/08", Earnings: 2000, Expense: -1200 },
            { month: "17/08", Earnings: 2500, Expense: -1500 },
            { month: "18/08", Earnings: 2800, Expense: -2000 },
            { month: "19/08", Earnings: 3000, Expense: -1000 },
            { month: "20/08", Earnings: 2000, Expense: -800 },
            { month: "21/08", Earnings: 1500, Expense: -1300 },
            { month: "22/08", Earnings: 2700, Expense: -1500 },
        ],
        "Year 2024": [
            { month: "16/08", Earnings: 1800, Expense: -1500 },
            { month: "17/08", Earnings: 2200, Expense: -1300 },
            { month: "18/08", Earnings: 2600, Expense: -2200 },
            { month: "19/08", Earnings: 3000, Expense: -1200 },
            { month: "20/08", Earnings: 1700, Expense: -700 },
            { month: "21/08", Earnings: 1200, Expense: -1600 },
            { month: "22/08", Earnings: 2000, Expense: -1200 },
        ],
    };

    const chartConfig = {
        Earnings: {
            label: "Earnings",
            color: "var(--color-blue-500)",
        },
        Expense: {
            label: "Expense",
            color: "var(--color-sky-400)",
        },
    } satisfies ChartConfig;

    return (
        <Card className="py-6 gap-6">
            <CardHeader className="px-6">
                <div className="sm:flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">
                            Revenue Updates
                        </CardTitle>
                        <CardDescription>Overview of profit</CardDescription>
                    </div>
                    <div >
                        <Select
                            value={selectedMonth}
                            onValueChange={(value) => value && setSelectedMonth(value)}
                        >
                            <SelectTrigger className="shadow-xs h-9!">
                                <SelectValue >{selectedMonth}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem className="cursor-pointer" value="Year 2026">Year 2026</SelectItem>
                                    <SelectItem className="cursor-pointer" value="Year 2025">Year 2025</SelectItem>
                                    <SelectItem className="cursor-pointer" value="Year 2024">Year 2024</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-6">
                <div className="grid grid-cols-12 items-center gap-6">
                    <div className="lg:col-span-8 md:col-span-8 sm:col-span-12 col-span-12">
                        <div className="h-80 w-full ">
                            <ChartContainer config={chartConfig} className="h-full w-full ">
                                <BarChart
                                    accessibilityLayer
                                    data={chartDataByMonth[selectedMonth]}
                                    stackOffset="sign"
                                    margin={{ left: -30 }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        tickMargin={15}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={(val) => `${val / 1000}k`}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[-3000, 3000]}

                                        ticks={[-3000, -2000, -1000, 0, 1000, 2000, 3000]}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar
                                        dataKey="Earnings"
                                        stackId="a"
                                        fill="var(--color-Earnings)"
                                        radius={[6, 6, 0, 0]}
                                        barSize={11}
                                        stroke="var(--background)"
                                        strokeWidth={2}
                                    />
                                    <Bar
                                        dataKey="Expense"
                                        stackId="a"
                                        fill="var(--color-Expense)"
                                        radius={[6, 6, 0, 0]}
                                        barSize={11}
                                        stroke="var(--background)"
                                        strokeWidth={2}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </div>

                    <div className="lg:col-span-4 md:col-span-4 sm:col-span-12 col-span-12">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 dark:bg-darkprimary shrink-0 h-10 w-10 flex justify-center items-center rounded-md">
                                <Grip className="text-xl text-blue-500" />
                            </div>
                            <div>
                                <h4 className="text-xl text-foreground dark:text-white font-semibold">
                                    $63,489.50
                                </h4>
                                <p className="text-muted-foreground ">Total Earnings</p>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-3 pt-9 sm:pt-14">
                            <i className="h-2 w-2 rounded-full bg-blue-500" />
                            <div>
                                <p className="text-muted-foreground">Earnings this month</p>
                                <h6 className="text-lg text-foreground font-semibold">$48,820</h6>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-3 pt-8">
                            <i className="h-2 w-2  rounded-full bg-sky-400" />
                            <div>
                                <p className="text-muted-foreground">Expense this month</p>
                                <h6 className="text-lg text-foreground font-semibold">$26,498</h6>
                            </div>
                        </div>

                        <Button className="h-9 px-4 mt-9 sm:mt-14 capitalize w-full cursor-pointer hover:bg-primary/80">view full report</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
export default RevenueUpdate;
