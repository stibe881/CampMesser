CREATE TABLE `packTemplatesCustom` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`itemsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `packTemplatesCustom_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `packTemplatesCustom_userId` ON `packTemplatesCustom` (`userId`);