"use client";

import { motion, useInView } from "motion/react";
import { Card, CardHeader, CardContent, CardTitle, CardFooter, CardAction, } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { EllipsisVertical } from "lucide-react";

export default function RecentTransactions() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    const DROPDOWN_ITEMS = [
        { title: "Action", link: "#" },
        { title: "Another action", link: "#" },
        { title: "Something else", link: "#" },
    ];

    const paymentGateways = [
        {
            key: "paymentOption1",
            paymentOption: "Paypal",
            desc: "Big Brands",
            amount: "+$6,235",
            paymentImg:
                "https://images.shadcnspace.com/assets/widgets/icon-paypal.svg",
            color: "bg-blue-500/10",
        },
        {
            key: "paymentOption2",
            paymentOption: "Wallet",
            desc: "Big Brands",
            paymentImg:
                "https://images.shadcnspace.com/assets/widgets/icon-office-bag.svg",
            amount: "+$345",
            color: "bg-teal-400/10",
        },
        {
            key: "paymentOption3",
            paymentOption: "Credit card",
            desc: "Money reversed",
            paymentImg:
                "https://images.shadcnspace.com/assets/widgets/icon-mastercard.svg",
            amount: "+$2,235",
            color: "bg-amber-300/10",
        },
        {
            key: "paymentOption4",
            paymentOption: "Bank Transfer",
            desc: "Money added",
            paymentImg: "https://images.shadcnspace.com/assets/widgets/icon-bank.svg",
            amount: "+$320",
            color: "bg-sky-400/10",
        },
        {
            key: "paymentOption5",
            paymentOption: "Refund ",
            desc: "Bill payment",
            paymentImg:
                "https://images.shadcnspace.com/assets/widgets/icon-pie-chart.svg",
            amount: "-$32",
            color: "bg-red-500/10",
        },
    ];

    return (
        <div ref={ref}>
            <Card className="w-full gap-6 py-6 justify-between">
                {/* Header */}
                <CardHeader className="px-6">
                    <CardTitle className="text-lg font-semibold ">
                        Recent Transactions
                    </CardTitle>
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
                                            <span className="w-full justify-start">
                                                {item.title}
                                            </span>
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardAction>
                </CardHeader>

                {/* Payment Entries */}
                <CardContent className="flex flex-col gap-6 px-6">
                    {paymentGateways.map((item, index) => (
                        <motion.div
                            key={item.key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: index * 0.3 }}
                            className="flex items-center justify-between"
                        >
                            <div className="flex gap-3 items-center">
                                <div
                                    className={`${item.color} rounded-md flex items-center justify-center h-11 w-11`}
                                >
                                    <img
                                        src={item.paymentImg}
                                        alt={`${item.paymentOption} icon`}
                                        width={24}
                                        height={24}
                                        className="h-6 w-6"
                                    />
                                </div>
                                <div>
                                    <h6 className="text-base font-semibold">
                                        {item.paymentOption}
                                    </h6>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                            </div>
                            <p className="text-base font-semibold">{item.amount}</p>
                        </motion.div>
                    ))}
                </CardContent>

                <CardFooter className="px-6 pt-0 pb-6 border-0 bg-card">
                    <Button className="w-full py-2 h-auto rounded-full cursor-pointer">
                        View full report
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
