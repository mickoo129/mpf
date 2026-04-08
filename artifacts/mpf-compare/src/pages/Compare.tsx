import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  getAllFunds,
  getFundDetail,
  formatReturn,
  returnColor,
  fundTypeShort,
  type MpfFundSummary,
  type MpfFundDetail,
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
  Legend,
} from "recharts";
import { Search, X, Plus, RefreshCw, GitCompare } from "lucide-react";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
const CALENDAR_YEARS = ["2025", "2024", "2023", "2022", "2021"];

function FundPicker({
  allFunds,
  selected,
  onAdd,
  loading,
}: {
  allFunds: MpfFundSummary[];
  selected: string[];
  onAdd: (cfId: string) => void;
  loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = query.length >= 1
    ? allFunds
        .filter((f) => {
          const q = query.toLowerCase();
          return (
            !selected.includes(f.cfId) &&
            ((f.nameZh ?? "").toLowerCase().includes(q) ||
              f.nameEn.toLowerCase().includes(q) ||
              f.trustee.toLowerCase().includes(q))
          );
        })
        .slice(0, 8)
    : [];

  if (selected.length >= 4) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-card border rounded-xl px-3 py-2.5 shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? "載入中..." : "搜尋並新增基金..."}
          disabled={loading}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <Plus className="h-4 w-4 text-primary flex-shrink-0" />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-xl overflow-hidden">
          {filtered.map((f) => (
            <button
              key={f.cfId}
              onClick={() => { onAdd(f.cfId); setQuery(""); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 hover:bg-muted text-sm border-b last:border-b-0 flex items-center gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{f.nameZh || f.nameEn}</div>
                <div className="text-[10px] text-muted-foreground">{f.trustee} · {fundTypeShort(f.fundType)}</div>
              </div>
              <span className={`text-xs font-bold ${returnColor(f.returnAnn)}`}>
                {formatReturn(f.returnAnn)}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-xl px-3 py-3 text-sm text-muted-foreground">
          沒有找到基金
        </div>
      )}
    </div>
  );
}

export default function Compare() {
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState("1y");
  const [allFunds, setAllFunds] = useState<MpfFundSummary[]>([]);
  const [allLoading, setAllLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [details, setDetails] = useState<Record<string, MpfFundDetail>>({});
  const [detailLoading, setDetailLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    getAllFunds({ period: "1y" })
      .then(setAllFunds)
      .finally(() => setAllLoading(false));
  }, []);

  const addFund = async (cfId: string) => {
    if (selectedIds.includes(cfId) || selectedIds.length >= 4) return;
    setSelectedIds((prev) => [...prev, cfId]);
    if (!details[cfId]) {
      setDetailLoading((s) => new Set(s).add(cfId));
      const d = await getFundDetail(cfId);
      setDetails((prev) => ({ ...prev, [cfId]: d }));
      setDetailLoading((s) => { const n = new Set(s); n.delete(cfId); return n; });
    }
  };

  const removeFund = (cfId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== cfId));
  };

  const getReturn = (detail: MpfFundDetail, p: string) =>
    detail.returns.find((r) => r.period === p)?.annualizedReturn ?? null;

  const chartData = CALENDAR_YEARS.map((year) => {
    const row: Record<string, string | number | null> = { year };
    selectedIds.forEach((id) => {
      const d = details[id];
      if (d) row[d.nameZh || d.nameEn] = getReturn(d, year);
    });
    return row;
  });

  const periodRows = PERIODS.slice(0, 4);
  const loadedDetails = selectedIds.filter((id) => details[id]);

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-foreground">比較基金</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          最多比較 4 隻基金 · 並排分析各項指標
        </p>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm p-4 space-y-3">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          新增基金（最多 4 隻）
        </div>
        <FundPicker
          allFunds={allFunds}
          selected={selectedIds}
          onAdd={addFund}
          loading={allLoading}
        />

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedIds.map((id, i) => {
              const d = details[id];
              const isLoading = detailLoading.has(id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-1.5 bg-muted rounded-xl px-2.5 py-1.5 text-xs font-medium"
                  style={{ borderLeft: `3px solid ${CHART_COLORS[i]}` }}
                >
                  {isLoading ? (
                    <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-foreground truncate max-w-[120px]">
                      {d ? (d.nameZh || d.nameEn).substring(0, 18) : id}
                    </span>
                  )}
                  <button onClick={() => removeFund(id)}>
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedIds.length === 0 && (
        <div className="bg-card rounded-2xl border shadow-sm p-12 text-center">
          <GitCompare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">搜尋並新增基金開始比較</p>
          <p className="text-xs text-muted-foreground/70 mt-1">可同時比較最多 4 隻基金</p>
        </div>
      )}

      {loadedDetails.length >= 1 && (
        <>
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b">
              <span className="text-sm font-semibold">各時段年化回報比較</span>
            </div>
            <div>
              <div className="bg-muted/30 px-4 py-2 border-b">
                <PeriodSelector value={period} onChange={setPeriod} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground">基金</th>
                      {periodRows.map((p) => (
                        <th key={p.id} className="text-right px-3 py-2.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                          {p.labelZh}
                        </th>
                      ))}
                      <th className="text-right px-4 py-2.5 text-[11px] font-medium text-muted-foreground">風險</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-medium text-muted-foreground">開支比率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadedDetails.map((id, i) => {
                      const d = details[id];
                      return (
                        <tr key={id} className="border-b last:border-b-0 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/fund/${id}`)}
                              className="text-left group"
                            >
                              <div
                                className="font-medium text-foreground text-xs group-hover:text-primary truncate max-w-[140px]"
                                style={{ borderLeft: `3px solid ${CHART_COLORS[i]}`, paddingLeft: 8 }}
                              >
                                {(d.nameZh || d.nameEn).substring(0, 22)}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 pl-[11px]">
                                {d.trustee}
                              </div>
                            </button>
                          </td>
                          {periodRows.map((p) => {
                            const val = getReturn(d, p.id);
                            return (
                              <td key={p.id} className={`text-right px-3 py-3 text-sm font-bold tabular-nums ${returnColor(val)}`}>
                                {formatReturn(val)}
                              </td>
                            );
                          })}
                          <td className="text-right px-4 py-3 text-xs text-muted-foreground">
                            {d.riskClass ?? "—"}
                          </td>
                          <td className="text-right px-4 py-3 text-xs text-muted-foreground">
                            {d.ferPct != null ? `${d.ferPct.toFixed(2)}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {loadedDetails.some((id) => {
            const d = details[id];
            return CALENDAR_YEARS.some((y) => getReturn(d, y) !== null);
          }) && (
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b">
                <span className="text-sm font-semibold">各年度回報比較</span>
              </div>
              <div className="h-[240px] px-2 py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-popover border rounded-xl shadow-lg px-3 py-2 space-y-1">
                            <div className="text-[11px] text-muted-foreground font-medium">{label}年</div>
                            {payload.map((p, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                                <span className="text-muted-foreground truncate max-w-[100px]">{String(p.name).substring(0, 12)}</span>
                                <span className={`font-bold ml-auto ${(p.value as number) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                  {formatReturn(p.value as number)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span className="text-[10px] text-muted-foreground">{String(value).substring(0, 15)}</span>
                      )}
                    />
                    {loadedDetails.map((id, i) => (
                      <Bar
                        key={id}
                        dataKey={details[id]?.nameZh || details[id]?.nameEn || id}
                        fill={CHART_COLORS[i]}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={30}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-center text-[11px] text-muted-foreground pb-2">
        數據來源：積金局 · 僅供參考，不構成投資建議
      </p>
    </div>
  );
}
