import { CheckCircle2, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface TipCardProps {
  type: "good" | "improve" | "critical";
  title: string;
  explanation: string;
  suggestion?: string;
}

const tipConfig = {
  good: {
    icon: CheckCircle2,
    iconColor: "text-green-500",
    borderColor: "border-l-green-500",
    bgColor: "bg-green-50",
  },
  improve: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-50",
  },
  critical: {
    icon: XCircle,
    iconColor: "text-red-500",
    borderColor: "border-l-red-500",
    bgColor: "bg-red-50",
  },
} as const;

export function TipCard({ type, title, explanation, suggestion }: TipCardProps) {
  const config = tipConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 bg-white p-4",
        config.borderColor
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconColor)} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600">{explanation}</p>
          {suggestion && (
            <div
              className={cn(
                "mt-3 flex items-start gap-2 rounded-md p-3",
                config.bgColor
              )}
            >
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <p className="text-sm text-gray-700">
                <span className="font-medium">Conseil :</span> {suggestion}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
