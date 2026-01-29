import { Telegraf } from "telegraf";
import {
  type BotContext,
  hasDbUser,
  hasLanguage,
  isServiceIndex,
} from "@/types";

import {
  answerInvalidCallback,
  extractValidatedIndex,
} from "@/utils/callback-helpers";
import { CALLBACK_PATTERNS, CALLBACK_DATA } from "@/constants";
import { sendServiceCard } from "@/handlers/shared/service-display";

export function registerServiceCallbacks(bot: Telegraf<BotContext>): void {
  bot.action(CALLBACK_PATTERNS.SERVICE_NAV, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) return;

    const serviceIndex = extractValidatedIndex(
      ctx,
      CALLBACK_PATTERNS.SERVICE_NAV,
      isServiceIndex,
    );
    if (serviceIndex === null) {
      await answerInvalidCallback(ctx);
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
