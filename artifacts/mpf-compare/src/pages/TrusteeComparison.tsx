import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  getTrustees,
  formatReturn,
  returnColor,
  fundTypeShort,
  PERIODS,
  type MpfTrusteeStat,
} from "@/lib/api";
import { PeriodSelector } from "@/components/PeriodSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ArrowLeftRight, RefreshCw } from "lucide-react";

export default function TrusteeComparison() {
  const [period, setPeriod] = useState("1y");
  const [trustee1, setTrustee1] = useState("Manulife");
  const [trustee2, setTrustee2] = useState("HSBC");
  const [trustees, setTrustees] = useState<MpfTrusteeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const load = (p: string) => {
    setLoading(true);
    setError(null);
    getTrustees(p)
      .then((data) => {
        setTrustees(data);
        if (data.length >= 2) {
          const names = data.map((t) => t.trustee);
          if (!names.includes(trustee1)) setTrustee1(data[0]?.trustee ?? "");
          if (!names.includes(trustee2)) setTrustee2(data[1]?.trustee ?? "");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(period);
  }, [period]);

  const t1 = trustees.find((t) => t.trustee === trustee1);
  const t2 = trustees.find((t) => t.trustee === trustee2);

  const avg1 = t1?.avgReturn ?? null;
  const avg2 = t2?.avgReturn ?? null;
  const winner =
    avg1 !== null && avg2 !== null ? (avg1 > avg2 ? 1 : avg2 > avg1 ? 2 : 0) : 0;

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-foreground">受託人比較</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          對比兩間受託人所有基金表現
        </p>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm px-4 py-3 space-y-3">
        <div>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            時間段
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Select value={trustee1} onValueChange={setTrustee1}>
            <SelectTrigger className="h-10 rounded-xl border-2 border-blue-200 bg-blue-50/50 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trustees.map((t) => (
                <SelectItem key={t.trustee} value={t.trustee}>
                  {t.trustee}
                </SelectItem>
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
                <SelectItem key={t.trustee} value={t.trustee}>
                  {t.trustee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center space-y-3">
          <p className="text-sm text-red-600">{`載入失敗：${error}`}</p>
          <button
            onClick={() => load(period)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 active:bg-red-300 px-3 py-1.5 rounded-full transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            重試
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`bg-card rounded-2xl border shadow-sm p-4 ${
                winner === 1 ? "border-blue-400 ring-1 ring-blue-200" : ""
              }`}
            >
              {winner === 1 && (
                <div className="text-[10px] font-bold text-blue-600 bg-blue-100 rounded-full px-2 py-0.5 inline-block mb-2">
                  領先
                </div>
              )}
              <div className="text-[11px] text-muted-foreground font-medium">
                {t1?.trustee ?? trustee1}
              </div>
              <div
                className={`text-2xl font-bold tabular-nums mt-0.5 ${returnColor(avg1)}`}
              >
                {formatReturn(avg1)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {t1?.fundCount ?? 0} 隻基金
              </div>
            </div>
            <div
              className={`bg-card rounded-2xl border shadow-sm p-4 ${
                winner === 2 ? "border-orange-400 ring-1 ring-orange-200" : ""
              }`}
            >
              {winner === 2 && (
                <div className="text-[10px] font-bold text-orange-600 bg-orange-100 rounded-full px-2 py-0.5 inline-block mb-2">
                  領先
                </div>
              )}
              <div className="text-[11px] text-muted-foreground font-medium">
                {t2?.trustee ?? trustee2}
              </div>
              <div
                className={`text-2xl font-bold tabular-nums mt-0.5 ${returnColor(avg2)}`}
              >
                {formatReturn(avg2)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {t2?.fundCount ?? 0} 隻基金
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { stat: t1, color: "blue" },
              { stat: t2, color: "orange" },
            ].map(({ stat, color }) => {
              if (!stat) return null;
              return (
                <div
                  key={stat.trustee}
                  className="bg-card rounded-2xl border shadow-sm overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 px-4 py-3.5 border-b bg-muted/30">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${color === "blue" ? "bg-blue-500" : "bg-orange-500"}`}
                    />
                    <span className="text-sm font-semibold">{stat.trustee}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {stat.fundCount} 隻基金
                    </span>
                  </div>
                  <div>
                    {stat.funds.slice(0, 15).map((fund, i) => (
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
                            {fund.nameZh || fund.nameEn}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {fundTypeShort(fund.fundType)}
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
