---
name: telegram-bot-i18n
description: Type-safe multi-language support for Telegram bots with Telegraf, middleware patterns, and message builders
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: telegram-bot
  tech-stack: telegraf, typescript, drizzle-orm
---

## What I Do

Implement type-safe i18n for Telegram bots with:

- **Type-safe translation system** using TypeScript type guards (no `as` assertions)
- **Middleware-based language gating** to block users until language is set
- **Message builder pattern** to eliminate code duplication (~4% → ~2%)
- **Inline keyboard selection** with emoji flags
- **Graceful fallbacks** to primary language (Russian)
- **Database persistence** via Drizzle ORM

## When to Use Me

Adding multi-language support to Telegraf bots with TypeScript.

**Prerequisites:**

- Telegraf for Telegram API
- TypeScript strict mode
- Custom logger (no console.log)
- Drizzle ORM for database

## Implementation

### 1. Define Language Type

```typescript
// src/types/utils.ts
export type Language = "ru" | "en" | "es" | "pt";
export type MaybeOptional<T> = T | null | undefined;
```

### 2. Translation Storage

```typescript
// src/i18n/locales.ts
import type { Language, MaybeOptional } from "@/types/utils";
import { warn } from "@/utils/logger";

export const SUPPORTED_LANGUAGES: readonly Language[] = [
  "ru",
  "en",
  "es",
  "pt",
] as const;

export const LANGUAGE_CALLBACK_PATTERN = /^lang_(ru|en|es|pt)$/;

const locales = {
  ru: { welcome: "👋 Добро пожаловать!" /* ... */ },
  en: { welcome: "👋 Welcome!" /* ... */ },
  es: { welcome: "👋 ¡Bienvenido!" /* ... */ },
  pt: { welcome: "👋 Bem-vindo!" /* ... */ },
};

export function isLanguage(value: MaybeOptional<string>): value is Language {
  return value === "ru" || value === "en" || value === "es" || value === "pt";
}

export function getText(
  language: MaybeOptional<Language>,
  key: string,
): string {
  const lang = isLanguage(language) ? language : "ru";
  const translation = locales[lang][key];

  if (!translation) {
    warn("Translation not found", { key, language: lang });
    return key;
  }

  return translation;
}

export function hasLanguage(language: MaybeOptional<Language>): boolean {
  return language !== null && language !== undefined && isLanguage(language);
}

export function getLanguageName(lang: Language): string {
  const names: Record<Language, string> = {
    ru: "Русский",
    en: "English",
    es: "Español",
    pt: "Português",
  };
  return names[lang];
}
```

### 3. Message Builders

```typescript
// src/i18n/messages.ts
import { getText } from "./locales";
import type { Language, MaybeOptional } from "@/types/utils";

export function buildWelcomeMessage(
  language: MaybeOptional<Language>,
  referralCode: string,
): string {
  return (
    getText(language, "welcome") +
    "\n\n" +
    getText(language, "referral_code") +
    " `" +
    referralCode +
    "`\n\n" +
    getText(language, "help_title") +
    "\n" +
    getText(language, "cmd_start") +
    "\n" +
    getText(language, "cmd_help") +
    "\n\n" +
    getText(language, "more_commands")
  );
}
```

### 4. Language Middleware

```typescript
// src/middleware/language.ts
import type { Middleware } from "telegraf";
import type { BotContext } from "@/types";
import {
  getText,
  getSupportedLanguages,
  getLanguageName,
  hasLanguage,
  LANGUAGE_CALLBACK_PATTERN,
} from "@/i18n";
import type { InlineKeyboardMarkup } from "telegraf/types";

const languageEmojis: Record<string, string> = {
  ru: "🇷🇺",
  en: "🇬🇧",
  es: "🇪🇸",
  pt: "🇧🇷",
};

const isLanguageSelection = (ctx: BotContext): boolean => {
  if (
    ctx.callbackQuery &&
    "data" in ctx.callbackQuery &&
    ctx.callbackQuery.data
  ) {
    return LANGUAGE_CALLBACK_PATTERN.test(ctx.callbackQuery.data);
  }
  return false;
};

