-- Create Partners in Play answers table
CREATE TABLE `right_to_play_pip_answers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `response_id` BIGINT UNSIGNED NOT NULL,
  `question_id` BIGINT UNSIGNED NOT NULL,
  `answer_value` TEXT NOT NULL,
  `score` DECIMAL(5,2) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pip_answers_response` FOREIGN KEY (`response_id`) REFERENCES `right_to_play_pip_responses`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pip_answers_question` FOREIGN KEY (`question_id`) REFERENCES `right_to_play_questions`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;