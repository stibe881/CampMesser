CREATE TABLE `plannedRoutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tripId` int,
	`name` varchar(80) NOT NULL,
	`waypointsJson` text NOT NULL,
	`distanceM` int NOT NULL DEFAULT 0,
	`ascentM` int NOT NULL DEFAULT 0,
	`descentM` int NOT NULL DEFAULT 0,
	`minutes` int NOT NULL DEFAULT 0,
	`pace` varchar(10) NOT NULL DEFAULT 'normal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plannedRoutes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `plannedRoutes_userId` ON `plannedRoutes` (`userId`);--> statement-breakpoint
CREATE INDEX `plannedRoutes_tripId` ON `plannedRoutes` (`tripId`);