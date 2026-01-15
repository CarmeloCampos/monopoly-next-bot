---
name: drizzle-orm
description: Best practices for Drizzle ORM with query API, relations v2, type safety, transactions, performance optimization, schema definition, error handling, connection management, migrations, and Bun integration
license: MIT
compatibility: both
metadata:
  category: database
  audience: developers
  language: typescript
---

## What I Do

Provide complete best practices for working with Drizzle ORM in this project:

- Correct use of query API (query vs select)
- Schema definition with v2 relations using `defineRelations()`
- Type safety without type assertions
- Robust transaction handling for atomic operations
- Performance optimization with prepared statements and column selection
- Schema definition with proper foreign keys and constraints
- Error handling with contextual logging using project logger
- Efficient connection management and pooling
- Migration practices with drizzle-kit
- Optimal integration with Bun runtime

## When to Use Me

Use this skill when you are:

- Developing a new application with Drizzle ORM
- Defining or modifying database schemas
- Working with relationships between tables
- Optimizing database queries
- Implementing complex transactions
- Ensuring type safety in your queries
- Integrating Drizzle with the Bun runtime

**Always verify:**

- What version of Drizzle you're using (v2 is current standard)
- Your SQL dialect requirements (PostgreSQL, MySQL, SQLite)
- Appropriate dependencies are installed

## Implementation Details

### Query API Usage

**PREFER `db.query()`** for relational queries and simple data fetching:

```typescript
// ✅ CORRECT: Use query for relations
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: true,
    comments: true,
  },
});

// ✅ CORRECT: Use query with filters
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    posts: {
      where: eq(posts.published, true),
      orderBy: [desc(posts.createdAt)],
    },
  },
});
```

**USE `db.select()`** ONLY for:

- Complex SQL expressions and aggregations (SUM, COUNT, etc.)
- Custom WHERE clauses with multiple OR/AND conditions
- Partial field selection without relations
- SQL-level operations like GROUP BY, HAVING

```typescript
// ✅ CORRECT: Use select for aggregations
const postStats = await db
  .select({
    authorId: posts.authorId,
    totalPosts: count(posts.id),
    avgViews: avg(posts.views),
  })
  .from(posts)
  .groupBy(posts.authorId);

// ✅ CORRECT: Use select for complex WHERE
const results = await db
  .select()
  .from(users)
  .where(
    or(
      eq(users.email, email),
      eq(users.username, username),
      and(
        eq(users.status, "active"),
        gte(users.createdAt, new Date("2024-01-01")),
      ),
    ),
  );
```

**See official docs:** https://orm.drizzle.team/docs/query-overview

### Relations (v2 Syntax - Current Standard)

**ALWAYS define relations centrally** using `defineRelations()`:

```typescript
import { defineRelations } from "drizzle-orm";
import { pgTable, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
});

export const postsTable = pgTable("posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ✅ CORRECT: Centralized v2 relation definition
export const relations = defineRelations(schema, (r) => ({
  users: {
    posts: r.many.posts({
      from: r.users.id,
      to: r.posts.authorId,
      where: { published: true },
    }),
  },
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
      alias: "author_user",
    }),
  },
}));
```

**Key principles:**

- Use `r.one()` for one-to-one/many-to-one
- Use `r.many()` for one-to-many
- ALWAYS specify explicit `from`/`to` column mappings
- Use `alias` for custom relation names
- Pass `where` clause in relation definition for filtered relations

**See official docs:** https://orm.drizzle.team/docs/relational

### Type Safety

**NEVER use type assertions** (`as`, `@ts-ignore`) - trust Drizzle's type system:

```typescript
// ❌ INCORRECT: No type assertions
const result = (await db.select().from(users)) as User[];

// ❌ INCORRECT: No @ts-ignore
// @ts-ignore
const badResult = await db.query.users.findMany();
```

**Use `.$type<T>()` for JSONB/JSON columns:**

