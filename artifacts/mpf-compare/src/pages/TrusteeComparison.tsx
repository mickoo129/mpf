import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  trustees,
  getFundsByTrustee,
  timePeriodLabels,
  categoryLabels,
  type TimePeriod,
} from "@/data/mpf-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, Building2 } from "lucide-react";

const periods: TimePeriod[] = ["1d", "1w", "1m", "mtd", "ytd", "3m", "6m", "1y", "3y", "5y", "10y"];

export default function TrusteeComparison() {
  const [period, setPeriod] = useState<TimePeriod>("ytd");
  const [trustee1, setTrustee1] = useState("manulife");
  const [trustee2, setTrustee2] = useState("hsbc");
  const [, navigate] = useLocation();

  const funds1 = useMemo(
    () =>
      getFundsByTrustee(trustee1)
        .filter((f) => f.returns[period] !== null)
        .sort((a, b) => (b.returns[period] ?? 0) - (a.returns[period] ?? 0)),
    [trustee1, period]
  );
  const funds2 = useMemo(
    () =>
      getFundsByTrustee(trustee2)
        .filter((f) => f.returns[period] !== null)
        .sort((a, b) => (b.returns[period] ?? 0) - (a.returns[period] ?? 0)),
    [trustee2, period]
  );

  const avg1 = useMemo(() => {
    if (funds1.length === 0) return 0;
    const sum = funds1.reduce((a, b) => a + (b.returns[period] ?? 0), 0);
    return Math.round((sum / funds1.length) * 100) / 100;
  }, [funds1, period]);

  const avg2 = useMemo(() => {
    if (funds2.length === 0) return 0;
    const sum = funds2.reduce((a, b) => a + (b.returns[period] ?? 0), 0);
    return Math.round((sum / funds2.length) * 100) / 100;
  }, [funds2, period]);

  const trustee1Info = trustees.find((t) => t.id === trustee1)!;
  const trustee2Info = trustees.find((t) => t.id === trustee2)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">受託人比較</h1>
        <p className="text-muted-foreground mt-1">選擇兩間受託人，對比指定時間內所有基金的表現</p>
      </div>

      <Card>
        <CardContent className="py-4 space-y-4">
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

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
              <Select value={trustee1} onValueChange={setTrustee1}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trustees.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.nameEn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-muted-foreground font-bold text-lg hidden sm:block">VS</span>
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <Building2 className="h-4 w-4 text-orange-600 shrink-0" />
              <Select value={trustee2} onValueChange={setTrustee2}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trustees.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.nameEn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-blue-200">
          <CardContent className="py-4 text-center">
            <div className="text-sm text-muted-foreground">{trustee1Info.name} 平均回報</div>
            <div className={`text-2xl font-bold tabular-nums mt-1 ${avg1 >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {avg1 >= 0 ? "+" : ""}{avg1.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">{funds1.length} 隻基金</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="py-4 text-center">
            <div className="text-sm text-muted-foreground">{trustee2Info.name} 平均回報</div>
            <div className={`text-2xl font-bold tabular-nums mt-1 ${avg2 >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {avg2 >= 0 ? "+" : ""}{avg2.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">{funds2.length} 隻基金</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              {trustee1Info.name} ({trustee1Info.nameEn})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>基金名稱</TableHead>
                    <TableHead>類別</TableHead>
                    <TableHead className="text-right">回報</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funds1.map((fund, i) => {
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-3 h-3 rounded-full bg-orange-600" />
              {trustee2Info.name} ({trustee2Info.nameEn})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>基金名稱</TableHead>
                    <TableHead>類別</TableHead>
                    <TableHead className="text-right">回報</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funds2.map((fund, i) => {
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
      </div>
    </div>
  );
}
