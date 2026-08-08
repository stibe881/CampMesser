CREATE TABLE `fuelLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`day` date NOT NULL,
	`odometerKm` int NOT NULL,
	`liters10` int NOT NULL,
	`priceRappen` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fuelLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `fuelLogs_userId` ON `fuelLogs` (`userId`);