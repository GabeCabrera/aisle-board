/**
 * Structured logging utility
 *
 * - Development: Pretty-printed console output
 * - Production: JSON-formatted logs for observability
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: { message: string; stack?: string };
}

const isDev = process.env.NODE_ENV === "development";

function formatLog(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: Error
): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error: error ? { message: error.message, stack: error.stack } : undefined,
  };

  // Pretty print in dev, JSON in production
  if (isDev) {
    const prefix = `[${level.toUpperCase()}]`;
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    const errorStr = error ? ` | Error: ${error.message}` : "";
    return `${prefix} ${message}${contextStr}${errorStr}`;
  }

  return JSON.stringify(entry);
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => {
    if (isDev) {
      console.log(formatLog("debug", msg, ctx));
    }
  },

  info: (msg: string, ctx?: Record<string, unknown>) => {
    console.log(formatLog("info", msg, ctx));
  },

  warn: (msg: string, ctx?: Record<string, unknown>) => {
    console.warn(formatLog("warn", msg, ctx));
  },

  error: (msg: string, error?: Error, ctx?: Record<string, unknown>) => {
    console.error(formatLog("error", msg, ctx, error));
  },
};

export default logger;
