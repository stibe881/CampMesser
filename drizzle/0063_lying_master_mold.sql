CREATE TABLE `pushLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` varchar(20) NOT NULL,
	`title` varchar(160) NOT NULL,
	`body` varchar(500) NOT NULL,
	`url` varchar(200),
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `pushLog_user_sentAt` ON `pushLog` (`userId`,`sentAt`);