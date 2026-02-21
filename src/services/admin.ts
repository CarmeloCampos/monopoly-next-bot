import { db } from "@/db";
import { users, withdrawals } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import type {
  TelegramId,
  SelectUser,
  SelectWithdrawal,
  MaybeNull,
} from "@/types";
import { asWithdrawalId } from "@/types/utils";
import { env } from "@/config/env";
import { error, debug } from "@/utils/logger";
import { isTelegramId } from "@/utils/guards";

export function isAdmin(userId: TelegramId): boolean {
  const result = env.ADMIN_USER_IDS.includes(userId);
  debug("Checking admin status", {
    userId,
    adminIds: env.ADMIN_USER_IDS,
    isAdmin: result,
    totalAdmins: env.ADMIN_USER_IDS.length,
  });
  return result;
}

export interface TopUser {
  telegram_id: TelegramId;
  username: MaybeNull<string>;
  first_name: MaybeNull<string>;
  last_name: MaybeNull<string>;
  balance: number;
}

export async function getTopUsersByBalance(limit = 20): Promise<TopUser[]> {
  try {
    const results = await db
      .select({
        telegram_id: users.telegram_id,
        username: users.username,
        first_name: users.first_name,
        last_name: users.last_name,
        balance: users.balance,
      })
      .from(users)
      .orderBy(desc(users.balance))
      .limit(limit);

    return results satisfies TopUser[];
  } catch (err) {
    error("Error fetching top users", {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export interface UserStats {
  totalUsers: number;
  totalBalance: number;
  pendingWithdrawals: number;
  totalWithdrawals: number;
}

export async function getUserStats(): Promise<UserStats> {
  try {
    const [userStats] = await db
      .select({
        totalUsers: sql<number>`count(*)`,
        totalBalance: sql<number>`coalesce(sum(${users.balance}), 0)`,
      })
      .from(users);

    const [withdrawalStats] = await db
      .select({
        pending: sql<number>`count(case when ${withdrawals.status} = 'pending' then 1 end)`,
        total: sql<number>`count(*)`,
      })
      .from(withdrawals);

    return {
      totalUsers: userStats?.totalUsers ?? 0,
      totalBalance: userStats?.totalBalance ?? 0,
      pendingWithdrawals: withdrawalStats?.pending ?? 0,
      totalWithdrawals: withdrawalStats?.total ?? 0,
    };
  } catch (err) {
    error("Error fetching user stats", {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      totalUsers: 0,
      totalBalance: 0,
      pendingWithdrawals: 0,
      totalWithdrawals: 0,
    };
  }
}

export async function getAllUsers(
  page = 1,
  pageSize = 20,
): Promise<{ users: SelectUser[]; total: number }> {
  try {
    const offset = (page - 1) * pageSize;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const results = await db.query.users.findMany({
      orderBy: desc(users.created_at),
      limit: pageSize,
      offset,
    });

    return {
      users: results,
      total: countResult?.count ?? 0,
    };
  } catch (err) {
    error("Error fetching all users", {
      page,
      pageSize,
      error: err instanceof Error ? err.message : String(err),
    });
    return { users: [], total: 0 };
  }
}

export async function getUserById(
  userId: TelegramId,
): Promise<SelectUser | null> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.telegram_id, userId),
    });

    return user ?? null;
  } catch (err) {
    error("Error fetching user by id", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export interface WithdrawalWithUser extends SelectWithdrawal {
  user: {
    telegram_id: TelegramId;
    username: MaybeNull<string>;
    first_name: MaybeNull<string>;
    last_name: MaybeNull<string>;
    language: MaybeNull<string>;
  };
}

export async function getPendingWithdrawalsWithUsers(): Promise<
  WithdrawalWithUser[]
> {
  try {
    const results = await db
      .select({
        withdrawal: withdrawals,
        user_telegram_id: users.telegram_id,
        user_username: users.username,
        user_first_name: users.first_name,
        user_last_name: users.last_name,
        user_language: users.language,
      })
      .from(withdrawals)
      .innerJoin(users, eq(withdrawals.user_id, users.telegram_id))
      .where(eq(withdrawals.status, "pending"))
      .orderBy(desc(withdrawals.created_at));

    const mapped: WithdrawalWithUser[] = results
      .map((row) => {
        if (!isTelegramId(row.user_telegram_id)) {
          error("Invalid telegram_id in withdrawal join", {
            userTelegramId: row.user_telegram_id,
          });
          return null;
        }

        const telegramId: TelegramId = row.user_telegram_id;
        const withdrawalId = asWithdrawalId(row.withdrawal.id);
        const languageValue: MaybeNull<string> = row.user_language;

        return {
          ...row.withdrawal,
          id: withdrawalId,
          user: {
            telegram_id: telegramId,
            username: row.user_username,
            first_name: row.user_first_name,
            last_name: row.user_last_name,
            language: languageValue,
          },
        };
      })
      .filter((item): item is WithdrawalWithUser => item !== null);

    return mapped;
  } catch (err) {
    error("Error fetching pending withdrawals with users", {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
