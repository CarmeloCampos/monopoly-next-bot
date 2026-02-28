ALTER TABLE `users` ADD `rent_reminder_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_rent_reminder_at` integer;