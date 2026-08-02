CREATE TABLE `menuEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tripId` int NOT NULL,
	`day` date NOT NULL,
	`meal` enum('breakfast','lunch','dinner','snack') NOT NULL DEFAULT 'dinner',
	`recipeId` varchar(80),
	`customRecipeId` int,
	`freeText` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menuEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `menuEntries_trip_day_meal` UNIQUE(`tripId`,`day`,`meal`)
);
--> statement-breakpoint
CREATE INDEX `menuEntries_userId` ON `menuEntries` (`userId`);--> statement-breakpoint
CREATE INDEX `menuEntries_tripId` ON `menuEntries` (`tripId`);