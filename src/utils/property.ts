import type { Language, UserPropertyData } from "@/types";
import {
  isPropertyIndex,
  isPropertyLevel,
  isServiceIndex,
} from "@/utils/guards";
import { getText } from "@/i18n";
import {
  getPropertyIncome,
  type PropertyInfo,
  type PropertyColor,
} from "@/constants/properties";
import { PROPERTY_IMAGES, SERVICE_IMAGES } from "@/constants/images";
import { formatTelegramText } from "@/utils/telegram-format";

const COLOR_EMOJIS: Record<PropertyColor, string> = {
  brown: "🟤",
  orange: "🟧",
  red: "🔴",
  blue: "🔵",
};

const IMAGE_BASE_URL = "https://via.assets.so/img.jpg";

function fallbackPropertyImageUrl(
  propertyIndex: number,
  propertyName: string,
): string {
  const encodedName = encodeURIComponent(propertyName);
  const text = `${propertyIndex}_${encodedName}`;
  const gradient = encodeURIComponent(
    "linear-gradient(60deg, black, gray, #da214e, #fab34a, #E21143, #4a4def)",
  );

  const params = new URLSearchParams({
    w: "400",
    h: "400",
    pattern: "dots",
    gradient,
    text,
    f: "png",
  });

  return `${IMAGE_BASE_URL}?${params.toString()}`;
}

function fallbackServiceImageUrl(
  serviceIndex: number,
  serviceName: string,
): string {
  const encodedName = encodeURIComponent(serviceName);
  const text = `service_${serviceIndex}_${encodedName}`;
  const gradient = encodeURIComponent(
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  );

  const params = new URLSearchParams({
    w: "400",
    h: "400",
    pattern: "stripes",
    gradient,
    text,
    f: "png",
  });

  return `${IMAGE_BASE_URL}?${params.toString()}`;
}

export function getPropertyImageUrl(
  propertyIndex: number,
  level: number,
): string {
  if (!isPropertyIndex(propertyIndex) || !isPropertyLevel(level)) {
    return fallbackPropertyImageUrl(propertyIndex, `property_${propertyIndex}`);
  }

  const images = PROPERTY_IMAGES[propertyIndex];
  return images[level];
}

export function getServiceImageUrl(serviceIndex: number): string {
  if (!isServiceIndex(serviceIndex)) {
    return fallbackServiceImageUrl(serviceIndex, `service_${serviceIndex}`);
  }

  return SERVICE_IMAGES[serviceIndex];
}

function formatElapsedTime(date: Date, language: Language): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return getText(language, "property_days_ago").replace(
      "{days}",
      String(diffDays),
    );
  }
  if (diffHours > 0) {
    return getText(language, "property_hours_ago").replace(
      "{hours}",
      String(diffHours),
    );
  }
  return getText(language, "property_minutes_ago").replace(
    "{minutes}",
    String(Math.floor(diffMs / (1000 * 60))),
  );
}

interface PropertyProgressInfo {
  currentIndex: number;
  totalProperties: number;
  colorOwned: number;
  colorTotal: number;
  colorMinLevel: number;
}

export function buildPropertyDetailMessage(
  property: UserPropertyData,
  propertyInfo: PropertyInfo,
  language: Language,
  progressInfo?: PropertyProgressInfo,
): string {
  const propertyName = getText(language, propertyInfo.nameKey);
  const colorEmoji = COLOR_EMOJIS[propertyInfo.color];
  const colorName = getText(language, `color_${propertyInfo.color}`);

  const validIndex = isPropertyIndex(property.property_index)
    ? property.property_index
    : null;
  const validLevel = isPropertyLevel(property.level) ? property.level : null;

  const income =
    validIndex !== null && validLevel !== null
      ? getPropertyIncome(validIndex, validLevel)
      : undefined;

  const hourlyIncome = income ?? 0;
  const monthlyIncome = hourlyIncome * 24 * 30;

  const lastUpdated = formatElapsedTime(property.last_generated_at, language);

  let message = `${colorEmoji} ${propertyName}\n\n`;

  // Add progress indicator if available
  if (progressInfo) {
    const progressText = formatTelegramText(
      getText(language, "property_progress"),
      {
        current: String(progressInfo.currentIndex + 1),
        total: String(progressInfo.totalProperties),
      },
    );
    message += `${progressText}\n`;

    const setProgressText = formatTelegramText(
      getText(language, "property_set_progress"),
      {
        color: colorName,
        owned: String(progressInfo.colorOwned),
        total: String(progressInfo.colorTotal),
        minLevel: String(progressInfo.colorMinLevel),
      },
    );
    message += `${setProgressText}\n\n`;
  }

  message += `${getText(
    language,
    "property_color_label",
  )}: ${colorEmoji} ${colorName}\n${formatTelegramText(
    getText(language, "property_level"),
    { level: String(property.level) },
  )}\n${formatTelegramText(getText(language, "property_hourly_income"), {
    income: hourlyIncome.toFixed(2),
  })}\n${formatTelegramText(getText(language, "property_monthly_income"), {
    income: String(monthlyIncome.toFixed(0)),
  })}\n${formatTelegramText(getText(language, "property_accumulated"), {
    amount: property.accumulated_unclaimed.toFixed(2),
  })}\n\n${formatTelegramText(getText(language, "property_last_updated"), {
    time: lastUpdated,
  })}`;

  return message;
}
