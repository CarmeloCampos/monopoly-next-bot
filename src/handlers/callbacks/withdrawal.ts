import { Telegraf } from "telegraf";
import type { BotContext, BotContextWithLanguage } from "@/types";
import {
  hasDbUser,
  hasLanguage,
  isWithdrawalCurrency,
  isMonopolyCoins,
} from "@/types/index";
import { getText } from "@/i18n";
import {
  getCurrencySelectionKeyboard,
  getWithdrawalConfirmationKeyboard,
  getWithdrawalHistoryKeyboard,
  getStatusDisplay,
} from "@/keyboards/withdrawal";
import { CALLBACK_DATA, CALLBACK_PATTERNS } from "@/constants/bot";
import {
  createWithdrawal,
  getUserWithdrawals,
  calculateUsdAmount,
  getCurrencyDisplayName,
} from "@/services/withdrawal";
import {
  setWithdrawalState,
  getWithdrawalState,
  clearWithdrawalState,
  updateWithdrawalState,
} from "@/services/withdrawal-state";
import {
  answerUserNotFound,
  extractCallbackMatch,
  extractPageNumber,
} from "@/utils/callback-helpers";
import { info, error } from "@/utils/logger";
import { notifyAdminsNewWithdrawal } from "@/utils/notifications";

const WITHDRAWAL_PAGE_SIZE = 5;

export const registerWithdrawalCallbacks = (
  bot: Telegraf<BotContext>,
): void => {
  // Create withdrawal - start flow
  bot.action(CALLBACK_DATA.WITHDRAWAL_CREATE, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    setWithdrawalState(ctx.dbUser.telegram_id, { step: "currency" });

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser.language, "withdrawal_select_currency"),
      {
        reply_markup: getCurrencySelectionKeyboard(ctx.dbUser.language),
      },
    );
  });

  // Currency selection
  bot.action(CALLBACK_PATTERNS.WITHDRAWAL_CURRENCY, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    const result = extractCallbackMatch(
      ctx,
      CALLBACK_PATTERNS.WITHDRAWAL_CURRENCY,
    );
    if (!result) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const [, currency] = result.match;
    if (!isWithdrawalCurrency(currency)) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    setWithdrawalState(ctx.dbUser.telegram_id, {
      step: "amount",
      currency,
    });

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser.language, "withdrawal_enter_amount"),
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: getText(ctx.dbUser.language, "btn_cancel"),
                callback_data: CALLBACK_DATA.WITHDRAWAL_CANCEL,
              },
            ],
          ],
        },
      },
    );
  });

  // Cancel withdrawal creation
  bot.action(CALLBACK_DATA.WITHDRAWAL_CANCEL, async (ctx: BotContext) => {
    if (hasDbUser(ctx)) {
      clearWithdrawalState(ctx.dbUser.telegram_id);
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser?.language, "withdrawal_cancelled"),
    );
  });

  // View withdrawal history
  bot.action(CALLBACK_DATA.WITHDRAWAL_HISTORY, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    await showWithdrawalHistory(ctx, 1);
  });

  // History pagination
  bot.action(CALLBACK_PATTERNS.WITHDRAWAL_HISTORY, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    const page = extractPageNumber(ctx, CALLBACK_PATTERNS.WITHDRAWAL_HISTORY);
    if (!page) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    await showWithdrawalHistory(ctx, page);
  });

  // Handle text messages for withdrawal flow
  bot.on("text", async (ctx: BotContext, next) => {
    // Skip if not in withdrawal flow
    if (!hasDbUser(ctx) || !hasLanguage(ctx) || !ctx.message) {
      return next();
    }

    const withdrawalState = getWithdrawalState(ctx.dbUser.telegram_id);
    if (!withdrawalState) {
      return next();
    }

    const text = "text" in ctx.message ? ctx.message.text : undefined;

    if (!text) {
      return next();
    }

    try {
      if (withdrawalState.step === "amount") {
        const amount = Number.parseInt(text, 10);

        if (Number.isNaN(amount) || amount <= 0) {
          await ctx.reply(getText(ctx.dbUser.language, "minigame_bet_invalid"));
          return;
        }

        if (!isMonopolyCoins(amount)) {
          await ctx.reply(getText(ctx.dbUser.language, "minigame_bet_invalid"));
          return;
        }
        updateWithdrawalState(ctx.dbUser.telegram_id, {
          amount,
          step: "wallet",
        });

        const currencyDisplay = withdrawalState.currency
          ? getCurrencyDisplayName(withdrawalState.currency)
          : "";

        await ctx.reply(
          getText(ctx.dbUser.language, "withdrawal_enter_wallet").replace(
            "{currency}",
            currencyDisplay,
          ),
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: getText(ctx.dbUser.language, "btn_cancel"),
                    callback_data: CALLBACK_DATA.WITHDRAWAL_CANCEL,
                  },
                ],
              ],
            },
          },
        );
      } else if (withdrawalState.step === "wallet") {
        updateWithdrawalState(ctx.dbUser.telegram_id, {
          walletAddress: text,
          step: "confirm",
        });

        const updatedState = getWithdrawalState(ctx.dbUser.telegram_id);
        if (!updatedState) {
          return;
        }
        const { amount, currency, walletAddress } = updatedState;
        if (!isMonopolyCoins(amount)) {
          await ctx.reply(getText(ctx.dbUser.language, "minigame_bet_invalid"));
          return;
        }
        const usdAmount = calculateUsdAmount(amount);
        const currencyDisplay = currency
          ? getCurrencyDisplayName(currency)
          : "";

        await ctx.reply(
          getText(ctx.dbUser.language, "withdrawal_confirm_text")
            .replace("{amount}", String(amount))
            .replace("{usd}", String(usdAmount))
            .replace("{currency}", currencyDisplay)
            .replace("{wallet}", walletAddress ?? ""),
          {
            parse_mode: "Markdown",
            reply_markup: getWithdrawalConfirmationKeyboard(
              ctx.dbUser.language,
            ),
          },
        );
      }
    } catch (err) {
      error("Error in withdrawal text handler", {
        userId: ctx.dbUser.telegram_id,
        step: withdrawalState.step,
        error: err instanceof Error ? err.message : String(err),
      });
      await ctx.reply(getText(ctx.dbUser.language, "error_updating_language"));
    }
  });

  // Confirm withdrawal
  bot.action("withdrawal_confirm", async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    const withdrawalState = getWithdrawalState(ctx.dbUser.telegram_id);

    if (
      !withdrawalState ||
      withdrawalState.step !== "confirm" ||
      !withdrawalState.amount ||
      !withdrawalState.currency ||
      !withdrawalState.walletAddress
    ) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const { amount, currency, walletAddress } = withdrawalState;

    if (!amount || !currency || !walletAddress) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const result = await createWithdrawal({
      userId: ctx.dbUser.telegram_id,
      amount,
      currency,
      walletAddress,
    });

    clearWithdrawalState(ctx.dbUser.telegram_id);

    if (result.success && result.withdrawal) {
      const currencyDisplay = getCurrencyDisplayName(
        result.withdrawal.currency,
      );

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        getText(ctx.dbUser.language, "withdrawal_created_success")
          .replace("{amount}", String(result.withdrawal.amount))
          .replace("{currency}", currencyDisplay),
      );

      info("Withdrawal created", {
        withdrawalId: result.withdrawal.id,
        userId: ctx.dbUser.telegram_id,
      });

      await notifyAdminsNewWithdrawal(ctx.telegram, {
        id: result.withdrawal.id,
        userId: ctx.dbUser.telegram_id,
        username: ctx.dbUser.username,
        firstName: ctx.dbUser.first_name,
        lastName: ctx.dbUser.last_name,
        amount: result.withdrawal.amount,
        currency: result.withdrawal.currency,
        walletAddress: result.withdrawal.wallet_address,
      });
    } else {
      let errorMessage = getText(
        ctx.dbUser.language,
        "error_updating_language",
      );

      switch (result.error) {
        case "minimum_amount":
          errorMessage = getText(
            ctx.dbUser.language,
            "withdrawal_error_minimum",
          );
          break;
        case "insufficient_balance":
          errorMessage = getText(
            ctx.dbUser.language,
            "withdrawal_error_balance",
          ).replace("{needed}", String(result.needed ?? 0));
          break;
        case "pending_withdrawal":
          errorMessage = getText(
            ctx.dbUser.language,
            "withdrawal_error_pending",
          );
          break;
        case "cooldown_active":
          errorMessage = getText(
            ctx.dbUser.language,
            "withdrawal_error_cooldown",
          ).replace("{days}", "7");
          break;
      }

      await ctx.answerCbQuery(errorMessage);
    }
  });
};

