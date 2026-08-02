ALTER TABLE `tripLogs` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `tripLogs` ADD CONSTRAINT `tripLogs_shareToken_unique` UNIQUE(`shareToken`);