CREATE TABLE `tripTemplatesCustom` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(140) NOT NULL,
	`kind` varchar(30) NOT NULL DEFAULT 'camping',
	`nights` int NOT NULL,
	`location` varchar(140),
	`latitude` double,
	`longitude` double,
	`stagesJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripTemplatesCustom_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tripTemplatesCustom_userId` ON `tripTemplatesCustom` (`userId`);