```typescript
import { pgTable, text, jsonb } from "drizzle-orm/pg-core";

interface UserMetadata {
  bio: string;
  website?: string;
  socials: {
    twitter?: string;
    github?: string;
  };
}

// ✅ CORRECT: Typed JSONB
export const usersTable = pgTable("users", {
  id: integer("id").primaryKey(),
  metadata: jsonb("metadata").$type<UserMetadata>(),
  preferences: json("preferences").$type<{ theme: "light" | "dark" }>(),
});
```

**ALWAYS export inferred types** from schema files:

```typescript
// ✅ CORRECT: Export inferred types
export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
export type InsertPost = typeof postsTable.$inferInsert;
export type SelectPost = typeof postsTable.$inferSelect;

// Usage in application
import type { InsertUser, SelectUser } from "@/db/schema";

async function createUser(data: InsertUser): Promise<SelectUser> {
  const [user] = await db.insert(usersTable).values(data).returning();
  return user;
}
```

**See official docs:** https://orm.drizzle.team/docs/goodies#inferred-types

### Transaction Handling

**Wrap multi-step operations in `db.transaction()`:**

```typescript
import { error, info } from "@/utils/logger";

// ✅ CORRECT: Transaction for atomic operations
async function transferFunds(
  fromAccountId: number,
  toAccountId: number,
  amount: number,
) {
  try {
    await db.transaction(async (tx) => {
      info("Starting transfer", { fromAccountId, toAccountId, amount });

      const [fromAccount] = await tx
        .select()
        .from(accountsTable)
        .where(eq(accountsTable.id, fromAccountId));

      if (!fromAccount || fromAccount.balance < amount) {
        tx.rollback();
        throw new Error("Insufficient balance");
      }

      await tx
        .update(accountsTable)
        .set({ balance: sql`${accountsTable.balance} - ${amount}` })
        .where(eq(accountsTable.id, fromAccountId));

      await tx
        .update(accountsTable)
        .set({ balance: sql`${accountsTable.balance} + ${amount}` })
        .where(eq(accountsTable.id, toAccountId));

      info("Transfer completed", { fromAccountId, toAccountId, amount });
    });
  } catch (err) {
    error("Transfer error", {
      fromAccountId,
      toAccountId,
      amount,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    throw err;
  }
}
```

**Use `tx.rollback()` for conditional rollbacks:**

```typescript
await db.transaction(async (tx) => {
  const user = await tx.insert(usersTable).values(userData).returning();

  if (!user[0].emailVerified) {
    tx.rollback();
    throw new Error("Email must be verified");
  }

  await tx.insert(profilesTable).values({ userId: user[0].id, ...profileData });
});
```

**Support nested transactions with `tx.transaction()` for savepoints:**

```typescript
await db.transaction(async (tx) => {
  // Main transaction operations

  await tx.transaction(async (nestedTx) => {
    // Nested savepoint operations
    // If this fails, only the savepoint rolls back
  });
});
```

**See official docs:** https://orm.drizzle.team/docs/transactions

### Performance Optimization

**Use prepared statements for repeated queries:**

```typescript
// ✅ CORRECT: Prepared statement for frequent queries
const getUserById = db
  .select()
  .from(usersTable)
  .where(eq(usersTable.id, sql.placeholder("id")))
  .prepare("getUserById");

// Efficient repeated usage
const user1 = await getUserById.execute({ id: 1 });
const user2 = await getUserById.execute({ id: 2 });
```

**Apply column selection to reduce data transfer:**

```typescript
// ✅ CORRECT: Select only needed columns
const postsWithAuthor = await db.query.posts.findMany({
  columns: {
    id: true,
    title: true,
    createdAt: true,
  },
  with: {
    author: {
      columns: {
        id: true,
        name: true,
      },
    },
  },
});
```

**Create appropriate indexes on:**

- Foreign key columns
- Frequently filtered columns
- Columns used in WHERE, ORDER BY, JOIN

```typescript
import { index } from "drizzle-orm/pg-core";

// ✅ CORRECT: Indexes for optimization
export const postsTable = pgTable(
  "posts",
  {
    id: integer("id").primaryKey(),
    title: text("title").notNull(),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    views: integer("views").notNull().default(0),
  },
  (table) => ({
    authorIdIdx: index("posts_author_id_idx").on(table.authorId),
    publishedCreatedAtIdx: index("posts_published_created_idx").on(
      table.published,
      table.createdAt,
    ),
    viewsIdx: index("posts_views_idx").on(table.views),
  }),
);
```

