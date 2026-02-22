/**
 * Deposit callback handlers
 */

import { Telegraf } from "telegraf";
import type { BotContext, BotContextWithLanguage } from "@/types";
import { hasDbUser, hasLanguage } from "@/types/index";
import { getText } from "@/i18n";
import {
  getDepositMenuKeyboard,
  getDepositCancelKeyboard,
  getDepositHistoryKeyboard,
  getDepositStatusDisplay,
  getCryptoSelectionKeyboard,
} from "@/keyboards/deposit";
import { CALLBACK_DATA, CALLBACK_PATTERNS } from "@/constants/bot";
import {
  createDeposit,
  getUserDeposits,
  calculateMcAmount,
} from "@/services/deposit";
import {
  setDepositState,
  getDepositState,
  clearDepositState,
  isInDepositFlow,
} from "@/services/deposit-state";
import {
  answerUserNotFound,
  extractPageNumber,
} from "@/utils/callback-helpers";
import { info, error } from "@/utils/logger";
import { env } from "@/config/env";
import { formatTelegramText } from "@/utils/telegram-format";

const DEPOSIT_PAGE_SIZE = 5;
const { MINIMUM_DEPOSIT_USD } = env;

/**
 * Shows the deposit menu to the user
 */
async function showDepositMenu(
  ctx: BotContextWithLanguage,
  answerCallback = true,
): Promise<void> {
  if (answerCallback) {
    await ctx.answerCbQuery();
  }
  await ctx.editMessageText(
    getText(ctx.dbUser.language, "deposit_menu_text").replace(
      "{min_amount}",
      String(MINIMUM_DEPOSIT_USD),
    ),
    {
      reply_markup: getDepositMenuKeyboard(ctx.dbUser.language),
    },
  );
}

