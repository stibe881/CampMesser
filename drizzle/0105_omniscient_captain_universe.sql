ALTER TABLE `tripExpenses` ADD `currency` varchar(3) DEFAULT 'CHF' NOT NULL;--> statement-breakpoint
ALTER TABLE `tripLogs` ADD `eurRateX10000` int;