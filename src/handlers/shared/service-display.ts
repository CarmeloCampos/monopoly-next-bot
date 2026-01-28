import type { BotContextWithLanguage, MaybeOptional, Language } from "@/types";
import { isServiceIndex, isLanguage } from "@/utils/guards";
import { getText } from "@/i18n";
import { getUserServices } from "@/services/service";
import { getServiceByIndex } from "@/constants/services";
import { getServiceImageUrl } from "@/utils/property";
import { getServiceNavigationKeyboard } from "@/keyboards";

interface SendServiceCardParams {
  ctx: BotContextWithLanguage;
  serviceIndex: number;
  isNavigation: boolean;
}

export async function sendServiceCard(
  params: SendServiceCardParams,
): Promise<void> {
  const { ctx, serviceIndex, isNavigation } = params;
  const { dbUser } = ctx;

  const services = await getUserServices(dbUser.telegram_id);

  if (services.length === 0) {
    if (isNavigation) {
      await ctx.deleteMessage();
      return;
    }

    await ctx.reply(getText(dbUser.language, "service_no_services"), {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: getText(dbUser.language, "btn_back"),
              callback_data: "service_back",
            },
          ],
        ],
      },
    });
    return;
  }

  if (serviceIndex < 0 || serviceIndex >= services.length) {
    if (isNavigation) {
      return;
    }
    await ctx.reply(getText(dbUser.language, "error_service_not_found"));
    return;
  }

  const service = services[serviceIndex];
  if (!service) {
    if (isNavigation) {
      return;
    }
    await ctx.reply(getText(dbUser.language, "error_service_not_found"));
    return;
  }

  if (!isServiceIndex(service.service_index)) {
    if (isNavigation) {
      return;
    }
    await ctx.reply(getText(dbUser.language, "error_service_not_found"));
    return;
  }

  const validServiceIndex = service.service_index;
  const serviceInfo = getServiceByIndex(validServiceIndex);

  if (!serviceInfo) {
    if (isNavigation) {
      return;
    }
    await ctx.reply(getText(dbUser.language, "error_service_not_found"));
    return;
  }

  const imageUrl = getServiceImageUrl(validServiceIndex);

  const detailMessage = buildServiceDetailMessage(
    service,
    serviceInfo,
    dbUser.language,
  );

  const keyboard = getServiceNavigationKeyboard(serviceIndex, services.length);

  if (isNavigation) {
    if (ctx.callbackQuery?.message && "photo" in ctx.callbackQuery.message) {
      await ctx.editMessageMedia(
        {
          type: "photo",
          media: imageUrl,
          caption: detailMessage,
          parse_mode: "Markdown",
        },
        { reply_markup: keyboard },
      );
    } else {
      await ctx.editMessageText(detailMessage, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
    }
  } else {
    await ctx.replyWithPhoto(imageUrl, {
      caption: detailMessage,
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }
}

function buildServiceDetailMessage(
  service: { service_index: number; purchased_at: Date },
  serviceInfo: {
    nameKey: string;
    type: string;
    cost: number;
    boostPercentage: number;
  },
  language: MaybeOptional<Language>,
): string {
  const languageParam = language ?? "en";

  if (!isLanguage(languageParam)) {
    return getText("en", serviceInfo.nameKey);
  }

  const serviceName = getText(languageParam, serviceInfo.nameKey);
  const boostText = `${serviceInfo.boostPercentage}%`;

  return (
    `⚡ **${serviceName}**\n\n` +
    `${getText(languageParam, "service_type")}: ${serviceInfo.type}\n` +
    `${getText(languageParam, "service_cost_label")}: ${serviceInfo.cost} MC\n` +
    `${getText(languageParam, "service_boost_label")}: +${boostText}\n\n` +
    `${getText(languageParam, "service_purchased_at")}: ${service.purchased_at.toLocaleDateString()}`
  );
}
