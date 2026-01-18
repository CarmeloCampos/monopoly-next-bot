import { Telegraf } from "telegraf";
import {
  type BotContext,
  hasDbUser,
  hasLanguage,
  isServiceIndex,
} from "@/types";
import { getText } from "@/i18n";
import {
  answerInvalidCallback,
  extractCallbackMatch,
} from "@/utils/callback-helpers";
import { CALLBACK_PATTERNS, CALLBACK_DATA } from "@/constants";
import { sendServiceCard } from "@/handlers/shared/service-display";

export function registerServiceCallbacks(bot: Telegraf<BotContext>): void {
  bot.action(CALLBACK_PATTERNS.SERVICE_NAV, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) return;

    const matchResult = extractCallbackMatch(
      ctx,
      CALLBACK_PATTERNS.SERVICE_NAV,
    );
    if (!matchResult) {
      await answerInvalidCallback(ctx);
      return;
    }

    const [, serviceIndexStr] = matchResult.match;
    if (!serviceIndexStr) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const serviceIndex = Number.parseInt(serviceIndexStr, 10);
    if (!isServiceIndex(serviceIndex)) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    await sendServiceCard({
      ctx,
      serviceIndex,
      isNavigation: true,
    });

    await ctx.answerCbQuery();
  });

  bot.action(CALLBACK_DATA.SERVICE_CLOSE, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) return;

    await ctx.answerCbQuery();
    await ctx.deleteMessage();
  });

  bot.action(CALLBACK_DATA.SERVICE_BACK, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) return;

    await ctx.answerCbQuery();
    await ctx.deleteMessage();
  });
}
