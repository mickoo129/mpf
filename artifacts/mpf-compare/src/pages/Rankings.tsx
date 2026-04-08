import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  getTopFunds,
  getBottomFunds,
  categoryLabels,
  type TimePeriod,
  type Fund,
} from "@/data/mpf-data";
import { PeriodSelector } from "@/components/PeriodSelector";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";

function ReturnValue({ value, size = "md" }: { value: number | null; size?: "sm" | "md" | "lg" }) {
  if (value === null) return <span className="text-muted-foreground">--</span>;
  const isPositive = value >= 0;
  const sizeClass = size === "lg" ? "text-xl font-bold" : size === "sm" ? "text-xs font-semibold" : "text-base font-bold";
  return (
    <span className={`${sizeClass} tabular-nums ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
      {isPositive ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

function FundCard({ fund, rank, period, type }: { fund: Fund; rank: number; period: TimePeriod; type: "top" | "bottom" }) {
  const [, navigate] = useLocation();
  const ret = fund.returns[period];
  const isPositive = ret !== null && ret >= 0;

  return (
    <button
      onClick={() => navigate(`/fund/${fund.id}`)}
      className="w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors border-b last:border-b-0"
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        type === "top"
          ? rank <= 3 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
          : rank <= 3 ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
      }`}>
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground truncate">{fund.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-medium">{fund.trusteeEn}</span>
          <span className="text-[11px] text-muted-foreground">{categoryLabels[fund.category]}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <ReturnValue value={ret} size="md" />
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </div>
    </button>
  );
}

function FundSection({ funds, period, title, type }: {
  funds: Fund[];
  period: TimePeriod;
  title: string;
  type: "top" | "bottom";
}) {
  const icon = type === "top"
    ? <TrendingUp className="h-4 w-4 text-emerald-500" />
    : <TrendingDown className="h-4 w-4 text-red-500" />;
  const accentColor = type === "top" ? "bg-emerald-500" : "bg-red-500";

  return (
    <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b bg-muted/30">
        <div className={`w-1 h-5 rounded-full ${accentColor}`} />
        {icon}
        <span className="font-semibold text-sm text-foreground">{title}</span>
      </div>
      <div>
        {funds.map((fund, i) => (
          <FundCard key={fund.id} fund={fund} rank={i + 1} period={period} type={type} />
        ))}
      </div>
    </div>
  );
}

export default function Rankings() {
  const [period, setPeriod] = useState<TimePeriod>("ytd");
  const topFunds = useMemo(() => getTopFunds(period, 10), [period]);
  const bottomFunds = useMemo(() => getBottomFunds(period, 10), [period]);

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-foreground">MPF 基金排名</h1>
        <p className="text-xs text-muted-foreground mt-0.5">點擊基金查看詳細走勢圖</p>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm px-4 py-3">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">時間段</div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <FundSection funds={topFunds} period={period} title="表現最佳 Top 10" type="top" />
      <FundSection funds={bottomFunds} period={period} title="表現最差 Bottom 10" type="bottom" />

      <p className="text-center text-[11px] text-muted-foreground pb-2">
        數據僅供參考，不構成投資建議
      </p>
    </div>
  );
}
