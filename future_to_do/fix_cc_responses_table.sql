-- Correctly create Consolidated Checklist Responses table with matching data types
CREATE TABLE `right_to_play_consolidated_checklist_responses` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `itinerary_id` BIGINT UNSIGNED NOT NULL,
  `school_id` BIGINT UNSIGNED NOT NULL,
  `teacher_id` BIGINT UNSIGNED NULL,
  `submitted_by` BIGINT UNSIGNED NOT NULL,
  `submitted_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  CONSTRAINT `fk_cc_responses_itinerary` FOREIGN KEY (`itinerary_id`) REFERENCES `right_to_play_itineraries`(`id`),
  CONSTRAINT `fk_cc_responses_school` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`),
  CONSTRAINT `fk_cc_responses_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`),
  CONSTRAINT `fk_cc_responses_user` FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;