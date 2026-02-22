import { Telegraf } from "telegraf";
import {
  type BotContext,
  hasDbUser,
  hasLanguage,
  isLanguage,
  isPropertyIndex,
  asMonopolyCoins,
  type Language,
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
import { info, error } from "@/utils/logger";
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
  getUserProperties,
} from "@/services/property";
import { getPropertyByIndex } from "@/constants/properties";
import {
  STARTER_PROPERTY_INDEX,
  DEFAULT_PROPERTY_LEVEL,
} from "@/constants/game";
import { sendPropertyCard } from "@/handlers/shared/property-display";
import { registerBoardCallbacks } from "./board";
import { registerUpgradeCallbacks } from "./upgrade";
import { registerServiceCallbacks } from "./service";
import { registerMinigameCallbacks } from "./minigames";
import { registerReferralCallbacks } from "./referral";
import { registerWithdrawalCallbacks } from "./withdrawal";
import { registerAdminCallbacks } from "./admin";
import { registerDepositCallbacks } from "./deposit";

/** Sentinel value indicating an item was not found in an array */
const NOT_FOUND_INDEX = -1;

/**
 * Completes user onboarding by checking/giving starter property and sending welcome message
 */
async function completeUserOnboarding(
  ctx: BotContext,
  language: Language,
): Promise<void> {
  const { dbUser } = ctx;
  if (!dbUser) return;

  const hasStarterProperty = await userHasProperty(
    dbUser.telegram_id,
    STARTER_PROPERTY_INDEX,
  );

  if (!hasStarterProperty) {
    await buyProperty({
      userId: dbUser.telegram_id,
      propertyIndex: STARTER_PROPERTY_INDEX,
      level: DEFAULT_PROPERTY_LEVEL,
      cost: asMonopolyCoins(0),
    });
  }

  const welcomeMsg = hasStarterProperty
    ? buildWelcomeExistingUserMessage(language)
    : getText(language, "welcome_new_user");

  await ctx.reply(welcomeMsg, {
    parse_mode: "Markdown",
    reply_markup: getMainMenuKeyboard(language, ctx.isAdmin),
  });
}

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

      await completeUserOnboarding(ctx, langValue);

      await ctx.deleteMessage();
    } catch (err) {
      error("Error updating language", {
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

  bot.action(CALLBACK_DATA.TERMS_ACCEPT, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    const { dbUser } = ctx;

    try {
      await db
        .update(users)
        .set({
          terms_accepted_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(users.telegram_id, dbUser.telegram_id));

      info("Terms accepted", {
        userId: dbUser.telegram_id,
      });

      await ctx.answerCbQuery();
      await ctx.reply(getText(dbUser.language, "terms_accepted"));
      await ctx.reply(getText(dbUser.language, "language_selected"));

      const langValue = dbUser.language ?? "en";
      await completeUserOnboarding(ctx, langValue);

      if (ctx.callbackQuery && "message" in ctx.callbackQuery) {
        await ctx.deleteMessage();
      }
    } catch (err) {
      error("Error accepting terms", {
        userId: dbUser.telegram_id,
        error: err instanceof Error ? err.message : String(err),
      });
      await ctx.answerCbQuery(getText(dbUser.language, "error_generic_retry"));
    }
  });

  bot.action(CALLBACK_DATA.TERMS_DECLINE, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    const { dbUser } = ctx;

    await ctx.answerCbQuery();
    await ctx.reply(getText(dbUser.language, "terms_required"));
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

    // Show processing state
    await ctx.answerCbQuery(getText(dbUser.language, "processing_claim"));

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

  bot.action(CALLBACK_PATTERNS.PROPERTY_COLOR, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) {
      await answerInvalidCallback(ctx);
      return;
    }

    const result = extractCallbackMatch(ctx, CALLBACK_PATTERNS.PROPERTY_COLOR);
    if (!result) {
      await answerInvalidCallback(ctx);
      return;
    }

    const [, color, currentIndexStr] = result.match;
    if (!color || !currentIndexStr) {
      await answerInvalidCallback(ctx);
      return;
    }

    const currentIndex = Number.parseInt(currentIndexStr, 10);
    if (Number.isNaN(currentIndex)) {
      await answerInvalidCallback(ctx);
      return;
    }

    const { dbUser } = ctx;

    const userProperties = await db.query.userProperties.findMany({
      where: (fields, { eq }) => eq(fields.user_id, dbUser.telegram_id),
      orderBy: (fields, { asc }) => asc(fields.property_index),
    });

    const colorProperties = userProperties.filter((p) => {
      if (!isPropertyIndex(p.property_index)) return false;
      const propertyInfo = getPropertyByIndex(p.property_index);
      return propertyInfo && propertyInfo.color === color;
    });

    if (colorProperties.length === 0) {
      await ctx.answerCbQuery(
        getText(dbUser.language, "property_no_properties"),
      );
      return;
    }

    if (colorProperties.length === 1) {
      // Only one property of this color, just acknowledge
      await ctx.answerCbQuery();
      return;
    }

    // Get all user properties to find the current property's position
    const allUserProperties = await getUserProperties(dbUser.telegram_id);
    const currentProperty = allUserProperties[currentIndex];

    if (!currentProperty) {
      await ctx.answerCbQuery(
        getText(dbUser.language, "error_property_not_found"),
      );
      return;
    }

    // Find the position of current property within color properties
    const currentColorIndex = colorProperties.findIndex(
      (p) => p.property_index === currentProperty.property_index,
    );

    if (currentColorIndex === NOT_FOUND_INDEX) {
      await ctx.answerCbQuery(
        getText(dbUser.language, "error_property_not_found"),
      );
      return;
    }

    // Calculate next property index cyclically: 1 > 2 > 3 > 1 > 2 > 3...
    const nextColorIndex = (currentColorIndex + 1) % colorProperties.length;
    const nextColorProperty = colorProperties[nextColorIndex];

    if (!nextColorProperty) {
      await ctx.answerCbQuery(
        getText(dbUser.language, "error_property_not_found"),
      );
      return;
    }

    // Find the index in allUserProperties for the next property
    const nextPropertyIndex = allUserProperties.findIndex(
      (p) => p.property_index === nextColorProperty.property_index,
    );

    if (nextPropertyIndex === NOT_FOUND_INDEX) {
      await ctx.answerCbQuery(
        getText(dbUser.language, "error_property_not_found"),
      );
      return;
    }

    await ctx.answerCbQuery();
    await sendPropertyCard({
      ctx,
      propertyIndex: nextPropertyIndex,
      isNavigation: true,
    });
  });

  registerBoardCallbacks(bot);
  registerUpgradeCallbacks(bot);
  registerServiceCallbacks(bot);
  registerMinigameCallbacks(bot);
  registerReferralCallbacks(bot);
  registerWithdrawalCallbacks(bot);
  registerAdminCallbacks(bot);
  registerDepositCallbacks(bot);
};
