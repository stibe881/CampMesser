ALTER TABLE `packTemplatesCustom` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `packTemplatesCustom` ADD CONSTRAINT `packTemplatesCustom_shareToken_unique` UNIQUE(`shareToken`);