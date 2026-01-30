CREATE TABLE `deposits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`amount_usd` real NOT NULL,
	`amount_mc` integer NOT NULL,
	`nowpayments_payment_id` text NOT NULL,
	`nowpayments_order_id` text NOT NULL,
	`status` text NOT NULL,
	`pay_address` text,
	`pay_amount` real,
	`pay_currency` text,
	`payment_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`paid_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`telegram_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deposits_nowpayments_payment_id_unique` ON `deposits` (`nowpayments_payment_id`);--> statement-breakpoint
CREATE INDEX `deposits_user_id_idx` ON `deposits` (`user_id`);--> statement-breakpoint
CREATE INDEX `deposits_status_idx` ON `deposits` (`status`);--> statement-breakpoint
CREATE INDEX `deposits_payment_id_idx` ON `deposits` (`nowpayments_payment_id`);