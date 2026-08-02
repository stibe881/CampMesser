CREATE TABLE `childBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`childId` int NOT NULL,
	`badgeId` varchar(40) NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `childBadges_id` PRIMARY KEY(`id`),
	CONSTRAINT `childBadges_child_badge` UNIQUE(`childId`,`badgeId`)
);
--> statement-breakpoint
CREATE TABLE `childStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`childId` int NOT NULL,
	`huntsCompleted` int NOT NULL DEFAULT 0,
	`quizzesCompleted` int NOT NULL DEFAULT 0,
	`bestStreak` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `childStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `childStats_childId` UNIQUE(`childId`)
);
--> statement-breakpoint
CREATE TABLE `familyChildren` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(60) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `familyChildren_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `childBadges_userId` ON `childBadges` (`userId`);--> statement-breakpoint
CREATE INDEX `childStats_userId` ON `childStats` (`userId`);--> statement-breakpoint
CREATE INDEX `familyChildren_userId` ON `familyChildren` (`userId`);