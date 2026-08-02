ALTER TABLE `campSpots` ADD `shareToken` varchar(32);--> statement-breakpoint
CREATE INDEX `campSpots_shareToken` ON `campSpots` (`shareToken`);