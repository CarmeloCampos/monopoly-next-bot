---
name: typescript-refactoring
description: Comprehensive patterns and best practices for TypeScript code refactoring, focusing on constant centralization, type safety without assertions, early returns, helper functions, and eliminating code duplication while maintaining strict typing standards
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: code-quality
  tech-stack: typescript
---

## What I Do

I provide comprehensive guidance for TypeScript code refactoring and optimization, helping you:

- **Centralize Constants**: Eliminate duplicate constants by consolidating them into a single source of truth with proper typing
- **Eliminate Magic Values**: Replace hardcoded strings and numbers with named constants and enums
- **Extract Helper Functions**: Identify repetitive patterns and create reusable utilities with proper typing
- **Improve Readability**: Apply template literals, early returns, and guard clauses to flatten code structure
- **Enhance Type Safety**: Refactor code to use type guards, branded types, and avoid type assertions
- **Optimize Imports**: Use type-only imports and barrel exports for better TypeScript performance
- **Maintain Code Quality**: Follow strict TypeScript standards with comprehensive validation checklists

## When to Use Me

Use this skill when you need to:

- **Refactor Legacy Code**: Clean up codebases with duplicated constants, magic strings, or nested conditionals
- **Code Review**: Evaluate TypeScript code against strict quality standards before committing
- **Reduce Duplication**: Eliminate logical duplication while recognizing acceptable structural patterns
- **Improve Type Safety**: Convert code using `as` assertions to proper type guards and validation functions
- **Establish Patterns**: Create consistent patterns across a TypeScript project for maintainability

Ask clarifying questions if:

- The codebase has unclear duplication boundaries (logical vs structural)
- Type safety improvements might break existing functionality
- You're unsure whether a pattern is acceptable duplication or needs refactoring

## Refactoring Patterns

### 1. Constant Centralization

**Problem**: Duplicate constants scattered across multiple files create maintenance burden and inconsistency.

**Before**:

```typescript
// keyboard.ts
const languageEmojis = { ru: "🇷🇺", en: "🇬🇧", es: "🇪🇸", pt: "🇧🇷" };

// middleware.ts
const languageEmojis = { ru: "🇷🇺", en: "🇬🇧", es: "🇪🇸", pt: "🇧🇷" };

// handlers/inline.ts
const URLS = {
  official: "https://t.me/monopolyfunbot_channel",
  community: "https://t.me/monopolyfunbot_chat",
};
```

**Solution**: Create a central constants file with barrel exports:

```typescript
// constants/index.ts
export * from "./language";
export * from "./channels";
export * from "./game";

// constants/language.ts
export const LANGUAGE_EMOJIS: Record<"ru" | "en" | "es" | "pt", string> = {
  ru: "🇷🇺",
  en: "🇬🇧",
  es: "🇪🇸",
  pt: "🇧🇷",
} as const;

export const DEFAULT_LANGUAGE = "en" as const;
export const SUPPORTED_LANGUAGES = ["ru", "en", "es", "pt"] as const;

// constants/channels.ts
export const CHANNEL_URLS = {
  official: "https://t.me/monopolyfunbot_channel",
  community: "https://t.me/monopolyfunbot_chat",
  news: "https://t.me/monopolyfunbot_news",
} as const;
```

### 2. Eliminate Magic Strings & Numbers

Replace hardcoded values with named constants for maintainability and discoverability.

**Before**:

```typescript
if (lang === "en") {
  /* ... */
}
const regex = /^\/start\s+(\S+)$/;
message = "Welcome! https://t.me/monopolyfunbot_channel";
```

**After**:

```typescript
import {
  DEFAULT_LANGUAGE,
  REFERRAL_CODE_REGEX,
  CHANNEL_URLS,
} from "@/constants";

if (lang === DEFAULT_LANGUAGE) {
  /* ... */
}
const regex = REFERRAL_CODE_REGEX;
message = `Welcome! ${CHANNEL_URLS.official}`;
```

### 3. Helper Functions for Repetitive Patterns

Extract repeated logic into well-typed helper functions.

**Before**:

```typescript
// Repeated in multiple callback handlers
if (!hasDbUser(ctx)) {
  await ctx.answerCbQuery(getText("en", "error_user_not_found"));
  return;
}

if (!hasDbUser(ctx)) {
  await ctx.answerCbQuery(getText("en", "error_user_not_found"));
  return;
}
```

**After**:

