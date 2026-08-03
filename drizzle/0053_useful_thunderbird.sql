ALTER TABLE `customQuizzes` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `customQuizzes` ADD CONSTRAINT `customQuizzes_shareToken_unique` UNIQUE(`shareToken`);