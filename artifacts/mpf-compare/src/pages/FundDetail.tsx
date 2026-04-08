import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { getFundById, timePeriodLabels, categoryLabels, type TimePeriod } from "@/data/mpf-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Shield } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const chartPeriods = [
  { key: "1m", label: "1M", days: 30 },
  { key: "3m", label: "3M", days: 90 },
  { key: "6m", label: "6M", days: 180 },
  { key: "1y", label: "1Y", days: 365 },
  { key: "3y", label: "3Y", days: 1095 },
  { key: "5y", label: "5Y", days: 1825 },
  { key: "max", label: "MAX", days: 99999 },
];

const allPeriods: TimePeriod[] = ["1d", "1w", "1m", "mtd", "ytd", "3m", "6m", "1y", "3y", "5y", "10y"];

const riskColors = ["", "bg-emerald-500", "bg-teal-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"];

export default function FundDetail() {
  const [, params] = useRoute("/fund/:id");
  const [, navigate] = useLocation();
  const [chartPeriod, setChartPeriod] = useState("1y");

  const fund = params?.id ? getFundById(params.id) : undefined;

  const chartData = useMemo(() => {
    if (!fund) return [];
    const periodDef = chartPeriods.find((p) => p.key === chartPeriod);
    if (!periodDef) return [];
    const history = fund.priceHistory;
    if (periodDef.days >= 99999) return history;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDef.days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return history.filter((h) => h.date >= cutoffStr);
  }, [fund, chartPeriod]);

  if (!fund) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">找不到基金</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/")}>
            返回
          </Button>
        </div>
      </div>
    );
  }

  const priceChange = chartData.length >= 2
    ? chartData[chartData.length - 1].price - chartData[0].price : 0;
  const priceChangePercent = chartData.length >= 2
    ? (priceChange / chartData[0].price) * 100 : 0;
  const isPositive = priceChange >= 0;
  const chartColor = isPositive ? "#10b981" : "#ef4444";

  return (
    <div className="space-y-3 pb-2">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors pt-1"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <div className="bg-card rounded-2xl border shadow-sm p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground leading-snug">{fund.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{fund.nameEn}</p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[11px] bg-primary/10 text-primary rounded px-2 py-0.5 font-medium">{fund.trusteeEn}</span>
              <span className="text-[11px] bg-muted text-muted-foreground rounded px-2 py-0.5">{categoryLabels[fund.category]}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold tabular-nums text-foreground">
              ${fund.price.toFixed(4)}
            </div>
            <div className={`flex items-center justify-end gap-1 mt-0.5 ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span className="text-sm font-semibold tabular-nums">
                {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">截至 {fund.priceDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">風險級別</span>
          <div className="flex gap-1 ml-1">
            {[1, 2, 3, 4, 5].map((l) => (
              <div
                key={l}
                className={`h-2.5 w-5 rounded-sm ${l <= fund.riskLevel ? riskColors[fund.riskLevel] : "bg-muted"}`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold ml-1">{fund.riskLevel} / 5</span>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold">價格走勢</span>
          <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {chartPeriods.map((p) => (
              <button
                key={p.key}
                onClick={() => setChartPeriod(p.key)}
                className={`flex-shrink-0 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  chartPeriod === p.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[240px] sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                interval="preserveStartEnd"
                minTickGap={60}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `$${v.toFixed(1)}`}
                width={50}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-xl shadow-lg px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">{d.date}</div>
                      <div className="text-sm font-bold mt-0.5" style={{ color: chartColor }}>
                        HK${d.price.toFixed(4)}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#grad)"
                dot={false}
                activeDot={{ r: 4, fill: chartColor, strokeWidth: 2, stroke: "hsl(var(--card))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b">
          <span className="text-sm font-semibold">各時段回報</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 divide-x divide-y divide-border">
          {allPeriods.map((p) => {
            const ret = fund.returns[p];
            const pos = ret !== null && ret >= 0;
            return (
              <div key={p} className="flex flex-col items-center justify-center py-4 px-2">
                <div className="text-[11px] text-muted-foreground mb-1 font-medium">{timePeriodLabels[p]}</div>
                <div className={`text-base font-bold tabular-nums ${
                  ret === null ? "text-muted-foreground" : pos ? "text-emerald-500" : "text-red-500"
                }`}>
                  {ret === null ? "—" : `${pos ? "+" : ""}${ret.toFixed(2)}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-muted/50 rounded-xl px-4 py-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          計劃: {fund.scheme} · 數據僅供參考，不構成投資建議。過去表現並不代表未來表現。
        </p>
      </div>
    </div>
  );
}
