import { useRef } from "react";
import { timePeriodLabels, type TimePeriod } from "@/data/mpf-data";

const periods: TimePeriod[] = ["1d", "1w", "1m", "mtd", "ytd", "3m", "6m", "1y", "3y", "5y", "10y"];

interface PeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {periods.map((p) => {
          const isActive = value === p;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {timePeriodLabels[p]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
