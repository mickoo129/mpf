import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  getRankings,
  formatReturn,
  returnColor,
  fundTypeShort,
  type MpfFundSummary,
  type MpfRankingsResponse,
  PERIODS,
} from "@/lib/api";
import { PeriodSelector } from "@/components/PeriodSelector";
import { TrendingUp, TrendingDown, ChevronRight, RefreshCw } from "lucide-react";

function FundCard({
  fund,
  rank,
  type,
}: {
  fund: MpfFundSummary;
  rank: number;
  type: "top" | "bottom";
}) {
  const [, navigate] = useLocation();
  const isPositive = (fund.returnAnn ?? 0) >= 0;

  return (
    <button
      onClick={() => navigate(`/fund/${fund.cfId}`)}
      className="w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors border-b last:border-b-0"
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          type === "top"
            ? rank <= 3
              ? "bg-amber-100 text-amber-700"
              : "bg-muted text-muted-foreground"
            : rank <= 3
              ? "bg-red-100 text-red-700"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground truncate">
          {fund.nameEn}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-medium">
            {fund.trustee}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {fundTypeShort(fund.fundType)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className={`text-base font-bold tabular-nums ${returnColor(fund.returnAnn)}`}
        >
          {formatReturn(fund.returnAnn)}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </div>
    </button>
  );
}

function FundSection({
  funds,
  title,
  type,
}: {
  funds: MpfFundSummary[];
  title: string;
  type: "top" | "bottom";
}) {
  const icon =
    type === "top" ? (
      <TrendingUp className="h-4 w-4 text-emerald-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
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
          <FundCard key={fund.cfId} fund={fund} rank={i + 1} type={type} />
        ))}
      </div>
    </div>
  );
}

export default function Rankings() {
  const [period, setPeriod] = useState("1y");
  const [data, setData] = useState<MpfRankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periodLabel = PERIODS.find((p) => p.id === period)?.labelZh || period;

  useEffect(() => {
    setLoading(true);
    setError(null);
    getRankings(period, 10)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-foreground">MPF 基金排名</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          真實積金局數據 · 點擊查看基金詳情
        </p>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm px-4 py-3">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          時間段
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600">
            {error.includes("No fund") || error.includes("404")
              ? "數據正在載入中，請稍候片刻後重試"
              : `載入失敗：${error}`}
          </p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <FundSection
            funds={data.top}
            title={`表現最佳 Top 10（${periodLabel}）`}
            type="top"
          />
          <FundSection
            funds={data.bottom}
            title={`表現最差 Bottom 10（${periodLabel}）`}
            type="bottom"
          />
        </>
      )}

      {!loading && !error && data?.top.length === 0 && (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            數據正在同步中，請稍候...
          </p>
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground pb-2">
        數據來源：積金局強積金基金平台 · 僅供參考，不構成投資建議
      </p>
    </div>
  );
}