```typescript
// utils/callback-helpers.ts
import type { BotContext } from "@/types";
import { getText } from "@/i18n";

export async function answerUserNotFound(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery?.(getText("en", "error_user_not_found"));
}

export async function answerInvalidCallback(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery?.(getText("en", "error_invalid_callback"));
}

export async function answerSuccess(
  ctx: BotContext,
  message: string,
): Promise<void> {
  await ctx.answerCbQuery?.(message);
}

// Usage in handlers
if (!hasDbUser(ctx)) {
  await answerUserNotFound(ctx);
  return;
}
```

### 4. Template Strings Over Concatenation

Use template literals for better readability and maintainability.

**Before**:

```typescript
text: languageEmojis[lang] + " " + getLanguageName(lang),
callback_data: "lang_" + lang,
message = codeText + linkText,
url = "https://api.example.com/" + endpoint + "?id=" + id,
```

**After**:

```typescript
text: `${LANGUAGE_EMOJIS[lang]} ${getLanguageName(lang)}`,
callback_data: `lang_${lang}`,
message = `${codeText}${linkText}`,
url = `https://api.example.com/${endpoint}?id=${id}`,
```

### 5. Early Returns (Guard Clauses)

Flatten nested conditionals by using early returns for invalid conditions.

**Before**:

```typescript
if (ctx.message) {
  if ("text" in ctx.message) {
    if (hasDbUser(ctx)) {
      if (hasLanguage(ctx)) {
        // actual logic here (6 levels deep)
        return await handleCommand(ctx);
      }
    }
  }
}
```

**After**:

```typescript
// Guard clauses - flat structure
if (!ctx.message || !("text" in ctx.message)) return;
if (!hasDbUser(ctx)) return;
if (!hasLanguage(ctx)) return;

// actual logic here (no nesting)
return await handleCommand(ctx);
```

### 6. Type-Only Imports

Use `import type` for type-only imports to improve TypeScript performance and clarity.

**Before**:

```typescript
import { BotContext, TelegramId, Language } from "@/types";
import { logger } from "@/utils/logger";

export function processUser(data: User): TelegramId {
  // ...
}
```

**After**:

```typescript
import type { BotContext, TelegramId, Language } from "@/types";
import { logger } from "@/utils/logger";

export function processUser(data: User): TelegramId {
  // ...
}
```

## TypeScript Best Practices

### Type Safety Without Assertions

**Rule**: Avoid `as` type assertions. Use type guards and validation functions instead.

**Before** (WRONG):

```typescript
const userId = data.id as TelegramId;
const lang = ctx.session.language as Language;

if (someArray.length > 0) {
  // TypeScript doesn't know this is non-empty
  const first = someArray[0];
}
```

**After** (RIGHT):

```typescript
// Create a validation function with type guard
function isTelegramId(value: unknown): value is TelegramId {
  return typeof value === "number" && value > 0;
}

if (!isTelegramId(data.id)) {
  throw new Error("Invalid Telegram ID");
}
const userId = data.id; // TypeScript knows this is TelegramId

// Use type guard for arrays
function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

if (isNonEmptyArray(someArray)) {
  const first = someArray[0]; // TypeScript knows this exists
}
```

### Proper Type Guards

Create reusable type guards for common validations:

```typescript
// types/guards.ts
import type { Language, TelegramId } from "@/types";

export function isLanguage(value: unknown): value is Language {
  return value === "ru" || value === "en" || value === "es" || value === "pt";
}

export function isTelegramId(value: unknown): value is TelegramId {
  return typeof value === "number" && value > 0;
}

export function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
```

### Strict Type Checking

**Requirements**:

- All functions must have explicit parameter and return types
- No implicit `any` types
- Use proper union types with discriminated unions
- Leverage `as const` for literal types

**Example**:

```typescript
// BEFORE: Implicit types, weak typing
function getConfig(key) {
  return process.env[key];
}

// AFTER: Explicit types, strict typing
function getConfig<T extends string>(key: string): MaybeOptional<string> {
  return process.env[key] ?? undefined;
}

// Use branded types for domain values
type TelegramId = number & { readonly __brand: unique symbol };

function asTelegramId(value: unknown): TelegramId {
  if (typeof value !== "number" || value <= 0) {
    throw new Error("Invalid Telegram ID");
  }
  return value as TelegramId;
}
```

## File Organization Patterns

### Barrel Exports (index.ts)

Use barrel files to aggregate related exports for cleaner imports:

```typescript
// constants/index.ts - aggregates all constant modules
export * from "./language";
export * from "./channels";
export * from "./game";
export * from "./properties";