export const registerDepositCallbacks = (bot: Telegraf<BotContext>): void => {
  // Deposit menu
  bot.action(CALLBACK_DATA.DEPOSIT_MENU, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    await showDepositMenu(ctx);
  });

  // Create deposit - start flow
  bot.action(CALLBACK_DATA.DEPOSIT_CREATE, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    setDepositState(ctx.dbUser.telegram_id, { step: "amount" });

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser.language, "deposit_enter_amount").replace(
        "{min_amount}",
        String(MINIMUM_DEPOSIT_USD),
      ),
      {
        reply_markup: getDepositCancelKeyboard(ctx.dbUser.language),
      },
    );
  });

  // Security confirmation
  bot.action(
    CALLBACK_DATA.DEPOSIT_SECURITY_CONFIRM,
    async (ctx: BotContext) => {
      if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
        await answerUserNotFound(ctx);
        return;
      }

      const userId = ctx.dbUser.telegram_id;
      const depositState = getDepositState(userId);

      if (
        !depositState ||
        depositState.step !== "security" ||
        !depositState.amountUsd
      ) {
        await ctx.answerCbQuery(
          getText(ctx.dbUser.language, "error_invalid_callback"),
        );
        clearDepositState(userId);
        return;
      }

      const { amountUsd } = depositState;

      // Update state to crypto selection step
      setDepositState(userId, { step: "crypto", amountUsd });

      await ctx.answerCbQuery();

      // Show crypto selection keyboard with all available currencies
      await ctx.reply(
        getText(ctx.dbUser.language, "deposit_select_crypto").replace(
          "{amount_usd}",
          String(amountUsd),
        ),
        {
          parse_mode: "Markdown",
          reply_markup: getCryptoSelectionKeyboard(ctx.dbUser.language),
        },
      );
    },
  );

  // Security cancel
  bot.action(CALLBACK_DATA.DEPOSIT_SECURITY_CANCEL, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    const userId = ctx.dbUser.telegram_id;
    clearDepositState(userId);

    await ctx.answerCbQuery();
    await ctx.reply(getText(ctx.dbUser.language, "deposit_cancelled"));
  });

  // Cancel deposit creation
  bot.action(CALLBACK_DATA.DEPOSIT_CANCEL, async (ctx: BotContext) => {
    const userLanguage = hasDbUser(ctx) ? ctx.dbUser.language : undefined;

    if (hasDbUser(ctx)) {
      clearDepositState(ctx.dbUser.telegram_id);
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(getText(userLanguage, "deposit_cancelled"));
  });

  // View deposit history
  bot.action(CALLBACK_DATA.DEPOSIT_HISTORY, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    await showDepositHistory(ctx, 1);
  });

  // History pagination
  bot.action(CALLBACK_PATTERNS.DEPOSIT_HISTORY, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    const page = extractPageNumber(ctx, CALLBACK_PATTERNS.DEPOSIT_HISTORY);
    if (!page) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    await showDepositHistory(ctx, page);
  });

  // Handle crypto currency selection
  bot.action(CALLBACK_PATTERNS.DEPOSIT_CRYPTO, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    const { callbackQuery } = ctx;

    if (!callbackQuery || !("data" in callbackQuery) || !callbackQuery.data) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const match = callbackQuery.data.match(CALLBACK_PATTERNS.DEPOSIT_CRYPTO);
    if (!match) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const [, cryptoCode] = match;
    if (!cryptoCode) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const userId = ctx.dbUser.telegram_id;
    const depositState = getDepositState(userId);

    if (!depositState || !depositState.amountUsd) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      clearDepositState(userId);
      return;
    }

    const { amountUsd } = depositState;

    // Show processing state
    await ctx.answerCbQuery(getText(ctx.dbUser.language, "processing_deposit"));

    // Create deposit with selected crypto
    const result = await createDeposit({
      userId,
      amountUsd,
      payCurrency: cryptoCode,
    });

    const { deposit } = result;
    if (result.success && deposit) {
      const amountMc = calculateMcAmount(amountUsd);

      // Check if we have a payment URL
      if (result.paymentUrl) {
        // Standard flow with payment URL
        const successMessage = formatTelegramText(
          getText(ctx.dbUser.language, "deposit_created_success"),
          {
            amount_usd: String(amountUsd),
            amount_mc: String(amountMc),
            payment_url: result.paymentUrl,
          },
        );

        await ctx.editMessageText(successMessage, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: getText(ctx.dbUser.language, "btn_pay_now"),
                  url: result.paymentUrl,
                },
              ],
              [
                {
                  text: getText(ctx.dbUser.language, "btn_back"),
                  callback_data: CALLBACK_DATA.DEPOSIT_MENU,
                },
              ],
            ],
          },
        });
      } else if (deposit.pay_address) {
        // Fallback: show payment address directly when no URL is available
        const noUrlMessage = formatTelegramText(
          getText(ctx.dbUser.language, "deposit_created_no_url"),
          {
            amount_usd: String(amountUsd),
            amount_mc: String(amountMc),
            pay_address: deposit.pay_address,
            pay_amount: String(deposit.pay_amount),
            pay_currency: String(deposit.pay_currency),
          },
        );

        await ctx.editMessageText(noUrlMessage, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: getText(ctx.dbUser.language, "btn_back"),
                  callback_data: CALLBACK_DATA.DEPOSIT_MENU,
                },
              ],
            ],
          },
        });
      } else {
        // Neither URL nor address available - this shouldn't happen
        error("Deposit created but no payment method available", {
          depositId: deposit.id,
          userId,
          amountUsd,
        });
        await ctx.editMessageText(
          getText(ctx.dbUser.language, "deposit_api_error"),
        );
      }

      info("Deposit created via bot", {
        depositId: deposit.id,
        userId,
        amountUsd,
        amountMc,
        payCurrency: cryptoCode,
        hasPaymentUrl: !!result.paymentUrl,
        hasPayAddress: !!deposit.pay_address,
      });

      // Clear state only after successful deposit creation
      clearDepositState(userId);
    } else {
      let errorMessage = getText(ctx.dbUser.language, "error_deposit_failed");

      switch (result.error) {
        case "minimum_amount":
          errorMessage = getText(
            ctx.dbUser.language,
            "deposit_minimum_error",
          ).replace("{min_amount}", String(MINIMUM_DEPOSIT_USD));
          await ctx.editMessageText(errorMessage);
          break;
        case "crypto_minimum_amount":
          // Show error and allow user to select another cryptocurrency
          await ctx.editMessageText(
            getText(ctx.dbUser.language, "deposit_crypto_minimum_error"),
            {
              parse_mode: "Markdown",
              reply_markup: getCryptoSelectionKeyboard(ctx.dbUser.language),
            },
          );
          // Keep the deposit state so user can try again with different crypto
          // Do NOT clear state here - user should be able to select another crypto
          return;
        case "crypto_estimate_unavailable":
          // Show error and allow user to select another cryptocurrency
          await ctx.editMessageText(
            getText(ctx.dbUser.language, "deposit_crypto_estimate_error"),
            {
              parse_mode: "Markdown",
              reply_markup: getCryptoSelectionKeyboard(ctx.dbUser.language),
            },
          );
          // Keep the deposit state so user can try again with different crypto
          // Do NOT clear state here - user should be able to select another crypto
          return;
        case "invalid_amount":
          errorMessage = getText(ctx.dbUser.language, "deposit_invalid_amount");
          await ctx.editMessageText(errorMessage);
          break;
        case "api_error":
          errorMessage = getText(ctx.dbUser.language, "deposit_api_error");
          await ctx.editMessageText(errorMessage);
          break;
        case "database_error":
          errorMessage = getText(ctx.dbUser.language, "error_database");
          await ctx.editMessageText(errorMessage);
          break;
        default:
          await ctx.editMessageText(errorMessage);
      }

      clearDepositState(userId);
    }
  });

  // Handle back button from crypto selection
  bot.action(CALLBACK_DATA.DEPOSIT_CRYPTO_BACK, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    const userId = ctx.dbUser.telegram_id;
    clearDepositState(userId);

    await showDepositMenu(ctx);
  });

  // Handle text messages for deposit flow
  bot.on("text", async (ctx: BotContext, next) => {
    // Skip if not in deposit flow
    if (!hasDbUser(ctx) || !hasLanguage(ctx) || !ctx.message) {
      return next();
    }

    const userId = ctx.dbUser.telegram_id;
    if (!isInDepositFlow(userId)) {
      return next();
    }

    const text = "text" in ctx.message ? ctx.message.text : undefined;

    if (!text) {
      return next();
    }

    try {
      const depositState = getDepositState(userId);
      if (!depositState || depositState.step !== "amount") {
        return next();
      }

      // Parse amount
      const amountUsd = Number.parseFloat(text);

      if (Number.isNaN(amountUsd) || amountUsd <= 0) {
        await ctx.reply(getText(ctx.dbUser.language, "deposit_invalid_amount"));
        return;
      }

      // Validate minimum amount
      if (amountUsd < MINIMUM_DEPOSIT_USD) {
        await ctx.reply(
          getText(ctx.dbUser.language, "deposit_minimum_error").replace(
            "{min_amount}",
            String(MINIMUM_DEPOSIT_USD),
          ),
        );
        return;
      }

      // Update state to security step
      setDepositState(userId, { step: "security", amountUsd });

      // Show security message
      const amountMc = calculateMcAmount(amountUsd);
      await ctx.reply(getText(ctx.dbUser.language, "deposit_security_title"));
      const securityMessage = formatTelegramText(
        getText(ctx.dbUser.language, "deposit_security_message"),
        {
          amount_usd: String(amountUsd),
          amount_mc: String(amountMc),
        },
      );
      await ctx.reply(securityMessage, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: getText(ctx.dbUser.language, "deposit_security_confirm"),
                callback_data: CALLBACK_DATA.DEPOSIT_SECURITY_CONFIRM,
              },
              {
                text: getText(ctx.dbUser.language, "deposit_security_cancel"),
                callback_data: CALLBACK_DATA.DEPOSIT_SECURITY_CANCEL,
              },
            ],
          ],
        },
      });
    } catch (err) {
      error("Error in deposit text handler", {
        userId,
        text,
        error: err instanceof Error ? err.message : String(err),
      });
      await ctx.reply(getText(ctx.dbUser.language, "error_deposit_failed"));
      clearDepositState(userId);
    }
  });
};

