ALTER TABLE `menuEntries` ADD `updatedByUserId` int;--> statement-breakpoint
ALTER TABLE `menuEntries` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `packItems` ADD `updatedByUserId` int;--> statement-breakpoint
ALTER TABLE `packItems` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;