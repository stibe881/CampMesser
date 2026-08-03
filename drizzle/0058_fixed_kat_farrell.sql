ALTER TABLE `customRecipes` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `customRecipes` ADD CONSTRAINT `customRecipes_shareToken_unique` UNIQUE(`shareToken`);