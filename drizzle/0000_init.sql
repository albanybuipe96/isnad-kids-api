CREATE TABLE `content_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`body` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
