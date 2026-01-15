/**
 * Pre-built message templates for common bot responses
 */

import { getText } from "./locales";
import type { Language, MaybeOptional } from "@/types/utils";

/**
 * Build the welcome message with referral code
 */
export function buildWelcomeMessage(
  language: MaybeOptional<Language>,
  referralCode: string,
): string {
  return (
    getText(language, "welcome") +
    "\n\n" +
    getText(language, "referral_code") +
    " `" +
    referralCode +
    "`\n\n" +
    getText(language, "share_referral") +
    "\n\n" +
    getText(language, "help_title") +
    "\n" +
    getText(language, "cmd_start") +
    "\n" +
    getText(language, "cmd_help") +
    "\n\n" +
    getText(language, "more_commands")
  );
}

/**
 * Build the help message with available commands
 */
export function buildHelpMessage(language: MaybeOptional<Language>): string {
  return (
    getText(language, "help_title") +
    "\n\n" +
    getText(language, "cmd_start") +
    "\n" +
    getText(language, "cmd_help") +
    "\n\n" +
    getText(language, "more_commands")
  );
}
