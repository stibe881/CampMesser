CREATE TABLE `tripJournal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`day` date NOT NULL,
	`text` varchar(2000) NOT NULL,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tripJournal_id` PRIMARY KEY(`id`),
	CONSTRAINT `tripJournal_trip_day` UNIQUE(`tripId`,`day`)
);
--> statement-breakpoint
CREATE INDEX `tripJournal_tripId` ON `tripJournal` (`tripId`);