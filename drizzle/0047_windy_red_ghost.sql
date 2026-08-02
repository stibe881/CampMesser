CREATE TABLE `natureSightings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`entryId` varchar(60),
	`sightedAt` date NOT NULL,
	`lat` double,
	`lon` double,
	`note` varchar(500),
	`fileName` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `natureSightings_id` PRIMARY KEY(`id`),
	CONSTRAINT `natureSightings_fileName_unique` UNIQUE(`fileName`)
);
--> statement-breakpoint
CREATE INDEX `natureSightings_userId` ON `natureSightings` (`userId`);