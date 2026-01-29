CREATE TABLE `withdrawals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`wallet_address` text NOT NULL,
	`status` text NOT NULL,
	`transaction_hash` text,
	`processed_by` integer,
	`processed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`processed_by`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `withdrawals_user_id_idx` ON `withdrawals` (`user_id`);--> statement-breakpoint
CREATE INDEX `withdrawals_status_idx` ON `withdrawals` (`status`);--> statement-breakpoint
CREATE INDEX `withdrawals_created_at_idx` ON `withdrawals` (`created_at`);