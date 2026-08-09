CREATE TABLE `tripStops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`name` varchar(140) NOT NULL,
	`latitude` double,
	`longitude` double,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tripStops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tripStops_tripId` ON `tripStops` (`tripId`);