CREATE TABLE `cart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cart_id` text NOT NULL,
	`product_id` text NOT NULL,
	`colour` text NOT NULL,
	`size` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cart_items_variant_idx` ON `cart_items` (`cart_id`,`product_id`,`colour`,`size`);--> statement-breakpoint
CREATE TABLE `carts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `discount_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`kind` text DEFAULT 'percent' NOT NULL,
	`value` integer NOT NULL,
	`min_subtotal` integer DEFAULT 0 NOT NULL,
	`max_uses` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` text NOT NULL,
	`colour` text NOT NULL,
	`size` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_variant_idx` ON `inventory` (`product_id`,`colour`,`size`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`colour` text NOT NULL,
	`size` text NOT NULL,
	`unit_price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` text NOT NULL,
	`full_name` text NOT NULL,
	`telephone` text NOT NULL,
	`city` text NOT NULL,
	`address` text NOT NULL,
	`delivery_method` text DEFAULT 'courier' NOT NULL,
	`subtotal` integer NOT NULL,
	`delivery_fee` integer DEFAULT 0 NOT NULL,
	`discount_code` text,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`payment_method` text DEFAULT 'cod' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_reference_unique` ON `orders` (`reference`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`created_at`);