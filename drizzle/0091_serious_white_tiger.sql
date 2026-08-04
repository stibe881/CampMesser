CREATE TABLE `passportAbsences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`childId` int NOT NULL,
	`tripId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passportAbsences_id` PRIMARY KEY(`id`),
	CONSTRAINT `passportAbsences_child_trip` UNIQUE(`childId`,`tripId`)
);
--> statement-breakpoint
CREATE INDEX `passportAbsences_userId` ON `passportAbsences` (`userId`);