export const languageMiddleware: Middleware<BotContext> = async (ctx, next) => {
  if (!ctx.dbUser) return next();

  if (hasLanguage(ctx.dbUser.language)) return next();

  if (isLanguageSelection(ctx)) {
    return next();
  }

  const inlineKeyboard: InlineKeyboardMarkup = {
    inline_keyboard: getSupportedLanguages().map((lang) => [
      {
        text: languageEmojis[lang] + " " + getLanguageName(lang),
        callback_data: "lang_" + lang,
      },
    ]),
  };

  await ctx.reply(getText(null, "language_selection"), {
    reply_markup: inlineKeyboard,
  });
};
```

### 5. Callback Handler

```typescript
// src/handlers/callbacks/index.ts
import { Telegraf } from "telegraf";
import type { BotContext } from "@/types";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getText,
  buildWelcomeMessage,
  isLanguage,
  LANGUAGE_CALLBACK_PATTERN,
} from "@/i18n";
import { info, error as logError } from "@/utils/logger";

export const registerCallbacks = (bot: Telegraf<BotContext>): void => {
  bot.action(/^lang_(.+)$/, async (ctx: BotContext) => {
    const { callbackQuery, dbUser } = ctx;

    if (!callbackQuery || !("data" in callbackQuery) || !callbackQuery.data) {
      await ctx.answerCbQuery("Invalid callback");
      return;
    }

    const langMatch = callbackQuery.data.match(LANGUAGE_CALLBACK_PATTERN);
    if (!langMatch) {
      await ctx.answerCbQuery("Invalid language");
      return;
    }

    const [, langValue] = langMatch;
    if (!isLanguage(langValue)) {
      await ctx.answerCbQuery("Invalid language");
      return;
    }

    if (!dbUser) {
      await ctx.answerCbQuery("User not found");
      return;
    }

    try {
      await db
        .update(users)
        .set({
          language: langValue,
          updated_at: new Date(),
        })
        .where(eq(users.telegram_id, dbUser.telegram_id));

      dbUser.language = langValue;

      info("Language updated", {
        userId: dbUser.telegram_id,
        language: langValue,
      });

      await ctx.answerCbQuery();
      await ctx.reply(getText(langValue, "language_selected"));

      const message = buildWelcomeMessage(langValue, dbUser.referral_code);
      await ctx.reply(message, { parse_mode: "Markdown" });
      await ctx.deleteMessage();
    } catch (err) {
      logError("Error updating language", {
        userId: dbUser.telegram_id,
        error: err instanceof Error ? err.message : String(err),
      });
      await ctx.answerCbQuery("Error updating language");
    }
  });
};
```

### 6. Database Schema

```typescript
// src/db/schema.ts
import type { Language } from "@/types/utils";

