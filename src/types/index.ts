import type { Context } from "telegraf";

interface BotState {}

interface BotContext extends Context {
  session?: BotState;
}

export type { BotState, BotContext };