**Use `limit()` and `offset()` for pagination:**

```typescript
const page = 1;
const pageSize = 20;

const posts = await db.query.posts.findMany({
  with: {
    author: true,
  },
  orderBy: [desc(postsTable.createdAt)],
  limit: pageSize,
  offset: (page - 1) * pageSize,
});
```

**See official docs:** https://orm.drizzle.team/docs/performance

### Schema Definition

**Use `pgTable()`, `mysqlTable()`, or `sqliteTable()` per dialect:**

```typescript
import {
  pgTable,
  mysqlTable,
  sqliteTable,
  integer,
  text,
  boolean,
  timestamp,
  serial,
  index,
  unique,
} from "drizzle-orm/pg-core";

// PostgreSQL
export const usersTable = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

// MySQL
export const usersTable = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
});

// SQLite
export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});
```

**Define foreign keys with cascade delete:**

```typescript
// ✅ CORRECT: Foreign key with cascade
export const postsTable = pgTable(
  "posts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: text("title").notNull(),
    content: text("content"),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    authorIdx: index("posts_author_idx").on(table.authorId),
  }),
);
```

**Use `.defaultNow()` and `.$onUpdate()` for timestamps:**

```typescript
// ✅ CORRECT: Automatic timestamps
export const postsTable = pgTable("posts", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});
```

**Use `unique()` constraints for unique fields:**

```typescript
// ✅ CORRECT: Unique constraints
export const usersTable = pgTable(
  "users",
  {
    id: integer("id").primaryKey(),
    email: text("email").notNull().unique(),
    username: text("username").notNull().unique(),
  },
  (table) => ({
    emailUsernameIdx: unique("users_email_username").on(
      table.email,
      table.username,
    ),
  }),
);
```

**See official docs:** https://orm.drizzle.team/docs/schema-overview

### Error Handling

**Wrap ALL database operations in try-catch:**

```typescript
import { error, info } from "@/utils/logger";

async function createUser(data: InsertUser): Promise<SelectUser> {
  try {
    info("Creating user", { email: data.email });

    const [user] = await db.insert(usersTable).values(data).returning();

    info("User created successfully", { userId: user.id });
    return user;
  } catch (err) {
    // ✅ CORRECT: Log with full context
    error("Error creating user", {
      email: data.email,
      error:
        err instanceof Error
          ? {
              message: err.message,
              stack: err.stack,
              name: err.name,
            }
          : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    // Distinguish error types
    if (err instanceof Error) {
      if (err.message.includes("duplicate key")) {
        throw new Error("Email already registered");
      }

      if (err.message.includes("foreign key")) {
        throw new Error("Reference error in data");
      }

      if (err.message.includes("connection")) {
        throw new Error("Database connection error");
      }
    }

    throw new Error("Internal error creating user");
  }
}
```

**See official docs:** https://orm.drizzle.team/docs/goodies#error-handling

### Connection Management

**Use connection pooling for production:**

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// ✅ CORRECT: Pool config for production
const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);

// Close connections on app shutdown
process.on("beforeExit", () => {
  client.end();
});
```

**Configure appropriate pool size based on load:**

```typescript
// High concurrency
const poolConfig = {
  max: process.env.MAX_POOL_SIZE ? parseInt(process.env.MAX_POOL_SIZE) : 10,
  min: 2,
  idle: 10000,
  acquire: 30000,
};

// Serverless (fast connections)
const serverlessConfig = {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 5,
};
```

**Close connections properly in serverless:**

```typescript
// ✅ CORRECT: Connection cleanup in serverless
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export async function handler(event: any) {
  const client = postgres(process.env.DATABASE_URL!, {
    max: 1,
    idle_timeout: 5,
  });

  const db = drizzle(client);

  try {
    const result = await db.select().from(usersTable);
    return { data: result };
  } finally {
    // ALWAYS close connection in serverless
    await client.end();
  }
}
```

**See official docs:** https://orm.drizzle.team/docs/connection-overview

### Migration Practices

**Use drizzle-kit for schema migrations:**

```bash
# Generate migration from schema changes
bunx drizzle-kit generate:pg