// types/index.ts - aggregates all type definitions
export * from "./db";
export * from "./index";
export * from "./utils";
export type { TelegramId, Language, MaybeOptional } from "./types";
```

**Usage becomes cleaner**:

```typescript
// BEFORE: Multiple imports from different files
import { LANGUAGE_EMOJIS } from "@/constants/language";
import { CHANNEL_URLS } from "@/constants/channels";
import { GAME_CONFIG } from "@/constants/game";

// AFTER: Single import
import { LANGUAGE_EMOJIS, CHANNEL_URLS, GAME_CONFIG } from "@/constants";
```

### Helper Modules

Create specialized helper files for specific concerns:

```
utils/
├── callback-helpers.ts  # Reusable callback patterns
├── logger.ts           # Logging utilities
├── referral.ts         # Referral code generation/validation
├── type-guards.ts      # Type guard functions
└── validation.ts       # Data validation helpers
```

## Code Quality Checklist

### Pre-Commit Checklist

Before committing code, ensure:

- [ ] **Run `bun check`** - Executes format, lint, knip, and duplication checks
- [ ] **Run `bunx tsc --noEmit`** - Strict TypeScript type checking
- [ ] **All tests pass** - No failing tests
- [ ] **No unused exports** - Verified by knip
- [ ] **No code duplication** - Except expected structural patterns
- [ ] **All imports are type-safe** - Use `import type` where appropriate
- [ ] **Constants are centralized** - No duplicate constant definitions
- [ ] **Magic strings/numbers eliminated** - All replaced with named constants
- [ ] **Template strings used** - No string concatenation
- [ ] **Early returns prioritized** - No deeply nested conditionals
- [ ] **No type assertions** - Use type guards instead of `as`
- [ ] **Explicit types everywhere** - All functions have parameter and return types

### Refactoring Flow

1. **Identify Duplication**: Search for repeated constants, strings, or patterns
2. **Extract Constants**: Move to appropriate `constants/` module
3. **Create Helpers**: Extract repetitive logic into utility functions
4. **Apply Type Guards**: Replace `as` assertions with proper type guards
5. **Flatten Logic**: Use early returns and guard clauses
6. **Update Imports**: Use type-only imports and barrel exports
7. **Run Quality Checks**: Execute `bun check` and `bunx tsc --noEmit`
8. **Test Thoroughly**: Ensure no functionality is broken

## Anti-Patterns to Avoid

### ❌ Don't Duplicate Constants

**Wrong**:

```typescript
// constants/language.ts
export const DEFAULT_LANG = "en";

// config/settings.ts
export const DEFAULT_LANGUAGE = "en";

// handlers/user.ts
const DEFAULT_LANG_CODE = "en";
```

**Right**:

```typescript
// constants/language.ts
export const DEFAULT_LANGUAGE = "en" as const;

// All imports use same constant
import { DEFAULT_LANGUAGE } from "@/constants";
```

### ❌ Don't Use String Concatenation

**Wrong**:

```typescript
callback_data: "lang_" + lang,
url = "https://api.example.com/" + endpoint,
message = prefix + " " + suffix,
```

**Right**:

```typescript
callback_data: `lang_${lang}`,
url = `https://api.example.com/${endpoint}`,
message = `${prefix} ${suffix}`,
```

### ❌ Don't Nest Conditionals

**Wrong**:

```typescript
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      doSomething();
    }
  }
}
```

**Right**:

```typescript
if (!user || !user.isActive || !user.hasPermission) return;
doSomething();
```

### ❌ Don't Use Type Assertions

**Wrong**:

```typescript
const userId = data.id as TelegramId;
const lang = ctx.session.language as Language;
```

**Right**:

```typescript
if (!isTelegramId(data.id)) {
  throw new Error("Invalid user ID");
}
const userId = data.id;

if (!isLanguage(ctx.session.language)) {
  throw new Error("Invalid language");
}
const lang = ctx.session.language;
```

### ❌ Don't Mix Logical and Structural Duplication

**Understanding the Difference**:

- **Logical duplication**: Same business logic repeated (bad) → Refactor
- **Structural duplication**: Similar structure but different logic (acceptable)

**Examples of Acceptable Structural Duplication**:

```typescript
// Database schema indexes - similar structure but different fields
// OK to have this duplication
export const usersIndex = pgIndex("users_email_idx").on(users.email);
export const gamesIndex = pgIndex("games_code_idx").on(games.code);

