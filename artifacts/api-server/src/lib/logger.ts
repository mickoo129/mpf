import pino from "pino";

const usePretty =
  process.env.NODE_ENV !== "production" &&
  process.env.NETLIFY !== "true" &&
  (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY === true;

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(usePretty
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {}),
});
