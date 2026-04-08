export interface Fund {
  id: string;
  name: string;
  nameEn: string;
  trustee: string;
  trusteeEn: string;
  scheme: string;
  category: FundCategory;
  riskLevel: number;
  price: number;
  priceDate: string;
  returns: Record<TimePeriod, number | null>;
  priceHistory: { date: string; price: number }[];
}

export type FundCategory =
  | "equity_hk"
  | "equity_global"
  | "equity_asia"
  | "equity_china"
  | "equity_us"
  | "equity_europe"
  | "bond"
  | "mixed"
  | "money_market"
  | "guaranteed"
  | "conservative"
  | "target_date"
  | "index";

export type TimePeriod =
  | "1d"
  | "1w"
  | "1m"
  | "mtd"
  | "ytd"
  | "3m"
  | "6m"
  | "1y"
  | "3y"
  | "5y"
  | "10y";

export const timePeriodLabels: Record<TimePeriod, string> = {
  "1d": "每日",
  "1w": "每週",
  "1m": "每月",
  mtd: "月至今",
  ytd: "年至今",
  "3m": "3個月",
  "6m": "6個月",
  "1y": "1年",
  "3y": "3年",
  "5y": "5年",
  "10y": "10年",
};

export const categoryLabels: Record<FundCategory, string> = {
  equity_hk: "香港股票基金",
  equity_global: "環球股票基金",
  equity_asia: "亞洲股票基金",
  equity_china: "中國股票基金",
  equity_us: "美國股票基金",
  equity_europe: "歐洲股票基金",
  bond: "債券基金",
  mixed: "混合資產基金",
  money_market: "貨幣市場基金",
  guaranteed: "保證基金",
  conservative: "保守基金",
  target_date: "目標日期基金",
  index: "指數基金",
};

export const categoryGroups: Record<string, FundCategory[]> = {
  "股票基金": ["equity_hk", "equity_global", "equity_asia", "equity_china", "equity_us", "equity_europe"],
  "債券基金": ["bond"],
  "混合資產基金": ["mixed"],
  "貨幣市場/保守基金": ["money_market", "conservative"],
  "保證基金": ["guaranteed"],
  "目標日期基金": ["target_date"],
  "指數基金": ["index"],
};

export const trustees = [
  { id: "manulife", name: "宏利", nameEn: "Manulife" },
  { id: "hsbc", name: "匯豐", nameEn: "HSBC" },
  { id: "aia", name: "友邦", nameEn: "AIA" },
  { id: "sunlife", name: "永明", nameEn: "Sun Life" },
  { id: "boci", name: "中銀保誠", nameEn: "BOC-Prudential" },
  { id: "fidelity", name: "富達", nameEn: "Fidelity" },
  { id: "bea", name: "東亞", nameEn: "BEA" },
  { id: "bcm", name: "交通銀行", nameEn: "BCM" },
  { id: "principal", name: "信安", nameEn: "Principal" },
  { id: "massmutual", name: "萬全", nameEn: "Mass Mutual" },
  { id: "chinlife", name: "中國人壽", nameEn: "China Life" },
];

function generatePriceHistory(basePrice: number, volatility: number, trend: number): { date: string; price: number }[] {
  const history: { date: string; price: number }[] = [];
  const now = new Date(2026, 3, 8);
  let price = basePrice * (1 - trend * 10 / 100);

  for (let i = 3650; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dailyReturn = (trend / 252) + (Math.random() - 0.48) * volatility / 100;
    price = price * (1 + dailyReturn);
    if (price < 0.5) price = 0.5;

    history.push({
      date: date.toISOString().split("T")[0],
      price: Math.round(price * 10000) / 10000,
    });
  }

  return history;
}

