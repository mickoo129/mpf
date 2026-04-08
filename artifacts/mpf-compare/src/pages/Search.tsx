import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  getAllFunds,
  formatReturn,
  returnColor,
  fundTypeShort,
  type MpfFundSummary,
  PERIODS,
} from "@/lib/api";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Search as SearchIcon, X, RefreshCw, SlidersHorizontal } from "lucide-react";

const CATEGORIES = [
  "全部類別",
  "股票基金",
  "債券基金",
  "混合資產基金",
  "保證基金",
  "貨幣市場基金",
  "其他",
];

const TRUSTEES = [
  "全部受託人",
  "AIA",
  "BCT",
  "BCM",
  "BEA",
  "BOC-Prudential",
  "China Life",
  "Fidelity",
  "Haitong",
  "Hang Seng",
  "HSBC",
  "Manulife",
  "Principal",
  "Standard Chartered",
  "Sun Life",
  "YF Life",
];

export default function Search() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("1y");
  const [category, setCategory] = useState("全部類別");
  const [trustee, setTrustee] = useState("全部受託人");
  const [allFunds, setAllFunds] = useState<MpfFundSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = (p: string) => {
    setLoading(true);
    setError(null);
    getAllFunds({ period: p })
      .then(setAllFunds)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(period);
  }, [period]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = allFunds.filter((f) => {
    const q = query.toLowerCase();
    const matchSearch =
      !q ||
      (f.nameZh ?? "").toLowerCase().includes(q) ||
      f.nameEn.toLowerCase().includes(q) ||
      f.trustee.toLowerCase().includes(q);
    const matchCat = category === "全部類別" || f.fundCategory === category;
    const matchTrustee = trustee === "全部受託人" || f.trustee === trustee;
    return matchSearch && matchCat && matchTrustee;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.returnAnn == null && b.returnAnn == null) return 0;
    if (a.returnAnn == null) return 1;
    if (b.returnAnn == null) return -1;
    return b.returnAnn - a.returnAnn;
  });

  const periodLabel = PERIODS.find((p) => p.id === period)?.labelZh || period;

  return (
    <div className="space-y-3">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-foreground">搜尋基金</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          447 隻基金 · 按名稱、受託人搜尋
        </p>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <SearchIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋基金名稱、受託人..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${showFilters ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            篩選
          </button>
        </div>

        {showFilters && (
          <div className="px-4 py-3 bg-muted/30 border-b space-y-3">
            <div>
              <div className="text-[11px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">時間段</div>
              <PeriodSelector value={period} onChange={setPeriod} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">基金類別</div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs bg-background border rounded-lg px-2.5 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[11px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">受託人</div>
                <select
                  value={trustee}
                  onChange={(e) => setTrustee(e.target.value)}
                  className="w-full text-xs bg-background border rounded-lg px-2.5 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  {TRUSTEES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-2 flex items-center justify-between bg-muted/20">
          <span className="text-[11px] text-muted-foreground">
            {loading ? "載入中..." : `找到 ${sorted.length} 隻基金`}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {periodLabel} 年化回報
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center space-y-3">
          <p className="text-sm text-red-600">載入失敗：{error}</p>
          <button
            onClick={() => load(period)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-full transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> 重試
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {sorted.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">沒有符合條件的基金</p>
            </div>
          ) : (
            sorted.map((fund, i) => (
              <button
                key={fund.cfId}
                onClick={() => navigate(`/fund/${fund.cfId}`)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors border-b last:border-b-0"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {fund.nameZh || fund.nameEn}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">
                      {fund.trustee}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {fundTypeShort(fund.fundType)}
                    </span>
                    {fund.riskClass && (
                      <span className="text-[10px] text-muted-foreground">
                        風險 {fund.riskClass}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`text-sm font-bold tabular-nums flex-shrink-0 ${returnColor(fund.returnAnn)}`}>
                  {formatReturn(fund.returnAnn)}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <p className="text-center text-[11px] text-muted-foreground pb-2">
          數據來源：積金局 · 僅供參考，不構成投資建議
        </p>
      )}
    </div>
  );
}
