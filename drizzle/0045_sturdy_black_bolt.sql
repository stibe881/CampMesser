CREATE TABLE `tripInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`inviteToken` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `tripInvites_tripId` UNIQUE(`tripId`),
	CONSTRAINT `tripInvites_token` UNIQUE(`inviteToken`)
);
--> statement-breakpoint
CREATE TABLE `tripMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `tripMembers_trip_user` UNIQUE(`tripId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `tripMembers_tripId` ON `tripMembers` (`tripId`);--> statement-breakpoint
CREATE INDEX `tripMembers_userId` ON `tripMembers` (`userId`);