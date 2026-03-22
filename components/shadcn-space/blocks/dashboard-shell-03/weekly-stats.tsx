"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Presentation, MessageSquareMore } from 'lucide-react'
import { cn } from "@/lib/utils";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts"
import {
    ChartContainer,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge";

export const WeeklyStats = () => {
    const chartData = [
        { name: "1", sales: 5 },
        { name: "1", sales: 7 },
        { name: "2", sales: 15 },
        { name: "3", sales: 5 },
        { name: "4", sales: 10 },
        { name: "5", sales: 5 },
        { name: "5", sales: 8 },
    ]

    const chartConfig = {
        sales: {
            label: "Sales",
            color: "var(--color-blue-500)",
        },
    }
    const SalesData = [
        {
            key: "topSales",
            title: "Top Sales",
            subtitle: "Johnathan Doe",
            badgeColor: "bg-blue-500/10",
            bgcolor: "bg-sky-400/10 text-sky-400",
            record: 76,
            Icon: Presentation,
        },
        {
            key: "topSeller",
            title: "Best Seller",
            subtitle: "Footware",
            badgeColor: "bg-teal-400/10",
            bgcolor: "bg-teal-400/10 text-teal-400",
            record: 68,
            Icon: Star,
        },
        {
            key: "topCommented",
            title: " Most Commented",
            subtitle: "Fashionware",
            badgeColor: "bg-orange-400/10",
            bgcolor: "bg-orange-400/10 text-orange-400",
            record: 52,
            Icon: MessageSquareMore,
        }
    ]
    return (
        <Card className="py-6 gap-6">
            <div className="flex flex-col h-full">
                <CardHeader className="px-6">
                    <CardTitle>Weekly Stats</CardTitle>
                    <CardDescription> Average sales</CardDescription>
                </CardHeader>
                <CardContent className="px-6">
                    <div className="my-6">
                        <ChartContainer config={chartConfig}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop
                                                offset="5%"
                                                stopColor="var(--color-primary)"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--color-primary)"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        content={<ChartTooltipContent />}
                                        cursor={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="var(--color-blue-500)"
                                        strokeWidth={2}
                                        fillOpacity={0.1}
                                        fill="var(--color-blue-500)"
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                    <div className="flex flex-col gap-6 ">
                        {SalesData.map((item) => {
                            return (
                                <div key={item.key} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`${item.bgcolor} h-10 w-10 flex justify-center items-center rounded-md`}>
                                            <item.Icon className="h-5 w-5 text-center" />
                                        </div>
                                        <div>
                                            <h6 className="text-base">{item.title}</h6>
                                            <p className=" text-xs text-muted-foreground ">{item.subtitle}</p>
                                        </div>
                                    </div>
                                    <Badge
                                        className={cn(
                                            "py-1.1 rounded-md text-sm text-muted-foreground",
                                            item.badgeColor,
                                        )}
                                    >+{item.record}
                                    </Badge>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </div>
        </Card>
    )
}