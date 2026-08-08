CREATE TABLE `documentCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(80) NOT NULL,
	`fileName` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `documentCards_userId` ON `documentCards` (`userId`);