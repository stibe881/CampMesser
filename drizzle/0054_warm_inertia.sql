CREATE TABLE `emailVerifyTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailVerifyTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailVerifyTokens_tokenHash` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifiedAt` timestamp;--> statement-breakpoint
CREATE INDEX `emailVerifyTokens_userId` ON `emailVerifyTokens` (`userId`);