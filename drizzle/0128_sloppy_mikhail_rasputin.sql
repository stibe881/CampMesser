CREATE TABLE `tripPlanItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`day` date NOT NULL,
	`title` varchar(140) NOT NULL,
	`timeAt` varchar(5),
	`done` boolean NOT NULL DEFAULT false,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripPlanItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tripPlanItems_tripId` ON `tripPlanItems` (`tripId`);--> statement-breakpoint
CREATE INDEX `tripPlanItems_trip_day` ON `tripPlanItems` (`tripId`,`day`);