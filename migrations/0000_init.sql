CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `admin_users` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text,
	`role` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `children` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_user_id` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text NOT NULL,
	`age_band` text NOT NULL,
	`narration_language` text DEFAULT 'en' NOT NULL,
	`settings` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`parent_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `children_parent_idx` ON `children` (`parent_user_id`);--> statement-breakpoint
CREATE TABLE `progress_events` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`child_id` text NOT NULL,
	`skill` text NOT NULL,
	`content_id` text,
	`kind` text NOT NULL,
	`value` text,
	`occurred_at` integer NOT NULL,
	`received_at` integer NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `progress_events_id_unique` ON `progress_events` (`id`);--> statement-breakpoint
CREATE INDEX `progress_child_seq_idx` ON `progress_events` (`child_id`,`seq`);--> statement-breakpoint
CREATE TABLE `content_items` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`section` text NOT NULL,
	`template` text NOT NULL,
	`age_bands` text NOT NULL,
	`skills` text NOT NULL,
	`riwayah` text,
	`is_islamic` integer NOT NULL,
	`source` text,
	`data` text NOT NULL,
	`media_ids` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`last_published_pack_version` integer,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_items_slug_unique` ON `content_items` (`slug`);--> statement-breakpoint
CREATE INDEX `content_status_idx` ON `content_items` (`status`);--> statement-breakpoint
CREATE INDEX `content_section_idx` ON `content_items` (`section`);--> statement-breakpoint
CREATE TABLE `content_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`revision` integer NOT NULL,
	`reviewer_email` text NOT NULL,
	`decision` text NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `content_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reviews_content_idx` ON `content_reviews` (`content_id`);--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`r2_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_r2_key_unique` ON `media_assets` (`r2_key`);--> statement-breakpoint
CREATE TABLE `content_packs` (
	`id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`status` text DEFAULT 'building' NOT NULL,
	`manifest_key` text,
	`item_count` integer,
	`total_bytes` integer,
	`notes` text,
	`error` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`published_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_packs_version_unique` ON `content_packs` (`version`);