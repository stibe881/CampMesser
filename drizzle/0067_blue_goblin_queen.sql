CREATE TABLE `shoppingLists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shoppingLists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `shoppingShares` DROP INDEX `shoppingShares_userId`;--> statement-breakpoint
ALTER TABLE `shoppingItems` ADD `listId` int;--> statement-breakpoint
ALTER TABLE `shoppingShares` ADD `listId` int;--> statement-breakpoint
ALTER TABLE `shoppingShares` ADD CONSTRAINT `shoppingShares_user_list` UNIQUE(`userId`,`listId`);--> statement-breakpoint
CREATE INDEX `shoppingLists_userId` ON `shoppingLists` (`userId`);--> statement-breakpoint
CREATE INDEX `shoppingItems_listId` ON `shoppingItems` (`listId`);