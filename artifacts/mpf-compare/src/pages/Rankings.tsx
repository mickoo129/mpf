import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  getTopFunds,
  getBottomFunds,
  timePeriodLabels,
  categoryLabels,
  type TimePeriod,
  type Fund,
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
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

const periods: TimePeriod[] = ["1d", "1w", "1m", "mtd", "ytd", "3m", "6m", "1y", "3y", "5y", "10y"];

function ReturnBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">--</span>;
  const isPositive = value >= 0;
  return (
    <span className={`font-semibold tabular-nums ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
      {isPositive ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

function FundTable({ funds, period, title, icon }: { funds: Fund[]; period: TimePeriod; title: string; icon: React.ReactNode }) {
  const [, navigate] = useLocation();

  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>基金名稱</TableHead>
                <TableHead>受託人</TableHead>
                <TableHead>類別</TableHead>
                <TableHead className="text-right">回報</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funds.map((fund, i) => (
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
                    <ReturnBadge value={fund.returns[period]} />
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Rankings() {
  const [period, setPeriod] = useState<TimePeriod>("ytd");

  const topFunds = useMemo(() => getTopFunds(period, 10), [period]);
  const bottomFunds = useMemo(() => getBottomFunds(period, 10), [period]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MPF 基金排名</h1>
        <p className="text-muted-foreground mt-1">查看不同時間段內表現最佳及最差的強積金基金</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FundTable
          funds={topFunds}
          period={period}
          title="表現最佳 Top 10"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        />
        <FundTable
          funds={bottomFunds}
          period={period}
          title="表現最差 Bottom 10"
          icon={<TrendingDown className="h-5 w-5 text-red-500" />}
        />
      </div>
    </div>
  );
}
