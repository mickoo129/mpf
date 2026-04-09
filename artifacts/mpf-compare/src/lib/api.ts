const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

export interface MpfFundReturn {
  period: string;
  annualizedReturn: number | null;
  cumulativeReturn: number | null;
}

export interface MpfFundSummary {
  cfId: string;
  nameEn: string;
  nameZh: string | null;
  trustee: string;
  trusteeCode: string;
  scheme: string;
  fundType: string;
  fundCategory: string;
  launchDate: string | null;
  fundSizeHkm: number | null;
  riskClass: number | null;
  ferPct: number | null;
  returnAnn: number | null;
  returnCum: number | null;
  period: string;
}

export interface MpfFundDetail {
  cfId: string;
  nameEn: string;
  nameZh: string | null;
  trustee: string;
  trusteeCode: string;
  scheme: string;
  fundType: string;
  fundCategory: string;
  launchDate: string | null;
  fundSizeHkm: number | null;
  riskClass: number | null;
  ferPct: number | null;
  mgmtFee: string | null;
  returns: MpfFundReturn[];
}

export interface MpfRankingsResponse {
  period: string;
  asOf: string;
  top: MpfFundSummary[];
  bottom: MpfFundSummary[];
}

export interface MpfCategoryStat {
  category: string;
  avgReturn: number | null;
  fundCount: number;
  period: string;
}

export interface MpfTrusteeStat {
  trustee: string;
  trusteeCode: string;
  avgReturn: number | null;
  fundCount: number;
  period: string;
  funds: MpfFundSummary[];
}

