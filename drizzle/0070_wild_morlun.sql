CREATE TABLE `locationShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`accuracyM` int,
	`capturedAt` timestamp NOT NULL,
	`shareExpiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locationShares_id` PRIMARY KEY(`id`),
	CONSTRAINT `locationShares_userId` UNIQUE(`userId`),
	CONSTRAINT `locationShares_shareToken` UNIQUE(`shareToken`)
);
