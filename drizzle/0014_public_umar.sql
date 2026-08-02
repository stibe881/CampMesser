CREATE TABLE `customRecipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`method` varchar(40) NOT NULL DEFAULT 'Gaskocher',
	`timeMinutes` int NOT NULL DEFAULT 30,
	`servings` int NOT NULL DEFAULT 4,
	`difficulty` varchar(20) NOT NULL DEFAULT 'einfach',
	`onePot` boolean NOT NULL DEFAULT false,
	`kidFriendly` boolean NOT NULL DEFAULT false,
	`ingredientsJson` text NOT NULL,
	`stepsJson` text NOT NULL,
	`tip` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customRecipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `customRecipes_userId` ON `customRecipes` (`userId`);