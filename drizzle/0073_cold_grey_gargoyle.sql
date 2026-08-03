CREATE TABLE `fishCatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`speciesId` varchar(60),
	`speciesName` varchar(120) NOT NULL,
	`lengthCm` double,
	`weightKg` double,
	`water` varchar(120) NOT NULL,
	`caughtAt` date NOT NULL,
	`caughtTime` varchar(5),
	`method` varchar(120),
	`released` boolean NOT NULL DEFAULT false,
	`note` varchar(500),
	`fileName` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fishCatches_id` PRIMARY KEY(`id`),
	CONSTRAINT `fishCatches_fileName_unique` UNIQUE(`fileName`)
);
--> statement-breakpoint
CREATE INDEX `fishCatches_userId` ON `fishCatches` (`userId`);