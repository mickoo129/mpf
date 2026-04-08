import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  trustees,
  getFundsByTrustee,
  categoryLabels,
  type TimePeriod,
} from "@/data/mpf-data";
import { PeriodSelector } from "@/components/PeriodSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ArrowLeftRight } from "lucide-react";

export default function TrusteeComparison() {
  const [period, setPeriod] = useState<TimePeriod>("ytd");
  const [trustee1, setTrustee1] = useState("manulife");
  const [trustee2, setTrustee2] = useState("hsbc");
  const [, navigate] = useLocation();

  const funds1 = useMemo(
    () => getFundsByTrustee(trustee1)
      .filter((f) => f.returns[period] !== null)
      .sort((a, b) => (b.returns[period] ?? 0) - (a.returns[period] ?? 0)),
    [trustee1, period]
  );
  const funds2 = useMemo(
    () => getFundsByTrustee(trustee2)
      .filter((f) => f.returns[period] !== null)
      .sort((a, b) => (b.returns[period] ?? 0) - (a.returns[period] ?? 0)),
    [trustee2, period]
  );

  const avg1 = useMemo(() => {
    if (!funds1.length) return 0;
    return Math.round((funds1.reduce((a, f) => a + (f.returns[period] ?? 0), 0) / funds1.length) * 100) / 100;
  }, [funds1, period]);

  const avg2 = useMemo(() => {
    if (!funds2.length) return 0;
    return Math.round((funds2.reduce((a, f) => a + (f.returns[period] ?? 0), 0) / funds2.length) * 100) / 100;
  }, [funds2, period]);

  const t1 = trustees.find((t) => t.id === trustee1)!;
  const t2 = trustees.find((t) => t.id === trustee2)!;
  const winner = avg1 > avg2 ? 1 : avg2 > avg1 ? 2 : 0;

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-foreground">受託人比較</h1>
        <p className="text-xs text-muted-foreground mt-0.5">對比兩間受託人所有基金表現</p>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm px-4 py-3 space-y-3">
        <div>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">時間段</div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Select value={trustee1} onValueChange={setTrustee1}>
            <SelectTrigger className="h-10 rounded-xl border-2 border-blue-200 bg-blue-50/50 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trustees.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
            <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <Select value={trustee2} onValueChange={setTrustee2}>
            <SelectTrigger className="h-10 rounded-xl border-2 border-orange-200 bg-orange-50/50 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trustees.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`bg-card rounded-2xl border shadow-sm p-4 ${winner === 1 ? "border-blue-400 ring-1 ring-blue-200" : ""}`}>
          {winner === 1 && (
            <div className="text-[10px] font-bold text-blue-600 bg-blue-100 rounded-full px-2 py-0.5 inline-block mb-2">領先</div>
          )}
          <div className="text-[11px] text-muted-foreground font-medium">{t1.name}</div>
          <div className={`text-2xl font-bold tabular-nums mt-0.5 ${avg1 >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {avg1 >= 0 ? "+" : ""}{avg1.toFixed(2)}%
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">{funds1.length} 隻基金</div>
        </div>
        <div className={`bg-card rounded-2xl border shadow-sm p-4 ${winner === 2 ? "border-orange-400 ring-1 ring-orange-200" : ""}`}>
          {winner === 2 && (
            <div className="text-[10px] font-bold text-orange-600 bg-orange-100 rounded-full px-2 py-0.5 inline-block mb-2">領先</div>
          )}
          <div className="text-[11px] text-muted-foreground font-medium">{t2.name}</div>
          <div className={`text-2xl font-bold tabular-nums mt-0.5 ${avg2 >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {avg2 >= 0 ? "+" : ""}{avg2.toFixed(2)}%
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">{funds2.length} 隻基金</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { funds: funds1, info: t1, color: "blue", avg: avg1 },
          { funds: funds2, info: t2, color: "orange", avg: avg2 },
        ].map(({ funds, info, color, avg }) => (
          <div key={info.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b bg-muted/30">
              <div className={`w-2.5 h-2.5 rounded-full ${color === "blue" ? "bg-blue-500" : "bg-orange-500"}`} />
              <span className="text-sm font-semibold">{info.name}</span>
              <span className="text-xs text-muted-foreground">({info.nameEn})</span>
            </div>
            <div>
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
                      <div className="text-[10px] text-muted-foreground mt-0.5">{categoryLabels[fund.category]}</div>
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
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-muted-foreground pb-2">數據僅供參考，不構成投資建議</p>
    </div>
  );
}
