CREATE TABLE `treasureHunts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(60) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `treasureHunts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasurePoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`huntId` int NOT NULL,
	`name` varchar(60) NOT NULL,
	`hint` varchar(200),
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`sortIndex` int NOT NULL DEFAULT 0,
	`foundAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `treasurePoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `treasureHunts_userId` ON `treasureHunts` (`userId`);--> statement-breakpoint
CREATE INDEX `treasurePoints_huntId` ON `treasurePoints` (`huntId`);