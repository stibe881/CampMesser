CREATE TABLE `shoppingItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`checked` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shoppingItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `shoppingItems_userId` ON `shoppingItems` (`userId`);