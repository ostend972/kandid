"use client";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardAction,
    CardDescription,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    EllipsisVertical,
    Bike,
    TrainFront,
    Building,
    MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const UpcomingSchedules = () => {
    const DROPDOWN_ITEMS = [
        { title: "Action", link: "#" },
        { title: "Another action", link: "#" },
        { title: "Something else", link: "#" },
    ];
    const TABS = [
        { value: "all", label: "All" },
        { value: "delivered", label: "Delivered" },
        { value: "shipping", label: "Shipping" },
    ];
    const Events = [
        {
            key: "Delivered",
            icons: Bike,
            iconBg: "bg-blue-500/10",
            iconclr: "text-blue-500",
            name: "Scooter Freight",
            id: "#9002-125423",
            HQ: {
                location: "Messina Harbor",
                ctr: "Sicily, Italy",
            },
            address: {
                location: "Hektor Container Hotel",
                ctr: "Tallin, EST",
            },
        },
        {
            key: "Shipping",
            icons: TrainFront,
            iconBg: "bg-sky-400/10",
            iconclr: "text-sky-400",
            name: "Tram Freight",
            id: "#1245-780652",
            HQ: {
                location: "Messina Harbor",
                ctr: "Lester, United Kingdom",
            },
            address: {
                location: "Laxmi Empire Hotel",
                ctr: "Mumbai, India",
            },
        },
    ];

    return (
        <Card className="h-full gap-6 py-6">
            <CardHeader className="px-6">
                <div>
                    <CardTitle className="text-lg ">Upcoming Schedules</CardTitle>
                    <CardDescription>Our corporate events</CardDescription>
                </div>
                <CardAction>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="rounded-full hover:bg-accent cursor-pointer p-2">
                            <EllipsisVertical width={16} height={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {DROPDOWN_ITEMS.map((item, index) => (
                                <DropdownMenuItem
                                    key={index}
                                    className="font-normal cursor-pointer"
                                >
                                    {item.link ? (
                                        <a href={item.link} className="w-full">
                                            {item.title}
                                        </a>
                                    ) : (
                                        <span className="w-full justify-start">{item.title}</span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardAction>
            </CardHeader>
            <CardContent className="px-6">
                <Tabs defaultValue="all">
                    <TabsList className="w-full">
                        {TABS.map((tab, index) => (
                            <TabsTrigger
                                key={index}
                                value={tab.value}
                                className="text-base font-medium"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {TABS.map((tab, index) => (
                        <TabsContent
                            key={index}
                            value={tab.value}
                            className="space-y-6 pt-4"
                        >
                            {Events.filter(
                                (event) =>
                                    tab.value === "all" ||
                                    event.key.toLowerCase() === tab.value,
                            ).map((event, eventIdx) => (
                                <div
                                    key={eventIdx}
                                    className="border-b last:border-0 pb-4 last:pb-0 flex flex-col gap-2"
                                >
                                    <div className="flex items-center justify-between gap-4 sm:flex-nowrap flex-wrap-reverse">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    "rounded-xl flex items-center justify-center p-3 shrink-0",
                                                    event.iconBg,
                                                )}
                                            >
                                                <event.icons
                                                    width={16}
                                                    height={16}
                                                    className={cn("", event.iconclr)}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-muted-foreground">
                                                    {event.name}
                                                </span>
                                                <span className="text-sm font-semibold">
                                                    {event.id}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className="bg-teal-400/10 text-muted-foreground">
                                            {event.key}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="border border-input rounded-xl flex items-center justify-center p-3 shrink-0">
                                            <Building width={16} height={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">
                                                {event.HQ.location}
                                            </span>
                                            <span className="text-sm font-semibold ">
                                                {event.HQ.ctr}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="border border-input rounded-xl flex items-center justify-center p-3 shrink-0">
                                            <MapPin width={16} height={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">
                                                {event.address.location}
                                            </span>
                                            <span className="text-sm font-semibold">
                                                {event.address.ctr}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default UpcomingSchedules;
