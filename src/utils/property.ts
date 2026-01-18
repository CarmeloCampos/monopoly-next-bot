import type { Language, UserPropertyData } from "@/types";
import { isPropertyIndex, isPropertyLevel } from "@/utils/guards";
import { getText } from "@/i18n";
import { getPropertyIncome, type PropertyInfo } from "@/constants/properties";

const IMAGE_BASE_URL = "https://via.assets.so/img.jpg";

export function getPropertyImageUrl(
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

export function getServiceImageUrl(
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

export function buildPropertyDetailMessage(
  property: UserPropertyData,
  propertyInfo: PropertyInfo,
  language: Language,
): string {
  const propertyName = getText(language, propertyInfo.nameKey);

  // Validate property_index and level before using with getPropertyIncome
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

  return (
    `🏢 ${propertyName}\n\n` +
    `${getText(language, "property_level").replace("{level}", String(property.level))}\n` +
    `${getText(language, "property_hourly_income").replace("{income}", hourlyIncome.toFixed(2))}\n` +
    `${getText(language, "property_monthly_income").replace("{income}", monthlyIncome.toFixed(0))}\n` +
    `${getText(language, "property_accumulated").replace("{amount}", property.accumulated_unclaimed.toFixed(2))}\n\n` +
    `${getText(language, "property_last_updated").replace("{time}", lastUpdated)}`
  );
}
