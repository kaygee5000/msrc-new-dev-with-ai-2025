-- Create Consolidated Checklist Answers table
CREATE TABLE `right_to_play_consolidated_checklist_answers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `response_id` BIGINT UNSIGNED NOT NULL,
  `question_id` BIGINT UNSIGNED NOT NULL,
  `answer_value` TEXT NULL,
  `upload_file_path` VARCHAR(255) NULL,
  `upload_file_name` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cc_answers_response` FOREIGN KEY (`response_id`) REFERENCES `right_to_play_consolidated_checklist_responses`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cc_answers_question` FOREIGN KEY (`question_id`) REFERENCES `right_to_play_questions`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;