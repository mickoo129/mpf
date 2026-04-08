import * as cheerio from "cheerio";
import { db } from "@workspace/db";
import {
  mpfFundsTable,
  mpfReturnsTable,
  mpfSyncLogTable,
  type InsertMpfFund,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { logger } from "./logger";

const MOBILE_LIST_URL_EN = "https://mfp.mpfa.org.hk/mobile/eng/mpp_list.jsp";
const MOBILE_LIST_URL_ZH = "https://mfp.mpfa.org.hk/mobile/tch/mpp_list.jsp";

interface RawFundRow {
  cfId: string;
  scheme: string;
  nameEn: string;
  trusteeCode: string;
  fundType: string;
  launchDate: string;
  fundSizeHkm: string;
  riskClass: string;
  ferPct: string;
  return1yAnn: string;
  return5yAnn: string;
  return10yAnn: string;
  returnSinceLaunchAnn: string;
  return1yCum: string;
  return5yCum: string;
  return10yCum: string;
  returnSinceLaunchCum: string;
  return2025: string;
  return2024: string;
  return2023: string;
  return2022: string;
  return2021: string;
}

function parseTrustee(code: string): string {
  const map: Record<string, string> = {
    AIAT: "AIA",
    BCT: "BCT",
    BCOMT: "BCM",
    BEAT: "BEA",
    "BOCI-P": "BOC-Prudential",
    CLT: "China Life",
    HSBC: "HSBC",
    MPF: "Manulife",
    PT: "Principal",
    SCT: "Standard Chartered",
    SLT: "Sun Life",
    YF: "YF Life",
    FIDELITY: "Fidelity",
    HAITONG: "Haitong",
    HANGSENG: "Hang Seng",
  };
  return map[code] || code;
}

function parseFundCategory(fundType: string): string {
  const t = fundType.toLowerCase();
  if (t.includes("equity")) return "股票基金";
  if (t.includes("bond")) return "債券基金";
  if (t.includes("mixed") || t.includes("balanced")) return "混合資產基金";
  if (t.includes("guaranteed")) return "保證基金";
  if (t.includes("money market") || t.includes("conservative"))
    return "貨幣市場基金";
  return "其他";
}

function safeNum(s: string): string | null {
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "n.a." || cleaned === "-") return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : String(n);
}

function getTrusteeCode(trusteeText: string): string {
  const codeMap: Record<string, string> = {
    "AIA Company (Trustee) Limited": "AIAT",
    "Bank Consortium Trust Company Limited": "BCT",
    "Bank of Communications Trustee Limited": "BCOMT",
    "Bank of East Asia (Trustees) Limited": "BEAT",
    "BOCI-Prudential Trustee Limited": "BOCI-P",
    "China Life Trustees Limited": "CLT",
    "HSBC Provident Fund Trustee (Hong Kong) Limited": "HSBC",
    "Manulife Provident Funds Trust Company Limited": "MPF",
    "Principal Trust Company (Asia) Limited": "PT",
    "Standard Chartered Trustee (Hong Kong) Limited": "SCT",
    "Sun Life Trustee Company Limited": "SLT",
    "YF Life Trustees Limited": "YF",
  };
  return codeMap[trusteeText] || trusteeText.substring(0, 6).toUpperCase();
}

async function fetchHtml(url: string, lang: "en" | "zh"): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300_000); // 5 min
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": lang === "zh" ? "zh-TW,zh;q=0.9" : "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractCfIdNameMap(html: string): Map<string, string> {
  const map = new Map<string, string>();
  // Find each fund row by checkbox id (always on one line)
  const idRegex = /id="sortlist_checkbox(\d+)"/g;
  let match;
  while ((match = idRegex.exec(html)) !== null) {
    const cfId = match[1];
    if (map.has(cfId)) continue;
    // Within the next ~1500 chars, find the first left-aligned table cell = Chinese fund name
    const segment = html.substring(match.index, match.index + 1500);
    // Pattern: align="left"[whitespace/newlines]class="table">TEXT</td>
    const nameMatch = segment.match(
      /align="left"[\s\S]{0,60}class="table">([\s\S]{1,80}?)<\/td>/
    );
    if (nameMatch) {
      const name = nameMatch[1].replace(/[\r\n\s]+/g, " ").trim();
      if (name) map.set(cfId, name);
    }
  }
  return map;
}

