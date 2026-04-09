import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  getMeta,
  getAllFunds,
  getFundDetail,
  formatReturn,
  returnColor,
  fundTypeShort,
  type MpfFundSummary,
  type MpfFundDetail,
  type MpfSchemeEntry,
  PERIODS,
} from "@/lib/api";
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
import { X, Plus, RefreshCw, GitCompare, ChevronDown, Printer } from "lucide-react";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
const CALENDAR_YEARS = ["2025", "2024", "2023", "2022", "2021"];

function FundSelector({
  schemes,
  allFunds,
  selected,
  onAdd,
}: {
  schemes: MpfSchemeEntry[];
  allFunds: MpfFundSummary[];
  selected: string[];
  onAdd: (cfId: string) => void;
}) {
  const [trustee, setTrustee] = useState("");
  const [scheme, setScheme] = useState("");
  const [fundId, setFundId] = useState("");

  const trustees = [...new Set(schemes.map((s) => s.trustee))].sort();
  const filteredSchemes = schemes.filter((s) => !trustee || s.trustee === trustee);
  const filteredFunds = allFunds.filter(
    (f) =>
      (!trustee || f.trustee === trustee) &&
      (!scheme || f.scheme === scheme) &&
      !selected.includes(f.cfId)
  );

  const canAdd = !!fundId && !selected.includes(fundId);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
            ① 受託人
          </label>
          <div className="relative">
            <select
              value={trustee}
              onChange={(e) => { setTrustee(e.target.value); setScheme(""); setFundId(""); }}
              className="w-full appearance-none bg-background border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 pr-8"
            >
              <option value="">全部受託人</option>
              {trustees.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="relative">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
            ② 計劃名稱
          </label>
          <div className="relative">
            <select
              value={scheme}
              onChange={(e) => { setScheme(e.target.value); setFundId(""); }}
              disabled={!trustee}
              className="w-full appearance-none bg-background border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 pr-8 disabled:opacity-50"
            >
              <option value="">全部計劃</option>
              {filteredSchemes.map((s) => (
                <option key={s.scheme} value={s.scheme}>
                  {s.scheme.replace(s.trustee + " ", "").replace(/Mandatory Provident Fund/gi, "MPF")}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="relative">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
            ③ 選擇基金
          </label>
          <div className="relative">
            <select
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              disabled={filteredFunds.length === 0}
              className="w-full appearance-none bg-background border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 pr-8 disabled:opacity-50"
            >
              <option value="">{filteredFunds.length === 0 ? "請先選受託人" : `選擇基金 (${filteredFunds.length}隻)`}</option>
              {filteredFunds.map((f) => (
                <option key={f.cfId} value={f.cfId}>
                  {f.nameZh || f.nameEn}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      <button
        onClick={() => { if (canAdd) { onAdd(fundId); setFundId(""); } }}
        disabled={!canAdd || selected.length >= 4}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:bg-primary/80 transition-colors"
      >
        <Plus className="h-4 w-4" />
        加入比較 {selected.length > 0 && `(${selected.length}/4)`}
      </button>
    </div>
  );
}

export default function Compare() {
  const [, navigate] = useLocation();
  const [schemes, setSchemes] = useState<MpfSchemeEntry[]>([]);
  const [allFunds, setAllFunds] = useState<MpfFundSummary[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [details, setDetails] = useState<Record<string, MpfFundDetail>>({});
  const [detailLoading, setDetailLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([getMeta(), getAllFunds({ period: "1y" })]).then(([meta, funds]) => {
      setSchemes(meta.schemes);
      setAllFunds(funds);
      setLoadingMeta(false);
    });
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

  const removeFund = (cfId: string) =>
    setSelectedIds((prev) => prev.filter((id) => id !== cfId));

  const getReturn = (detail: MpfFundDetail, p: string) =>
    detail.returns.find((r) => r.period === p)?.annualizedReturn ?? null;

  const calendarData = CALENDAR_YEARS.map((year) => {
    const row: Record<string, string | number | null> = { year };
    selectedIds.forEach((id) => {
      const d = details[id];
      if (d) row[d.nameZh || d.nameEn] = getReturn(d, year);
    });
    return row;
  });

  const periodRows = PERIODS.slice(0, 4);
  const loadedDetails = selectedIds.filter((id) => details[id]);
  const hasCalendarData = loadedDetails.some((id) =>
    CALENDAR_YEARS.some((y) => getReturn(details[id], y) !== null)
  );

  return (
    <div className="space-y-4">
      <div className="pt-1 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">比較基金</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            最多比較 4 隻基金 · 按受託人 → 計劃 → 基金逐步選擇
          </p>
        </div>
        {loadedDetails.length >= 2 && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted hover:bg-muted/70 px-3 py-2 rounded-xl transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            打印
          </button>
        )}
      </div>

      <div className="bg-card rounded-2xl border shadow-sm p-4 space-y-4">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          選擇基金（最多 4 隻）
        </div>

        {loadingMeta ? (
          <div className="flex justify-center py-6">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <FundSelector
            schemes={schemes}
            allFunds={allFunds}
            selected={selectedIds}
            onAdd={addFund}
          />
        )}

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 border-t">
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
                    <span className="text-foreground truncate max-w-[140px]">
                      {d ? (d.nameZh || d.nameEn).substring(0, 20) : id}
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
          <p className="text-sm font-medium text-muted-foreground">按上方步驟選擇基金開始比較</p>
          <p className="text-xs text-muted-foreground/70 mt-1">先選受託人 → 計劃名稱 → 基金</p>
        </div>
      )}

      {loadedDetails.length >= 1 && (
        <>
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden print-section">
            <div className="px-4 py-3 border-b bg-muted/20">
              <span className="text-sm font-semibold">各時段年化回報比較</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/10">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground">基金</th>
                    {periodRows.map((p) => (
                      <th key={p.id} className="text-right px-3 py-3 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                        {p.labelZh}
                      </th>
                    ))}
                    <th className="text-right px-3 py-3 text-[11px] font-semibold text-muted-foreground">風險</th>
                    <th className="text-right px-3 py-3 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">開支比率</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">基金規模</th>
                  </tr>
                </thead>
                <tbody>
                  {loadedDetails.map((id, i) => {
                    const d = details[id];
                    return (
                      <tr key={id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <button onClick={() => navigate(`/fund/${id}`)} className="text-left group">
                            <div
                              className="font-semibold text-foreground text-xs group-hover:text-primary"
                              style={{ borderLeft: `3px solid ${CHART_COLORS[i]}`, paddingLeft: 8 }}
                            >
                              {(d.nameZh || d.nameEn).substring(0, 24)}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 pl-[11px]">
                              {d.trustee} · {d.scheme.replace(/Mandatory Provident Fund/gi, "MPF").substring(0, 22)}
                            </div>
                            <div className="text-[10px] text-muted-foreground/60 mt-0.5 pl-[11px]">
                              {fundTypeShort(d.fundType)}
                            </div>
                          </button>
                        </td>
                        {periodRows.map((p) => {
                          const val = getReturn(d, p.id);
                          return (
                            <td key={p.id} className={`text-right px-3 py-3.5 text-sm font-bold tabular-nums ${returnColor(val)}`}>
                              {formatReturn(val)}
                            </td>
                          );
                        })}
                        <td className="text-right px-3 py-3.5">
                          <span className="inline-flex items-center justify-center bg-muted rounded-lg text-xs font-medium px-2 py-0.5">
                            {d.riskClass ?? "—"} / 7
                          </span>
                        </td>
                        <td className="text-right px-3 py-3.5 text-xs font-medium text-muted-foreground">
                          {d.ferPct != null ? `${d.ferPct.toFixed(2)}%` : "—"}
                        </td>
                        <td className="text-right px-4 py-3.5 text-xs text-muted-foreground">
                          {d.fundSizeHkm != null ? `$${(d.fundSizeHkm / 1000).toFixed(1)}B` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {loadedDetails.length >= 2 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <div className="text-xs font-semibold text-amber-800 mb-1">💡 開支比率（FER）的長遠影響</div>
              {(() => {
                const sorted = [...loadedDetails].sort((a, b) =>
                  (details[a].ferPct ?? 99) - (details[b].ferPct ?? 99)
                );
                const low = details[sorted[0]]?.ferPct;
                const high = details[sorted[sorted.length - 1]]?.ferPct;
                if (low == null || high == null || low === high) return null;
                const diff = high - low;
                const impact30yr = (1 - Math.pow(1 - diff / 100, 30)) * 100;
                return (
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    費用差距 <strong>{diff.toFixed(2)}%</strong> · 30 年後資產差距約 <strong>{impact30yr.toFixed(1)}%</strong>（以同等回報計算）
                  </p>
                );
              })()}
            </div>
          )}

          {hasCalendarData && (
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b">
                <span className="text-sm font-semibold">各年度回報比較（{CALENDAR_YEARS[CALENDAR_YEARS.length - 1]}–{CALENDAR_YEARS[0]}）</span>
              </div>
              <div className="h-[240px] px-2 py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calendarData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-popover border rounded-xl shadow-lg px-3 py-2 space-y-1">
                            <div className="text-[11px] text-muted-foreground font-medium">{label} 年</div>
                            {payload.map((p, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                                <span className="text-muted-foreground truncate max-w-[110px]">{String(p.name).substring(0, 14)}</span>
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
                        <span className="text-[10px] text-muted-foreground">{String(value).substring(0, 16)}</span>
                      )}
                    />
                    {loadedDetails.map((id, i) => (
                      <Bar
                        key={id}
                        dataKey={details[id]?.nameZh || details[id]?.nameEn || id}
                        fill={CHART_COLORS[i]}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={32}
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
        數據來源：積金局 · 數據截至 2026年2月 · 僅供參考，不構成投資建議
      </p>
    </div>
  );
}
