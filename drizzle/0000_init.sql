CREATE TABLE `room_members` (
	`room_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`room_id`, `user_id`),
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`invite_code` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `saved_discs` (
	`user_id` text NOT NULL,
	`track_uri` text NOT NULL,
	`track_name` text NOT NULL,
	`artists` text NOT NULL,
	`album` text,
	`cover_url` text,
	`saved_from_name` text,
	`saved_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `track_uri`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`product` text,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`token_expires_at` integer NOT NULL,
	`session_token` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_track_uri` text,
	`last_track_name` text,
	`last_artists` text,
	`last_album` text,
	`last_cover_url` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_session_token_unique` ON `users` (`session_token`);