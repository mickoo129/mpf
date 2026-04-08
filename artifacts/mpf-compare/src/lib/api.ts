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

async function get<T>(path: string, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`);
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
          continue;
        }
      }
      if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
      return res.json() as Promise<T>;
    } catch (err) {
      if (attempt < retries && err instanceof TypeError) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`API 無法連接: ${path}`);
}

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
