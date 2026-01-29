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
  buildWelcomeExistingUserMessage,
  buildReferralDashboardMessage,
  getText,
} from "@/i18n";
import {
  getMainMenuKeyboard,
  getMenuButtonTexts,
  getSettingsKeyboard,
  getReferralDashboardKeyboard,
  getBalanceSubmenuKeyboard,
} from "@/keyboards";
import { userHasProperty } from "@/services/property";
import { STARTER_PROPERTY_INDEX } from "@/constants/game";
import { sendPropertyCard } from "@/handlers/shared/property-display";
import { sendServiceCard } from "@/handlers/shared/service-display";
import { handleBoard, handleRollDice, handleViewCurrent } from "./board-menu";
import { handleMinigames, handleBetAmount } from "./minigames-menu";
import { isAwaitingBet } from "@/services/minigame-state";
import { isInWithdrawalFlow } from "@/services/withdrawal-state";
import { getReferralStats } from "@/services/referral";
import { showAdminPanel } from "@/utils/admin-helpers";

export const registerCommands = (bot: Telegraf<BotContext>): void => {
  bot.command("start", async (ctx: BotContext): Promise<void> => {
    info("Start command received", { userId: ctx.from?.id });

    if (!hasDbUser(ctx)) {
      await ctx.reply(getText("en", "error_user_not_found"));
      return;
    }

    if (!hasLanguage(ctx)) return;

    const { dbUser, referralBonusReceived } = ctx;
    const hasStarterProperty = await userHasProperty(
      dbUser.telegram_id,
      STARTER_PROPERTY_INDEX,
    );

    let startMessage: string;

    if (hasStarterProperty) {
      startMessage = buildWelcomeExistingUserMessage(dbUser.language);
    } else {
      startMessage = getText(dbUser.language, "welcome_new_user");
    }

    if (referralBonusReceived) {
      startMessage += `\n\n${buildReferralBonusMessage(dbUser.language, referralBonusReceived)}`;
    }

    await ctx.reply(startMessage, {
      parse_mode: "Markdown",
      reply_markup: getMainMenuKeyboard(dbUser.language, ctx.isAdmin),
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
  bot.on(message("text"), async (ctx, next) => {
    if (!hasLanguage(ctx)) return next();

    const { dbUser } = ctx;
    const messageText = ctx.message.text;
    const menuTexts = getMenuButtonTexts(dbUser.language);

    if (messageText && isAwaitingBet(dbUser.telegram_id)) {
      const amount = Number.parseFloat(messageText);
      if (!isNaN(amount) && isFinite(amount)) {
        await handleBetAmount(ctx, amount);
        return;
      }
    }

    // Skip if in withdrawal flow - let withdrawal handler handle it
    if (isInWithdrawalFlow(dbUser.telegram_id)) {
      return next();
    }

    switch (messageText) {
      case menuTexts.properties:
        await handleProperties(ctx);
        break;
      case menuTexts.services:
        await handleServices(ctx);
        break;
      case menuTexts.balance:
        await handleBalance(ctx);
        break;
      case menuTexts.board:
        await handleBoard(ctx);
        break;
      case menuTexts.advance:
        await handleBoard(ctx);
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
      case getText(dbUser.language, "board_roll_dice"):
        await handleRollDice(ctx);
        break;
      case getText(dbUser.language, "board_view_current"):
        await handleViewCurrent(ctx);
        break;
      case getText(dbUser.language, "admin_panel_button"):
        if (ctx.isAdmin) {
          await handleAdminPanel(ctx);
        }
        break;
      case getText(dbUser.language, "btn_back"):
        await ctx.reply(getText(dbUser.language, "menu_main"), {
          reply_markup: getMainMenuKeyboard(dbUser.language, ctx.isAdmin),
        });
        break;
      default:
        await ctx.reply(getText(dbUser.language, "invalid_message"), {
          reply_markup: getMainMenuKeyboard(dbUser.language, ctx.isAdmin),
        });
    }
  });
}

async function handleProperties(ctx: BotContextWithLanguage): Promise<void> {
  await sendPropertyCard({
    ctx,
    propertyIndex: 0,
    isNavigation: false,
  });
}

async function handleBalance(ctx: BotContextWithLanguage): Promise<void> {
  const balanceMessage = buildBalanceMessage(
    ctx.dbUser.language,
    ctx.dbUser.balance,
  );
  const submenuMessage = `${balanceMessage}\n\n${getText(ctx.dbUser.language, "balance_submenu_prompt")}`;

  await ctx.reply(submenuMessage, {
    parse_mode: "Markdown",
    reply_markup: getBalanceSubmenuKeyboard(ctx.dbUser.language),
  });
}

async function handleReferral(ctx: BotContextWithLanguage): Promise<void> {
  const stats = await getReferralStats(ctx.dbUser.telegram_id);
  const dashboardMessage = buildReferralDashboardMessage(
    ctx.dbUser.language,
    ctx.dbUser.referral_code,
    stats,
  );

  await ctx.reply(dashboardMessage, {
    parse_mode: "Markdown",
    reply_markup: getReferralDashboardKeyboard(
      ctx.dbUser.language,
      ctx.dbUser.referral_code,
    ),
  });
}

async function handleSettings(ctx: BotContextWithLanguage): Promise<void> {
  await ctx.reply(getText(ctx.dbUser.language, "menu_settings"), {
    reply_markup: getSettingsKeyboard(ctx.dbUser.language),
  });
}

async function handleServices(ctx: BotContextWithLanguage): Promise<void> {
  await sendServiceCard({
    ctx,
    serviceIndex: 0,
    isNavigation: false,
  });
}

async function handleAdminPanel(ctx: BotContextWithLanguage): Promise<void> {
  await showAdminPanel(ctx);
}
