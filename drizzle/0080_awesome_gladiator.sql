CREATE TABLE `tripGuestbook` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`userId` int,
	`authorName` varchar(60) NOT NULL,
	`message` varchar(500) NOT NULL,
	`photoId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripGuestbook_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tripGuestbook_tripId` ON `tripGuestbook` (`tripId`);