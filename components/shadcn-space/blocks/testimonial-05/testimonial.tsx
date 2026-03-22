// @ts-nocheck
"use client";

import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useInView, motion } from "motion/react";
import { cn } from "@/lib/utils";

export type TestimonialType = {
  id?: number;
  quote: string;
  name: string;
  role: string;
  image: string;
  theme?: "light" | "dark";
  cardColor?: string;
};

const TestimonialCard = ({ data }: { data: TestimonialType }) => {
  const MainTextClass =
    data.theme === "dark"
      ? "text-white dark:text-background"
      : "text-foreground";

  const SubTextClass =
    data.theme === "dark"
      ? "text-white/50 dark:text-background/50"
      : "text-muted-foreground";

  return (
    <Card
      className={cn(
        "rounded-none p-6 ring-0 shadow-none h-full sm:min-h-80",
        data.cardColor,
      )}
    >
      <CardContent className="p-0 flex flex-col justify-between gap-24 sm:gap-0 flex-1 h-full">
        <div className="flex flex-col gap-8">
          <div className="shrink-0 flex items-start">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 7H7C5.89543 7 5 7.89543 5 9V13C5 14.1046 5.89543 15 7 15H9C9.55228 15 10 15.4477 10 16V16C10 17.1046 9.10457 18 8 18H7.5" stroke={data.theme === "dark" ? "white" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" className="dark:stroke-current"/>
              <path d="M19 7H15C13.8954 7 13 7.89543 13 9V13C13 14.1046 13.8954 15 15 15H17C17.5523 15 18 15.4477 18 16V16C18 17.1046 17.1046 18 16 18H15.5" stroke={data.theme === "dark" ? "white" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" className="dark:stroke-current"/>
            </svg>
          </div>
          <p className={cn("text-xl font-medium", MainTextClass)}>
            {data.quote}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <img
            src={data.image!}
            alt={data.name}
            width={48}
            height={48}
            className="object-cover rounded-full"
          />
          <div>
            <p className={cn("text-base font-medium", MainTextClass)}>
              {data.name}
            </p>
            <p className={cn("text-sm", SubTextClass)}>{data.role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Testimonials({
  testimonials,
}: {
  testimonials: TestimonialType[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  /* ---------------- variants ---------------- */

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  return (
    <section ref={sectionRef} className="py-10">
      <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="flex flex-col gap-8 sm:gap-12"
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-4">
            <motion.div variants={itemVariants}>
              <Badge className="h-7 px-3 py-1 text-sm font-normal">
                Temoignages
              </Badge>
            </motion.div>
            <div className="flex flex-col items-center gap-3">
              <motion.h2
                variants={itemVariants}
                className="text-center font-medium text-3xl sm:text-4xl lg:text-5xl"
              >
                Ce que disent nos utilisateurs
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-center text-lg sm:text-xl text-muted-foreground max-w-2xl"
              >
                Des frontaliers qui ont transforme leurs candidatures grace a Kandid.
              </motion.p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id ?? index}
                variants={itemVariants}
                className={cn(index === 1 && "sm:col-span-2", "h-full")}
              >
                <TestimonialCard data={testimonial} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
