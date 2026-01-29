import { Telegraf } from "telegraf";
import type { BotContext, WithdrawalId } from "@/types";
import { hasDbUser, hasLanguage } from "@/types/index";
import { getText } from "@/i18n";
import {
  getAdminPanelKeyboard,
  getAdminUsersKeyboard,
  getAdminWithdrawalActionsKeyboard,
  getAdminBackKeyboard,
} from "@/keyboards/admin";
import { CALLBACK_DATA, CALLBACK_PATTERNS } from "@/constants/bot";
import {
  getTopUsersByBalance,
  getUserStats,
  getAllUsers,
  getPendingWithdrawalsWithUsers,
  getUserById,
} from "@/services/admin";
import {
  processWithdrawal,
  cancelWithdrawal,
  getWithdrawalById,
  getCurrencyDisplayName,
} from "@/services/withdrawal";
import {
  answerUserNotFound,
  extractWithdrawalId,
  extractPageNumber,
} from "@/utils/callback-helpers";
import { buildUserDisplayName } from "@/utils/user-display";
import {
  notifyUserWithdrawalProcessed,
  notifyUserWithdrawalCancelled,
} from "@/utils/withdrawal-notifications";

const USERS_PAGE_SIZE = 20;

export const registerAdminCallbacks = (bot: Telegraf<BotContext>): void => {
  // Admin panel button from main menu
  bot.hears(
    /🔐|Admin Panel|Painel Admin|Panel Admin/i,
    async (ctx: BotContext) => {
      if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
        await answerUserNotFound(ctx);
        return;
      }

      if (!ctx.isAdmin) {
        return;
      }

      await showAdminPanel(ctx);
    },
  );

  // Admin panel callback
  bot.action(CALLBACK_DATA.ADMIN_PANEL, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!ctx.isAdmin) {
      await ctx.answerCbQuery("Access denied");
      return;
    }

    await ctx.answerCbQuery();
    await showAdminPanel(ctx);
  });

  // View all users
  bot.action(CALLBACK_DATA.ADMIN_USERS, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx) || !ctx.isAdmin) {
      await ctx.answerCbQuery("Access denied");
      return;
    }

    await showUsersList(ctx, 1);
  });

  // Users pagination
  bot.action(CALLBACK_PATTERNS.ADMIN_USERS_PAGE, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx) || !ctx.isAdmin) {
      await ctx.answerCbQuery("Access denied");
      return;
    }

    const page = extractPageNumber(ctx, CALLBACK_PATTERNS.ADMIN_USERS_PAGE);
    if (!page) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    await showUsersList(ctx, page);
  });

  // View top users
  bot.action(CALLBACK_DATA.ADMIN_TOP_USERS, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx) || !ctx.isAdmin) {
      await ctx.answerCbQuery("Access denied");
      return;
    }

    await showTopUsers(ctx);
  });

  // View pending withdrawals
  bot.action(
    CALLBACK_DATA.ADMIN_PENDING_WITHDRAWALS,
    async (ctx: BotContext) => {
      if (!hasDbUser(ctx) || !hasLanguage(ctx) || !ctx.isAdmin) {
        await ctx.answerCbQuery("Access denied");
        return;
      }

      await showPendingWithdrawals(ctx);
    },
  );

  // View specific withdrawal
  bot.action(
    CALLBACK_PATTERNS.WITHDRAWAL_ADMIN_VIEW,
    async (ctx: BotContext) => {
      if (!hasDbUser(ctx) || !hasLanguage(ctx) || !ctx.isAdmin) {
        await ctx.answerCbQuery("Access denied");
        return;
      }

      const withdrawalId = extractWithdrawalId(
        ctx,
        CALLBACK_PATTERNS.WITHDRAWAL_ADMIN_VIEW,
      );
      if (!withdrawalId) {
        await ctx.answerCbQuery(
          getText(ctx.dbUser.language, "error_invalid_callback"),
        );
        return;
      }

      await showWithdrawalDetails(ctx, withdrawalId);
    },
  );

  // Process withdrawal - start
  bot.action(
    CALLBACK_PATTERNS.WITHDRAWAL_ADMIN_PROCESS,
    async (ctx: BotContext) => {
      if (!hasDbUser(ctx) || !hasLanguage(ctx) || !ctx.isAdmin) {
        await ctx.answerCbQuery("Access denied");
        return;
      }

      const withdrawalId = extractWithdrawalId(
        ctx,
        CALLBACK_PATTERNS.WITHDRAWAL_ADMIN_PROCESS,
      );
      if (!withdrawalId) {
        await ctx.answerCbQuery(
          getText(ctx.dbUser.language, "error_invalid_callback"),
        );
        return;
      }

      ctx.adminState = {
        step: "process_hash",
        withdrawalId,
      };

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        getText(ctx.dbUser.language, "admin_enter_transaction_hash"),
        {
          reply_markup: getAdminBackKeyboard(ctx.dbUser.language),
        },
      );
    },
  );

  // Cancel withdrawal
  bot.action(
    CALLBACK_PATTERNS.WITHDRAWAL_ADMIN_CANCEL,
    async (ctx: BotContext) => {
      if (!hasDbUser(ctx) || !hasLanguage(ctx) || !ctx.isAdmin) {
        await ctx.answerCbQuery("Access denied");
        return;
      }

      const withdrawalId = extractWithdrawalId(
        ctx,
        CALLBACK_PATTERNS.WITHDRAWAL_ADMIN_CANCEL,
      );
      if (!withdrawalId) {
        await ctx.answerCbQuery(
          getText(ctx.dbUser.language, "error_invalid_callback"),
        );
        return;
      }

      await handleWithdrawalCancellation(ctx, withdrawalId, false);
    },
  );

  // Refund withdrawal
  bot.action(
    CALLBACK_PATTERNS.WITHDRAWAL_ADMIN_REFUND,
    async (ctx: BotContext) => {
      if (!hasDbUser(ctx) || !hasLanguage(ctx) || !ctx.isAdmin) {
        await ctx.answerCbQuery("Access denied");
        return;
      }

      const withdrawalId = extractWithdrawalId(
        ctx,
        CALLBACK_PATTERNS.WITHDRAWAL_ADMIN_REFUND,
      );
      if (!withdrawalId) {
        await ctx.answerCbQuery(
          getText(ctx.dbUser.language, "error_invalid_callback"),
        );
        return;
      }

      await handleWithdrawalCancellation(ctx, withdrawalId, true);
    },
  );

  // Handle admin text input (transaction hash)
  bot.on("text", async (ctx: BotContext, next) => {
    if (
      !ctx.adminState ||
      !hasDbUser(ctx) ||
      !hasLanguage(ctx) ||
      !ctx.isAdmin ||
      !ctx.message
    ) {
      return next();
    }

    const { adminState } = ctx;
    const text = "text" in ctx.message ? ctx.message.text : undefined;

    if (!text) {
      return next();
    }

    if (adminState.step === "process_hash" && adminState.withdrawalId) {
      const { withdrawalId } = adminState;
      const processResult = await processWithdrawal({
        withdrawalId,
        adminId: ctx.dbUser.telegram_id,
        transactionHash: text,
      });

      ctx.adminState = undefined;

      if (processResult.success) {
        await ctx.reply(
          getText(ctx.dbUser.language, "admin_withdrawal_processed").replace(
            "{id}",
            String(withdrawalId),
          ),
          {
            reply_markup: getAdminBackKeyboard(ctx.dbUser.language),
          },
        );

        // Notify user
        const withdrawal = await getWithdrawalById(withdrawalId);
        if (withdrawal) {
          const withdrawalUser = await getUserById(withdrawal.user_id);
          await notifyUserWithdrawalProcessed(
            ctx.telegram,
            withdrawal.user_id,
            withdrawalUser?.language,
            {
              userId: withdrawal.user_id,
              amount: withdrawal.amount,
              currency: withdrawal.currency,
            },
            text,
          );
        }
      } else {
        await ctx.reply(processResult.error ?? "Error");
      }
    }
  });

  // Close admin panel
  bot.action(CALLBACK_DATA.ADMIN_CLOSE, async (ctx: BotContext) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
  });
};

