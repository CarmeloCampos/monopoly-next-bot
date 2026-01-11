type LogLevel = "debug" | "info" | "warn" | "error";

const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

let currentLogLevel: LogLevel = "info";

const setLogLevel = (level: LogLevel): void => {
  currentLogLevel = level;
};

const shouldLog = (level: LogLevel): boolean => {
  return logLevels[level] >= logLevels[currentLogLevel];
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

const debug = (message: string, data?: unknown): void => {
  if (shouldLog("debug")) {
    console.log(formatMessage("debug", message, data));
  }
};

const info = (message: string, data?: unknown): void => {
  if (shouldLog("info")) {
    console.log(formatMessage("info", message, data));
  }
};

const warn = (message: string, data?: unknown): void => {
  if (shouldLog("warn")) {
    console.warn(formatMessage("warn", message, data));
  }
};

const error = (message: string, data?: unknown): void => {
  if (shouldLog("error")) {
    console.error(formatMessage("error", message, data));
  }
};

export type { LogLevel };
export { setLogLevel, debug, info, warn, error };
