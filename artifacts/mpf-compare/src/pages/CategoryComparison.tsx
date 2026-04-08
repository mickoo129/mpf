import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  getCategoryAverageReturns,
  getAllFunds,
  timePeriodLabels,
  categoryLabels,
  categoryGroups,
  type TimePeriod,
  type FundCategory,
} from "@/data/mpf-data";
import { PeriodSelector } from "@/components/PeriodSelector";
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
import { ChevronRight, ChevronDown, BarChart3 } from "lucide-react";

export default function CategoryComparison() {
  const [period, setPeriod] = useState<TimePeriod>("ytd");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const categoryData = useMemo(() => getCategoryAverageReturns(period), [period]);

  const chartData = useMemo(() => {
    return categoryData.map((d) => ({
      name: d.label.replace("基金", "").replace("資產", "").trim(),
      fullName: d.label,
      value: d.avgReturn,
      count: d.count,
    }));
  }, [categoryData]);

  const groupEntries = useMemo(() => {
    return Object.entries(categoryGroups).map(([groupName, cats]) => {
      const funds = getAllFunds()
        .filter((f) => (cats as FundCategory[]).includes(f.category as FundCategory))
        .filter((f) => f.returns[period] !== null)
        .sort((a, b) => (b.returns[period] ?? 0) - (a.returns[period] ?? 0));
      const avg =
        funds.length > 0
          ? Math.round((funds.reduce((s, f) => s + (f.returns[period] ?? 0), 0) / funds.length) * 100) / 100
          : 0;
      return { groupName, funds, avg };
    });
  }, [period]);

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-foreground">基金類別比較</h1>
        <p className="text-xs text-muted-foreground mt-0.5">比較不同基金類別的平均回報</p>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm px-4 py-3">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">時間段</div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">各類別平均回報</span>
          <span className="text-xs text-muted-foreground ml-auto">{timePeriodLabels[period]}</span>
        </div>
        <div className="h-[220px] sm:h-[280px] px-2 py-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={58}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-xl shadow-lg px-3 py-2">
                      <div className="text-xs font-semibold">{d.fullName}</div>
                      <div className={`text-sm font-bold mt-0.5 ${d.value >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {d.value >= 0 ? "+" : ""}{d.value.toFixed(2)}%
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{d.count} 隻基金</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground px-1">展開類別查看基金</h2>
        {groupEntries.map(({ groupName, funds, avg }) => {
          const isExpanded = expandedGroup === groupName;
          const isPositive = avg >= 0;

          return (
            <div key={groupName} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedGroup(isExpanded ? null : groupName)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-5 rounded-full ${isPositive ? "bg-emerald-500" : "bg-red-500"}`} />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{groupName}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{funds.length} 隻基金</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold tabular-nums ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                    {isPositive ? "+" : ""}{avg.toFixed(2)}%
                  </span>
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
              </button>

              {isExpanded && funds.length > 0 && (
                <div className="border-t">
                  {funds.map((fund, i) => {
                    const ret = fund.returns[period];
                    const pos = ret !== null && ret >= 0;
                    return (
                      <button
                        key={fund.id}
                        onClick={() => navigate(`/fund/${fund.id}`)}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted transition-colors border-b last:border-b-0"
                      >
                        <div className="w-5 text-right text-xs font-bold text-muted-foreground flex-shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{fund.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{fund.trusteeEn}</span>
                            <span className="text-[10px] text-muted-foreground">{categoryLabels[fund.category]}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`text-sm font-bold tabular-nums ${pos ? "text-emerald-500" : "text-red-500"}`}>
                            {ret === null ? "—" : `${pos ? "+" : ""}${ret.toFixed(2)}%`}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-muted-foreground pb-2">數據僅供參考，不構成投資建議</p>
    </div>
  );
}
