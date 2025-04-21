-- Create Question Scoring table
CREATE TABLE `right_to_play_question_scoring` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `question_id` BIGINT UNSIGNED NOT NULL,
  `score_value` DECIMAL(5,2) NULL,
  `scoring_logic` TEXT NULL,
  `scoring_formula` VARCHAR(255) NULL,
  `score_min` DECIMAL(5,2) NULL,
  `score_max` DECIMAL(5,2) NULL, 
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_question_scoring_question` FOREIGN KEY (`question_id`) REFERENCES `right_to_play_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add performance indexes
ALTER TABLE `right_to_play_consolidated_checklist_answers`
ADD INDEX `idx_cc_answers_question_value` (`question_id`, `answer_value`(20));

ALTER TABLE `right_to_play_pip_answers`
ADD INDEX `idx_pip_answers_question_value` (`question_id`, `answer_value`(20));