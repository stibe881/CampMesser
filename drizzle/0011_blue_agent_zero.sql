CREATE TABLE `customHunts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(140) NOT NULL,
	`ageHint` varchar(80),
	`durationMinutes` int NOT NULL DEFAULT 30,
	`intro` text NOT NULL,
	`preparation` text,
	`stationsJson` text NOT NULL,
	`solutionWord` varchar(40),
	`finale` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customHunts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `customHunts_userId` ON `customHunts` (`userId`);