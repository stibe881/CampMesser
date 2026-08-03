CREATE TABLE `tripBoardNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`userId` int NOT NULL,
	`kind` varchar(16) NOT NULL DEFAULT 'message',
	`text` varchar(500) NOT NULL,
	`done` boolean NOT NULL DEFAULT false,
	`doneByUserId` int,
	`doneAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tripBoardNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tripBoardNotes_tripId` ON `tripBoardNotes` (`tripId`);--> statement-breakpoint
CREATE INDEX `tripBoardNotes_userId` ON `tripBoardNotes` (`userId`);