ALTER TABLE `inventoryItems` ADD `priceRappen` int;--> statement-breakpoint
ALTER TABLE `inventoryItems` ADD `purchaseDate` date;--> statement-breakpoint
ALTER TABLE `inventoryItems` ADD `receiptFileName` varchar(64);--> statement-breakpoint
ALTER TABLE `inventoryItems` ADD CONSTRAINT `inventoryItems_receiptFileName` UNIQUE(`receiptFileName`);