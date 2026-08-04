ALTER TABLE `pushSubscriptions` ADD `wantsHeat` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `pushSubscriptions` ADD `lastHeatKey` varchar(64);