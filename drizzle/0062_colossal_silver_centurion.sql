CREATE TABLE `tickBites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bitAt` date NOT NULL,
	`bodyPart` varchar(80),
	`note` varchar(500),
	`resolvedAt` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tickBites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tickBites_userId` ON `tickBites` (`userId`);