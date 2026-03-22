"use client"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

const chartData = [
    { month: "January", usa: 186, india: 80 },
    { month: "February", usa: 305, india: 200 },
    { month: "March", usa: 237, india: 120 },
    { month: "April", usa: 73, india: 190 },
    { month: "May", usa: 209, india: 130 },
    { month: "June", usa: 214, india: 140 },
]

const chartConfig = {
    usa: {
        label: "USA",
        color: "var(--color-teal-400)",
    },
    india: {
        label: "India",
        color: "var(--color-blue-500)",
    },
} satisfies ChartConfig

const Widget = () => {

    return (
        <Card className="w-full max-w-sm gap-5 mx-auto h-full py-6">
            <CardHeader className="px-6">
                <CardTitle className="text-lg font-semibold text-foreground">
                    Sales from Locations
                </CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground">
                    This Year
                </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
                <ChartContainer config={chartConfig} className="min-h-96 w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                            dataKey="usa"
                            stackId="a"

                            fill="var(--color-usa)"
                            barSize={10}
                            radius={8}
                            stroke="var(--background)"

                        />
                        <Bar
                            dataKey="india"
                            stackId="a"

                            fill="var(--color-india)"

                            barSize={10}
                            radius={8}
                            stroke="var(--background)"

                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};

export default Widget;