function computeReturns(history: { date: string; price: number }[]): Record<TimePeriod, number | null> {
  if (history.length < 2) {
    return { "1d": null, "1w": null, "1m": null, mtd: null, ytd: null, "3m": null, "6m": null, "1y": null, "3y": null, "5y": null, "10y": null };
  }

  const latest = history[history.length - 1];
  const latestDate = new Date(latest.date);

  function findPrice(daysAgo: number): number | null {
    const target = new Date(latestDate);
    target.setDate(target.getDate() - daysAgo);
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].date <= target.toISOString().split("T")[0]) {
        return history[i].price;
      }
    }
    return null;
  }

  function findPriceByDate(dateStr: string): number | null {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].date <= dateStr) {
        return history[i].price;
      }
    }
    return null;
  }

  function calcReturn(oldPrice: number | null): number | null {
    if (!oldPrice) return null;
    return Math.round(((latest.price - oldPrice) / oldPrice) * 10000) / 100;
  }

  const startOfMonth = `${latestDate.getFullYear()}-${String(latestDate.getMonth() + 1).padStart(2, "0")}-01`;
  const startOfYear = `${latestDate.getFullYear()}-01-01`;

  return {
    "1d": calcReturn(findPrice(1)),
    "1w": calcReturn(findPrice(7)),
    "1m": calcReturn(findPrice(30)),
    mtd: calcReturn(findPriceByDate(startOfMonth)),
    ytd: calcReturn(findPriceByDate(startOfYear)),
    "3m": calcReturn(findPrice(90)),
    "6m": calcReturn(findPrice(180)),
    "1y": calcReturn(findPrice(365)),
    "3y": calcReturn(findPrice(1095)),
    "5y": calcReturn(findPrice(1825)),
    "10y": calcReturn(findPrice(3650)),
  };
}

interface FundDef {
  id: string;
  name: string;
  nameEn: string;
  trustee: string;
  trusteeEn: string;
  scheme: string;
  category: FundCategory;
  riskLevel: number;
  basePrice: number;
  volatility: number;
  trend: number;
}

