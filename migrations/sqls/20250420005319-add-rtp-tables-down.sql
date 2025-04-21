-- Drop tables in reverse order of creation (to avoid foreign key constraints)

-- Drop scoring table
DROP TABLE IF EXISTS `right_to_play_question_scoring`;

-- Drop Partners in Play answers
DROP TABLE IF EXISTS `right_to_play_pip_answers`;

-- Drop Partners in Play responses
DROP TABLE IF EXISTS `right_to_play_pip_responses`;

-- Drop Consolidated Checklist answers
DROP TABLE IF EXISTS `right_to_play_consolidated_checklist_answers`;

-- Drop Consolidated Checklist responses
DROP TABLE IF EXISTS `right_to_play_consolidated_checklist_responses`;

-- Drop District Output answers
DROP TABLE IF EXISTS `right_to_play_district_response_answers`;

-- Drop District Output responses
DROP TABLE IF EXISTS `right_to_play_district_responses`;

-- Drop School Output answers
DROP TABLE IF EXISTS `right_to_play_school_response_answers`;

-- Drop School Output responses
DROP TABLE IF EXISTS `right_to_play_school_responses`;

-- Revert column additions to the questions table
ALTER TABLE `right_to_play_questions`
DROP COLUMN IF EXISTS `indicator_type`,
DROP COLUMN IF EXISTS `question_form`,
DROP COLUMN IF EXISTS `display_order`,
DROP COLUMN IF EXISTS `is_required`,
DROP COLUMN IF EXISTS `has_file_upload`,
DROP COLUMN IF EXISTS `target`;