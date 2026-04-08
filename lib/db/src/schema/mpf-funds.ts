import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  timestamp,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mpfFundsTable = pgTable(
  "mpf_funds",
  {
    id: serial("id").primaryKey(),
    cfId: text("cf_id").notNull(),
    nameEn: text("name_en").notNull(),
    nameZh: text("name_zh"),
    trustee: text("trustee").notNull(),
    trusteeCode: text("trustee_code").notNull(),
    scheme: text("scheme").notNull(),
    fundType: text("fund_type").notNull(),
    fundCategory: text("fund_category").notNull(),
    launchDate: text("launch_date"),
    fundSizeHkm: numeric("fund_size_hkm"),
    riskClass: integer("risk_class"),
    ferPct: numeric("fer_pct"),
    mgmtFee: text("mgmt_fee"),
    adminFee: text("admin_fee"),
    memberFee: text("member_fee"),
    investMgmtFee: text("invest_mgmt_fee"),
    guaranteeCharge: text("guarantee_charge"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("mpf_funds_cf_id_idx").on(t.cfId)]
);

export const insertMpfFundSchema = createInsertSchema(mpfFundsTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertMpfFund = z.infer<typeof insertMpfFundSchema>;
export type MpfFund = typeof mpfFundsTable.$inferSelect;

export const mpfReturnsTable = pgTable("mpf_returns", {
  id: serial("id").primaryKey(),
  fundId: integer("fund_id")
    .notNull()
    .references(() => mpfFundsTable.id, { onDelete: "cascade" }),
  period: text("period").notNull(),
  annualizedReturn: numeric("annualized_return"),
  cumulativeReturn: numeric("cumulative_return"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertMpfReturnSchema = createInsertSchema(mpfReturnsTable).omit({
  id: true,
  fetchedAt: true,
});
export type InsertMpfReturn = z.infer<typeof insertMpfReturnSchema>;
export type MpfReturn = typeof mpfReturnsTable.$inferSelect;

export const mpfSyncLogTable = pgTable("mpf_sync_log", {
  id: serial("id").primaryKey(),
  status: text("status").notNull(),
  fundsScraped: integer("funds_scraped"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type MpfSyncLog = typeof mpfSyncLogTable.$inferSelect;
