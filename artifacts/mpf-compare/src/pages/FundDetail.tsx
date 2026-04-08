import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { getFundById, timePeriodLabels, categoryLabels, type TimePeriod } from "@/data/mpf-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const chartPeriods: { key: string; label: string; days: number }[] = [
  { key: "1m", label: "1個月", days: 30 },
  { key: "3m", label: "3個月", days: 90 },
  { key: "6m", label: "6個月", days: 180 },
  { key: "1y", label: "1年", days: 365 },
  { key: "3y", label: "3年", days: 1095 },
  { key: "5y", label: "5年", days: 1825 },
  { key: "max", label: "全部", days: 99999 },
];

const allPeriods: TimePeriod[] = ["1d", "1w", "1m", "mtd", "ytd", "3m", "6m", "1y", "3y", "5y", "10y"];

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

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDef.days);
    const cutoff = cutoffDate.toISOString().split("T")[0];
    return history.filter((h) => h.date >= cutoff);
  }, [fund, chartPeriod]);

  if (!fund) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">找不到基金</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回排名
          </Button>
        </div>
      </div>
    );
  }

  const priceChange = chartData.length >= 2
    ? chartData[chartData.length - 1].price - chartData[0].price
    : 0;
  const priceChangePercent = chartData.length >= 2
    ? ((priceChange / chartData[0].price) * 100)
    : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回排名
      </Button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{fund.name}</h1>
          <p className="text-muted-foreground">{fund.nameEn}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline">{fund.trusteeEn}</Badge>
            <Badge variant="secondary">{categoryLabels[fund.category]}</Badge>
            <Badge variant="secondary">風險級別: {fund.riskLevel}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{fund.scheme}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums">HK${fund.price.toFixed(4)}</div>
          <div className={`flex items-center justify-end gap-1 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="font-semibold tabular-nums">
              {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">截至 {fund.priceDate}</div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">價格走勢</CardTitle>
            <div className="flex gap-1">
              {chartPeriods.map((p) => (
                <Button
                  key={p.key}
                  variant={chartPeriod === p.key ? "default" : "outline"}
                  size="sm"
                  className="text-xs px-3 h-7"
                  onClick={() => setChartPeriod(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                  width={65}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <div className="text-xs text-muted-foreground">{data.date}</div>
                        <div className="text-sm font-semibold mt-1">HK${data.price.toFixed(4)}</div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">各時段回報表現</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allPeriods.map((p) => {
              const ret = fund.returns[p];
              const pos = ret !== null && ret >= 0;
              return (
                <div key={p} className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">{timePeriodLabels[p]}</div>
                  <div className={`text-lg font-bold tabular-nums ${ret === null ? "text-muted-foreground" : pos ? "text-emerald-600" : "text-red-500"}`}>
                    {ret === null ? "--" : `${pos ? "+" : ""}${ret.toFixed(2)}%`}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
