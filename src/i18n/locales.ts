/**
 * Translation locales for multi-language support
 * Main language: Russian (ru)
 * Supported languages: Russian, English, Spanish, Portuguese
 */

import type { Language, MaybeOptional } from "@/types/utils";
import { warn } from "@/utils/logger";
import { LANGUAGE_NAMES } from "@/constants";

export const LANGUAGE_CALLBACK_PATTERN = /^lang_(ru|en|es|pt)$/;

interface Locales {
  ru: Record<string, string>;
  en: Record<string, string>;
  es: Record<string, string>;
  pt: Record<string, string>;
}

const locales: Locales = {
  ru: {
    language_selection: "Пожалуйста, выберите язык",
    language_selected: "Язык успешно выбран! Добро пожаловать!",
    welcome: "👋 Добро пожаловать в Monopoly Bot!",
    referral_code: "Ваш реферальный код:",
    share_referral: "Поделитесь им с друзьями, чтобы получить награды!",
    help_title: "📚 Доступные команды:",
    cmd_start: "/start - Запустить бота",
    cmd_help: "/help - Показать это сообщение",
    more_commands: "Больше команд скоро!",
    menu_properties: "🏠 Недвижимость",
    menu_balance: "💰 MonopolyCoins",
    menu_advance: "🎲 Вперёд",
    menu_referral: "👥 Рефералы",
    menu_minigames: "🎮 Мини-игры",
    menu_settings: "⚙️ Настройки",
    settings_language: "🌐 Изменить язык",
    settings_support: "💬 Поддержка",
    settings_channels: "📢 Каналы",
    channel_official: "Официальный канал",
    channel_community: "Сообщество",
    channel_news: "Новости",
    btn_back: "◀️ Назад",
    welcome_new_user:
      "🎉 Добро пожаловать в Monopoly Bot!\n\nВы получили свою первую недвижимость: *Стартовая Квартира*\n\nНачните строить свою империю!",
    referral_bonus_received:
      "🎁 Вы получили {amount} MC за использование реферального кода!",
    invalid_message: "❓ Я не понимаю это сообщение. Используйте меню ниже.",
    error_user_not_found:
      "❌ Ошибка: Пользователь не найден. Попробуйте снова.",
    error_referral_code_not_found: "Код реферала не найден",
    referral_level_n: "Реферал уровень {level}",
    referral_welcome_bonus: "Бонус приветствия за реферала",
    menu_properties_coming_soon: "🏠 Недвижимость - Скоро...",
    menu_balance_message: "💰 Ваш баланс: {balance} MC",
    menu_advance_coming_soon: "🎲 Вперёд - Скоро...",
    menu_referral_code: "👥 Ваш реферальный код: `{code}`",
    menu_referral_share_link:
      "\n\nПоделитесь этой ссылкой:\nt.me/MonopolyFunBot?start={code}",
    menu_minigames_coming_soon: "🎮 Мини-игры - Скоро...",
    error_invalid_callback: "Неверный callback",
    error_invalid_language: "Неверный язык",
    error_updating_language: "Ошибка при обновлении языка",
    settings_support_message:
      "💬 Для поддержки напишите: @MonopolyFunBotSupport",
  },
  en: {
    language_selection: "Please select your language",
    language_selected: "Language selected successfully! Welcome!",
    welcome: "👋 Welcome to Monopoly Bot!",
    referral_code: "Your referral code:",
    share_referral: "Share it with friends to earn rewards!",
    help_title: "📚 Available Commands:",
    cmd_start: "/start - Start bot",
    cmd_help: "/help - Show this help message",
    more_commands: "More commands coming soon!",
    menu_properties: "🏠 Properties",
    menu_balance: "💰 MonopolyCoins",
    menu_advance: "🎲 Advance",
    menu_referral: "👥 Referrals",
    menu_minigames: "🎮 Mini-games",
    menu_settings: "⚙️ Settings",
    settings_language: "🌐 Change Language",
    settings_support: "💬 Support",
    settings_channels: "📢 Channels",
    channel_official: "Official Channel",
    channel_community: "Community",
    channel_news: "News",
    btn_back: "◀️ Back",
    welcome_new_user:
      "🎉 Welcome to Monopoly Bot!\n\nYou received your first property: *Startup Apartment*\n\nStart building your empire!",
    referral_bonus_received:
      "🎁 You received {amount} MC for using a referral code!",
    invalid_message: "❓ I don't understand that message. Use the menu below.",
    error_user_not_found: "❌ Error: User not found. Please try again.",
    error_referral_code_not_found: "Referral code not found",
    referral_level_n: "Referral level {level}",
    referral_welcome_bonus: "Welcome bonus for referral",
    menu_properties_coming_soon: "🏠 Properties - Coming soon...",
    menu_balance_message: "💰 Your balance: {balance} MC",
    menu_advance_coming_soon: "🎲 Advance - Coming soon...",
    menu_referral_code: "👥 Your referral code: `{code}`",
    menu_referral_share_link:
      "\n\nShare this link:\nt.me/MonopolyFunBot?start={code}",
    menu_minigames_coming_soon: "🎮 Mini-games - Coming soon...",
    error_invalid_callback: "Invalid callback",
    error_invalid_language: "Invalid language",
    error_updating_language: "Error updating language",
    settings_support_message: "💬 For support, contact: @MonopolyFunBotSupport",
  },
  es: {
    language_selection: "Por favor, selecciona tu idioma",
    language_selected: "¡Idioma seleccionado con éxito! ¡Bienvenido!",
    welcome: "👋 ¡Bienvenido a Monopoly Bot!",
    referral_code: "Tu código de referido:",
    share_referral: "¡Compártelo con amigos para ganar recompensas!",
    help_title: "📚 Comandos disponibles:",
    cmd_start: "/start - Iniciar bot",
    cmd_help: "/help - Mostrar este mensaje de ayuda",
    more_commands: "¡Más comandos pronto!",
    menu_properties: "🏠 Propiedades",
    menu_balance: "💰 MonopolyCoins",
    menu_advance: "🎲 Avanzar",
    menu_referral: "👥 Referidos",
    menu_minigames: "🎮 Minijuegos",
    menu_settings: "⚙️ Configuración",
    settings_language: "🌐 Cambiar Idioma",
    settings_support: "💬 Soporte",
    settings_channels: "📢 Canales",
    channel_official: "Canal Oficial",
    channel_community: "Comunidad",
    channel_news: "Noticias",
    btn_back: "◀️ Volver",
    welcome_new_user:
      "🎉 ¡Bienvenido a Monopoly Bot!\n\nHas recibido tu primera propiedad: *Apartamento Emprender*\n\n¡Empieza a construir tu imperio!",
    referral_bonus_received:
      "🎁 ¡Has recibido {amount} MC por usar un código de referido!",
    invalid_message: "❓ No entiendo ese mensaje. Usa el menú de abajo.",
    error_user_not_found:
      "❌ Error: Usuario no encontrado. Por favor intenta de nuevo.",
    error_referral_code_not_found: "Código de referido no encontrado",
    referral_level_n: "Referido nivel {level}",
    referral_welcome_bonus: "Bono de bienvenida por referido",
    menu_properties_coming_soon: "🏠 Propiedades - Próximamente...",
    menu_balance_message: "💰 Tu balance: {balance} MC",
    menu_advance_coming_soon: "🎲 Avanzar - Próximamente...",
    menu_referral_code: "👥 Tu código de referido: `{code}`",
    menu_referral_share_link:
      "\n\nComparte este enlace:\nt.me/MonopolyFunBot?start={code}",
    menu_minigames_coming_soon: "🎮 Minijuegos - Próximamente...",
    error_invalid_callback: "Callback inválido",
    error_invalid_language: "Idioma inválido",
    error_updating_language: "Error al actualizar el idioma",
    settings_support_message:
      "💬 Para soporte, contacta: @MonopolyFunBotSupport",
  },
  pt: {
    language_selection: "Por favor, selecione seu idioma",
    language_selected: "Idioma selecionado com sucesso! Bem-vindo!",
    welcome: "👋 Bem-vindo ao Monopoly Bot!",
    referral_code: "Seu código de referência:",
    share_referral: "Compartilhe com amigos para ganhar recompensas!",
    help_title: "📚 Comandos disponíveis:",
    cmd_start: "/start - Iniciar bot",
    cmd_help: "/help - Mostrar esta mensagem de ajuda",
    more_commands: "Mais comandos em breve!",
    menu_properties: "🏠 Propriedades",
    menu_balance: "💰 MonopolyCoins",
    menu_advance: "🎲 Avançar",
    menu_referral: "👥 Indicações",
    menu_minigames: "🎮 Mini-jogos",
    menu_settings: "⚙️ Configurações",
    settings_language: "🌐 Mudar Idioma",
    settings_support: "💬 Suporte",
    settings_channels: "📢 Canais",
    channel_official: "Canal Oficial",
    channel_community: "Comunidade",
    channel_news: "Notícias",
    btn_back: "◀️ Voltar",
    welcome_new_user:
      "🎉 Bem-vindo ao Monopoly Bot!\n\nVocê recebeu sua primeira propriedade: *Apartamento Empreender*\n\nComece a construir seu império!",
    referral_bonus_received:
      "🎁 Você recebeu {amount} MC por usar um código de indicação!",
    invalid_message: "❓ Não entendo essa mensagem. Use o menu abaixo.",
    error_user_not_found:
      "❌ Erro: Usuário não encontrado. Por favor tente novamente.",
    error_referral_code_not_found: "Código de referência não encontrado",
    referral_level_n: "Indicação nível {level}",
    referral_welcome_bonus: "Bônus de boas-vindas por indicação",
    menu_properties_coming_soon: "🏠 Propriedades - Em breve...",
    menu_balance_message: "💰 Seu saldo: {balance} MC",
    menu_advance_coming_soon: "🎲 Avançar - Em breve...",
    menu_referral_code: "👥 Seu código de referência: `{code}`",
    menu_referral_share_link:
      "\n\nCompartilhe este link:\nt.me/MonopolyFunBot?start={code}",
    menu_minigames_coming_soon: "🎮 Mini-jogos - Em breve...",
    error_invalid_callback: "Callback inválido",
    error_invalid_language: "Idioma inválido",
    error_updating_language: "Erro ao atualizar idioma",
    settings_support_message:
      "💬 Para suporte, contate: @MonopolyFunBotSupport",
  },
};

/**
 * Type guard to check if a value is a valid Language
 */
export function isLanguage(value: MaybeOptional<string>): value is Language {
  return value === "ru" || value === "en" || value === "es" || value === "pt";
}

/**
 * Get a text translation by key and language
 * Falls back to Russian if key not found in target language
 */
export function getText(
  language: MaybeOptional<Language>,
  key: string,
): string {
  const lang = isLanguage(language) ? language : "ru";
  const translation = locales[lang][key];

  if (!translation) {
    warn("Translation not found", { key, language: lang });
    return key;
  }

  return translation;
}

/**
 * Check if a user has a language set
 */
export function hasLanguage(language: MaybeOptional<Language>): boolean {
  return language !== null && language !== undefined && isLanguage(language);
}

export function getSupportedLanguages(): readonly ["ru", "en", "es", "pt"] {
  return ["ru", "en", "es", "pt"];
}

export function getLanguageName(lang: Language): string {
  return LANGUAGE_NAMES[lang];
}
