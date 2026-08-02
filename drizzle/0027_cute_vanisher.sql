CREATE TABLE `customQuizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(140) NOT NULL,
	`questionsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customQuizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `customQuizzes_userId` ON `customQuizzes` (`userId`);