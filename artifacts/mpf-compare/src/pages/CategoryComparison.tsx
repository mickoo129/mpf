import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  getAllFundsMultiPeriod,
  getMeta,
  formatReturn,
  returnColor,
  FUND_TYPE_ZH,
  type MpfFundMultiPeriod,
  type MpfSchemeEntry,
  PERIODS,
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
import { ChevronRight, ChevronDown, BarChart3, RefreshCw, X } from "lucide-react";

const CATEGORIES = ["股票基金", "債券基金", "混合資產基金", "保證基金", "貨幣市場基金"];
const TYPE_BY_CATEGORY: Record<string, string[]> = {
  股票基金: [
    "Equity Fund - Greater China Equity Fund",
    "Equity Fund - Hong Kong Equity Fund",
    "Equity Fund - Hong Kong Equity Fund (Index Tracking)",
    "Equity Fund - China Equity Fund",
    "Equity Fund - Asia Equity Fund",
    "Equity Fund - Global Equity Fund",
    "Equity Fund - United States Equity Fund",
    "Equity Fund - Europe Equity Fund",
    "Equity Fund - Japan Equity Fund",
    "Equity Fund - Korea Equity Fund",
    "Equity Fund - Uncategorized Equity Fund",
  ],
  債券基金: [
    "Bond Fund - Hong Kong Dollar Bond Fund",
    "Bond Fund - RMB Bond Fund",
    "Bond Fund - Asia Bond Fund",
    "Bond Fund - Global Bond Fund",
  ],
  混合資產基金: [
    "Mixed Assets Fund - 81% to 100% Equity",
    "Mixed Assets Fund - 61% to 80% Equity",
    "Mixed Assets Fund - 41% to 60% Equity",
    "Mixed Assets Fund - 21% to 40% Equity",
    "Mixed Assets Fund - Default Investment Strategy - Core Accumulation Fund",
    "Mixed Assets Fund - Default Investment Strategy - Age 65 Plus Fund",
    "Mixed Assets Fund - Uncategorized Mixed Asset Fund",
  ],
  保證基金: ["Guaranteed Fund"],
  貨幣市場基金: [
    "Money Market Fund - MPF Conservative Fund",
    "Money Market Fund - Other than MPF Conservative Fund",
  ],
};

const CATEGORY_COLORS: Record<string, string> = {
  股票基金: "#3b82f6",
  債券基金: "#8b5cf6",
  混合資產基金: "#10b981",
  保證基金: "#f59e0b",
  貨幣市場基金: "#6b7280",
};

