import type { Telegraf } from "telegraf";
import type { BotContext, BotContextWithLanguage } from "@/types";
import { hasDbUser, hasLanguage } from "@/types/index";
import { CALLBACK_DATA } from "@/constants";
import { getReferralStats, getEarningsHistory } from "@/services/referral";
import {
  buildReferralDashboardMessage,
  buildReferralHistoryMessage,
} from "@/i18n";
import {
  getReferralDashboardKeyboard,
  getReferralHistoryKeyboard,
} from "@/keyboards";
import { answerUserNotFound } from "@/utils/callback-helpers";

async function refreshDashboard(ctx: BotContextWithLanguage): Promise<void> {
  const { dbUser } = ctx;
  const stats = await getReferralStats(dbUser.telegram_id);
  const message = buildReferralDashboardMessage(
    dbUser.language,
    dbUser.referral_code,
    stats,
  );

  await ctx.answerCbQuery();
  await ctx.editMessageText(message, {
    parse_mode: "Markdown",
    reply_markup: getReferralDashboardKeyboard(
      dbUser.language,
      dbUser.referral_code,
    ),
  });
}

export const registerReferralCallbacks = (bot: Telegraf<BotContext>): void => {
  bot.action(CALLBACK_DATA.REFERRAL_HISTORY, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) return;

    const { dbUser } = ctx;
    const history = await getEarningsHistory(dbUser.telegram_id);
    const message = buildReferralHistoryMessage(dbUser.language, history);

    await ctx.answerCbQuery();
    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      reply_markup: getReferralHistoryKeyboard(dbUser.language),
    });
  });

  bot.action(CALLBACK_DATA.REFERRAL_REFRESH, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) return;

    await refreshDashboard(ctx);
  });

  bot.action("referral_back", async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) return;

    await refreshDashboard(ctx);
  });
};
