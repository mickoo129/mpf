import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  getCategories,
  getTrustees,
  formatReturn,
  returnColor,
  fundTypeShort,
  PERIODS,
  type MpfCategoryStat,
  type MpfFundSummary,
} from "@/lib/api";
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
import { ChevronRight, ChevronDown, BarChart3, RefreshCw } from "lucide-react";

interface CategoryGroup {
  category: string;
  avgReturn: number | null;
  fundCount: number;
  funds: MpfFundSummary[];
}

export default function CategoryComparison() {
  const [period, setPeriod] = useState("1y");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [categories, setCategories] = useState<MpfCategoryStat[]>([]);
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  const periodLabel = PERIODS.find((p) => p.id === period)?.labelZh || period;

  useEffect(() => {
    setLoading(true);
    Promise.all([getCategories(period), getTrustees(period)])
      .then(([cats, trustees]) => {
        setCategories(cats);
        const allFunds = trustees.flatMap((t) => t.funds);
        const catMap = new Map<string, MpfFundSummary[]>();
        for (const f of allFunds) {
          const arr = catMap.get(f.fundCategory) ?? [];
          arr.push(f);
          catMap.set(f.fundCategory, arr);
        }
        const grps = cats.map((c) => {
          const catFunds = catMap.get(c.category) ?? [];
          catFunds.sort(
            (a, b) => (b.returnAnn ?? -999) - (a.returnAnn ?? -999)
          );
          return {
            category: c.category,
            avgReturn: c.avgReturn,
            fundCount: c.fundCount,
            funds: catFunds,
          };
        });
        setGroups(grps);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const chartData = categories.map((c) => ({
    name: c.category.replace("基金", "").replace("資產", "").trim(),
    fullName: c.category,
    value: c.avgReturn ?? 0,
    count: c.fundCount,
  }));

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-foreground">基金類別比較</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          比較不同基金類別的平均回報
        </p>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm px-4 py-3">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          時間段
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">各類別平均回報</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {periodLabel}
              </span>
            </div>
            <div className="h-[220px] sm:h-[280px] px-2 py-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />
                  <XAxis
                    type="number"
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
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
                          <div className="text-xs font-semibold">
                            {d.fullName}
                          </div>
                          <div
                            className={`text-sm font-bold mt-0.5 ${returnColor(d.value)}`}
                          >
                            {formatReturn(d.value)}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {d.count} 隻基金
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={18}
                  >
                    {chartData.map((entry, i) => (
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

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground px-1">
              展開類別查看基金
            </h2>
            {groups.map(({ category, avgReturn, fundCount, funds }) => {
              const isExpanded = expandedGroup === category;
              const isPositive = (avgReturn ?? 0) >= 0;

              return (
                <div
                  key={category}
                  className="bg-card rounded-2xl border shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedGroup(isExpanded ? null : category)
                    }
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-1 h-5 rounded-full ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
                      />
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {category}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {fundCount} 隻基金
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-base font-bold tabular-nums ${returnColor(avgReturn)}`}
                      >
                        {formatReturn(avgReturn)}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && funds.length > 0 && (
                    <div className="border-t">
                      {funds.slice(0, 20).map((fund, i) => (
                        <button
                          key={fund.cfId}
                          onClick={() => navigate(`/fund/${fund.cfId}`)}
                          className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted transition-colors border-b last:border-b-0"
                        >
                          <div className="w-5 text-right text-xs font-bold text-muted-foreground flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {fund.nameEn}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                                {fund.trustee}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {fundTypeShort(fund.fundType)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span
                              className={`text-sm font-bold tabular-nums ${returnColor(fund.returnAnn)}`}
                            >
                              {formatReturn(fund.returnAnn)}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="text-center text-[11px] text-muted-foreground pb-2">
        數據來源：積金局強積金基金平台 · 僅供參考，不構成投資建議
      </p>
    </div>
  );
}
