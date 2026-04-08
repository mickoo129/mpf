import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calculator as CalcIcon, TrendingUp } from "lucide-react";

function formatHKD(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

function formatM(val: number): string {
  return `$${(val / 10000).toFixed(2)}萬`;
}

const PRESETS = [
  { label: "保守", rate: 3 },
  { label: "平衡", rate: 5 },
  { label: "積極", rate: 8 },
  { label: "進取", rate: 12 },
];

export default function Calculator() {
  const [initial, setInitial] = useState(50000);
  const [monthly, setMonthly] = useState(2000);
  const [employerPct, setEmployerPct] = useState(5);
  const [salary, setSalary] = useState(20000);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(30);

  const monthlyEmployer = useMemo(() => (salary * employerPct) / 100, [salary, employerPct]);
  const totalMonthly = monthly + monthlyEmployer;

  const { data, finalValue, totalContrib, totalGrowth } = useMemo(() => {
    const monthlyRate = rate / 100 / 12;
    const data: { year: number; value: number; contrib: number }[] = [];
    let value = initial;
    let totalContrib = initial;

    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        value = value * (1 + monthlyRate) + totalMonthly;
        totalContrib += totalMonthly;
      }
      data.push({
        year: y,
        value: Math.round(value),
        contrib: Math.round(totalContrib),
      });
    }

    return {
      data,
      finalValue: Math.round(value),
      totalContrib: Math.round(totalContrib),
      totalGrowth: Math.round(value - totalContrib),
    };
  }, [initial, totalMonthly, rate, years]);

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-foreground">退休計算器</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          估算強積金退休儲蓄 · 按複利計算
        </p>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm p-4 space-y-5">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <CalcIcon className="h-3.5 w-3.5" />
          輸入資料
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">現有積金結餘</label>
              <span className="text-sm font-bold text-primary">{formatHKD(initial)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000000}
              step={5000}
              value={initial}
              onChange={(e) => setInitial(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>$0</span><span>$100萬</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">月薪</label>
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(Math.max(0, Number(e.target.value)))}
                  className="flex-1 bg-transparent text-sm font-medium outline-none w-0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">僱主供款比率</label>
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <input
                  type="number"
                  value={employerPct}
                  min={5}
                  max={20}
                  step={0.5}
                  onChange={(e) => setEmployerPct(Math.max(5, Number(e.target.value)))}
                  className="flex-1 bg-transparent text-sm font-medium outline-none w-0"
                />
                <span className="text-muted-foreground text-sm">%</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">個人月供</label>
              <span className="text-sm font-bold text-primary">{formatHKD(monthly)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10000}
              step={100}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>$0</span><span>$10,000</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[11px] text-muted-foreground">每月總供款（包括僱主）：</span>
              <span className="text-[11px] font-semibold text-foreground">{formatHKD(totalMonthly)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">預期年回報率</label>
              <span className="text-sm font-bold text-primary">{rate}%</span>
            </div>
            <div className="flex gap-2 mb-2">
              {PRESETS.map((p) => (
                <button
                  key={p.rate}
                  onClick={() => setRate(p.rate)}
                  className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg border transition-colors ${rate === p.rate ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {p.label}<br /><span className="text-[10px]">{p.rate}%</span>
                </button>
              ))}
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>1%</span><span>20%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">供款年期</label>
              <span className="text-sm font-bold text-primary">{years} 年</span>
            </div>
            <input
              type="range"
              min={1}
              max={45}
              step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>1年</span><span>45年</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card rounded-2xl border shadow-sm p-3 text-center">
          <div className="text-[10px] text-muted-foreground mb-1 font-medium">預計總額</div>
          <div className="text-lg font-bold text-primary tabular-nums">{formatM(finalValue)}</div>
        </div>
        <div className="bg-card rounded-2xl border shadow-sm p-3 text-center">
          <div className="text-[10px] text-muted-foreground mb-1 font-medium">總供款</div>
          <div className="text-lg font-bold text-foreground tabular-nums">{formatM(totalContrib)}</div>
        </div>
        <div className="bg-card rounded-2xl border shadow-sm p-3 text-center">
          <div className="text-[10px] text-muted-foreground mb-1 font-medium">複利增長</div>
          <div className="text-lg font-bold text-emerald-600 tabular-nums">{formatM(totalGrowth)}</div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">資產增長預測</span>
        </div>
        <div className="h-[220px] px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}年`}
                interval={Math.floor(years / 5)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `$${(v / 10000).toFixed(0)}萬`}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-popover border rounded-xl shadow-lg px-3 py-2 space-y-1">
                      <div className="text-[11px] text-muted-foreground">第 {label} 年</div>
                      {payload.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
                          <span className="text-muted-foreground">{p.name === "value" ? "預計總額" : "總供款"}</span>
                          <span className="font-bold ml-auto">{formatM(p.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="contrib"
                stroke="#9ca3af"
                strokeWidth={1.5}
                fill="url(#contribGrad)"
                name="contrib"
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#valueGrad)"
                name="value"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-5 pb-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <div className="w-3 h-0.5 bg-blue-500 rounded" />預計總額
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <div className="w-3 h-0.5 bg-gray-400 rounded" />總供款
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b">
          <span className="text-sm font-semibold">各年預測明細</span>
        </div>
        <div className="overflow-y-auto max-h-[200px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">年期</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">總供款</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">複利增長</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">預計總額</th>
              </tr>
            </thead>
            <tbody>
              {data.filter((_, i) => i % Math.max(1, Math.floor(years / 10)) === 0 || i === data.length - 1).map((d) => (
                <tr key={d.year} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-2 text-muted-foreground">第 {d.year} 年</td>
                  <td className="text-right px-4 py-2 text-foreground tabular-nums">{formatM(d.contrib)}</td>
                  <td className="text-right px-4 py-2 text-emerald-600 tabular-nums">+{formatM(d.value - d.contrib)}</td>
                  <td className="text-right px-4 py-2 font-bold text-primary tabular-nums">{formatM(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-[11px] text-amber-800 leading-relaxed">
          ⚠️ 此計算器僅供參考，實際回報因基金表現而有所不同。過去表現並不保證未來回報。計算結果不構成任何投資建議。
        </p>
      </div>
    </div>
  );
}
