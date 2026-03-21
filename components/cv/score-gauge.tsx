"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: "lg" | "sm";
  label?: string;
}

function getScoreColor(score: number) {
  if (score >= 80) return { stroke: "stroke-green-500", text: "text-green-500" };
  if (score >= 40) return { stroke: "stroke-amber-500", text: "text-amber-500" };
  return { stroke: "stroke-red-500", text: "text-red-500" };
}

export function ScoreGauge({ score, size = "lg", label }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const isLarge = size === "lg";
  const svgSize = isLarge ? 180 : 90;
  const strokeWidth = isLarge ? 12 : 8;
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const colors = getScoreColor(score);

  // Animate score on mount
  useEffect(() => {
    const duration = 1000; // ms
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(score, Math.round(increment * step));
      setAnimatedScore(current);
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedScore(score);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const progress = (animatedScore / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            className="stroke-gray-200"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            className={cn(colors.stroke, "transition-all duration-1000 ease-out")}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-bold tabular-nums",
              colors.text,
              isLarge ? "text-4xl" : "text-lg"
            )}
          >
            {animatedScore}
          </span>
          <span
            className={cn(
              "text-muted-foreground",
              isLarge ? "text-sm" : "text-[10px]"
            )}
          >
            /100
          </span>
        </div>
      </div>
      {label && (
        <span
          className={cn(
            "text-center font-medium text-muted-foreground",
            isLarge ? "text-sm" : "text-xs"
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
