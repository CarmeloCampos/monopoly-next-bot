import type { BotContextWithLanguage, MaybeOptional, Language } from "@/types";
import { isServiceIndex, isLanguage } from "@/utils/guards";
import { getText } from "@/i18n";
import { getUserServices } from "@/services/service";
import { getServiceByIndex, type ServiceInfo } from "@/constants/services";
import { getServiceImageUrl } from "@/utils/property";
import { getServiceNavigationKeyboard } from "@/keyboards";
import { displayMediaCard } from "./media-display";

interface SendServiceCardParams {
  ctx: BotContextWithLanguage;
  serviceIndex: number;
  isNavigation: boolean;
}

interface UserServiceData {
  service_index: number;
  purchased_at: Date;
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

  await displayMediaCard({
    ctx,
    imageUrl,
    caption: detailMessage,
    keyboard,
    isNavigation,
  });
}

function buildServiceDetailMessage(
  service: UserServiceData,
  serviceInfo: ServiceInfo,
  language: MaybeOptional<Language>,
): string {
  const languageParam = language ?? "en";

  if (!isLanguage(languageParam)) {
    return getText("en", serviceInfo.nameKey);
  }

  const serviceName = getText(languageParam, serviceInfo.nameKey);
  const boostText = `${serviceInfo.boostPercentage}%`;

  let message =
    `⚡ **${serviceName}**\n\n` +
    `${getText(languageParam, "service_type")}: ${serviceInfo.type}\n` +
    `${getText(languageParam, "service_cost_label")}: ${serviceInfo.cost} MC\n` +
    `${getText(languageParam, "service_boost_label")}: +${boostText}\n\n` +
    `${getText(languageParam, "service_purchased_at")}: ${service.purchased_at.toLocaleDateString()}`;

  // Add train collection info if this is a train
  if (serviceInfo.type === "train") {
    message += getTrainCollectionInfo(languageParam);
  }

  return message;
}

function getTrainCollectionInfo(language: Language): string {
  return (
    `\n\n🚂 ${getText(language, "service_train_collection_info")}\n` +
    `• 2 ${getText(language, "service_trains")}: +10%\n` +
    `• 3 ${getText(language, "service_trains")}: +20%\n` +
    `• 4 ${getText(language, "service_trains")}: +35%`
  );
}
