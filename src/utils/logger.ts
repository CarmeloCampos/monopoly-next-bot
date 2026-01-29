export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

let currentLogLevel: LogLevel = "info";

export const setLogLevel = (level: LogLevel): void => {
  currentLogLevel = level;
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
};

const formatMessage = (
  level: LogLevel,
  message: string,
  data?: unknown,
): string => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
};

export const info = (message: string, data?: unknown): void => {
  if (!shouldLog("info")) return;
  console.log(formatMessage("info", message, data));
};

export const warn = (message: string, data?: unknown): void => {
  if (!shouldLog("warn")) return;
  console.warn(formatMessage("warn", message, data));
};

export const error = (message: string, data?: unknown): void => {
  if (!shouldLog("error")) return;
  console.error(formatMessage("error", message, data));
};

export const debug = (message: string, data?: unknown): void => {
  if (!shouldLog("debug")) return;
  console.log(formatMessage("debug", message, data));
};
