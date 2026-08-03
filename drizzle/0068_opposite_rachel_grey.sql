CREATE TABLE `tripExpenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`userId` int NOT NULL,
	`amountRappen` int NOT NULL,
	`category` varchar(20) NOT NULL,
	`description` varchar(160),
	`day` date NOT NULL,
	`paidBy` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tripExpenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tripExpenses_tripId` ON `tripExpenses` (`tripId`);--> statement-breakpoint
CREATE INDEX `tripExpenses_userId` ON `tripExpenses` (`userId`);