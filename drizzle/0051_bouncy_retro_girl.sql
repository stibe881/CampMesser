CREATE TABLE `menuDayNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`day` date NOT NULL,
	`note` varchar(200) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuDayNotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `menuDayNotes_trip_day` UNIQUE(`tripId`,`day`)
);
--> statement-breakpoint
CREATE INDEX `menuDayNotes_tripId` ON `menuDayNotes` (`tripId`);