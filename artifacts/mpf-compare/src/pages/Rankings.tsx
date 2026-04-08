import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  getRankings,
  getAllFunds,
  formatReturn,
  returnColor,
  fundTypeShort,
  type MpfFundSummary,
  type MpfRankingsResponse,
  PERIODS,
} from "@/lib/api";
import { PeriodSelector } from "@/components/PeriodSelector";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, ChevronRight, RefreshCw, Target } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  股票基金: "#3b82f6",
  債券基金: "#8b5cf6",
  混合資產基金: "#10b981",
  保證基金: "#f59e0b",
  貨幣市場基金: "#6b7280",
};

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
  return (
    <button
      onClick={() => navigate(`/fund/${fund.cfId}`)}
      className="w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors border-b last:border-b-0"
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          type === "top"
            ? rank <= 3 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
            : rank <= 3 ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
        }`}
      >
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground truncate">
          {fund.nameZh || fund.nameEn}
        </div>
        {fund.nameZh && (
          <div className="text-[10px] text-muted-foreground truncate mt-0.5">
            {fund.nameEn}
          </div>
        )}
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
        <span className={`text-base font-bold tabular-nums ${returnColor(fund.returnAnn)}`}>
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
          <FundCard key={fund.cfId} fund={fund} rank={i + 1} type={type} />
        ))}
      </div>
    </div>
  );
}

function RiskReturnScatter({ period }: { period: string }) {
  const [, navigate] = useLocation();
  const [funds, setFunds] = useState<MpfFundSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllFunds({ period })
      .then((data) =>
        setFunds(data.filter((f) => f.riskClass != null && f.returnAnn != null))
      )
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[240px]">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const byCategory: Record<string, { x: number; y: number; name: string; cfId: string }[]> = {};
  funds.forEach((f) => {
    const cat = f.fundCategory || "其他";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({
      x: f.riskClass!,
      y: f.returnAnn!,
      name: f.nameZh || f.nameEn,
      cfId: f.cfId,
    });
  });

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; x: number; y: number; cfId: string } }[] }) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-popover border rounded-xl shadow-lg px-3 py-2">
        <div className="text-xs font-medium text-foreground truncate max-w-[160px]">{d.name}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">風險級別：{d.x}</div>
        <div className={`text-xs font-bold mt-0.5 ${returnColor(d.y)}`}>{formatReturn(d.y)}</div>
      </div>
    );
  };

  return (
    <div className="h-[240px] px-1 py-3">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0.5, 7.5]}
            ticks={[1, 2, 3, 4, 5, 6, 7]}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            label={{ value: "風險級別", position: "insideBottom", offset: -2, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            type="number"
            dataKey="y"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => `${v}%`}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" opacity={0.5} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
          {Object.entries(byCategory).map(([cat, points]) => (
            <Scatter
              key={cat}
              name={cat}
              data={points}
              fill={CATEGORY_COLORS[cat] ?? "#94a3b8"}
              opacity={0.7}
              r={3}
              onClick={(d: { cfId: string }) => navigate(`/fund/${d.cfId}`)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Rankings() {
  const [period, setPeriod] = useState("1y");
  const [data, setData] = useState<MpfRankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScatter, setShowScatter] = useState(false);

  const periodLabel = PERIODS.find((p) => p.id === period)?.labelZh || period;

  const load = (p: string) => {
    setLoading(true);
    setError(null);
    getRankings(p, 10)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(period);
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
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center space-y-3">
          <p className="text-sm text-red-600">
            {error.includes("No fund") || error.includes("404")
              ? "數據正在載入中，請稍候片刻後重試"
              : `載入失敗：${error}`}
          </p>
          <button
            onClick={() => load(period)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 active:bg-red-300 px-3 py-1.5 rounded-full transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            重試
          </button>
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

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <button
              onClick={() => setShowScatter(!showScatter)}
              className="w-full flex items-center gap-2.5 px-4 py-3.5 border-b bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="w-1 h-5 rounded-full bg-blue-500" />
              <Target className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-sm text-foreground">風險回報分布圖</span>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {showScatter ? "收起" : "展開"}
              </span>
            </button>
            {showScatter && (
              <>
                <RiskReturnScatter period={period} />
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-4 pb-3">
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <div key={cat} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      {cat}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {!loading && !error && data?.top.length === 0 && (
        <div className="bg-card rounded-2xl border p-8 text-center">
          <p className="text-muted-foreground text-sm">數據正在同步中，請稍候...</p>
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground pb-2">
        數據來源：積金局強積金基金平台 · 僅供參考，不構成投資建議
      </p>
    </div>
  );
}
