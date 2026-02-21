import { getText } from "./locales";
import type {
  Language,
  MaybeOptional,
  ReferralLevel,
  ReferralStats,
  ReferralEarningRecord,
} from "@/types";

export function buildReferralBonusMessage(
  language: MaybeOptional<Language>,
  amount: number,
): string {
  return getText(language, "referral_bonus_received").replace(
    "{amount}",
    String(amount),
  );
}

export function buildReferralLevelMessage(
  language: MaybeOptional<Language>,
  level: number,
): string {
  return getText(language, "referral_level_n").replace(
    "{level}",
    String(level),
  );
}

export function buildBalanceMessage(
  language: MaybeOptional<Language>,
  balance: number,
): string {
  return getText(language, "menu_balance_message").replace(
    "{balance}",
    String(balance),
  );
}

export function buildWelcomeExistingUserMessage(
  language: MaybeOptional<Language>,
): string {
  return getText(language, "welcome_existing_user");
}

export function buildReferralDashboardMessage(
  language: MaybeOptional<Language>,
  code: string,
  stats: ReferralStats,
): string {
  const title = getText(language, "referral_dashboard_title");
  const statsSection = getText(language, "referral_stats_section");
  const levelsSection = getText(language, "referral_levels_section");

  const statsTotal = getText(language, "referral_stats_total").replace(
    "{count}",
    String(stats.totalReferrals),
  );
  const statsEarnings = getText(language, "referral_stats_earnings").replace(
    "{amount}",
    String(stats.totalEarnings),
  );

  const levels: { level: ReferralLevel; emoji: string }[] = [
    { level: 1, emoji: "🥇" },
    { level: 2, emoji: "🥈" },
    { level: 3, emoji: "🥉" },
    { level: 4, emoji: "  " },
    { level: 5, emoji: "  " },
  ];

  const levelLines = levels
    .map(({ level, emoji }) => {
      const key = `referral_level_${level}` as const;
      return `${emoji} ${getText(language, key).replace(
        "{count}",
        String(stats.referralsByLevel[level]),
      )}`;
    })
    .join("\n");

  const bonusInfo = getText(language, "referral_bonus_info");
  const codeText = getText(language, "menu_referral_code").replace(
    "{code}",
    code,
  );

  const now = new Date();
  const timeString = now.toLocaleTimeString(language ?? "en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const lastUpdated = getText(language, "referral_last_updated").replace(
    "{time}",
    timeString,
  );

  if (stats.totalReferrals === 0) {
    const noReferrals = getText(language, "referral_no_referrals");
    return `${title}

━━━━━━━━━━━━━━━━━━━━━━

${codeText}

${noReferrals}

━━━━━━━━━━━━━━━━━━━━━━

${bonusInfo}

${lastUpdated}`;
  }

  return `${title}

━━━━━ ${statsSection} ━━━━━

${statsTotal}
${statsEarnings}

━━━━━ ${levelsSection} ━━━━━

${levelLines}

━━━━━━━━━━━━━━━━━━━━━━

${codeText}

${bonusInfo}

${lastUpdated}`;
}

export function buildReferralHistoryMessage(
  language: MaybeOptional<Language>,
  history: ReferralEarningRecord[],
): string {
  const title = getText(language, "referral_history_title");

  if (history.length === 0) {
    const empty = getText(language, "referral_history_empty");
    return `${title}\n\n${empty}`;
  }

  const items = history
    .map((record) => {
      const date = formatDate(record.createdAt, language);
      return getText(language, "referral_history_item")
        .replace("{amount}", String(record.amount))
        .replace("{level}", String(record.level))
        .replace("{date}", date);
    })
    .join("\n");

  return `${title}\n\n${items}`;
}

function formatDate(date: Date, language: MaybeOptional<Language>): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 1000 / 60 / 60 / 24);

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / 1000 / 60 / 60);
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / 1000 / 60);
      return getText(language, "property_minutes_ago").replace(
        "{minutes}",
        String(diffMins),
      );
    }
    return getText(language, "property_hours_ago").replace(
      "{hours}",
      String(diffHours),
    );
  }
  return getText(language, "property_days_ago").replace(
    "{days}",
    String(diffDays),
  );
}
