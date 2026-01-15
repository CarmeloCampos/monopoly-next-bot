import type { Context } from "telegraf";
import type { SelectUser } from "./db";

interface BotState {}

interface BotContext extends Context {
  session?: BotState;
  dbUser?: SelectUser;
}

export type { BotState, BotContext };
export * from "./utils";
export * from "./db";
