# AGENTS.md

## Project Overview

Monopoly Next Bot is a Telegram bot built for managing Monopoly games. The project uses Bun as the JavaScript runtime and Telegraf for the Telegram Bot API.

## Tech Stack

- **Runtime**: Bun (NOT Node.js)
- **Telegram Bot**: Telegraf
- **Language**: TypeScript
- **Package Manager**: Bun

## Runtime Rules

### Always Use Bun (Never Node.js)

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` for testing
- Use `bun install` for dependency installation
- Use `bun run <script>` instead of `npm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads `.env` files - no need for dotenv

## Telegram Bot Rules

### Use Telegraf

- All Telegram bot functionality must use the `telegraf` package
- Configure with environment variable `BOT_TOKEN`
- Use polling mode for receiving updates (no webhooks)
- Bot instance is initialized in `src/index.ts`

### Custom Logger

Always use the custom logger from `src/utils/logger.ts`:

```typescript
import { setLogLevel, debug, info, warn, error } from "@/utils/logger";

// Set log level at initialization
setLogLevel("info");

// Log messages with optional data
info("Message here", { key: "value" });
error("Error message", { error: err.message });
```

Do not use `console.log` directly (except in the logger implementation itself).

## Path Aliases

Use `@/` prefix for all imports within the project:

```typescript
import config from "@/config";
import { info } from "@/utils/logger";
import type { BotContext } from "@/types";
import { registerCommands } from "@/handlers/commands";
```

## Project Structure

```
src/
├── config/          # Configuration management
│   └── index.ts     # Environment variable handling (BOT_TOKEN, LOG_LEVEL)
├── handlers/        # Command and event handlers
│   └── commands/    # Bot command handlers
├── types/           # TypeScript type definitions
│   └── index.ts     # BotContext, BotState types
├── utils/           # Utility functions
│   └── logger.ts    # Custom logging system
└── index.ts         # Main entry point
```

## Development Workflow

### Available Scripts

```bash
bun run dev                # Start with hot reload
bun run start              # Start production server
bun run build              # Build for production
```

### Code Quality & Best Practices

The project includes comprehensive code quality tools:

```bash
bun run format             # Format all files with Prettier
bun run format:check       # Check code formatting
bun run lint              # Lint code with oxlint
bun run lint:fix          # Auto-fix linting issues
bun run knip              # Detect unused code and dependencies
bun run check-duplication # Check for code duplication
bun run check             # Run all quality checks
bunx tsc --noEmit       # Run TypeScript strict type checking
```

All checks must pass before committing code. Pre-commit hooks automatically run tests and lint-staged.

### Environment Variables

Required variables (see `.env.example`):

- `BOT_TOKEN` - Telegram bot token (required)
- `LOG_LEVEL` - Logging level: 'debug' | 'info' | 'warn' | 'error' (default: 'info')

## Code Standards

- **TypeScript**: Use strict mode with strong typing (configured in tsconfig.json)
- **Type Safety**: Always use `BotContext` type for Telegraf handlers
- **No Type Assertions**: Avoid using `as`, `@ts-ignore`, `@ts-expect-error` - use type guards instead
- **No `any` Type**: Never use `any` type - use `unknown` for dynamic data with proper validation
- **No Implicit Any**: All functions must have explicit parameter and return types
- **No Unused Code**: All variables, parameters, and imports must be used (enforced by tsconfig)
- **Imports**: Use ES module syntax with path aliases
- **Error Handling**: Log errors using the custom logger, provide user-friendly responses
- **Logging**: Always log important events and errors with context data
- **Type Guards**: Use type guards (type predicates) instead of type assertions for runtime type checking

## Bot Context

The bot uses a custom `BotContext` type that extends Telegraf's `Context`:

```typescript
import type { BotContext } from "@/types";

bot.command("start", (ctx: BotContext) => {
  ctx.reply("Hello!");
});
```

## Configuration

All configuration is managed through `src/config/index.ts`. Access via:

```typescript
import config from "@/config";

console.log(config.botToken);
console.log(config.logLevel);
```

## Testing

- Use `bun test` to run tests
- Test files should follow the pattern `*.test.ts`
- Use the built-in Bun test framework
