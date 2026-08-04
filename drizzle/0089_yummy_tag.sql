CREATE TABLE `deletedItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` varchar(20) NOT NULL,
	`label` varchar(200) NOT NULL,
	`detail` varchar(200),
	`itemCount` int NOT NULL DEFAULT 0,
	`payload` mediumtext NOT NULL,
	`files` text NOT NULL DEFAULT ('[]'),
	`deletedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deletedItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `deletedItems_userId` ON `deletedItems` (`userId`);--> statement-breakpoint
CREATE INDEX `deletedItems_deletedAt` ON `deletedItems` (`deletedAt`);