CREATE TABLE `userNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(140),
	`text` text NOT NULL,
	`tags` varchar(300) NOT NULL DEFAULT '',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userNotes_userId` ON `userNotes` (`userId`);