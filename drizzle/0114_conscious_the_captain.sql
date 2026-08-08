ALTER TABLE `documentCards` ADD `expiresOn` date;--> statement-breakpoint
ALTER TABLE `pushSubscriptions` ADD `lastDocsKey` varchar(64);