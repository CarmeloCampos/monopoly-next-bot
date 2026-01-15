import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import {
  type BotContext,
  type BotContextWithLanguage,
  hasDbUser,
  hasLanguage,
} from "@/types";
import { info } from "@/utils/logger";
import {
  buildReferralBonusMessage,
  buildBalanceMessage,
  buildReferralCodeMessage,
  getText,
} from "@/i18n";
import {
  getMainMenuKeyboard,
  getMenuButtonTexts,
  getSettingsKeyboard,
} from "@/keyboards";

export const registerCommands = (bot: Telegraf<BotContext>): void => {
  bot.command("start", async (ctx: BotContext): Promise<void> => {
    info("Start command received", { userId: ctx.from?.id });

    if (!hasDbUser(ctx)) {
      await ctx.reply(getText("en", "error_user_not_found"));
      return;
    }

    if (!hasLanguage(ctx)) return;

    const { dbUser, referralBonusReceived } = ctx;
    let message = getText(dbUser.language, "welcome_new_user");

    if (referralBonusReceived) {
      message += `\n\n${buildReferralBonusMessage(dbUser.language, referralBonusReceived)}`;
    }

    await ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: getMainMenuKeyboard(dbUser.language),
    });
  });

  bot.command("help", async (ctx: BotContext): Promise<void> => {
    info("Help command received", { userId: ctx.from?.id });

    if (!hasDbUser(ctx)) {
      await ctx.reply(getText("en", "error_user_not_found"));
      return;
    }

    if (!hasLanguage(ctx)) return;

    await ctx.reply(getText(ctx.dbUser.language, "help_title"));
  });

  registerMenuHandlers(bot);
};

function registerMenuHandlers(bot: Telegraf<BotContext>): void {
  bot.on(message("text"), async (ctx) => {
    if (!hasLanguage(ctx)) return;

    const { dbUser } = ctx;
    const { text } = ctx.message;
    const menuTexts = getMenuButtonTexts(dbUser.language);

    switch (text) {
      case menuTexts.properties:
        await handleProperties(ctx);
        break;
      case menuTexts.balance:
        await handleBalance(ctx);
        break;
      case menuTexts.advance:
        await handleAdvance(ctx);
        break;
      case menuTexts.referral:
        await handleReferral(ctx);
        break;
      case menuTexts.minigames:
        await handleMinigames(ctx);
        break;
      case menuTexts.settings:
        await handleSettings(ctx);
        break;
      default:
        await ctx.reply(getText(dbUser.language, "invalid_message"), {
          reply_markup: getMainMenuKeyboard(dbUser.language),
        });
    }
  });
}

async function handleProperties(ctx: BotContextWithLanguage): Promise<void> {
  await ctx.reply(getText(ctx.dbUser.language, "menu_properties_coming_soon"));
}

async function handleBalance(ctx: BotContextWithLanguage): Promise<void> {
  await ctx.reply(buildBalanceMessage(ctx.dbUser.language, ctx.dbUser.balance));
}

async function handleAdvance(ctx: BotContextWithLanguage): Promise<void> {
  await ctx.reply(getText(ctx.dbUser.language, "menu_advance_coming_soon"));
}

async function handleReferral(ctx: BotContextWithLanguage): Promise<void> {
  await ctx.reply(
    buildReferralCodeMessage(ctx.dbUser.language, ctx.dbUser.referral_code),
    {
      parse_mode: "Markdown",
    },
  );
}

async function handleMinigames(ctx: BotContextWithLanguage): Promise<void> {
  await ctx.reply(getText(ctx.dbUser.language, "menu_minigames_coming_soon"));
}

async function handleSettings(ctx: BotContextWithLanguage): Promise<void> {
  await ctx.reply(getText(ctx.dbUser.language, "menu_settings"), {
    reply_markup: getSettingsKeyboard(ctx.dbUser.language),
  });
}
