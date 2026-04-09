CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text DEFAULT 'default' NOT NULL,
	`text` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	`deletedAt` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_todos_userId` ON `todos` (`userId`);