const fundDefs: FundDef[] = [
  { id: "manu-hk-eq", name: "宏利MPF香港股票基金", nameEn: "Manulife MPF HK Equity Fund", trustee: "manulife", trusteeEn: "Manulife", scheme: "宏利環球精選(強積金)計劃", category: "equity_hk", riskLevel: 5, basePrice: 18.5, volatility: 1.2, trend: 0.04 },
  { id: "manu-global-eq", name: "宏利MPF環球股票基金", nameEn: "Manulife MPF Global Equity Fund", trustee: "manulife", trusteeEn: "Manulife", scheme: "宏利環球精選(強積金)計劃", category: "equity_global", riskLevel: 5, basePrice: 22.3, volatility: 1.0, trend: 0.07 },
  { id: "manu-china-eq", name: "宏利MPF中華威力基金", nameEn: "Manulife MPF China Value Fund", trustee: "manulife", trusteeEn: "Manulife", scheme: "宏利環球精選(強積金)計劃", category: "equity_china", riskLevel: 5, basePrice: 12.8, volatility: 1.5, trend: 0.02 },
  { id: "manu-bond", name: "宏利MPF穩健基金", nameEn: "Manulife MPF Stable Fund", trustee: "manulife", trusteeEn: "Manulife", scheme: "宏利環球精選(強積金)計劃", category: "bond", riskLevel: 2, basePrice: 14.2, volatility: 0.3, trend: 0.03 },
  { id: "manu-mixed", name: "宏利MPF增長基金", nameEn: "Manulife MPF Growth Fund", trustee: "manulife", trusteeEn: "Manulife", scheme: "宏利環球精選(強積金)計劃", category: "mixed", riskLevel: 4, basePrice: 19.1, volatility: 0.8, trend: 0.05 },
  { id: "manu-conservative", name: "宏利MPF保守基金", nameEn: "Manulife MPF Conservative Fund", trustee: "manulife", trusteeEn: "Manulife", scheme: "宏利環球精選(強積金)計劃", category: "conservative", riskLevel: 1, basePrice: 11.5, volatility: 0.05, trend: 0.005 },
  { id: "manu-us-eq", name: "宏利MPF北美股票基金", nameEn: "Manulife MPF North America Equity Fund", trustee: "manulife", trusteeEn: "Manulife", scheme: "宏利環球精選(強積金)計劃", category: "equity_us", riskLevel: 5, basePrice: 25.6, volatility: 1.1, trend: 0.08 },
  { id: "manu-index", name: "宏利MPF恒指基金", nameEn: "Manulife MPF HSI Tracking Fund", trustee: "manulife", trusteeEn: "Manulife", scheme: "宏利環球精選(強積金)計劃", category: "index", riskLevel: 5, basePrice: 15.3, volatility: 1.3, trend: 0.03 },

  { id: "hsbc-hk-eq", name: "匯豐強積金香港股票基金", nameEn: "HSBC MPF HK Equity Fund", trustee: "hsbc", trusteeEn: "HSBC", scheme: "匯豐強積金智選計劃", category: "equity_hk", riskLevel: 5, basePrice: 19.8, volatility: 1.3, trend: 0.05 },
  { id: "hsbc-global-eq", name: "匯豐強積金環球股票基金", nameEn: "HSBC MPF Global Equity Fund", trustee: "hsbc", trusteeEn: "HSBC", scheme: "匯豐強積金智選計劃", category: "equity_global", riskLevel: 5, basePrice: 24.1, volatility: 0.9, trend: 0.08 },
  { id: "hsbc-china-eq", name: "匯豐強積金中國股票基金", nameEn: "HSBC MPF China Equity Fund", trustee: "hsbc", trusteeEn: "HSBC", scheme: "匯豐強積金智選計劃", category: "equity_china", riskLevel: 5, basePrice: 11.5, volatility: 1.6, trend: 0.01 },
  { id: "hsbc-bond", name: "匯豐強積金環球債券基金", nameEn: "HSBC MPF Global Bond Fund", trustee: "hsbc", trusteeEn: "HSBC", scheme: "匯豐強積金智選計劃", category: "bond", riskLevel: 2, basePrice: 13.8, volatility: 0.35, trend: 0.025 },
  { id: "hsbc-mixed", name: "匯豐強積金均衡基金", nameEn: "HSBC MPF Balanced Fund", trustee: "hsbc", trusteeEn: "HSBC", scheme: "匯豐強積金智選計劃", category: "mixed", riskLevel: 3, basePrice: 17.6, volatility: 0.7, trend: 0.045 },
  { id: "hsbc-conservative", name: "匯豐強積金保守基金", nameEn: "HSBC MPF Conservative Fund", trustee: "hsbc", trusteeEn: "HSBC", scheme: "匯豐強積金智選計劃", category: "conservative", riskLevel: 1, basePrice: 11.8, volatility: 0.04, trend: 0.004 },
  { id: "hsbc-asia-eq", name: "匯豐強積金亞太股票基金", nameEn: "HSBC MPF Asia Pacific Equity Fund", trustee: "hsbc", trusteeEn: "HSBC", scheme: "匯豐強積金智選計劃", category: "equity_asia", riskLevel: 5, basePrice: 16.2, volatility: 1.1, trend: 0.04 },
  { id: "hsbc-europe-eq", name: "匯豐強積金歐洲股票基金", nameEn: "HSBC MPF European Equity Fund", trustee: "hsbc", trusteeEn: "HSBC", scheme: "匯豐強積金智選計劃", category: "equity_europe", riskLevel: 5, basePrice: 15.9, volatility: 1.0, trend: 0.05 },
  { id: "hsbc-index", name: "匯豐強積金恒指基金", nameEn: "HSBC MPF HSI Tracking Fund", trustee: "hsbc", trusteeEn: "HSBC", scheme: "匯豐強積金智選計劃", category: "index", riskLevel: 5, basePrice: 14.9, volatility: 1.3, trend: 0.035 },

  { id: "aia-hk-eq", name: "友邦強積金優選計劃香港股票基金", nameEn: "AIA MPF HK Equity Fund", trustee: "aia", trusteeEn: "AIA", scheme: "友邦強積金優選計劃", category: "equity_hk", riskLevel: 5, basePrice: 20.1, volatility: 1.25, trend: 0.055 },
  { id: "aia-global-eq", name: "友邦強積金環球股票基金", nameEn: "AIA MPF Global Equity Fund", trustee: "aia", trusteeEn: "AIA", scheme: "友邦強積金優選計劃", category: "equity_global", riskLevel: 5, basePrice: 23.8, volatility: 1.0, trend: 0.075 },
  { id: "aia-bond", name: "友邦強積金環球債券基金", nameEn: "AIA MPF Global Bond Fund", trustee: "aia", trusteeEn: "AIA", scheme: "友邦強積金優選計劃", category: "bond", riskLevel: 2, basePrice: 13.5, volatility: 0.3, trend: 0.028 },
  { id: "aia-mixed", name: "友邦強積金均衡組合", nameEn: "AIA MPF Balanced Portfolio", trustee: "aia", trusteeEn: "AIA", scheme: "友邦強積金優選計劃", category: "mixed", riskLevel: 3, basePrice: 18.2, volatility: 0.75, trend: 0.05 },
  { id: "aia-conservative", name: "友邦強積金保守基金", nameEn: "AIA MPF Conservative Fund", trustee: "aia", trusteeEn: "AIA", scheme: "友邦強積金優選計劃", category: "conservative", riskLevel: 1, basePrice: 11.6, volatility: 0.04, trend: 0.004 },
  { id: "aia-china-eq", name: "友邦強積金中國股票基金", nameEn: "AIA MPF China Equity Fund", trustee: "aia", trusteeEn: "AIA", scheme: "友邦強積金優選計劃", category: "equity_china", riskLevel: 5, basePrice: 13.1, volatility: 1.4, trend: 0.025 },
  { id: "aia-us-eq", name: "友邦強積金北美股票基金", nameEn: "AIA MPF North America Equity Fund", trustee: "aia", trusteeEn: "AIA", scheme: "友邦強積金優選計劃", category: "equity_us", riskLevel: 5, basePrice: 26.2, volatility: 1.05, trend: 0.085 },

  { id: "sunlife-hk-eq", name: "永明強積金香港股票基金", nameEn: "Sun Life MPF HK Equity Fund", trustee: "sunlife", trusteeEn: "Sun Life", scheme: "永明彩虹強積金計劃", category: "equity_hk", riskLevel: 5, basePrice: 17.9, volatility: 1.2, trend: 0.038 },
  { id: "sunlife-global-eq", name: "永明強積金環球股票基金", nameEn: "Sun Life MPF Global Equity Fund", trustee: "sunlife", trusteeEn: "Sun Life", scheme: "永明彩虹強積金計劃", category: "equity_global", riskLevel: 5, basePrice: 21.5, volatility: 0.95, trend: 0.065 },
  { id: "sunlife-bond", name: "永明強積金環球債券基金", nameEn: "Sun Life MPF Global Bond Fund", trustee: "sunlife", trusteeEn: "Sun Life", scheme: "永明彩虹強積金計劃", category: "bond", riskLevel: 2, basePrice: 13.1, volatility: 0.32, trend: 0.022 },
  { id: "sunlife-mixed", name: "永明強積金均衡基金", nameEn: "Sun Life MPF Balanced Fund", trustee: "sunlife", trusteeEn: "Sun Life", scheme: "永明彩虹強積金計劃", category: "mixed", riskLevel: 3, basePrice: 16.8, volatility: 0.72, trend: 0.042 },
  { id: "sunlife-conservative", name: "永明強積金保守基金", nameEn: "Sun Life MPF Conservative Fund", trustee: "sunlife", trusteeEn: "Sun Life", scheme: "永明彩虹強積金計劃", category: "conservative", riskLevel: 1, basePrice: 11.3, volatility: 0.04, trend: 0.003 },
  { id: "sunlife-asia-eq", name: "永明強積金亞洲股票基金", nameEn: "Sun Life MPF Asian Equity Fund", trustee: "sunlife", trusteeEn: "Sun Life", scheme: "永明彩虹強積金計劃", category: "equity_asia", riskLevel: 5, basePrice: 15.8, volatility: 1.15, trend: 0.042 },

  { id: "boci-hk-eq", name: "中銀保誠香港股票基金", nameEn: "BOC-Prudential HK Equity Fund", trustee: "boci", trusteeEn: "BOC-Prudential", scheme: "中銀保誠簡易強積金計劃", category: "equity_hk", riskLevel: 5, basePrice: 21.2, volatility: 1.3, trend: 0.06 },
  { id: "boci-global-eq", name: "中銀保誠環球股票基金", nameEn: "BOC-Prudential Global Equity Fund", trustee: "boci", trusteeEn: "BOC-Prudential", scheme: "中銀保誠簡易強積金計劃", category: "equity_global", riskLevel: 5, basePrice: 23.5, volatility: 0.95, trend: 0.072 },
  { id: "boci-china-eq", name: "中銀保誠中國股票基金", nameEn: "BOC-Prudential China Equity Fund", trustee: "boci", trusteeEn: "BOC-Prudential", scheme: "中銀保誠簡易強積金計劃", category: "equity_china", riskLevel: 5, basePrice: 14.2, volatility: 1.5, trend: 0.03 },
  { id: "boci-bond", name: "中銀保誠債券基金", nameEn: "BOC-Prudential Bond Fund", trustee: "boci", trusteeEn: "BOC-Prudential", scheme: "中銀保誠簡易強積金計劃", category: "bond", riskLevel: 2, basePrice: 14.5, volatility: 0.28, trend: 0.03 },
  { id: "boci-mixed", name: "中銀保誠均衡基金", nameEn: "BOC-Prudential Balanced Fund", trustee: "boci", trusteeEn: "BOC-Prudential", scheme: "中銀保誠簡易強積金計劃", category: "mixed", riskLevel: 3, basePrice: 18.8, volatility: 0.75, trend: 0.048 },
  { id: "boci-conservative", name: "中銀保誠保守基金", nameEn: "BOC-Prudential Conservative Fund", trustee: "boci", trusteeEn: "BOC-Prudential", scheme: "中銀保誠簡易強積金計劃", category: "conservative", riskLevel: 1, basePrice: 11.9, volatility: 0.04, trend: 0.005 },
  { id: "boci-index", name: "中銀保誠我的強積金恒指基金", nameEn: "BOC-Prudential My MPF HSI Fund", trustee: "boci", trusteeEn: "BOC-Prudential", scheme: "中銀保誠簡易強積金計劃", category: "index", riskLevel: 5, basePrice: 16.1, volatility: 1.3, trend: 0.04 },

  { id: "fidelity-global-eq", name: "富達環球股票基金", nameEn: "Fidelity Global Equity Fund", trustee: "fidelity", trusteeEn: "Fidelity", scheme: "富達退休集成信託", category: "equity_global", riskLevel: 5, basePrice: 25.8, volatility: 0.9, trend: 0.09 },
  { id: "fidelity-hk-eq", name: "富達香港股票基金", nameEn: "Fidelity HK Equity Fund", trustee: "fidelity", trusteeEn: "Fidelity", scheme: "富達退休集成信託", category: "equity_hk", riskLevel: 5, basePrice: 18.3, volatility: 1.25, trend: 0.045 },
  { id: "fidelity-bond", name: "富達環球債券基金", nameEn: "Fidelity Global Bond Fund", trustee: "fidelity", trusteeEn: "Fidelity", scheme: "富達退休集成信託", category: "bond", riskLevel: 2, basePrice: 12.9, volatility: 0.3, trend: 0.02 },
  { id: "fidelity-mixed", name: "富達均衡基金", nameEn: "Fidelity Balanced Fund", trustee: "fidelity", trusteeEn: "Fidelity", scheme: "富達退休集成信託", category: "mixed", riskLevel: 3, basePrice: 17.5, volatility: 0.7, trend: 0.05 },
  { id: "fidelity-conservative", name: "富達保守基金", nameEn: "Fidelity Conservative Fund", trustee: "fidelity", trusteeEn: "Fidelity", scheme: "富達退休集成信託", category: "conservative", riskLevel: 1, basePrice: 11.4, volatility: 0.04, trend: 0.004 },

  { id: "bea-hk-eq", name: "東亞香港股票基金", nameEn: "BEA HK Equity Fund", trustee: "bea", trusteeEn: "BEA", scheme: "東亞(強積金)集成信託計劃", category: "equity_hk", riskLevel: 5, basePrice: 16.8, volatility: 1.3, trend: 0.035 },
  { id: "bea-global-eq", name: "東亞環球股票基金", nameEn: "BEA Global Equity Fund", trustee: "bea", trusteeEn: "BEA", scheme: "東亞(強積金)集成信託計劃", category: "equity_global", riskLevel: 5, basePrice: 20.5, volatility: 1.0, trend: 0.06 },
  { id: "bea-bond", name: "東亞環球債券基金", nameEn: "BEA Global Bond Fund", trustee: "bea", trusteeEn: "BEA", scheme: "東亞(強積金)集成信託計劃", category: "bond", riskLevel: 2, basePrice: 13.2, volatility: 0.32, trend: 0.022 },
  { id: "bea-mixed", name: "東亞均衡基金", nameEn: "BEA Balanced Fund", trustee: "bea", trusteeEn: "BEA", scheme: "東亞(強積金)集成信託計劃", category: "mixed", riskLevel: 3, basePrice: 15.9, volatility: 0.72, trend: 0.04 },
  { id: "bea-conservative", name: "東亞保守基金", nameEn: "BEA Conservative Fund", trustee: "bea", trusteeEn: "BEA", scheme: "東亞(強積金)集成信託計劃", category: "conservative", riskLevel: 1, basePrice: 11.2, volatility: 0.04, trend: 0.003 },

  { id: "bcm-hk-eq", name: "交通銀行香港動力股票基金", nameEn: "BCM HK Dynamic Equity Fund", trustee: "bcm", trusteeEn: "BCM", scheme: "交通銀行愉盈退休強積金計劃", category: "equity_hk", riskLevel: 5, basePrice: 17.5, volatility: 1.35, trend: 0.04 },
  { id: "bcm-global-eq", name: "交通銀行環球股票基金", nameEn: "BCM Global Equity Fund", trustee: "bcm", trusteeEn: "BCM", scheme: "交通銀行愉盈退休強積金計劃", category: "equity_global", riskLevel: 5, basePrice: 19.8, volatility: 1.0, trend: 0.055 },
  { id: "bcm-bond", name: "交通銀行環球債券基金", nameEn: "BCM Global Bond Fund", trustee: "bcm", trusteeEn: "BCM", scheme: "交通銀行愉盈退休強積金計劃", category: "bond", riskLevel: 2, basePrice: 12.8, volatility: 0.3, trend: 0.02 },
  { id: "bcm-mixed", name: "交通銀行均衡基金", nameEn: "BCM Balanced Fund", trustee: "bcm", trusteeEn: "BCM", scheme: "交通銀行愉盈退休強積金計劃", category: "mixed", riskLevel: 3, basePrice: 16.2, volatility: 0.7, trend: 0.04 },
  { id: "bcm-conservative", name: "交通銀行保守基金", nameEn: "BCM Conservative Fund", trustee: "bcm", trusteeEn: "BCM", scheme: "交通銀行愉盈退休強積金計劃", category: "conservative", riskLevel: 1, basePrice: 11.1, volatility: 0.04, trend: 0.003 },

  { id: "principal-hk-eq", name: "信安香港股票基金", nameEn: "Principal HK Equity Fund", trustee: "principal", trusteeEn: "Principal", scheme: "信安強積金計劃800系列", category: "equity_hk", riskLevel: 5, basePrice: 18.9, volatility: 1.2, trend: 0.048 },
  { id: "principal-global-eq", name: "信安環球股票基金", nameEn: "Principal Global Equity Fund", trustee: "principal", trusteeEn: "Principal", scheme: "信安強積金計劃800系列", category: "equity_global", riskLevel: 5, basePrice: 22.1, volatility: 0.95, trend: 0.07 },
  { id: "principal-bond", name: "信安環球債券基金", nameEn: "Principal Global Bond Fund", trustee: "principal", trusteeEn: "Principal", scheme: "信安強積金計劃800系列", category: "bond", riskLevel: 2, basePrice: 13.6, volatility: 0.3, trend: 0.024 },
  { id: "principal-mixed", name: "信安均衡基金", nameEn: "Principal Balanced Fund", trustee: "principal", trusteeEn: "Principal", scheme: "信安強積金計劃800系列", category: "mixed", riskLevel: 3, basePrice: 17.8, volatility: 0.72, trend: 0.046 },
  { id: "principal-conservative", name: "信安保守基金", nameEn: "Principal Conservative Fund", trustee: "principal", trusteeEn: "Principal", scheme: "信安強積金計劃800系列", category: "conservative", riskLevel: 1, basePrice: 11.5, volatility: 0.04, trend: 0.004 },

  { id: "mm-hk-eq", name: "萬全香港股票基金", nameEn: "Mass Mutual HK Equity Fund", trustee: "massmutual", trusteeEn: "Mass Mutual", scheme: "萬全強制性公積金計劃", category: "equity_hk", riskLevel: 5, basePrice: 16.5, volatility: 1.3, trend: 0.032 },
  { id: "mm-global-eq", name: "萬全環球股票基金", nameEn: "Mass Mutual Global Equity Fund", trustee: "massmutual", trusteeEn: "Mass Mutual", scheme: "萬全強制性公積金計劃", category: "equity_global", riskLevel: 5, basePrice: 19.2, volatility: 1.0, trend: 0.058 },
  { id: "mm-bond", name: "萬全環球債券基金", nameEn: "Mass Mutual Global Bond Fund", trustee: "massmutual", trusteeEn: "Mass Mutual", scheme: "萬全強制性公積金計劃", category: "bond", riskLevel: 2, basePrice: 12.5, volatility: 0.3, trend: 0.02 },
  { id: "mm-mixed", name: "萬全均衡基金", nameEn: "Mass Mutual Balanced Fund", trustee: "massmutual", trusteeEn: "Mass Mutual", scheme: "萬全強制性公積金計劃", category: "mixed", riskLevel: 3, basePrice: 15.5, volatility: 0.72, trend: 0.038 },
  { id: "mm-conservative", name: "萬全保守基金", nameEn: "Mass Mutual Conservative Fund", trustee: "massmutual", trusteeEn: "Mass Mutual", scheme: "萬全強制性公積金計劃", category: "conservative", riskLevel: 1, basePrice: 11.0, volatility: 0.04, trend: 0.003 },

  { id: "cl-hk-eq", name: "中國人壽香港股票基金", nameEn: "China Life HK Equity Fund", trustee: "chinlife", trusteeEn: "China Life", scheme: "中國人壽強積金集成信託計劃", category: "equity_hk", riskLevel: 5, basePrice: 17.2, volatility: 1.35, trend: 0.038 },
  { id: "cl-global-eq", name: "中國人壽環球股票基金", nameEn: "China Life Global Equity Fund", trustee: "chinlife", trusteeEn: "China Life", scheme: "中國人壽強積金集成信託計劃", category: "equity_global", riskLevel: 5, basePrice: 20.8, volatility: 1.0, trend: 0.062 },
  { id: "cl-bond", name: "中國人壽債券基金", nameEn: "China Life Bond Fund", trustee: "chinlife", trusteeEn: "China Life", scheme: "中國人壽強積金集成信託計劃", category: "bond", riskLevel: 2, basePrice: 13.0, volatility: 0.3, trend: 0.022 },
  { id: "cl-mixed", name: "中國人壽均衡基金", nameEn: "China Life Balanced Fund", trustee: "chinlife", trusteeEn: "China Life", scheme: "中國人壽強積金集成信託計劃", category: "mixed", riskLevel: 3, basePrice: 16.5, volatility: 0.72, trend: 0.042 },
  { id: "cl-conservative", name: "中國人壽保守基金", nameEn: "China Life Conservative Fund", trustee: "chinlife", trusteeEn: "China Life", scheme: "中國人壽強積金集成信託計劃", category: "conservative", riskLevel: 1, basePrice: 11.3, volatility: 0.04, trend: 0.004 },
  { id: "cl-china-eq", name: "中國人壽中國股票基金", nameEn: "China Life China Equity Fund", trustee: "chinlife", trusteeEn: "China Life", scheme: "中國人壽強積金集成信託計劃", category: "equity_china", riskLevel: 5, basePrice: 13.5, volatility: 1.5, trend: 0.028 },
];