// Callback handlers - same validation pattern but different logic
// OK to have this structure
bot.action("start_game", async (ctx) => {
  if (!hasDbUser(ctx)) {
    await answerUserNotFound(ctx);
    return;
  }
  // ... game start logic
});

bot.action("end_game", async (ctx) => {
  if (!hasDbUser(ctx)) {
    await answerUserNotFound(ctx);
    return;
  }
  // ... game end logic
});
```

## Integration with Existing Tools

### Running Quality Checks

This skill assumes the following tooling is available:

```bash
bun check              # Run all quality checks
bun run format         # Format with Prettier
bun run lint           # Lint with oxlint
bun run knip           # Detect unused code
bun run check-duplication  # Check for code duplication
bunx tsc --noEmit      # TypeScript strict type checking
```

### Pre-commit Integration

The skill supports pre-commit hooks that automatically:

1. Run tests
2. Execute lint-staged
3. Check code quality
4. Prevent commits that violate these standards

## Advanced Patterns

### Discriminated Unions

Use discriminated unions for type-safe state handling:

```typescript
type GameState =
  | { status: "waiting"; players: [] }
  | { status: "active"; players: Player[]; currentTurn: number }
  | { status: "finished"; players: Player[]; winner: PlayerId };

function handleGame(game: GameState): void {
  if (game.status === "active") {
    // TypeScript knows game.players is Player[] and game.currentTurn exists
    console.log(game.players[game.currentTurn]);
  }
}
```

### Branded Types

Use branded types to prevent type confusion:

```typescript
type TelegramId = number & { readonly __brand: unique symbol };
type GameId = number & { readonly __brand: unique symbol };

function asTelegramId(value: number): TelegramId {
  if (value <= 0) throw new Error("Invalid Telegram ID");
  return value as TelegramId;
}

// Prevents accidental mixing
const userId: TelegramId = 123;
const gameId: GameId = 456;

// TypeScript error: Cannot assign GameId to TelegramId
userId = gameId; // Type error!
```

### Utility Types for Better Type Safety

```typescript
// Non-nullable type
type NonNull<T> = T extends null | undefined ? never : T;

// Maybe optional helper
type MaybeOptional<T> = T | null | undefined;

// Require at least one property
type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

// Usage
function processUser(user: NonNull<User>): void {
  // TypeScript knows user is not null/undefined
}
```

## Examples in Context

### Complete Refactoring Example

**Before**:

```typescript
// handlers/commands.ts
import { BotContext } from "@/types";

const languageEmojis = {
  ru: "🇷🇺",
  en: "🇬🇧",
  es: "🇪🇸",
  pt: "🇧🇷",
};

bot.command("start", async (ctx: BotContext) => {
  if (ctx.message) {
    if ("text" in ctx.message) {
      const userId = ctx.from.id as number;
      const lang = "en";
      const text = languageEmojis[lang] + " " + lang;
      await ctx.reply(text);
    }
  }
});
```

**After**:

```typescript
// handlers/commands.ts
import type { BotContext } from "@/types";
import { LANGUAGE_EMOJIS, DEFAULT_LANGUAGE } from "@/constants";
import { isTelegramId } from "@/types/guards";
import { logger } from "@/utils/logger";

bot.command("start", async (ctx: BotContext) => {
  if (!ctx.message || !("text" in ctx.message)) return;

  const userId = ctx.from?.id;
  if (!isTelegramId(userId)) {
    logger.warn("Invalid user ID in start command");
    return;
  }

  const lang = DEFAULT_LANGUAGE;
  const text = `${LANGUAGE_EMOJIS[lang]} ${lang}`;

  await ctx.reply(text);
});
```

## Summary

This skill provides a comprehensive approach to TypeScript refactoring that:

1. **Eliminates logical duplication** through constant centralization and helper functions
2. **Improves type safety** by avoiding assertions and using proper type guards
3. **Enhances readability** with early returns, template strings, and clear structure
4. **Maintains code quality** through strict checklists and automated validation
5. **Recognizes patterns** by distinguishing acceptable structural duplication from harmful logical duplication

Apply these patterns consistently to maintain a clean, type-safe, and maintainable TypeScript codebase.
