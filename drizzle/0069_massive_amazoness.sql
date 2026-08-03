CREATE TABLE `hikeTracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tripId` int,
	`name` varchar(80) NOT NULL,
	`startedAt` timestamp NOT NULL,
	`endedAt` timestamp NOT NULL,
	`distanceM` int NOT NULL DEFAULT 0,
	`durationS` int NOT NULL DEFAULT 0,
	`ascentM` int NOT NULL DEFAULT 0,
	`descentM` int NOT NULL DEFAULT 0,
	`pointsJson` mediumtext NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hikeTracks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `hikeTracks_userId` ON `hikeTracks` (`userId`);--> statement-breakpoint
CREATE INDEX `hikeTracks_tripId` ON `hikeTracks` (`tripId`);