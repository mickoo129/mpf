import app from "./app";
import { logger } from "./lib/logger";
import cron from "node-cron";
import { scrapeMpfData } from "./lib/mpf-scraper";
import { db } from "@workspace/db";
import { mpfFundsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided."
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mpfFundsTable);

  if (Number(count) === 0) {
    logger.info("No MPF data found — running initial sync");
    scrapeMpfData().then((r) => {
      if (r.error) {
        logger.error({ error: r.error }, "Initial MPF sync failed");
      } else {
        logger.info({ count: r.count }, "Initial MPF sync completed");
      }
    });
  } else {
    logger.info({ count: Number(count) }, "MPF data already loaded");
  }

  cron.schedule("0 8 * * 1-5", async () => {
    logger.info("Running scheduled MPF data sync");
    const result = await scrapeMpfData();
    if (result.error) {
      logger.error({ error: result.error }, "Scheduled MPF sync failed");
    } else {
      logger.info({ count: result.count }, "Scheduled MPF sync completed");
    }
  });
});
