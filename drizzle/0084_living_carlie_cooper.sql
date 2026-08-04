CREATE TABLE `campChores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(60) NOT NULL,
	`points` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campChores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `choreAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`choreId` int NOT NULL,
	`childId` int,
	`day` varchar(10) NOT NULL,
	`doneAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `choreAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `campChores_userId` ON `campChores` (`userId`);--> statement-breakpoint
CREATE INDEX `choreAssignments_userId` ON `choreAssignments` (`userId`);--> statement-breakpoint
CREATE INDEX `choreAssignments_userId_day` ON `choreAssignments` (`userId`,`day`);