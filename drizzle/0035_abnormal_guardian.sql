CREATE TABLE `foodTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`itemsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `foodTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `foodTemplates_userId` ON `foodTemplates` (`userId`);