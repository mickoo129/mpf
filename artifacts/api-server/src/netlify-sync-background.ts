import { scrapeMpfData } from "./lib/mpf-scraper.js";

export const handler = async () => {
  console.log("[sync-background] Starting MPF sync");
  const result = await scrapeMpfData();
  if (result.error) {
    console.error("[sync-background] Sync failed:", result.error);
  } else {
    console.log(`[sync-background] Sync complete. Funds scraped: ${result.count}`);
  }
};
