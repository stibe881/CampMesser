CREATE TABLE `userSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenId` varchar(32) NOT NULL,
	`userAgent` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSessions_tokenId` UNIQUE(`tokenId`)
);
--> statement-breakpoint
CREATE INDEX `userSessions_userId` ON `userSessions` (`userId`);