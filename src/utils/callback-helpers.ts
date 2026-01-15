import type { BotContext } from "@/types";
import { getText } from "@/i18n";

export async function answerUserNotFound(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery?.(getText("en", "error_user_not_found"));
}

export async function answerInvalidCallback(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery?.(getText("en", "error_invalid_callback"));
}
