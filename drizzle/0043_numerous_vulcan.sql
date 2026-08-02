CREATE TABLE `gearTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`intervalMonths` int NOT NULL,
	`lastDoneAt` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gearTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pushSubscriptions` ADD `wantsGear` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `pushSubscriptions` ADD `lastGearKey` varchar(64);--> statement-breakpoint
CREATE INDEX `gearTasks_userId` ON `gearTasks` (`userId`);