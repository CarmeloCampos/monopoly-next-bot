import type { BotContext } from "@/types";
import { isAdmin } from "@/services/admin";
import { isTelegramId } from "@/utils/guards";
import { error, debug } from "@/utils/logger";

export async function checkAdminMiddleware(
  ctx: BotContext,
  next: () => Promise<void>,
): Promise<void> {
  try {
    const userId = ctx.from?.id;

    debug("Admin middleware - checking user", {
      userId,
      from: ctx.from,
    });

    if (!userId || !isTelegramId(userId)) {
      debug("Admin middleware - invalid userId", { userId });
      return;
    }

    ctx.isAdmin = isAdmin(userId);

    debug("Admin middleware - result", {
      userId,
      isAdmin: ctx.isAdmin,
    });

    await next();
  } catch (err) {
    error("Error in admin middleware", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
