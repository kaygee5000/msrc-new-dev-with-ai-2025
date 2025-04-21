-- Create Partners in Play responses table
CREATE TABLE `right_to_play_pip_responses` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `itinerary_id` BIGINT UNSIGNED NOT NULL,
  `school_id` BIGINT UNSIGNED NOT NULL,
  `teacher_id` BIGINT UNSIGNED NOT NULL,
  `class_id` BIGINT UNSIGNED NULL,
  `subject` VARCHAR(255) NULL,
  `friendly_tone_score` DECIMAL(5,2) NULL,
  `acknowledging_effort_score` DECIMAL(5,2) NULL,
  `pupil_participation_score` DECIMAL(5,2) NULL,
  `learning_environment_score` DECIMAL(5,2) NULL,
  `ltp_skills_score` DECIMAL(5,2) NULL,
  `submitted_by` BIGINT UNSIGNED NOT NULL,
  `submitted_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  CONSTRAINT `fk_pip_responses_itinerary` FOREIGN KEY (`itinerary_id`) REFERENCES `right_to_play_itineraries`(`id`),
  CONSTRAINT `fk_pip_responses_school` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`),
  CONSTRAINT `fk_pip_responses_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`),
  CONSTRAINT `fk_pip_responses_user` FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;