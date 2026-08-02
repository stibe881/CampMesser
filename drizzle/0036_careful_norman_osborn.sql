CREATE TABLE `shoppingShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shoppingShares_id` PRIMARY KEY(`id`),
	CONSTRAINT `shoppingShares_userId` UNIQUE(`userId`),
	CONSTRAINT `shoppingShares_shareToken` UNIQUE(`shareToken`)
);
