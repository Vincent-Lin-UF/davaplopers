

CREATE TABLE `bucket_list_items` (
  `item_id` bigint NOT NULL AUTO_INCREMENT,
  `trip_id` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `location_name` varchar(255) DEFAULT NULL,
  `notes` text,
  `status` enum('pending','completed') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  KEY `idx_items_trip` (`trip_id`),
  CONSTRAINT `fk_items_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`) ON DELETE CASCADE
) 


CREATE TABLE `calendar_events` (
  `event_id` bigint NOT NULL AUTO_INCREMENT,
  `trip_id` bigint NOT NULL,
  `bucket_item_id` bigint DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `event_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `location_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  KEY `idx_events_trip` (`trip_id`),
  KEY `idx_events_item` (`bucket_item_id`),
  CONSTRAINT `fk_events_item` FOREIGN KEY (`bucket_item_id`) REFERENCES `bucket_list_items` (`item_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_events_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`) ON DELETE CASCADE
)


CREATE TABLE `shared_invites` (
  `invite_id` bigint NOT NULL AUTO_INCREMENT,
  `trip_id` bigint NOT NULL,
  `invite_email` varchar(255) NOT NULL,
  `permission_level` enum('viewer','editor') NOT NULL DEFAULT 'viewer',
  `invite_status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`invite_id`),
  KEY `idx_invites_trip` (`trip_id`),
  CONSTRAINT `fk_invites_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`) ON DELETE CASCADE
)


CREATE TABLE `trips` (
  `trip_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `trip_name` varchar(255) DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`trip_id`),
  KEY `idx_trips_user` (`user_id`),
  CONSTRAINT `fk_trips_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) 


CREATE TABLE `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hashed` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) 
