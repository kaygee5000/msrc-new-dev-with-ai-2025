-- Add necessary RTP tables for storing school output indicators and responses

-- Table for School-level Output Indicators responses
CREATE TABLE IF NOT EXISTS `right_to_play_school_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `itinerary_id` INT NOT NULL,
  `school_id` INT NOT NULL,
  `submitted_by` INT NOT NULL,
  `submitted_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`itinerary_id`) REFERENCES `right_to_play_itineraries`(`id`),
  FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`),
  FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing School-level Output Indicators answers
CREATE TABLE IF NOT EXISTS `right_to_play_school_response_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `response_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `answer_value` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  FOREIGN KEY (`response_id`) REFERENCES `right_to_play_school_responses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `right_to_play_questions`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for District-level Output Indicators responses
CREATE TABLE IF NOT EXISTS `right_to_play_district_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `itinerary_id` INT NOT NULL,
  `district_id` INT NOT NULL,
  `submitted_by` INT NOT NULL,
  `submitted_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`itinerary_id`) REFERENCES `right_to_play_itineraries`(`id`),
  FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`),
  FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing District-level Output Indicators answers
CREATE TABLE IF NOT EXISTS `right_to_play_district_response_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `response_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `answer_value` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  FOREIGN KEY (`response_id`) REFERENCES `right_to_play_district_responses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `right_to_play_questions`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for Consolidated Checklist responses (outcome indicators)
CREATE TABLE IF NOT EXISTS `right_to_play_consolidated_checklist_responses` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `itinerary_id` BIGINT UNSIGNED NOT NULL,
  `school_id` BIGINT UNSIGNED NOT NULL,
  `teacher_id` BIGINT UNSIGNED NULL,
  `submitted_by` BIGINT UNSIGNED NOT NULL,
  `submitted_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`itinerary_id`) REFERENCES `right_to_play_itineraries`(`id`),
  FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`),
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`),
  FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing Consolidated Checklist answers with file upload support
CREATE TABLE IF NOT EXISTS `right_to_play_consolidated_checklist_answers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `response_id` BIGINT UNSIGNED NOT NULL,
  `question_id` BIGINT UNSIGNED NOT NULL,
  `answer_value` TEXT NULL,
  `upload_file_path` VARCHAR(255) NULL,
  `upload_file_name` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  FOREIGN KEY (`response_id`) REFERENCES `right_to_play_consolidated_checklist_responses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `right_to_play_questions`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for Partners in Play survey responses (outcome indicators)
CREATE TABLE IF NOT EXISTS `right_to_play_pip_responses` (
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
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`itinerary_id`) REFERENCES `right_to_play_itineraries`(`id`),
  FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`),
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`),
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`),
  FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing Partners in Play answers with scoring
CREATE TABLE IF NOT EXISTS `right_to_play_pip_answers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `response_id` BIGINT UNSIGNED NOT NULL,
  `question_id` BIGINT UNSIGNED NOT NULL,
  `answer_value` TEXT NOT NULL,
  `score` DECIMAL(5,2) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  FOREIGN KEY (`response_id`) REFERENCES `right_to_play_pip_responses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `right_to_play_questions`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add columns to right_to_play_questions table if they don't exist
ALTER TABLE `right_to_play_questions` 
ADD COLUMN IF NOT EXISTS `indicator_type` ENUM('output', 'outcome') DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `question_form` ENUM('school-output', 'district-output', 'consolidated-checklist', 'partners-in-play') DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `display_order` INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS `is_required` BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS `has_file_upload` BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS `target` VARCHAR(50) DEFAULT NULL;

-- Table for question scoring rules
CREATE TABLE IF NOT EXISTS `right_to_play_question_scoring` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `question_id` BIGINT UNSIGNED NOT NULL,
  `score_value` DECIMAL(5,2) NULL,
  `scoring_logic` TEXT NULL,
  `scoring_formula` VARCHAR(255) NULL,
  `score_min` DECIMAL(5,2) NULL,
  `score_max` DECIMAL(5,2) NULL, 
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  FOREIGN KEY (`question_id`) REFERENCES `right_to_play_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for improved query performance
ALTER TABLE `right_to_play_consolidated_checklist_answers`
ADD INDEX `idx_cc_answers_question` (`question_id`, `answer_value`(20));

ALTER TABLE `right_to_play_pip_answers`
ADD INDEX `idx_pip_answers_question` (`question_id`, `answer_value`(20));