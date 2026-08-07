ALTER TABLE `users` ADD `calendarToken` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_calendarToken_unique` UNIQUE(`calendarToken`);