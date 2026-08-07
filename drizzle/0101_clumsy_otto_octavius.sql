CREATE TABLE `familyRedemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`childId` int NOT NULL,
	`title` varchar(80) NOT NULL,
	`points` int NOT NULL,
	`redeemedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `familyRedemptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `familyRewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(80) NOT NULL,
	`points` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `familyRewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `familyRedemptions_userId` ON `familyRedemptions` (`userId`);--> statement-breakpoint
CREATE INDEX `familyRedemptions_childId` ON `familyRedemptions` (`childId`);--> statement-breakpoint
CREATE INDEX `familyRewards_userId` ON `familyRewards` (`userId`);