async function showAdminPanel(ctx: BotContext): Promise<void> {
  if (!hasLanguage(ctx)) return;

  const stats = await getUserStats();

  const message = getText(ctx.dbUser.language, "admin_stats_text")
    .replace("{totalUsers}", String(stats.totalUsers))
    .replace("{totalBalance}", String(stats.totalBalance))
    .replace("{pendingWithdrawals}", String(stats.pendingWithdrawals))
    .replace("{totalWithdrawals}", String(stats.totalWithdrawals));

  await ctx.reply(message, {
    parse_mode: "Markdown",
    reply_markup: getAdminPanelKeyboard(ctx.dbUser.language),
  });
}

async function showUsersList(ctx: BotContext, page: number): Promise<void> {
  if (!hasLanguage(ctx)) return;

  const { users, total } = await getAllUsers(page, USERS_PAGE_SIZE);
  const totalPages = Math.ceil(total / USERS_PAGE_SIZE);

  if (users.length === 0) {
    await ctx.answerCbQuery();
    await ctx.editMessageText("No users found", {
      reply_markup: getAdminBackKeyboard(ctx.dbUser.language),
    });
    return;
  }

  const items = users
    .map((user, index) => {
      const rank = (page - 1) * USERS_PAGE_SIZE + index + 1;
      const name = buildUserDisplayName({
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
      });
      return `${rank}. ${name} - ${user.balance} MC`;
    })
    .join("\n");

  const message = `👥 Users (Page ${page}/${totalPages})\n\n${items}`;

  await ctx.answerCbQuery();
  await ctx.editMessageText(message, {
    reply_markup: getAdminUsersKeyboard(
      ctx.dbUser.language,
      page,
      page < totalPages,
    ),
  });
}

