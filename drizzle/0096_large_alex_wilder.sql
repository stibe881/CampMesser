CREATE TABLE `packFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tripId` int NOT NULL,
	`kind` enum('unused','missing') NOT NULL,
	`name` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `packFeedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `packFeedback_userId` ON `packFeedback` (`userId`);--> statement-breakpoint
CREATE INDEX `packFeedback_tripId` ON `packFeedback` (`tripId`);