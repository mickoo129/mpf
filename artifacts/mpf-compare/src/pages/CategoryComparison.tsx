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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ArrowRight, BarChart3 } from "lucide-react";

const periods: TimePeriod[] = ["1d", "1w", "1m", "mtd", "ytd", "3m", "6m", "1y", "3y", "5y", "10y"];

export default function CategoryComparison() {
  const [period, setPeriod] = useState<TimePeriod>("ytd");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const categoryData = useMemo(() => getCategoryAverageReturns(period), [period]);

  const chartData = useMemo(() => {
    return categoryData.map((d) => ({
      name: d.label.length > 6 ? d.label.slice(0, 6) + "..." : d.label,
      fullName: d.label,
      value: d.avgReturn,
      count: d.count,
    }));
  }, [categoryData]);

  const groupCategories = useMemo(() => {
    if (!selectedGroup) return null;
    const cats = categoryGroups[selectedGroup];
    if (!cats) return null;
    return cats;
  }, [selectedGroup]);

  const fundsInGroup = useMemo(() => {
    if (!groupCategories) return [];
    return getAllFunds()
      .filter((f) => groupCategories.includes(f.category))
      .filter((f) => f.returns[period] !== null)
      .sort((a, b) => (b.returns[period] ?? 0) - (a.returns[period] ?? 0));
  }, [groupCategories, period]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">基金類別比較</h1>
        <p className="text-muted-foreground mt-1">比較不同基金類別的平均回報表現</p>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">選擇時段:</span>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
              <TabsList className="flex-wrap h-auto gap-1">
                {periods.map((p) => (
                  <TabsTrigger key={p} value={p} className="text-xs px-3 py-1.5">
                    {timePeriodLabels[p]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            各類別平均回報 ({timePeriodLabels[period]})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  width={55}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <div className="text-sm font-semibold">{data.fullName}</div>
                        <div className={`text-sm mt-1 ${data.value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          平均回報: {data.value >= 0 ? "+" : ""}{data.value.toFixed(2)}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{data.count} 隻基金</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.value >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">選擇基金類別查看詳情</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(categoryGroups).map((group) => (
            <Badge
              key={group}
              variant={selectedGroup === group ? "default" : "outline"}
              className="cursor-pointer text-sm px-3 py-1.5"
              onClick={() => setSelectedGroup(selectedGroup === group ? null : group)}
            >
              {group}
            </Badge>
          ))}
        </div>
      </div>

      {selectedGroup && fundsInGroup.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{selectedGroup} - 所有基金 ({timePeriodLabels[period]})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>基金名稱</TableHead>
                    <TableHead>受託人</TableHead>
                    <TableHead>子類別</TableHead>
                    <TableHead className="text-right">回報</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundsInGroup.map((fund, i) => {
                    const ret = fund.returns[period];
                    const pos = ret !== null && ret >= 0;
                    return (
                      <TableRow
                        key={fund.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/fund/${fund.id}`)}
                      >
                        <TableCell className="text-center font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{fund.name}</div>
                          <div className="text-xs text-muted-foreground">{fund.scheme}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{fund.trusteeEn}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{categoryLabels[fund.category]}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold tabular-nums ${ret === null ? "text-muted-foreground" : pos ? "text-emerald-600" : "text-red-500"}`}>
                            {ret === null ? "--" : `${pos ? "+" : ""}${ret.toFixed(2)}%`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">類別平均回報一覽</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>類別</TableHead>
                  <TableHead className="text-center">基金數目</TableHead>
                  <TableHead className="text-right">平均回報</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryData.map((d) => {
                  const pos = d.avgReturn >= 0;
                  return (
                    <TableRow key={d.category}>
                      <TableCell className="font-medium">{d.label}</TableCell>
                      <TableCell className="text-center">{d.count}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold tabular-nums ${pos ? "text-emerald-600" : "text-red-500"}`}>
                          {pos ? "+" : ""}{d.avgReturn.toFixed(2)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
