import { scrapeMpfData } from "./lib/mpf-scraper.js";

export const config = {
  schedule: "@daily",
};

export default async function () {
  console.log("[daily-sync] Starting scheduled MPF sync");
  const result = await scrapeMpfData();
  if (result.error) {
    console.error("[daily-sync] Sync failed:", result.error);
  } else {
    console.log(`[daily-sync] Sync complete. Funds scraped: ${result.count}`);
  }
}
