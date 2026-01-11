---
name: bun
description: Provides comprehensive Bun runtime conventions including CLI usage, built-in APIs, testing, frontend development, and Telegram Bot patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: runtime
  runtime: bun
---

## What I Do

I provide all the conventions and best practices for using Bun as the primary JavaScript runtime in this project. I cover:

### Runtime Commands

- Execute files with `bun <file>` instead of `node` or `ts-node`
- Install dependencies with `bun install` instead of npm/yarn/pnpm
- Run scripts with `bun run <script>` instead of npm/yarn run
- Run tests with `bun test` instead of jest or vitest
- Build bundles with `bun build <file>` instead of webpack or esbuild
- Execute package binaries with `bunx <package> <command>` instead of npx

### Built-in APIs (Don't use Node.js alternatives)

- **Server**: Use `Bun.serve()` instead of express (supports WebSockets, HTTPS, and routing)
- **SQLite**: Use `bun:sqlite` instead of better-sqlite3
- **Redis**: Use `Bun.redis` instead of ioredis
- **Postgres**: Use `Bun.sql` instead of pg or postgres.js
- **WebSockets**: Use built-in `WebSocket` instead of ws package
- **File System**: Prefer `Bun.file` over `node:fs` readFile/writeFile
- **Shell Commands**: Use `Bun.$`ls`` instead of execa

### Environment Variables

- Bun automatically loads `.env` files
- Do not use dotenv package
- Access environment variables directly via `process.env`

### Testing Framework

Use `bun test` with the following pattern:

```ts
import { test, expect } from "bun:test";

test("example test", () => {
  expect(1).toBe(1);
});
```

### Frontend Development

- Use HTML imports with `Bun.serve()` instead of vite
- HTML files can import `.tsx`, `.jsx`, or `.js` files directly
- Bun's bundler transpiles and bundles automatically
- `<link>` tags can point to stylesheets for CSS bundling
- Run dev server with `bun --hot ./index.ts`

### Server Template

```ts
import index from "./index.html";

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    },
  },
  development: {
    hmr: true,
    console: true,
  },
});
```

### HTML Import Template

```html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With frontend:

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

### Telegram Bot Specifics

- Use `telegraf` package for Telegram Bot API
- Configure bot token via `BOT_TOKEN` environment variable
- Use polling mode for receiving updates
- Use custom logger from `src/utils/logger.ts`
- Path aliases use `@/` prefix (e.g., `@/config/index.ts`)

## When to Use Me

Use this skill whenever you are:

- Writing or modifying any JavaScript/TypeScript code
- Running tests or scripts
- Setting up server infrastructure
- Working with databases (SQLite, Redis, Postgres)
- Building frontend with HTML/React
- Creating or modifying Telegram Bot functionality
- Installing dependencies or running build commands

Always default to Bun instead of Node.js in this project.

## Implementation Notes

### Core Principles

1. **No Node.js alternatives**: Always use Bun's built-in APIs instead of their Node.js equivalents
2. **Automatic env loading**: Never install or use dotenv
3. **Unified toolchain**: All operations (test, build, install, run) use bun commands
4. **Hot module replacement**: Use `bun --hot` for development servers
5. **TypeScript support**: Bun handles TypeScript compilation natively

### File System Operations

```ts
// Preferred
const file = Bun.file("path/to/file.txt");
const content = await file.text();
Bun.write("path/to/file.txt", content);

// Avoid (node:fs)
import { readFile, writeFile } from "node:fs";
```

### Shell Commands

```ts
// Preferred
const result = await Bun.$`ls -la`;

// Avoid (execa)
import execa from "execa";
await execa("ls", ["-la"]);
```

### Database Connections

```ts
// SQLite
import { Database } from "bun:sqlite";
const db = new Database("data.db");

// Redis
const redis = new Bun.Redis({
  url: "redis://localhost:6379",
});

// Postgres
const sql = Bun.sql({
  url: "postgres://localhost:5432/db",
});
```

### Reference Documentation

For detailed API documentation, refer to `node_modules/bun-types/docs/**.mdx` in the project.

## Common Patterns

### Running the Project

```bash
# Install dependencies
bun install

# Run development server
bun --hot ./index.ts

# Run tests
bun test

# Build for production
bun build ./src/index.ts --outdir ./dist

# Run package scripts
bun run dev
bun run build
bun run test
```

### Importing with Path Aliases

```ts
import { logger } from "@/utils/logger";
import config from "@/config/index";
```

Ensure `tsconfig.json` has proper path mapping configured for `@/` prefix.
