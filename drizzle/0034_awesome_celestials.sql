CREATE TABLE `homeLocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `homeLocations_id` PRIMARY KEY(`id`),
	CONSTRAINT `homeLocations_userId` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `pushSubscriptions` ADD `wantsAstro` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `pushSubscriptions` ADD `lastAstroKey` varchar(64);