type LogLevel = "debug" | "info" | "warn" | "error";

interface Config {
  botToken: string;
  logLevel: LogLevel;
}

const isLogLevel = (value: string | undefined): value is LogLevel => {
  return (
    value === "debug" ||
    value === "info" ||
    value === "warn" ||
    value === "error"
  );
};

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getLogLevel = (key: string): LogLevel => {
  const value = process.env[key];
  if (value && isLogLevel(value)) {
    return value;
  }
  return "info";
};

const config: Config = {
  botToken: getEnv("BOT_TOKEN"),
  logLevel: getLogLevel("LOG_LEVEL"),
};

export default config;