async function showWithdrawalHistory(
  ctx: BotContextWithLanguage,
  page: number,
): Promise<void> {
  const withdrawals = await getUserWithdrawals(
    ctx.dbUser.telegram_id,
    WITHDRAWAL_PAGE_SIZE + 1,
  );
  const hasMore = withdrawals.length > WITHDRAWAL_PAGE_SIZE;
  const displayWithdrawals = withdrawals.slice(0, WITHDRAWAL_PAGE_SIZE);

  if (displayWithdrawals.length === 0) {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser.language, "withdrawal_history_empty"),
      {
        reply_markup: getWithdrawalHistoryKeyboard(
          ctx.dbUser.language,
          page,
          false,
        ),
      },
    );
    return;
  }

  const items = displayWithdrawals
    .map((w) => {
      const date = new Date(w.created_at).toLocaleDateString(
        ctx.dbUser.language,
      );
      const status = getStatusDisplay(w.status, ctx.dbUser.language);
      const currencyDisplay = getCurrencyDisplayName(w.currency);

      return getText(ctx.dbUser.language, "withdrawal_history_item")
        .replace("{status}", status)
        .replace("{amount}", String(w.amount))
        .replace("{currency}", currencyDisplay)
        .replace("{date}", date)
        .replace("{wallet}", w.wallet_address);
    })
    .join("\n\n");

  const message = `${getText(ctx.dbUser.language, "withdrawal_history_title")}\n\n${items}`;

  await ctx.answerCbQuery();
  await ctx.editMessageText(message, {
    parse_mode: "Markdown",
    reply_markup: getWithdrawalHistoryKeyboard(
      ctx.dbUser.language,
      page,
      hasMore,
    ),
  });
}
