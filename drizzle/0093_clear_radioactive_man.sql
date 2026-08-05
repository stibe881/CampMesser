CREATE TABLE `systemState` (
	`stateKey` varchar(64) NOT NULL,
	`value` varchar(255) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemState_stateKey` PRIMARY KEY(`stateKey`)
);