export async function scrapeMpfData(): Promise<{
  count: number;
  error?: string;
}> {
  const [syncLog] = await db
    .insert(mpfSyncLogTable)
    .values({ status: "running" })
    .returning();

  try {
    logger.info("Starting MPF data scrape from MPFA mobile site");

    const [htmlEn, htmlZh] = await Promise.all([
      fetchHtml(MOBILE_LIST_URL_EN, "en"),
      fetchHtml(MOBILE_LIST_URL_ZH, "zh").catch(() => null),
    ]);

    const zhNameMap = htmlZh ? extractCfIdNameMap(htmlZh) : new Map<string, string>();
    logger.info({ count: zhNameMap.size }, "Scraped Chinese fund names");

    const html = htmlEn;
    const $ = cheerio.load(html);

    const funds: RawFundRow[] = [];

    $("table tbody tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 20) return;

      const getText = (i: number) => $(cells[i]).text().trim();
      const getLink = (i: number) => {
        const href = $(cells[i]).find("a[href*='cf_id']").attr("href") || "";
        const match = href.match(/cf_id=(\d+)/);
        return match ? match[1] : "";
      };

      const lastCell = cells.length - 1;
      const cfId = getLink(lastCell);
      if (!cfId) return;

      funds.push({
        cfId,
        scheme: getText(1),
        nameEn: getText(3),
        trusteeCode: getText(4),
        fundType: getText(5),
        launchDate: getText(6),
        fundSizeHkm: getText(7),
        riskClass: getText(8),
        ferPct: getText(9),
        return1yAnn: getText(10),
        return5yAnn: getText(11),
        return10yAnn: getText(12),
        returnSinceLaunchAnn: getText(13),
        return1yCum: getText(14),
        return5yCum: getText(15),
        return10yCum: getText(16),
        returnSinceLaunchCum: getText(17),
        return2025: getText(18),
        return2024: getText(19),
        return2023: getText(20),
        return2022: getText(21),
        return2021: getText(22),
      });
    });

    logger.info({ count: funds.length }, "Scraped fund rows from MPFA");

    if (funds.length === 0) {
      throw new Error("No fund rows found — page structure may have changed");
    }

    let upsertedCount = 0;

    for (const raw of funds) {
      const trusteeCode = raw.trusteeCode || getTrusteeCode(raw.scheme);
      const trustee = parseTrustee(trusteeCode);
      const fundCategory = parseFundCategory(raw.fundType);

      const fundData: InsertMpfFund = {
        cfId: raw.cfId,
        nameEn: raw.nameEn || "Unknown Fund",
        nameZh: zhNameMap.get(raw.cfId) || null,
        trustee,
        trusteeCode,
        scheme: raw.scheme,
        fundType: raw.fundType,
        fundCategory,
        launchDate: raw.launchDate || null,
        fundSizeHkm: safeNum(raw.fundSizeHkm),
        riskClass: raw.riskClass ? parseInt(raw.riskClass, 10) || null : null,
        ferPct: safeNum(raw.ferPct),
        mgmtFee: null,
        adminFee: null,
        memberFee: null,
        investMgmtFee: null,
        guaranteeCharge: null,
      };

      const [fund] = await db
        .insert(mpfFundsTable)
        .values(fundData)
        .onConflictDoUpdate({
          target: mpfFundsTable.cfId,
          set: {
            nameEn: fundData.nameEn,
            nameZh: fundData.nameZh,
            trustee: fundData.trustee,
            trusteeCode: fundData.trusteeCode,
            scheme: fundData.scheme,
            fundType: fundData.fundType,
            fundCategory: fundData.fundCategory,
            launchDate: fundData.launchDate,
            fundSizeHkm: fundData.fundSizeHkm,
            riskClass: fundData.riskClass,
            ferPct: fundData.ferPct,
            updatedAt: new Date(),
          },
        })
        .returning();

      await db
        .delete(mpfReturnsTable)
        .where(eq(mpfReturnsTable.fundId, fund.id));

      const periods = [
        {
          period: "1y",
          ann: safeNum(raw.return1yAnn),
          cum: safeNum(raw.return1yCum),
        },
        {
          period: "5y",
          ann: safeNum(raw.return5yAnn),
          cum: safeNum(raw.return5yCum),
        },
        {
          period: "10y",
          ann: safeNum(raw.return10yAnn),
          cum: safeNum(raw.return10yCum),
        },
        {
          period: "since_launch",
          ann: safeNum(raw.returnSinceLaunchAnn),
          cum: safeNum(raw.returnSinceLaunchCum),
        },
        {
          period: "2025",
          ann: safeNum(raw.return2025),
          cum: safeNum(raw.return2025),
        },
        {
          period: "2024",
          ann: safeNum(raw.return2024),
          cum: safeNum(raw.return2024),
        },
        {
          period: "2023",
          ann: safeNum(raw.return2023),
          cum: safeNum(raw.return2023),
        },
        {
          period: "2022",
          ann: safeNum(raw.return2022),
          cum: safeNum(raw.return2022),
        },
        {
          period: "2021",
          ann: safeNum(raw.return2021),
          cum: safeNum(raw.return2021),
        },
      ];

      const returnRows = periods
        .filter((p) => p.ann !== null || p.cum !== null)
        .map((p) => ({
          fundId: fund.id,
          period: p.period,
          annualizedReturn: p.ann,
          cumulativeReturn: p.cum,
        }));

      if (returnRows.length > 0) {
        await db.insert(mpfReturnsTable).values(returnRows);
      }

      upsertedCount++;
    }

    await db
      .update(mpfSyncLogTable)
      .set({
        status: "completed",
        fundsScraped: upsertedCount,
        completedAt: new Date(),
      })
      .where(eq(mpfSyncLogTable.id, syncLog.id));

    logger.info({ count: upsertedCount }, "MPF data sync completed");
    return { count: upsertedCount };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "MPF scrape failed");
    await db
      .update(mpfSyncLogTable)
      .set({ status: "failed", errorMessage: msg, completedAt: new Date() })
      .where(eq(mpfSyncLogTable.id, syncLog.id));
    return { count: 0, error: msg };
  }
}