let _funds: Fund[] | null = null;

export function getAllFunds(): Fund[] {
  if (_funds) return _funds;

  _funds = fundDefs.map((def) => {
    const priceHistory = generatePriceHistory(def.basePrice, def.volatility, def.trend);
    const returns = computeReturns(priceHistory);
    return {
      id: def.id,
      name: def.name,
      nameEn: def.nameEn,
      trustee: def.trustee,
      trusteeEn: def.trusteeEn,
      scheme: def.scheme,
      category: def.category,
      riskLevel: def.riskLevel,
      price: priceHistory[priceHistory.length - 1]?.price ?? def.basePrice,
      priceDate: priceHistory[priceHistory.length - 1]?.date ?? "2026-04-08",
      returns,
      priceHistory,
    };
  });

  return _funds;
}

export function getFundById(id: string): Fund | undefined {
  return getAllFunds().find((f) => f.id === id);
}

export function getFundsByTrustee(trusteeId: string): Fund[] {
  return getAllFunds().filter((f) => f.trustee === trusteeId);
}

export function getFundsByCategory(categories: FundCategory[]): Fund[] {
  return getAllFunds().filter((f) => categories.includes(f.category));
}

export function getTopFunds(period: TimePeriod, count: number = 10): Fund[] {
  return getAllFunds()
    .filter((f) => f.returns[period] !== null)
    .sort((a, b) => (b.returns[period] ?? 0) - (a.returns[period] ?? 0))
    .slice(0, count);
}

export function getBottomFunds(period: TimePeriod, count: number = 10): Fund[] {
  return getAllFunds()
    .filter((f) => f.returns[period] !== null)
    .sort((a, b) => (a.returns[period] ?? 0) - (b.returns[period] ?? 0))
    .slice(0, count);
}

export function getCategoryAverageReturns(period: TimePeriod): { category: FundCategory; label: string; avgReturn: number; count: number }[] {
  const groups = new Map<FundCategory, number[]>();

  getAllFunds().forEach((f) => {
    const ret = f.returns[period];
    if (ret === null) return;
    if (!groups.has(f.category)) groups.set(f.category, []);
    groups.get(f.category)!.push(ret);
  });

  return Array.from(groups.entries())
    .map(([cat, returns]) => ({
      category: cat,
      label: categoryLabels[cat],
      avgReturn: Math.round((returns.reduce((a, b) => a + b, 0) / returns.length) * 100) / 100,
      count: returns.length,
    }))
    .sort((a, b) => b.avgReturn - a.avgReturn);
}
