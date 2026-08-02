CREATE TABLE `tripPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tripId` int NOT NULL,
	`fileName` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripPhotos_id` PRIMARY KEY(`id`),
	CONSTRAINT `tripPhotos_fileName` UNIQUE(`fileName`)
);
--> statement-breakpoint
CREATE INDEX `tripPhotos_userId` ON `tripPhotos` (`userId`);--> statement-breakpoint
CREATE INDEX `tripPhotos_tripId` ON `tripPhotos` (`tripId`);