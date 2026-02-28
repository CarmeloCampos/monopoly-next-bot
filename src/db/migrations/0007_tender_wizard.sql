ALTER TABLE `users` ADD `rent_reminder_enabled` integer NOT NULL DEFAULT 1;
ALTER TABLE `users` ADD `last_rent_reminder_at` integer;
