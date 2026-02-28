import { Telegraf } from "telegraf";
import {
  type BotContext,
  hasDbUser,
  hasLanguage,
  isPropertyIndex,
  type UpgradeFailure,
} from "@/types";
import { getText } from "@/i18n";
import {
  answerInvalidCallback,
  extractValidatedIndex,
} from "@/utils/callback-helpers";
import { CALLBACK_PATTERNS } from "@/constants";
import { upgradeProperty } from "@/services/upgrade";
import { getUserProperties } from "@/services/property";
import { getPropertyByIndex, type PropertyIndex } from "@/constants/properties";
import { sendPropertyCard } from "@/handlers/shared/property-display";
import { formatTelegramText } from "@/utils/telegram-format";

interface UpgradeFailureParams {
  ctx: BotContext;
  result: UpgradeFailure;
  propertyIndex: PropertyIndex;
}

async function handleUpgradeError(params: UpgradeFailureParams): Promise<void> {
  const { ctx, result, propertyIndex } = params;
  if (!hasLanguage(ctx)) return;
  const { language } = ctx.dbUser;

  switch (result.code) {
    case "cannot_upgrade_free_property":
      await ctx.answerCbQuery(
        getText(language, "property_upgrade_free_property"),
      );
      break;
    case "max_level_reached":
      await ctx.answerCbQuery(getText(language, "property_upgrade_max_level"));
      break;
    case "insufficient_balance":
      if (result.needed) {
        const msg = formatTelegramText(
          getText(language, "property_upgrade_insufficient_balance"),
          { needed: String(result.needed) },
        );
        await ctx.answerCbQuery(msg);
      } else {
        await ctx.answerCbQuery(
          formatTelegramText(
            getText(language, "property_upgrade_insufficient_balance"),
            { needed: "0" },
          ),
        );
      }
      break;
    case "color_requirement_not_met": {
      const property = getPropertyByIndex(propertyIndex);
      const color = property
        ? property.color.charAt(0).toUpperCase() + property.color.slice(1)
        : "";
      const colorKey = property?.color ?? "unknown";

      // Basic message in callback
      const basicMsg = formatTelegramText(
        getText(language, "property_upgrade_color_requirement"),
        { color },
      );
      await ctx.answerCbQuery(basicMsg);

      // Detailed message in chat
      if (result.colorDetails) {
        const { owned, required, missingCount, lowLevelCount } =
          result.colorDetails;
        const colorName = getText(language, `color_${colorKey}`);

        const messageParts: string[] = [
          formatTelegramText(
            getText(language, "property_upgrade_color_requirement_detailed"),
            {
              color: colorName,
              owned: String(owned),
              required: String(required),
            },
          ),
        ];

        if (missingCount > 0) {
          messageParts.push(
            formatTelegramText(
              getText(language, "property_upgrade_missing_properties"),
              { count: String(missingCount) },
            ),
          );
        }

        if (lowLevelCount > 0) {
          messageParts.push(
            formatTelegramText(
              getText(language, "property_upgrade_low_level_properties"),
              { count: String(lowLevelCount) },
            ),
          );
        }

        await ctx.reply(messageParts.join("\n"));
      }
      break;
    }
    default:
      await ctx.answerCbQuery(getText(language, "property_upgrade_error"));
  }
}

export function registerUpgradeCallbacks(bot: Telegraf<BotContext>): void {
  bot.action(CALLBACK_PATTERNS.PROPERTY_UPGRADE, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) return;

    const propertyIndex = extractValidatedIndex(
      ctx,
      CALLBACK_PATTERNS.PROPERTY_UPGRADE,
      isPropertyIndex,
    );
    if (propertyIndex === null) {
      await answerInvalidCallback(ctx);
      return;
    }

    const upgradeResult = await upgradeProperty({
      userId: ctx.dbUser.telegram_id,
      propertyIndex,
    });

    if (!upgradeResult.success) {
      await handleUpgradeError({
        ctx,
        result: upgradeResult,
        propertyIndex,
      });
      return;
    }

    const properties = await getUserProperties(ctx.dbUser.telegram_id);
    const currentIndex = properties.findIndex(
      (p) => p.property_index === propertyIndex,
    );

    if (currentIndex === -1) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "property_upgrade_error"),
      );
      return;
    }

    const property = getPropertyByIndex(propertyIndex);
    let successMessage: string;

    if (property) {
      const propertyName = getText(ctx.dbUser.language, property.nameKey);
      const upgradedProperty =
        currentIndex >= 0 ? properties[currentIndex] : undefined;
      const newLevel = upgradedProperty ? upgradedProperty.level : 0;
      successMessage = formatTelegramText(
        getText(ctx.dbUser.language, "property_upgrade_success"),
        {
          property: propertyName,
          level: String(newLevel),
        },
      );
    } else {
      successMessage = formatTelegramText(
        getText(ctx.dbUser.language, "property_upgrade_success"),
        {
          property: "Property",
          level: "2",
        },
      );
    }

    await ctx.answerCbQuery(successMessage);
    await sendPropertyCard({
      ctx,
      propertyIndex: currentIndex >= 0 ? currentIndex : 0,
      isNavigation: true,
    });
  });
}
