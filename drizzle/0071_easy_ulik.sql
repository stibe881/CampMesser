ALTER TABLE `foodItems` ADD `storage` varchar(10) DEFAULT 'cooled' NOT NULL;--> statement-breakpoint
ALTER TABLE `foodItems` ADD `unit` varchar(16);--> statement-breakpoint
ALTER TABLE `foodItems` ADD `category` varchar(24);