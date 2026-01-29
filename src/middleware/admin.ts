import type { BotContext } from "@/types";
import { isAdmin } from "@/services/admin";
import { isTelegramId } from "@/utils/guards";
import { error } from "@/utils/logger";

export async function checkAdminMiddleware(
  ctx: BotContext,
  next: () => Promise<void>,
): Promise<void> {
  try {
    const userId = ctx.from?.id;

    if (!userId || !isTelegramId(userId)) {
      return;
    }

    ctx.isAdmin = isAdmin(userId);

    await next();
  } catch (err) {
    error("Error in admin middleware", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