export interface MpfSyncStatus {
  status: string;
  fundsScraped: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function get<T>(path: string, retries = 5): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`);
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        lastError = new Error(`API ${res.status}: ${path}`);
        if (attempt < retries) {
          await sleep(1000 * Math.pow(1.5, attempt));
          continue;
        }
        throw lastError;
      }
      if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof TypeError) {
        lastError = err;
        if (attempt < retries) {
          await sleep(1000 * Math.pow(1.5, attempt));
          continue;
        }
      }
      throw err;
    }
  }
  throw lastError ?? new Error(`API 無法連接: ${path}`);
}

export async function getAllFunds(opts?: {
  period?: string;
  search?: string;
  category?: string;
  trustee?: string;
}): Promise<MpfFundSummary[]> {
  const p = opts?.period ?? "1y";
  const params = new URLSearchParams({ period: p });
  if (opts?.search) params.set("search", opts.search);
  if (opts?.category) params.set("category", opts.category);
  if (opts?.trustee) params.set("trustee", opts.trustee);
  return get<MpfFundSummary[]>(`/mpf/funds?${params}`);
}

export interface MpfFundMultiPeriod {
  cfId: string;
  nameEn: string;
  nameZh: string | null;
  trustee: string;
  trusteeCode: string;
  scheme: string;
  fundType: string;
  fundCategory: string;
  launchDate: string | null;
  fundSizeHkm: number | null;
  riskClass: number | null;
  ferPct: number | null;
  returns: Record<string, { ann: number | null; cum: number | null }>;
}

export async function getAllFundsMultiPeriod(opts?: {
  search?: string;
  category?: string;
  trustee?: string;
}): Promise<MpfFundMultiPeriod[]> {
  const params = new URLSearchParams({ multiPeriod: "true" });
  if (opts?.search) params.set("search", opts.search);
  if (opts?.category) params.set("category", opts.category);
  if (opts?.trustee) params.set("trustee", opts.trustee);
  return get<MpfFundMultiPeriod[]>(`/mpf/funds?${params}`);
}

export const FUND_TYPE_ZH: Record<string, string> = {
  "Equity Fund - Asia Equity Fund": "亞洲股票基金",
  "Equity Fund - China Equity Fund": "中國股票基金",
  "Equity Fund - Europe Equity Fund": "歐洲股票基金",
  "Equity Fund - Global Equity Fund": "環球股票基金",
  "Equity Fund - Greater China Equity Fund": "大中華股票基金",
  "Equity Fund - Hong Kong Equity Fund": "香港股票基金",
  "Equity Fund - Hong Kong Equity Fund (Index Tracking)": "香港股票指數基金",
  "Equity Fund - Japan Equity Fund": "日本股票基金",
  "Equity Fund - Uncategorized Equity Fund": "其他股票基金",
  "Equity Fund - United States Equity Fund": "美國股票基金",
  "Equity Fund - Korea Equity Fund": "韓國股票基金",
  "Bond Fund - Asia Bond Fund": "亞洲債券基金",
  "Bond Fund - Global Bond Fund": "環球債券基金",
  "Bond Fund - Hong Kong Dollar Bond Fund": "港元債券基金",
  "Bond Fund - RMB Bond Fund": "人民幣債券基金",
  "Mixed Assets Fund - 21% to 40% Equity": "混合資產 (21-40% 股票)",
  "Mixed Assets Fund - 41% to 60% Equity": "混合資產 (41-60% 股票)",
  "Mixed Assets Fund - 61% to 80% Equity": "混合資產 (61-80% 股票)",
  "Mixed Assets Fund - 81% to 100% Equity": "混合資產 (81-100% 股票)",
  "Mixed Assets Fund - Default Investment Strategy - Age 65 Plus Fund": "預設策略 (65歲後)",
  "Mixed Assets Fund - Default Investment Strategy - Core Accumulation Fund": "預設策略 (核心累積)",
  "Mixed Assets Fund - Uncategorized Mixed Asset Fund": "其他混合資產基金",
  "Money Market Fund - MPF Conservative Fund": "強積金保守基金",
  "Money Market Fund - Other than MPF Conservative Fund": "其他貨幣市場基金",
  "Guaranteed Fund": "保證基金",
};

export async function getRankings(
  period: string,
  limit = 10
): Promise<MpfRankingsResponse> {
  return get<MpfRankingsResponse>(
    `/mpf/funds/rankings?period=${period}&limit=${limit}`
  );
}

export async function getFundDetail(cfId: string): Promise<MpfFundDetail> {
  return get<MpfFundDetail>(`/mpf/funds/${cfId}`);
}

export async function getCategories(period: string): Promise<MpfCategoryStat[]> {
  return get<MpfCategoryStat[]>(`/mpf/categories?period=${period}`);
}

export async function getTrustees(period: string): Promise<MpfTrusteeStat[]> {
  return get<MpfTrusteeStat[]>(`/mpf/trustees?period=${period}`);
}

export async function getSyncStatus(): Promise<MpfSyncStatus> {
  return get<MpfSyncStatus>("/mpf/sync/status");
}

export interface MpfSchemeEntry {
  scheme: string;
  trustee: string;
  trusteeCode: string;
}

export interface MpfMeta {
  dataAsOf: string;
  syncedAt: string | null;
  totalFunds: number;
  schemes: MpfSchemeEntry[];
}

export async function getMeta(): Promise<MpfMeta> {
  return get<MpfMeta>("/mpf/meta");
}

export async function triggerSync(): Promise<{ message: string; count: number }> {
  const res = await fetch(`${BASE}/mpf/sync`, { method: "POST" });
  if (!res.ok) throw new Error("Sync failed");
  return res.json();
}

export const PERIODS: { id: string; label: string; labelZh: string }[] = [
  { id: "1y", label: "1Y", labelZh: "1年" },
  { id: "5y", label: "5Y", labelZh: "5年" },
  { id: "10y", label: "10Y", labelZh: "10年" },
  { id: "since_launch", label: "Since Launch", labelZh: "成立至今" },
  { id: "2025", label: "2025", labelZh: "2025年" },
  { id: "2024", label: "2024", labelZh: "2024年" },
  { id: "2023", label: "2023", labelZh: "2023年" },
  { id: "2022", label: "2022", labelZh: "2022年" },
  { id: "2021", label: "2021", labelZh: "2021年" },
];

export function formatReturn(val: number | null | undefined): string {
  if (val == null) return "—";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

export function returnColor(val: number | null | undefined): string {
  if (val == null) return "text-gray-400";
  return val >= 0 ? "text-emerald-600" : "text-red-500";
}

export function categoryZh(cat: string): string {
  const map: Record<string, string> = {
    股票基金: "股票基金",
    債券基金: "債券基金",
    混合資產基金: "混合資產基金",
    保證基金: "保證基金",
    貨幣市場基金: "貨幣市場基金",
  };
  return map[cat] || cat;
}

export function fundTypeShort(fundType: string): string {
  if (fundType.includes("United States")) return "美股基金";
  if (fundType.includes("Greater China")) return "大中華";
  if (fundType.includes("Asia Pacific")) return "亞太股票";
  if (fundType.includes("Asia")) return "亞洲股票";
  if (fundType.includes("China")) return "中國股票";
  if (fundType.includes("Europe")) return "歐洲股票";
  if (fundType.includes("Global")) return "環球股票";
  if (fundType.includes("Hong Kong")) return "港股基金";
  if (fundType.includes("Japan")) return "日本股票";
  if (fundType.includes("Korea")) return "韓國股票";
  if (fundType.includes("Retirement")) return "目標日期";
  if (fundType.includes("Bond")) return "債券基金";
  if (fundType.includes("Mixed") || fundType.includes("Balanced"))
    return "混合資產";
  if (fundType.includes("Conservative") || fundType.includes("Money Market"))
    return "保守基金";
  if (fundType.includes("Guaranteed")) return "保證基金";
  if (fundType.includes("Uncategorized Equity")) return "股票基金";
  return fundType.split("-").pop()?.trim() || fundType;
}
