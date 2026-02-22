/**
 * Telegram message formatting utilities for Markdown
 *
 * NOTE: This project uses Telegram Markdown (legacy), NOT MarkdownV2.
 * For Markdown legacy, only these characters need escaping:
 * - `_` *italic*
 * - `*` *bold*
 * - `` ` `` `code`
 * - `[` `]` (only when part of links)
 * - `\` escape character
 *
 * NOTE: `()` do NOT need escaping in Telegram Markdown legacy.
 */

const MARKDOWN_LEGACY_ESCAPE_REGEX = new RegExp("([_*\\[\\]\\\\`])", "g");

function escapeTelegramMarkdown(text: string): string {
  return text.replace(MARKDOWN_LEGACY_ESCAPE_REGEX, "\\$1");
}

interface FormatReplacements {
  [key: string]: string;
}

export function formatTelegramText(
  template: string,
  replacements: FormatReplacements,
): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{${key}}`;
    const escapedValue = escapeTelegramMarkdown(String(value));
    result = result.split(placeholder).join(escapedValue);
  }
  return result;
}
