CREATE TABLE `tripChanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`userId` int NOT NULL,
	`area` varchar(20) NOT NULL,
	`action` varchar(10) NOT NULL,
	`label` varchar(160),
	`at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripChanges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tripChanges_tripId` ON `tripChanges` (`tripId`);--> statement-breakpoint
CREATE INDEX `tripChanges_tripId_at` ON `tripChanges` (`tripId`,`at`);