async function showDepositHistory(
  ctx: BotContextWithLanguage,
  page: number,
): Promise<void> {
  const userDeposits = await getUserDeposits(
    ctx.dbUser.telegram_id,
    DEPOSIT_PAGE_SIZE + 1,
  );
  const hasMore = userDeposits.length > DEPOSIT_PAGE_SIZE;
  const displayDeposits = userDeposits.slice(0, DEPOSIT_PAGE_SIZE);

  if (displayDeposits.length === 0) {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser.language, "deposit_history_empty"),
      {
        reply_markup: getDepositHistoryKeyboard(
          ctx.dbUser.language,
          page,
          false,
        ),
      },
    );
    return;
  }

  const items = displayDeposits
    .map((d) => {
      const date = new Date(d.created_at).toLocaleDateString(
        ctx.dbUser.language,
      );
      const status = getDepositStatusDisplay(d.status, ctx.dbUser.language);

      return formatTelegramText(
        getText(ctx.dbUser.language, "deposit_history_item"),
        {
          status,
          amount_usd: String(d.amount_usd),
          amount_mc: String(d.amount_mc),
          date,
        },
      );
    })
    .join("\n\n");

  const message = `${getText(ctx.dbUser.language, "deposit_history_title")}\n\n${items}`;

  await ctx.answerCbQuery();
  await ctx.editMessageText(message, {
    parse_mode: "Markdown",
    reply_markup: getDepositHistoryKeyboard(ctx.dbUser.language, page, hasMore),
  });
}
