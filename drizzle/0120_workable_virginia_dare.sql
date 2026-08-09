CREATE TABLE `savedPlaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`note` varchar(240),
	`color` varchar(12) NOT NULL DEFAULT 'red',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedPlaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `savedPlaces_userId` ON `savedPlaces` (`userId`);