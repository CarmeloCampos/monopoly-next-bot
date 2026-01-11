# Monopoly Next Bot

A Telegram bot built with Telegraf and Bun for managing Monopoly games.

## Installation

```bash
bun install
```

## Setup

1. Create a `.env` file from the example:

```bash
cp .env.example .env
```

2. Get your bot token from [@BotFather](https://t.me/BotFather) on Telegram
3. Add your token to the `.env` file:

```
BOT_TOKEN=your_telegram_bot_token_here
LOG_LEVEL=debug
```

## Running

Development (with hot reload):

```bash
bun run dev
```

Production:

```bash
bun start
```

## Project Structure

- `src/bot/` - Bot initialization
- `src/config/` - Configuration management
- `src/handlers/` - Command and message handlers
- `src/middlewares/` - Custom middleware
- `src/modules/` - Feature modules
- `src/types/` - TypeScript types
- `src/utils/` - Utility functions

## Available Commands

- `/start` - Start the bot
- `/help` - Show help message

This project uses [Bun](https://bun.com) as a fast all-in-one JavaScript runtime.
