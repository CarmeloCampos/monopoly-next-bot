---
name: telegraf
description: Complete Telegraf Telegram Bot API setup with polling, error handling, graceful shutdown, and custom logger integration for Bun-based projects
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: bot-development
  version: "4.16.0"
---

Up-to-date documentation: mcp zread_ai id: /telegraf/telegraf

## What I Do

I provide complete patterns and conventions for building Telegram bots using Telegraf with Bun, including:

- **Bot Initialization**: Setup Telegraf with custom context types and TypeScript configuration
- **Configuration Management**: Load BOT_TOKEN and other settings from environment variables
- **Polling Mode**: Configure bot to receive updates via long polling
- **Custom Logger Integration**: Use project-specific logger (debug, info, warn, error) throughout bot code
- **Command Registration**: Register bot commands in modular handler files
- **Error Handling**: Centralized error handling with bot.catch() and user-friendly responses
- **Graceful Shutdown**: Handle SIGINT/SIGTERM signals to stop bot cleanly
- **Middleware Usage**: Implement logging and request tracking middleware
- **Path Aliases**: Use `@/` prefix for clean imports (e.g., `@/utils/logger`)

## When to Use Me

Use this skill when you need to:

1. Create a new Telegram bot using Telegraf in a Bun-based project
2. Set up proper error handling and logging for a Telegraf bot
3. Implement graceful shutdown for production bots
4. Register new commands or handlers
5. Add middleware for request logging or state management
6. Configure context types with custom state/session data

## Implementation Details

### 1. Project Structure

```
src/
├── config/
│   └── index.ts          # Configuration with env variables
├── handlers/
│   └── commands/
│       └── index.ts      # Command registration
├── types/
│   └── index.ts          # BotContext and BotState types
├── utils/
│   └── logger.ts         # Custom logger
└── index.ts              # Bot entry point
```

### 2. Configuration Setup

Create `src/config/index.ts`:

```ts
interface Config {
  botToken: string;
  logLevel: "debug" | "info" | "warn" | "error";
}

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const config: Config = {
  botToken: getEnv("BOT_TOKEN"),
  logLevel:
    (process.env.LOG_LEVEL as "debug" | "info" | "warn" | "error") || "info",
};

export default config;
```

**Required Environment Variables:**

- `BOT_TOKEN`: Telegram bot token from @BotFather
- `LOG_LEVEL`: Optional, defaults to 'info'

### 3. Custom Logger

The project uses a custom logger from `src/utils/logger.ts`. Import the following functions:

```ts
import { setLogLevel, debug, info, warn, error } from "@/utils/logger";

// Set log level at startup
setLogLevel(config.logLevel);

// Use throughout bot code
info("Bot starting", { userId: ctx.from?.id });
error("Failed to process update", { error: err.message });
debug("Debugging details", { data: something });
warn("Warning message", { context: "details" });
```

Logger signature: `(message: string, data?: unknown): void`

### 4. Context Types

Create `src/types/index.ts` with custom context:

```ts
import { Context } from "telegraf";

interface BotState {
  // Add bot-specific state properties here
  // e.g., userId?: number;
  // e.g., gameState?: 'idle' | 'playing';
}

interface BotContext extends Context {
  session?: BotState;
}

export type { BotState, BotContext };
```

### 5. Bot Initialization

Main entry point in `src/index.ts`:

```ts
import { Telegraf } from "telegraf";
import config from "@/config";
import { setLogLevel, info, error } from "@/utils/logger";
import type { BotContext } from "@/types";
import { registerCommands } from "@/handlers/commands";

// Set up logger
setLogLevel(config.logLevel);
info("Initializing bot...", { logLevel: config.logLevel });

// Create bot instance with custom context
const bot = new Telegraf<BotContext>(config.botToken);
```

### 6. Middleware Patterns

Add middleware for logging/tracking:

```ts
// Logging middleware
bot.use(async (ctx, next) => {
  info("Update received", {
    updateId: ctx.update.update_id,
    updateType: Object.keys(ctx.update)[1],
  });
  await next();
});

// Custom session middleware (if needed)
bot.use(async (ctx, next) => {
  ctx.session = ctx.session || {};
  await next();
});
```

### 7. Command Registration

