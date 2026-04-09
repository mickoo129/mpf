import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  mpfFundsTable,
  mpfReturnsTable,
  mpfSyncLogTable,
} from "@workspace/db";
import { eq, desc, asc, and, isNotNull, sql } from "drizzle-orm";
import { scrapeMpfData } from "../lib/mpf-scraper";

const router: IRouter = Router();

function parseNum(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

async function getFundsWithReturn(
  period: string,
  trustee?: string,
  category?: string
) {
  const returns = await db
    .select({
      fundId: mpfReturnsTable.fundId,
      annualizedReturn: mpfReturnsTable.annualizedReturn,
      cumulativeReturn: mpfReturnsTable.cumulativeReturn,
    })
    .from(mpfReturnsTable)
    .where(eq(mpfReturnsTable.period, period));

  const returnMap = new Map(
    returns.map((r) => [
      r.fundId,
      {
        ann: parseNum(r.annualizedReturn),
        cum: parseNum(r.cumulativeReturn),
      },
    ])
  );

  let query = db.select().from(mpfFundsTable);
  const funds = await query;

  return funds
    .filter((f) => {
      if (trustee && f.trustee !== trustee) return false;
      if (category && f.fundCategory !== category) return false;
      return true;
    })
    .map((f) => {
      const ret = returnMap.get(f.id) ?? { ann: null, cum: null };
      return {
        cfId: f.cfId,
        nameEn: f.nameEn,
        nameZh: f.nameZh ?? null,
        trustee: f.trustee,
        trusteeCode: f.trusteeCode,
        scheme: f.scheme,
        fundType: f.fundType,
        fundCategory: f.fundCategory,
        launchDate: f.launchDate ?? null,
        fundSizeHkm: parseNum(f.fundSizeHkm),
        riskClass: f.riskClass ?? null,
        ferPct: parseNum(f.ferPct),
        returnAnn: ret.ann,
        returnCum: ret.cum,
        period,
      };
    });
}

router.get("/mpf/funds", async (req, res): Promise<void> => {
  const period = (req.query.period as string) || "1y";
  const trustee = req.query.trustee as string | undefined;
  const category = req.query.category as string | undefined;
  const search = (req.query.search as string | undefined)?.toLowerCase().trim();

  let funds = await getFundsWithReturn(period, trustee, category);
  if (search) {
    funds = funds.filter(
      (f) =>
        (f.nameZh ?? "").toLowerCase().includes(search) ||
        f.nameEn.toLowerCase().includes(search) ||
        f.trustee.toLowerCase().includes(search)
    );
  }
  res.json(funds);
});

router.get("/mpf/funds/rankings", async (req, res): Promise<void> => {
  const period = (req.query.period as string) || "1y";
  const limitRaw = req.query.limit as string | undefined;
  const limit = limitRaw ? parseInt(limitRaw, 10) : 10;

  const funds = await getFundsWithReturn(period);
  const withReturn = funds.filter((f) => f.returnAnn !== null);

  withReturn.sort((a, b) => (b.returnAnn ?? 0) - (a.returnAnn ?? 0));

  const top = withReturn.slice(0, limit);
  const bottom = [...withReturn].reverse().slice(0, limit).reverse();

  res.json({
    period,
    asOf: new Date().toISOString(),
    top,
    bottom,
  });
});

router.get("/mpf/funds/:cfId", async (req, res): Promise<void> => {
  const raw = req.params.cfId;
  const cfId = Array.isArray(raw) ? raw[0] : raw;

  const [fund] = await db
    .select()
    .from(mpfFundsTable)
    .where(eq(mpfFundsTable.cfId, cfId));

  if (!fund) {
    res.status(404).json({ error: "Fund not found" });
    return;
  }

  const returns = await db
    .select()
    .from(mpfReturnsTable)
    .where(eq(mpfReturnsTable.fundId, fund.id));

  res.json({
    cfId: fund.cfId,
    nameEn: fund.nameEn,
    nameZh: fund.nameZh ?? null,
    trustee: fund.trustee,
    trusteeCode: fund.trusteeCode,
    scheme: fund.scheme,
    fundType: fund.fundType,
    fundCategory: fund.fundCategory,
    launchDate: fund.launchDate ?? null,
    fundSizeHkm: parseNum(fund.fundSizeHkm),
    riskClass: fund.riskClass ?? null,
    ferPct: parseNum(fund.ferPct),
    mgmtFee: fund.mgmtFee ?? null,
    returns: returns.map((r) => ({
      period: r.period,
      annualizedReturn: parseNum(r.annualizedReturn),
      cumulativeReturn: parseNum(r.cumulativeReturn),
    })),
  });
});

router.get("/mpf/categories", async (req, res): Promise<void> => {
  const period = (req.query.period as string) || "1y";
  const funds = await getFundsWithReturn(period);

  const catMap = new Map<string, { sum: number; count: number }>();
  for (const f of funds) {
    if (f.returnAnn === null) continue;
    const entry = catMap.get(f.fundCategory) ?? { sum: 0, count: 0 };
    entry.sum += f.returnAnn;
    entry.count++;
    catMap.set(f.fundCategory, entry);
  }

  const result = Array.from(catMap.entries()).map(([category, { sum, count }]) => ({
    category,
    avgReturn: count > 0 ? sum / count : null,
    fundCount: count,
    period,
  }));

  result.sort((a, b) => (b.avgReturn ?? -999) - (a.avgReturn ?? -999));
  res.json(result);
});

router.get("/mpf/trustees", async (req, res): Promise<void> => {
  const period = (req.query.period as string) || "1y";
  const funds = await getFundsWithReturn(period);

  const trusteeMap = new Map<
    string,
    { code: string; sum: number; count: number; funds: typeof funds }
  >();

  for (const f of funds) {
    const entry = trusteeMap.get(f.trustee) ?? {
      code: f.trusteeCode,
      sum: 0,
      count: 0,
      funds: [],
    };
    if (f.returnAnn !== null) {
      entry.sum += f.returnAnn;
      entry.count++;
    }
    entry.funds.push(f);
    trusteeMap.set(f.trustee, entry);
  }

  const result = Array.from(trusteeMap.entries()).map(
    ([trustee, { code, sum, count, funds: tFunds }]) => ({
      trustee,
      trusteeCode: code,
      avgReturn: count > 0 ? sum / count : null,
      fundCount: tFunds.length,
      period,
      funds: tFunds
        .filter((f) => f.returnAnn !== null)
        .sort((a, b) => (b.returnAnn ?? 0) - (a.returnAnn ?? 0))
        .slice(0, 20),
    })
  );

  result.sort((a, b) => (b.avgReturn ?? -999) - (a.avgReturn ?? -999));
  res.json(result);
});

router.get("/mpf/meta", async (req, res): Promise<void> => {
  const [last] = await db
    .select()
    .from(mpfSyncLogTable)
    .orderBy(desc(mpfSyncLogTable.startedAt))
    .limit(1);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mpfFundsTable);

  const schemes = await db
    .selectDistinct({ scheme: mpfFundsTable.scheme, trustee: mpfFundsTable.trustee, trusteeCode: mpfFundsTable.trusteeCode })
    .from(mpfFundsTable)
    .orderBy(asc(mpfFundsTable.trustee), asc(mpfFundsTable.scheme));

  res.json({
    dataAsOf: "2026年2月",
    syncedAt: last?.completedAt ?? null,
    totalFunds: Number(countRow?.count ?? 0),
    schemes,
  });
});

router.post("/mpf/sync", async (req, res): Promise<void> => {
  req.log.info("Manual MPF sync triggered");
  const result = await scrapeMpfData();
  res.json({
    message: result.error ? "Sync failed" : "Sync completed",
    count: result.count,
    error: result.error ?? null,
  });
});

router.get("/mpf/sync/status", async (req, res): Promise<void> => {
  const [last] = await db
    .select()
    .from(mpfSyncLogTable)
    .orderBy(desc(mpfSyncLogTable.startedAt))
    .limit(1);

  if (!last) {
    res.json({
      status: "never",
      fundsScraped: null,
      errorMessage: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    });
    return;
  }

  res.json({
    status: last.status,
    fundsScraped: last.fundsScraped ?? null,
    errorMessage: last.errorMessage ?? null,
    startedAt: last.startedAt.toISOString(),
    completedAt: last.completedAt?.toISOString() ?? null,
  });
});

export default router;