# Apply migrations
bunx drizzle-kit migrate:pg

# Push schema (development only)
bunx drizzle-kit push:pg

# Visualize schema
bunx drizzle-kit studio
```

**Run migrations during deployment:**

```typescript
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function runMigrations() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    await client.end();
  }
}

await runMigrations();
```

**Review generated migrations before applying:**

```sql
-- drizzle/migrations/0001_initial_schema.sql
-- ✅ CORRECT: Clean, predictable SQL
CREATE TABLE IF NOT EXISTS "users" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "posts" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "title" text NOT NULL,
  "author_id" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "posts_author_id_idx" ON "posts" ("author_id");
```

**Keep migration files in version control:**

```bash
drizzle/
├── 0001_initial_schema.sql
├── 0002_add_posts_table.sql
├── 0003_add_user_preferences.sql
└── meta/
    └── journal.json  # Generated by drizzle-kit
```

**See official docs:** https://orm.drizzle.team/docs/migrations

### Bun Runtime Integration

**Use `bun:sqlite` for SQLite with Bun:**

```typescript
import { drizzle } from "drizzle-orm/bun-sqlite";
import Database from "bun:sqlite";

// ✅ CORRECT: SQLite with Bun
const sqlite = new Database("db.sqlite");
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite);
```

**Use native drivers where possible:**

```typescript
// PostgreSQL with Bun
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client);

// MySQL with Bun
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
export const db = drizzle(connection);
```

**Leverage Bun's fast startup for serverless:**

```typescript
// ✅ CORRECT: Optimized for Bun serverless
export async function initializeDatabase() {
  const connectionString = process.env.DATABASE_URL!;

  const client = postgres(connectionString, {
    max: 1,
    idle_timeout: 3,
    connect_timeout: 3,
    lazy: true,
  });

  return drizzle(client);
}

export async function handler() {
  const db = await initializeDatabase();

  try {
    return await db.select().from(usersTable);
  } finally {
    await client.end();
  }
}
```

## Best Practices Checklist

Before committing Drizzle ORM code:

- [ ] Use `db.query()` for relations, `db.select()` for aggregations/complex SQL
- [ ] Define relations centrally with `defineRelations()` v2
- [ ] Avoid type assertions, trust type inference system
- [ ] Use `.$type<T>()` for JSONB/JSON columns
- [ ] Export inferred types (`$inferInsert`, `$inferSelect`)
- [ ] Wrap multi-step operations in transactions
- [ ] Use prepared statements for repeated queries
- [ ] Apply column selection to reduce data transfer
- [ ] Create appropriate indexes on foreign keys and filtered columns
- [ ] Define foreign keys with cascade delete when appropriate
- [ ] Use `.defaultNow()` and `.$onUpdate()` for timestamps
- [ ] Wrap all DB operations in try-catch
- [ ] Log errors with full context using project logger
- [ ] Configure appropriate connection pooling
- [ ] Review migrations before applying
- [ ] Use native drivers and optimize for Bun in serverless

## Sources and References

This skill is based on official documentation and best practices from:

### Context7

- **Library ID**: `/drizzle-team/drizzle-orm-docs`
  - Relational queries and v1/v2 syntax
  - Definition of relations with `defineRelations()`
  - Transaction handling and atomic operations
  - Performance optimization (prepared statements, column selection)
  - Type system with `.$type<>()` and inferred types
  - Schema definition for PostgreSQL, MySQL, SQLite

### ZRead AI

- **Repository**: `drizzle-team/drizzle-orm`
  - Database connection guide
  - Serverless database support
  - Core modules for PostgreSQL, MySQL, SQLite
  - Performance optimization techniques
  - Transaction and connection management
  - Connection pooling configuration
  - Migrations with drizzle-kit

### Official Documentation

- **Drizzle ORM Docs**: https://orm.drizzle.team
- **GitHub Repository**: https://github.com/drizzle-team/drizzle-orm
- **Drizzle Kit**: https://orm.drizzle.team/docs/drizzle-kit
