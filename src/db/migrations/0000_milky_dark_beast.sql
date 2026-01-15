CREATE TABLE `dice_unlocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`item_type` text NOT NULL,
	`item_index` integer NOT NULL,
	`is_purchased` integer DEFAULT false NOT NULL,
	`unlocked_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dice_unlocks_user_id_idx` ON `dice_unlocks` (`user_id`);--> statement-breakpoint
CREATE TABLE `game_states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`can_roll_dice` integer DEFAULT true NOT NULL,
	`current_unlock_item_type` text,
	`current_unlock_item_index` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_states_user_id_unique` ON `game_states` (`user_id`);--> statement-breakpoint
CREATE INDEX `game_states_user_id_idx` ON `game_states` (`user_id`);--> statement-breakpoint
CREATE TABLE `mini_game_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`game_type` text NOT NULL,
	`cost` real NOT NULL,
	`result` text,
	`winnings` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mini_game_logs_user_id_idx` ON `mini_game_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `mini_game_logs_game_type_idx` ON `mini_game_logs` (`game_type`);--> statement-breakpoint
CREATE TABLE `referral_earnings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`referred_user_id` integer NOT NULL,
	`level` integer NOT NULL,
	`amount` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `referral_earnings_user_id_idx` ON `referral_earnings` (`user_id`);--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`referrer_id` integer NOT NULL,
	`referred_id` integer NOT NULL,
	`level` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`referrer_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`referred_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `referrals_referrer_id_idx` ON `referrals` (`referrer_id`);--> statement-breakpoint
CREATE INDEX `referrals_referred_id_idx` ON `referrals` (`referred_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`description` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `transactions_user_id_idx` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `transactions_type_idx` ON `transactions` (`type`);--> statement-breakpoint
CREATE TABLE `user_properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`property_index` integer NOT NULL,
	`level` integer NOT NULL,
	`accumulated_unclaimed` real DEFAULT 0 NOT NULL,
	`last_generated_at` integer NOT NULL,
	`last_claimed_at` integer,
	`purchased_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_properties_user_id_idx` ON `user_properties` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_properties_property_index_idx` ON `user_properties` (`property_index`);--> statement-breakpoint
CREATE TABLE `user_services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`service_index` integer NOT NULL,
	`purchased_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_services_user_id_idx` ON `user_services` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_services_service_index_idx` ON `user_services` (`service_index`);--> statement-breakpoint
CREATE TABLE `users` (
	`telegram_id` integer PRIMARY KEY NOT NULL,
	`username` text,
	`first_name` text,
	`last_name` text,
	`balance` integer DEFAULT 0 NOT NULL,
	`referral_code` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_referral_code_unique` ON `users` (`referral_code`);--> statement-breakpoint
CREATE INDEX `referral_code_idx` ON `users` (`referral_code`);