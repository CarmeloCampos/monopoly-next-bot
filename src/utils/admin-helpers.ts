import type { BotContextWithLanguage } from "@/types";
import { getText } from "@/i18n";
import { getAdminPanelKeyboard } from "@/keyboards/admin";
import { getUserStats } from "@/services/admin";
import { formatTelegramText } from "@/utils/telegram-format";

/**
 * Displays the admin panel with system statistics.
 *
 * @param ctx - The bot context with language
 * @returns Promise that resolves when the panel is displayed
 */
export async function showAdminPanel(
  ctx: BotContextWithLanguage,
): Promise<void> {
  const stats = await getUserStats();

  const message = formatTelegramText(
    getText(ctx.dbUser.language, "admin_stats_text"),
    {
      totalUsers: String(stats.totalUsers),
      totalBalance: String(stats.totalBalance),
      pendingWithdrawals: String(stats.pendingWithdrawals),
      totalWithdrawals: String(stats.totalWithdrawals),
    },
  );

  await ctx.reply(message, {
    parse_mode: "Markdown",
    reply_markup: getAdminPanelKeyboard(ctx.dbUser.language),
  });
}
