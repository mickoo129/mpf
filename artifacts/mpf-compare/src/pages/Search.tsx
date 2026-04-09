import { useState, useEffect, useRef, useMemo } from "react";
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
import { Search as SearchIcon, X, RefreshCw, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";

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

const DISPLAY_PERIODS = [
  { id: "1y", zh: "1年" },
  { id: "5y", zh: "5年" },
  { id: "10y", zh: "10年" },
  { id: "since_launch", zh: "成立至今" },
  { id: "2025", zh: "2025年" },
  { id: "2024", zh: "2024年" },
  { id: "2023", zh: "2023年" },
  { id: "2022", zh: "2022年" },
  { id: "2021", zh: "2021年" },
];

type SortDir = "asc" | "desc";

function Select({
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

export default function Search() {
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [trusteeFilter, setTrusteeFilter] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("");
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(["1y", "5y", "10y"]);
  const [sortPeriod, setSortPeriod] = useState("1y");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [funds, setFunds] = useState<MpfFundMultiPeriod[]>([]);
  const [schemes, setSchemes] = useState<MpfSchemeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAllFundsMultiPeriod(), getMeta()])
      .then(([f, m]) => { setFunds(f); setSchemes(m.schemes); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    inputRef.current?.focus();
  }, []);

  const trustees = useMemo(() => [...new Set(schemes.map((s) => s.trustee))].sort(), [schemes]);
  const filteredSchemes = useMemo(
    () => schemes.filter((s) => !trusteeFilter || s.trustee === trusteeFilter),
    [schemes, trusteeFilter]
  );
  const typeOptions = catFilter ? TYPE_BY_CATEGORY[catFilter] ?? [] : [];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return funds.filter((f) => {
      if (q && !(f.nameZh ?? "").toLowerCase().includes(q) && !f.nameEn.toLowerCase().includes(q) && !f.trustee.toLowerCase().includes(q) && !f.scheme.toLowerCase().includes(q)) return false;
      if (catFilter && f.fundCategory !== catFilter) return false;
      if (typeFilter && f.fundType !== typeFilter) return false;
      if (trusteeFilter && f.trustee !== trusteeFilter) return false;
      if (schemeFilter && f.scheme !== schemeFilter) return false;
      return true;
    });
  }, [funds, query, catFilter, typeFilter, trusteeFilter, schemeFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a.returns[sortPeriod]?.ann ?? null;
      const bv = b.returns[sortPeriod]?.ann ?? null;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [filtered, sortPeriod, sortDir]);

  const togglePeriod = (id: string) => {
    setSelectedPeriods((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((p) => p !== id) : prev) : [...prev, id]
    );
  };

  const handleSort = (pid: string) => {
    if (sortPeriod === pid) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortPeriod(pid); setSortDir("desc"); }
  };

  const clearFilters = () => {
    setCatFilter(""); setTypeFilter(""); setTrusteeFilter(""); setSchemeFilter(""); setQuery("");
  };
  const hasFilters = catFilter || typeFilter || trusteeFilter || schemeFilter || query;

  return (
    <div className="space-y-3">
      <div className="pt-1 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">基金一覽</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? "載入中..." : `${sorted.length} / ${funds.length} 隻基金`} · 按積金局分類
          </p>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-primary font-medium mt-1 hover:underline">
            清除篩選
          </button>
        )}
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <SearchIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋基金名稱..."
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none"
          />
          {query && <button onClick={() => setQuery("")}><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/20 border-b">
          <Select
            label="① 基金類別"
            value={catFilter}
            onChange={(v) => { setCatFilter(v); setTypeFilter(""); setTrusteeFilter(""); setSchemeFilter(""); }}
            options={[{ value: "", label: "全部類別" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
          <Select
            label="② 基金種類"
            value={typeFilter}
            onChange={(v) => setTypeFilter(v)}
            disabled={!catFilter}
            options={[
              { value: "", label: catFilter ? `全部 ${catFilter}` : "先選基金類別" },
              ...typeOptions.map((t) => ({ value: t, label: FUND_TYPE_ZH[t] ?? t })),
            ]}
          />
          <Select
            label="③ 受託人"
            value={trusteeFilter}
            onChange={(v) => { setTrusteeFilter(v); setSchemeFilter(""); }}
            options={[{ value: "", label: "全部受託人" }, ...trustees.map((t) => ({ value: t, label: t }))]}
          />
          <Select
            label="④ 計劃"
            value={schemeFilter}
            onChange={(v) => setSchemeFilter(v)}
            disabled={!trusteeFilter}
            options={[
              { value: "", label: trusteeFilter ? `全部計劃 (${filteredSchemes.length})` : "先選受託人" },
              ...filteredSchemes.map((s) => ({
                value: s.scheme,
                label: s.scheme.replace(/Mandatory Provident Fund/gi, "MPF").substring(0, 32),
              })),
            ]}
          />
        </div>

        <div className="px-3 py-2.5 border-b bg-muted/10">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            選擇時間段（可多選，點擊欄標題排序）
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DISPLAY_PERIODS.map((p) => {
              const on = selectedPeriods.includes(p.id);
              const isSort = sortPeriod === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => togglePeriod(p.id)}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                    on
                      ? isSort
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-primary/10 text-primary border-primary/30"
                      : "bg-background text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {p.zh}
                  {on && isSort && (sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600">載入失敗：{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {sorted.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">沒有符合條件的基金</p>
              <button onClick={clearFilters} className="mt-2 text-xs text-primary font-medium hover:underline">清除篩選</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 border-b">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/30 z-10 min-w-[180px]">
                      基金名稱
                    </th>
                    <th className="text-left px-3 py-3 font-semibold text-muted-foreground whitespace-nowrap">種類</th>
                    {selectedPeriods.map((pid) => {
                      const p = DISPLAY_PERIODS.find((d) => d.id === pid);
                      const isSort = sortPeriod === pid;
                      return (
                        <th
                          key={pid}
                          onClick={() => handleSort(pid)}
                          className="text-right px-3 py-3 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                        >
                          <div className="flex items-center justify-end gap-1">
                            {p?.zh}
                            {isSort
                              ? sortDir === "desc" ? <ChevronDown className="h-3 w-3 text-primary" /> : <ChevronUp className="h-3 w-3 text-primary" />
                              : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                          </div>
                        </th>
                      );
                    })}
                    <th className="text-right px-3 py-3 font-semibold text-muted-foreground">風險</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">FER</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((fund, i) => (
                    <tr
                      key={fund.cfId}
                      onClick={() => navigate(`/fund/${fund.cfId}`)}
                      className="border-b last:border-b-0 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5 sticky left-0 bg-card hover:bg-muted/40 z-10">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-muted-foreground/50 tabular-nums mt-0.5 w-5 flex-shrink-0">{i + 1}</span>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate max-w-[180px]">
                              {fund.nameZh || fund.nameEn}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                              {fund.trustee} · {fund.scheme.replace(/Mandatory Provident Fund/gi, "MPF")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-block bg-muted/60 text-muted-foreground rounded-lg px-1.5 py-0.5 whitespace-nowrap max-w-[120px] truncate">
                          {FUND_TYPE_ZH[fund.fundType] ?? fund.fundType}
                        </span>
                      </td>
                      {selectedPeriods.map((pid) => {
                        const val = fund.returns[pid]?.ann ?? null;
                        return (
                          <td key={pid} className={`text-right px-3 py-2.5 font-bold tabular-nums whitespace-nowrap ${returnColor(val)}`}>
                            {formatReturn(val)}
                          </td>
                        );
                      })}
                      <td className="text-right px-3 py-2.5 text-muted-foreground">
                        {fund.riskClass ?? "—"}
                      </td>
                      <td className="text-right px-4 py-2.5 text-muted-foreground">
                        {fund.ferPct != null ? `${fund.ferPct.toFixed(2)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <p className="text-center text-[11px] text-muted-foreground pb-2">
          數據來源：積金局 · 數據截至 2026年2月 · 僅供參考，不構成投資建議
        </p>
      )}
    </div>
  );
}
