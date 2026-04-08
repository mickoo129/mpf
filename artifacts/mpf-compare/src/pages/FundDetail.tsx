import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import {
  getFundDetail,
  formatReturn,
  returnColor,
  fundTypeShort,
  PERIODS,
  type MpfFundDetail,
  type MpfFundReturn,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, RefreshCw, Building2, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const riskColors = [
  "",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-red-700",
  "bg-red-900",
];

const CALENDAR_YEARS = ["2025", "2024", "2023", "2022", "2021"];

export default function FundDetail() {
  const [, params] = useRoute("/fund/:cfId");
  const [, navigate] = useLocation();
  const [fund, setFund] = useState<MpfFundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cfId = params?.cfId;

  useEffect(() => {
    if (!cfId) return;
    setLoading(true);
    setError(null);
    getFundDetail(cfId)
      .then(setFund)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cfId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            {error ?? "找不到基金"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => navigate("/")}
          >
            返回
          </Button>
        </div>
      </div>
    );
  }

  const getReturn = (period: string): MpfFundReturn | undefined =>
    fund.returns.find((r) => r.period === period);

  const ytdReturn = getReturn("1y");
  const ytdVal = ytdReturn?.annualizedReturn ?? null;

  const calendarData = CALENDAR_YEARS.map((y) => {
    const r = getReturn(y);
    return { year: y, value: r?.annualizedReturn ?? null };
  }).filter((d) => d.value !== null) as { year: string; value: number }[];

  const riskClass = Math.min(Math.max(fund.riskClass ?? 0, 0), 7);
  const maxRisk = 7;

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
            <h1 className="text-base font-bold text-foreground leading-snug">
              {fund.nameZh || fund.nameEn}
            </h1>
            {fund.nameZh && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{fund.nameEn}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[11px] bg-primary/10 text-primary rounded px-2 py-0.5 font-medium">
                {fund.trustee}
              </span>
              <span className="text-[11px] bg-muted text-muted-foreground rounded px-2 py-0.5">
                {fundTypeShort(fund.fundType)}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div
              className={`text-2xl font-bold tabular-nums ${returnColor(ytdVal)}`}
            >
              {formatReturn(ytdVal)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">1 年回報</p>
          </div>
        </div>

        {riskClass > 0 && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">風險級別</span>
            <div className="flex gap-1 ml-1">
              {Array.from({ length: maxRisk }, (_, i) => (
                <div
                  key={i}
                  className={`h-2.5 w-4 rounded-sm ${
                    i < riskClass ? riskColors[riskClass] : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold ml-1">
              {riskClass} / {maxRisk}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
          {fund.fundSizeHkm && (
            <div>
              <span className="font-medium text-foreground">
                HK${fund.fundSizeHkm.toFixed(0)}M
              </span>
              <span className="ml-1">基金規模</span>
            </div>
          )}
          {fund.ferPct && (
            <div>
              <span className="font-medium text-foreground">
                {fund.ferPct.toFixed(2)}%
              </span>
              <span className="ml-1">基金開支比率</span>
            </div>
          )}
          {fund.launchDate && (
            <div>
              <span className="font-medium text-foreground">
                {fund.launchDate}
              </span>
              <span className="ml-1">成立日期</span>
            </div>
          )}
        </div>
      </div>

      {calendarData.length > 0 && (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">各年度回報</span>
          </div>
          <div className="h-[180px] px-2 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={calendarData}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="year"
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-xl shadow-lg px-3 py-2">
                        <div className="text-[11px] text-muted-foreground">
                          {d.year}年
                        </div>
                        <div
                          className={`text-sm font-bold mt-0.5 ${returnColor(d.value)}`}
                        >
                          {formatReturn(d.value)}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {calendarData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.value >= 0 ? "#10b981" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b">
          <span className="text-sm font-semibold">各時段回報</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 divide-x divide-y divide-border">
          {PERIODS.map((p) => {
            const r = getReturn(p.id);
            const val = r?.annualizedReturn ?? null;
            return (
              <div
                key={p.id}
                className="flex flex-col items-center justify-center py-4 px-2"
              >
                <div className="text-[11px] text-muted-foreground mb-1 font-medium">
                  {p.labelZh}
                </div>
                <div
                  className={`text-base font-bold tabular-nums ${returnColor(val)}`}
                >
                  {formatReturn(val)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-muted/50 rounded-xl px-4 py-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">
            {fund.scheme}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          數據來源：積金局強積金基金平台（mfp.mpfa.org.hk）·
          回報數據以截至 2026 年 2 月為準 · 僅供參考，不構成投資建議。過去表現並不代表未來表現。
        </p>
      </div>
    </div>
  );
}