Create `src/handlers/commands/index.ts`:

```ts
import { Telegraf } from "telegraf";
import type { BotContext } from "@/types";
import { info } from "@/utils/logger";

export const registerCommands = (bot: Telegraf<BotContext>): void => {
  bot.command("start", (ctx) => {
    info("Start command received", { userId: ctx.from?.id });
    ctx.reply("👋 Welcome to the bot!");
  });

  bot.command("help", (ctx) => {
    info("Help command received", { userId: ctx.from?.id });
    ctx.reply(
      "📚 *Available Commands:*\n\n/start - Start the bot\n/help - Show help",
      {
        parse_mode: "Markdown",
      },
    );
  });
};
```

Register commands in main file:

```ts
registerCommands(bot);
```

### 8. Error Handling

Always implement error handling:

```ts
bot.catch((err, ctx) => {
  error("Error handling update", {
    error: err.message,
    stack: err.stack,
    updateId: ctx.update.update_id,
  });
  ctx.reply("❌ An error occurred. Please try again.");
});
```

### 9. Graceful Shutdown

Implement graceful shutdown for production:

```ts
const gracefulShutdown = async (signal: string): Promise<void> => {
  info(`Received ${signal}, shutting down gracefully...`);
  await bot.stop();
  info("Bot stopped");
  process.exit(0);
};

process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
```

### 10. Start Bot in Polling Mode

```ts
info("Starting bot in polling mode...");
bot
  .launch()
  .then(() => {
    info("Bot started successfully");
  })
  .catch((err) => {
    error("Failed to start bot", { error: err.message });
    process.exit(1);
  });
```

### 11. Path Alias Usage

Always use `@/` prefix for project imports:

```ts
import config from "@/config";
import { info } from "@/utils/logger";
import type { BotContext } from "@/types";
import { registerCommands } from "@/handlers/commands";
```

Ensure `tsconfig.json` has path aliases configured:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 12. Run Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "bun --hot src/index.ts",
    "start": "bun src/index.ts"
  },
  "dependencies": {
    "telegraf": "^4.16.0"
  }
}
```

## Best Practices

1. **Always use custom logger** - Don't use `console.log` directly, use `info`, `error`, `debug`, or `warn` from `@/utils/logger`
2. **Log user actions** - Track commands and important user interactions with `ctx.from?.id`
3. **Handle all errors** - Always use `bot.catch()` to prevent unhandled errors
4. **Graceful shutdown** - Always implement SIGINT/SIGTERM handlers
5. **Type safety** - Always use `BotContext` type for bot instance: `new Telegraf<BotContext>(token)`
6. **Modular handlers** - Keep commands organized in separate handler files
7. **Environment variables** - Never hardcode tokens; use `process.env` through config
8. **Middleware order** - Logging middleware should come before command registration
9. **User-friendly errors** - Provide helpful error messages to users when errors occur
10. **Use polling mode** - Default to polling (bot.launch()) unless webhook is required

## Common Patterns

### Logging Update Details

```ts
info("Update received", {
  updateId: ctx.update.update_id,
  updateType: Object.keys(ctx.update)[1],
  userId: ctx.from?.id,
  chatId: ctx.chat?.id,
});
```

### Accessing User Info

```ts
const userId = ctx.from?.id;
const username = ctx.from?.username;
const chatId = ctx.chat?.id;
```

### Sending Messages with Formatting

```ts
// Markdown
ctx.reply("*Bold text* and `code`", { parse_mode: "Markdown" });

// HTML
ctx.reply("<b>Bold text</b> and <code>code</code>", { parse_mode: "HTML" });
```

### Async Command Handlers

```ts
bot.command("async", async (ctx) => {
  try {
    await someAsyncOperation();
    ctx.reply("Done!");
  } catch (err) {
    error("Async command failed", { error: err.message });
    ctx.reply("❌ Operation failed");
  }
});
```

## Package Dependencies

- `telegraf`: ^4.16.0 (Telegram Bot framework)
- Built with Bun runtime (no additional runtime dependencies)

## See Also

- [Telegraf Documentation](https://telegraf.js.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Project CLAUDE.md](/Users/carmelocampos/Gits/monopoly-next-bot/CLAUDE.md)
