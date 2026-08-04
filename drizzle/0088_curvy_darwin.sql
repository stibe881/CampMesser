ALTER TABLE `hikeTracks` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `hikeTracks` ADD `shareExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `hikeTracks` ADD CONSTRAINT `hikeTracks_shareToken_unique` UNIQUE(`shareToken`);