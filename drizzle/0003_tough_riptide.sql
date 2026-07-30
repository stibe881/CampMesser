CREATE TABLE `campSpots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campSpots_id` PRIMARY KEY(`id`)
);
