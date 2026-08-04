CREATE TABLE `storageBoxes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(12) NOT NULL,
	`name` varchar(80) NOT NULL,
	`location` varchar(80),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storageBoxes_id` PRIMARY KEY(`id`),
	CONSTRAINT `storageBoxes_userId_code` UNIQUE(`userId`,`code`)
);
--> statement-breakpoint
ALTER TABLE `inventoryItems` ADD `boxId` int;--> statement-breakpoint
CREATE INDEX `storageBoxes_userId` ON `storageBoxes` (`userId`);