function avg(vals: (number | null | undefined)[]): number | null {
  const valid = vals.filter((v): v is number => v != null);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function SelectFilter({
  label, value, onChange, options, disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none bg-background border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 pr-7 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

export default function CategoryComparison() {
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState("1y");
  const [funds, setFunds] = useState<MpfFundMultiPeriod[]>([]);
  const [schemes, setSchemes] = useState<MpfSchemeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const [catFilter, setCatFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [trusteeFilter, setTrusteeFilter] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([getAllFundsMultiPeriod(), getMeta()])
      .then(([f, m]) => { setFunds(f); setSchemes(m.schemes); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const trustees = useMemo(() => [...new Set(schemes.map((s) => s.trustee))].sort(), [schemes]);
  const filteredSchemes = useMemo(
    () => schemes.filter((s) => !trusteeFilter || s.trustee === trusteeFilter),
    [schemes, trusteeFilter]
  );

  const typeOptions = catFilter ? TYPE_BY_CATEGORY[catFilter] ?? [] : [];
  const hasFilters = catFilter || typeFilter || trusteeFilter || schemeFilter;

  const allFiltered = useMemo(() =>
    funds.filter((f) => {
      if (catFilter && f.fundCategory !== catFilter) return false;
      if (typeFilter && f.fundType !== typeFilter) return false;
      if (trusteeFilter && f.trustee !== trusteeFilter) return false;
      if (schemeFilter && f.scheme !== schemeFilter) return false;
      return true;
    }),
    [funds, catFilter, typeFilter, trusteeFilter, schemeFilter]
  );

  const getAnn = (f: MpfFundMultiPeriod) => f.returns[period]?.ann ?? null;

  const chartMode = typeFilter ? "fund-list" : catFilter ? "by-type" : "by-category";

  const barChartData = useMemo(() => {
    if (chartMode === "by-category") {
      return CATEGORIES.map((cat) => {
        const catFunds = allFiltered.filter((f) => f.fundCategory === cat);
        const a = avg(catFunds.map(getAnn));
        return { name: cat.replace("基金", "").trim(), fullName: cat, value: a ?? 0, count: catFunds.length };
      }).filter((d) => d.count > 0);
    }
    if (chartMode === "by-type") {
      const types = TYPE_BY_CATEGORY[catFilter] ?? [];
      return types.map((t) => {
        const typeFunds = allFiltered.filter((f) => f.fundType === t);
        const a = avg(typeFunds.map(getAnn));
        return {
          name: (FUND_TYPE_ZH[t] ?? t).replace(/ *\(.*\)/, "").trim(),
          fullName: FUND_TYPE_ZH[t] ?? t,
          value: a ?? 0,
          count: typeFunds.length,
        };
      }).filter((d) => d.count > 0);
    }
    return [];
  }, [allFiltered, chartMode, catFilter, period]);

  const groupedFunds = useMemo(() => {
    if (chartMode === "fund-list") {
      return [{ key: typeFilter, label: FUND_TYPE_ZH[typeFilter] ?? typeFilter, funds: [...allFiltered].sort((a, b) => (getAnn(b) ?? -999) - (getAnn(a) ?? -999)) }];
    }
    if (chartMode === "by-type") {
      const types = TYPE_BY_CATEGORY[catFilter] ?? [];
      return types.map((t) => ({
        key: t,
        label: FUND_TYPE_ZH[t] ?? t,
        funds: allFiltered.filter((f) => f.fundType === t).sort((a, b) => (getAnn(b) ?? -999) - (getAnn(a) ?? -999)),
      })).filter((g) => g.funds.length > 0);
    }
    return CATEGORIES.map((cat) => ({
      key: cat,
      label: cat,
      funds: allFiltered.filter((f) => f.fundCategory === cat).sort((a, b) => (getAnn(b) ?? -999) - (getAnn(a) ?? -999)),
    })).filter((g) => g.funds.length > 0);
  }, [allFiltered, chartMode, catFilter, typeFilter, period]);

  const clearFilters = () => {
    setCatFilter(""); setTypeFilter(""); setTrusteeFilter(""); setSchemeFilter("");
  };

  const periodLabel = PERIODS.find((p) => p.id === period)?.labelZh || period;

  return (
    <div className="space-y-4">
      <div className="pt-1 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">類別比較</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? "載入中..." : `顯示 ${allFiltered.length} 隻基金`} · 按積金局分類篩選
          </p>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-primary font-medium mt-1 hover:underline flex items-center gap-1">
            <X className="h-3 w-3" />
            清除篩選
          </button>
        )}
      </div>

      <div className="bg-card rounded-2xl border shadow-sm px-4 py-3">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">時間段</div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/20">
          <SelectFilter
            label="① 基金類別"
            value={catFilter}
            onChange={(v) => { setCatFilter(v); setTypeFilter(""); setTrusteeFilter(""); setSchemeFilter(""); setExpandedGroup(null); }}
            options={[{ value: "", label: "全部類別" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
          <SelectFilter
            label="② 基金種類"
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v); setExpandedGroup(null); }}
            disabled={!catFilter}
            options={[
              { value: "", label: catFilter ? `全部 ${catFilter}` : "先選基金類別" },
              ...typeOptions.map((t) => ({ value: t, label: FUND_TYPE_ZH[t] ?? t })),
            ]}
          />
          <SelectFilter
            label="③ 受託人"
            value={trusteeFilter}
            onChange={(v) => { setTrusteeFilter(v); setSchemeFilter(""); }}
            options={[{ value: "", label: "全部受託人" }, ...trustees.map((t) => ({ value: t, label: t }))]}
          />
          <SelectFilter
            label="④ 計劃"
            value={schemeFilter}
            onChange={(v) => setSchemeFilter(v)}
            disabled={!trusteeFilter}
            options={[
              { value: "", label: trusteeFilter ? `全部計劃` : "先選受託人" },
              ...filteredSchemes.map((s) => ({
                value: s.scheme,
                label: s.scheme.replace(/Mandatory Provident Fund/gi, "MPF").substring(0, 30),
              })),
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600">載入失敗：{error}</p>
        </div>
      ) : (
        <>
          {barChartData.length > 0 && (
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  {chartMode === "by-type" ? `${catFilter} 各種類平均回報` : "各類別平均回報"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{periodLabel}</span>
              </div>
              <div className="h-[220px] sm:h-[280px] px-2 py-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    layout="vertical"
                    margin={{ top: 0, right: 55, left: 2, bottom: 0 }}
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
                      width={chartMode === "by-type" ? 88 : 54}
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
                            <div className={`text-sm font-bold mt-0.5 ${returnColor(d.value)}`}>{formatReturn(d.value)}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{d.count} 隻基金</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                      {barChartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={chartMode === "by-category"
                            ? (CATEGORY_COLORS[entry.fullName] ?? "#94a3b8")
                            : (entry.value >= 0 ? "#10b981" : "#ef4444")
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-foreground">
                {chartMode === "fund-list" ? "基金列表" : "展開查看基金"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {PERIODS.find((p) => p.id === period)?.labelZh ?? period} 年化回報
              </span>
            </div>

            {groupedFunds.map(({ key, label, funds: gFunds }) => {
              const isExpanded = chartMode === "fund-list" || expandedGroup === key;
              const groupAvg = avg(gFunds.map(getAnn));
              const color = CATEGORY_COLORS[key] ?? "#94a3b8";

              return (
                <div key={key} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                  {chartMode !== "fund-list" && (
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? null : key)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-5 rounded-full" style={{ background: color }} />
                        <div>
                          <div className="text-sm font-semibold text-foreground">{label}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{gFunds.length} 隻基金</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className={`text-sm font-bold tabular-nums ${returnColor(groupAvg)}`}>
                            {formatReturn(groupAvg)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">平均</div>
                        </div>
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>
                  )}

                  {isExpanded && gFunds.length > 0 && (
                    <div className={chartMode !== "fund-list" ? "border-t" : ""}>
                      {gFunds.slice(0, 30).map((fund, i) => {
                        const val = getAnn(fund);
                        return (
                          <button
                            key={fund.cfId}
                            onClick={() => navigate(`/fund/${fund.cfId}`)}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted transition-colors border-b last:border-b-0"
                          >
                            <div className="w-5 text-right text-xs font-bold text-muted-foreground flex-shrink-0">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{fund.nameZh || fund.nameEn}</div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{fund.trustee}</span>
                                <span className="text-[10px] text-muted-foreground">{FUND_TYPE_ZH[fund.fundType] ?? fund.fundType}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className={`text-sm font-bold tabular-nums ${returnColor(val)}`}>{formatReturn(val)}</span>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                            </div>
                          </button>
                        );
                      })}
                      {gFunds.length > 30 && (
                        <div className="px-4 py-2 text-xs text-muted-foreground text-center bg-muted/20">
                          只顯示前 30 隻 · 使用篩選器縮小範圍
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="text-center text-[11px] text-muted-foreground pb-2">
        數據來源：積金局 · 數據截至 2026年2月 · 僅供參考，不構成投資建議
      </p>
    </div>
  );
}
