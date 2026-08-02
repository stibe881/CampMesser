CREATE TABLE `passkeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`credentialId` varchar(255) NOT NULL,
	`publicKey` text NOT NULL,
	`counter` int NOT NULL DEFAULT 0,
	`transports` varchar(255),
	`name` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passkeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `passkeys_credentialId` UNIQUE(`credentialId`)
);
--> statement-breakpoint
CREATE INDEX `passkeys_userId` ON `passkeys` (`userId`);