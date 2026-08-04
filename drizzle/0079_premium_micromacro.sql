CREATE TABLE `tripDateOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`note` varchar(140),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripDateOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripDateVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`optionId` int NOT NULL,
	`userId` int NOT NULL,
	`vote` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tripDateVotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `tripDateVotes_option_user` UNIQUE(`optionId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `tripDateOptions_tripId` ON `tripDateOptions` (`tripId`);--> statement-breakpoint
CREATE INDEX `tripDateVotes_optionId` ON `tripDateVotes` (`optionId`);--> statement-breakpoint
CREATE INDEX `tripDateVotes_userId` ON `tripDateVotes` (`userId`);