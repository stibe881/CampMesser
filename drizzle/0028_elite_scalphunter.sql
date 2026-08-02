CREATE TABLE `spotPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`spotId` int NOT NULL,
	`fileName` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spotPhotos_id` PRIMARY KEY(`id`),
	CONSTRAINT `spotPhotos_fileName` UNIQUE(`fileName`)
);
--> statement-breakpoint
CREATE INDEX `spotPhotos_userId` ON `spotPhotos` (`userId`);--> statement-breakpoint
CREATE INDEX `spotPhotos_spotId` ON `spotPhotos` (`spotId`);