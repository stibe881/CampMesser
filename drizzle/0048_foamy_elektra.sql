CREATE TABLE `tripShoppingItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`quantity` varchar(40),
	`note` varchar(160),
	`category` varchar(40),
	`checked` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripShoppingItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tripShoppingItems_tripId` ON `tripShoppingItems` (`tripId`);