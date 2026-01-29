import type { MaybeOptional } from "@/types";

export interface UserDisplayInfo {
  telegramId: number;
  username: MaybeOptional<string>;
  firstName: MaybeOptional<string>;
  lastName: MaybeOptional<string>;
}

export function buildUserDisplayName(user: UserDisplayInfo): string {
  if (user.username) {
    return `@${user.username}`;
  }

  const firstName = user.firstName ?? "Unknown";
  const lastNamePart = user.lastName ? ` ${user.lastName}` : "";

  return `${firstName}${lastNamePart}`;
}