export const users = sqliteTable("users", {
  telegram_id: integer("telegram_id").primaryKey().$type<TelegramId>(),
  username: text("username"),
  first_name: text("first_name"),
  last_name: text("last_name"),
  balance: integer("balance").notNull().default(0).$type<MonopolyCoins>(),
  referral_code: text("referral_code").notNull().unique(),
  language: text("language").$type<Language>(), // Nullable
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

### 7. Updated Commands

```typescript
// src/handlers/commands/index.ts
import { buildWelcomeMessage, buildHelpMessage } from "@/i18n";

export const registerCommands = (bot: Telegraf<BotContext>): void => {
  bot.command("start", async (ctx: BotContext): Promise<void> => {
    info("Start command received", { userId: ctx.from?.id });

    const { dbUser } = ctx;

    if (!dbUser) {
      await ctx.reply("❌ Error: User not found. Please try again.");
      return;
    }

    const message = buildWelcomeMessage(dbUser.language, dbUser.referral_code);
    await ctx.reply(message, { parse_mode: "Markdown" });
  });

  bot.command("help", async (ctx: BotContext): Promise<void> => {
    info("Help command received", { userId: ctx.from?.id });

    const { dbUser } = ctx;

    if (!dbUser) {
      await ctx.reply("❌ Error: User not found. Please try again.");
      return;
    }

    const message = buildHelpMessage(dbUser.language);
    await ctx.reply(message, { parse_mode: "Markdown" });
  });
};
```

## Best Practices

### Type Guards (No Assertions)

```typescript
// ❌ WRONG
const lang = input as Language;

// ✅ CORRECT
if (isLanguage(input)) {
  // TypeScript knows input is Language here
}
```

### Early Returns

```typescript
// ❌ WRONG - Deep nesting
if (ctx.dbUser) {
  if (!hasLanguage(ctx.dbUser.language)) {
    if (!isLanguageSelection(ctx)) {
      await ctx.reply("Select language");
      return;
    }
  }
}
return next();

// ✅ CORRECT - Early returns
if (!ctx.dbUser) return next();
if (hasLanguage(ctx.dbUser.language)) return next();
if (isLanguageSelection(ctx)) return next();

await ctx.reply("Select language");
```

### Always Await Promises

```typescript
// ❌ WRONG
ctx.reply(getText(lang, "welcome"));
db.update(...);

// ✅ CORRECT
await ctx.reply(getText(lang, "welcome"));
await db.update(...);
```

### Centralize Constants

```typescript
export const SUPPORTED_LANGUAGES: readonly Language[] = [
  "ru",
  "en",
  "es",
  "pt",
] as const;
export const LANGUAGE_CALLBACK_PATTERN = /^lang_(ru|en|es|pt)$/;
```

### Update Context After Database Writes

```typescript
await db.update(users).set({ language: langValue });
dbUser.language = langValue; // Sync context for immediate use
```

## Common Pitfalls

### Forgetting Null Checks

```typescript
// ❌ WRONG
const lang = dbUser.language;

// ✅ CORRECT
export function getText(
  language: MaybeOptional<Language>,
  key: string,
): string {
  const lang = isLanguage(language) ? language : "ru";
}
```

### Blocking Language Selection Callbacks

```typescript
// ❌ WRONG
if (!hasLanguage(ctx.dbUser.language)) {
  await ctx.reply("Select language");
  return; // Blocks language callback
}

// ✅ CORRECT
if (hasLanguage(ctx.dbUser.language)) return next();
if (isLanguageSelection(ctx)) return next(); // Allow language callbacks
```

### Duplicating Message Logic

```typescript
// ❌ WRONG - Duplicated in handlers
const msg = getText(lang, "welcome") + "\n" + getText(lang, "code");

// ✅ CORRECT - Reusable builder
export function buildWelcomeMessage(language, code) {
  /* ... */
}
const msg = buildWelcomeMessage(language, code);
```

### Using console.log

```typescript
// ❌ WRONG
console.log("Language selected", lang);

// ✅ CORRECT
info("Language selected", { lang });
```

## Adding New Languages

Update in 4 places:

1. **Language type:**

```typescript
export type Language = "ru" | "en" | "es" | "pt" | "fr";
```

2. **SUPPORTED_LANGUAGES:**

```typescript
export const SUPPORTED_LANGUAGES: readonly Language[] = [
  "ru",
  "en",
  "es",
  "pt",
  "fr",
] as const;
```

3. **Locales object:**

```typescript
const locales = {
  fr: {
    /* French translations */
  },
};
```

4. **Regex pattern:**

```typescript
export const LANGUAGE_CALLBACK_PATTERN = /^lang_(ru|en|es|pt|fr)$/;
```

## File Structure

```
src/
├── i18n/
│   ├── index.ts          # Main exports
│   ├── locales.ts        # Translations & utilities
│   └── messages.ts       # Message builders
├── middleware/
│   └── language.ts       # Language gating middleware
├── handlers/
│   ├── callbacks/
│   │   └── index.ts      # Language callbacks
│   └── commands/
│       └── index.ts      # Commands with i18n
├── db/
│   └── schema.ts         # Database with language field
└── types/
    └── utils.ts          # Language & MaybeOptional types
```

## Code Quality Checklist

- [ ] No type assertions (`as`)
- [ ] All database fields use `MaybeOptional<T>`
- [ ] Type guards validate language codes
- [ ] All async functions awaited
- [ ] Logger used instead of console.log
- [ ] Early returns for clean flow
- [ ] Message builders eliminate duplication
- [ ] Constants centralized
- [ ] Errors handled with try-catch
- [ ] Context updated after database writes
- [ ] Missing translations don't crash
- [ ] Language callbacks allowed through middleware
- [ ] TypeScript strict mode enabled
- [ ] All tests pass
- [ ] Code duplication < 5%