async function showTopUsers(ctx: BotContext): Promise<void> {
  if (!hasLanguage(ctx)) return;

  const users = await getTopUsersByBalance(20);

  if (users.length === 0) {
    await ctx.answerCbQuery();
    await ctx.editMessageText("No users found", {
      reply_markup: getAdminBackKeyboard(ctx.dbUser.language),
    });
    return;
  }

  const items = users
    .map((user, index) => {
      const rank = index + 1;
      const name = buildUserDisplayName({
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
      });
      return getText(ctx.dbUser.language, "admin_top_users_item")
        .replace("{rank}", String(rank))
        .replace("{name}", name)
        .replace("{balance}", String(user.balance));
    })
    .join("\n");

  const message = `${getText(ctx.dbUser.language, "admin_top_users_title")}\n\n${items}`;

  await ctx.answerCbQuery();
  await ctx.editMessageText(message, {
    reply_markup: getAdminBackKeyboard(ctx.dbUser.language),
  });
}

async function showPendingWithdrawals(ctx: BotContext): Promise<void> {
  if (!hasLanguage(ctx)) return;

  const withdrawals = await getPendingWithdrawalsWithUsers();

  if (withdrawals.length === 0) {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser.language, "admin_pending_withdrawals_empty"),
      {
        reply_markup: getAdminBackKeyboard(ctx.dbUser.language),
      },
    );
    return;
  }

  const items = withdrawals
    .map((w) => {
      const date = new Date(w.created_at).toLocaleDateString(
        ctx.dbUser.language,
      );
      const userName = buildUserDisplayName({
        telegramId: w.user.telegram_id,
        username: w.user.username,
        firstName: w.user.first_name,
        lastName: w.user.last_name,
      });
      const currencyDisplay = getCurrencyDisplayName(w.currency);

      return getText(ctx.dbUser.language, "admin_pending_withdrawals_item")
        .replace("{id}", String(w.id))
        .replace("{user}", userName)
        .replace("{amount}", String(w.amount))
        .replace("{currency}", currencyDisplay)
        .replace("{wallet}", w.wallet_address)
        .replace("{date}", date);
    })
    .join("\n\n");

  const message = `${getText(ctx.dbUser.language, "admin_pending_withdrawals_title")}\n\n${items}`;

  await ctx.answerCbQuery();
  await ctx.editMessageText(message, {
    parse_mode: "Markdown",
    reply_markup: getAdminBackKeyboard(ctx.dbUser.language),
  });
}

async function showWithdrawalDetails(
  ctx: BotContext,
  withdrawalId: WithdrawalId,
): Promise<void> {
  if (!hasLanguage(ctx)) return;

  const withdrawal = await getWithdrawalById(withdrawalId);

  if (!withdrawal) {
    await ctx.answerCbQuery("Withdrawal not found");
    return;
  }

  const currencyDisplay = getCurrencyDisplayName(withdrawal.currency);
  const date = new Date(withdrawal.created_at).toLocaleDateString(
    ctx.dbUser.language,
  );

  const message = `
💸 Withdrawal #${withdrawal.id}

💰 Amount: ${withdrawal.amount} MC
💱 Currency: ${currencyDisplay}
👛 Wallet: \`${withdrawal.wallet_address}\`
📅 Date: ${date}
⏳ Status: ${withdrawal.status}
  `;

  await ctx.answerCbQuery();
  await ctx.editMessageText(message, {
    parse_mode: "Markdown",
    reply_markup: getAdminWithdrawalActionsKeyboard(
      ctx.dbUser.language,
      withdrawal.id,
    ),
  });
}

interface CancellationConfig {
  messageKey: string;
  notificationKey: string;
  logMessage: string;
}

function getCancellationConfig(refund: boolean): CancellationConfig {
  return refund
    ? {
        messageKey: "admin_withdrawal_refunded",
        notificationKey: "withdrawal_cancelled_notification",
        logMessage: "Failed to notify user about refunded withdrawal",
      }
    : {
        messageKey: "admin_withdrawal_cancelled",
        notificationKey: "withdrawal_cancelled_notification",
        logMessage: "Failed to notify user about cancelled withdrawal",
      };
}

async function handleWithdrawalCancellation(
  ctx: BotContext,
  withdrawalId: WithdrawalId,
  refund: boolean,
): Promise<void> {
  if (!hasLanguage(ctx)) return;

  const result = await cancelWithdrawal({
    withdrawalId,
    refund,
  });

  const config = getCancellationConfig(refund);

  if (result.success) {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser.language, config.messageKey).replace(
        "{id}",
        String(withdrawalId),
      ),
      {
        reply_markup: getAdminBackKeyboard(ctx.dbUser.language),
      },
    );

    // Notify user
    const withdrawal = await getWithdrawalById(withdrawalId);
    if (withdrawal) {
      const withdrawalUser = await getUserById(withdrawal.user_id);
      await notifyUserWithdrawalCancelled(
        ctx.telegram,
        withdrawal.user_id,
        withdrawalUser?.language,
        withdrawalId,
        withdrawal.amount,
        refund,
      );
    }
  } else {
    await ctx.answerCbQuery(result.error ?? "Error");
  }
}
