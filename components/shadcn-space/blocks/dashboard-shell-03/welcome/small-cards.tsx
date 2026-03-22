import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChartPie, CircleDollarSign, RefreshCw } from "lucide-react";

const SmallCards = () => {
    const summeryData = [
        {
            icon: RefreshCw,
            value: "434",
            percentage: "-12%",
            description: "Refunds",
            bgColor: "bg-blue-500/10",
            txtColor: "text-blue-500"
        },
        {
            icon: ChartPie,
            value: "2358",
            percentage: "+23%",
            description: "Sales",
            bgColor: "bg-red-500/10",
            txtColor: "text-red-500",

        },
        {
            icon: CircleDollarSign,
            value: "$245k",
            percentage: "-12%",
            description: "Earnings",
            bgColor: "bg-teal-400/10",
            txtColor: "text-teal-400"
        },
    ];

    return (
        <>
            {summeryData.map((item, index) => (
                <Card key={index} className={cn(" w-44 sm:w-full ring-0 py-6", item.bgColor)}>
                    <CardContent className="h-full flex flex-col gap-12 px-6">
                        <div className={cn("rounded-lg p-3 w-fit", item.bgColor, item.txtColor)}>
                            <item.icon className="size-4" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-lg font-semibold text-card-foreground">
                                        {item.value}
                                    </p>
                                    <Badge className={cn("font-normal text-muted-foreground", item.bgColor)}>
                                        {item.percentage}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </>
    );
};

export default SmallCards;
