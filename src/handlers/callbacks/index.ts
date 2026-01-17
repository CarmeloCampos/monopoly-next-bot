import { Telegraf } from "telegraf";
import {
  type BotContext,
  hasDbUser,
  hasLanguage,
  isLanguage,
  isPropertyIndex,
  asMonopolyCoins,
  type BotContextWithLanguage,
} from "@/types";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getText, buildWelcomeExistingUserMessage } from "@/i18n";
import {
  getMainMenuKeyboard,
  getLanguageKeyboard,
  getChannelsKeyboard,
  getSettingsKeyboard,
} from "@/keyboards";
import { info, error as logError } from "@/utils/logger";
import {
  answerUserNotFound,
  answerInvalidCallback,
  extractCallbackMatch,
} from "@/utils/callback-helpers";
import { CALLBACK_PATTERNS, CALLBACK_DATA } from "@/constants";
import {
  buyProperty,
  userHasProperty,
  claimPropertyEarnings,
} from "@/services/property";
import {
  STARTER_PROPERTY_INDEX,
  DEFAULT_PROPERTY_LEVEL,
} from "@/constants/game";
import { sendPropertyCard } from "@/handlers/shared/property-display";

export const registerCallbacks = (bot: Telegraf<BotContext>): void => {
  bot.action(CALLBACK_PATTERNS.LANGUAGE, async (ctx: BotContext) => {
    const { callbackQuery } = ctx;

    if (!callbackQuery || !("data" in callbackQuery) || !callbackQuery.data) {
      await answerInvalidCallback(ctx);
      return;
    }

    const langMatch = callbackQuery.data.match(CALLBACK_PATTERNS.LANGUAGE);
    if (!langMatch) {
      await answerInvalidCallback(ctx);
      return;
    }

    const [, langValue] = langMatch;
    if (!isLanguage(langValue)) {
      await ctx.answerCbQuery(getText("en", "error_invalid_language"));
      return;
    }

    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    const { dbUser } = ctx;

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

      const hasStarterProperty = await userHasProperty(
        dbUser.telegram_id,
        STARTER_PROPERTY_INDEX,
      );

      if (!hasStarterProperty) {
        // Safe cast: language was just validated with isLanguage() and assigned to dbUser.language
        const ctxWithLang = ctx as BotContextWithLanguage;
        await buyProperty({
          userId: dbUser.telegram_id,
          propertyIndex: STARTER_PROPERTY_INDEX,
          level: DEFAULT_PROPERTY_LEVEL,
          cost: asMonopolyCoins(0),
          ctx: ctxWithLang,
        });
      }

      const welcomeMsg = hasStarterProperty
        ? buildWelcomeExistingUserMessage(langValue)
        : getText(langValue, "welcome_new_user");
      await ctx.reply(welcomeMsg, {
        parse_mode: "Markdown",
        reply_markup: getMainMenuKeyboard(langValue),
      });
      await ctx.deleteMessage();
    } catch (err) {
      logError("Error updating language", {
        userId: dbUser.telegram_id,
        error: err instanceof Error ? err.message : String(err),
      });
      await ctx.answerCbQuery(getText("en", "error_updating_language"));
    }
  });

  bot.action(CALLBACK_DATA.SETTINGS_LANGUAGE, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser.language, "language_selection"),
      {
        reply_markup: getLanguageKeyboard(),
      },
    );
  });

  bot.action(CALLBACK_DATA.SETTINGS_CHANNELS, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser.language, "settings_channels"),
      {
        reply_markup: getChannelsKeyboard(ctx.dbUser.language),
      },
    );
  });

  bot.action(CALLBACK_DATA.SETTINGS_SUPPORT, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    await ctx.answerCbQuery();
    await ctx.reply(getText(ctx.dbUser.language, "settings_support_message"));
  });

  bot.action(CALLBACK_DATA.SETTINGS_BACK, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(getText(ctx.dbUser.language, "menu_settings"), {
      reply_markup: getSettingsKeyboard(ctx.dbUser.language),
    });
  });

  bot.action(CALLBACK_DATA.SETTINGS_CLOSE, async (ctx: BotContext) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
  });

  bot.action(CALLBACK_PATTERNS.PROPERTY_NAV, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) return;

    const result = extractCallbackMatch(ctx, CALLBACK_PATTERNS.PROPERTY_NAV);
    if (!result) {
      await answerInvalidCallback(ctx);
      return;
    }

    const [, navIndexStr] = result.match;
    if (!navIndexStr) {
      await answerInvalidCallback(ctx);
      return;
    }

    const index = Number.parseInt(navIndexStr, 10);

    await sendPropertyCard({
      ctx,
      propertyIndex: index,
      isNavigation: true,
    });
  });

  bot.action(CALLBACK_PATTERNS.PROPERTY_CLAIM, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) return;

    const result = extractCallbackMatch(ctx, CALLBACK_PATTERNS.PROPERTY_CLAIM);
    if (!result) {
      await answerInvalidCallback(ctx);
      return;
    }

    const [, propertyIndexStr] = result.match;
    if (!propertyIndexStr) {
      await answerInvalidCallback(ctx);
      return;
    }

    const parsedIndex = Number.parseInt(propertyIndexStr, 10);
    if (!isPropertyIndex(parsedIndex)) {
      await answerInvalidCallback(ctx);
      return;
    }

    const { dbUser } = ctx;

    const earnings = await claimPropertyEarnings({
      userId: dbUser.telegram_id,
      propertyIndex: parsedIndex,
      ctx,
    });

    if (earnings !== null) {
      await ctx.answerCbQuery(
        getText(dbUser.language, "property_claim_success").replace(
          "{amount}",
          String(earnings),
        ),
      );
    } else {
      await ctx.answerCbQuery();
    }
  });

  bot.action(CALLBACK_DATA.PROPERTY_CLOSE, async (ctx: BotContext) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
  });

  bot.action(CALLBACK_DATA.PROPERTY_BACK, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) return;

    await sendPropertyCard({
      ctx,
      propertyIndex: 0,
      isNavigation: true,
    });
  });
};
