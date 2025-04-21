-- Fix the indicator_type column in right_to_play_questions table
-- The column already exists but needs to be modified
ALTER TABLE `right_to_play_questions` 
MODIFY COLUMN `indicator_type` ENUM('output', 'outcome', 'output_indicators', 'outcome_indicators') NULL;

-- First check if columns exist before adding them
-- Adding question_form column if it doesn't exist
SELECT COUNT(*) INTO @column_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'right_to_play_questions' AND column_name = 'question_form';
SET @add_column = CONCAT('ALTER TABLE `right_to_play_questions` ADD COLUMN `question_form` ENUM(\'school-output\', \'district-output\', \'consolidated-checklist\', \'partners-in-play\') NULL');
PREPARE stmt FROM @add_column;
SET @column_exists = IF(@column_exists = 0, 'EXECUTE stmt', 'SELECT \'Column already exists\'');
PREPARE stmt2 FROM @column_exists;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt;
DEALLOCATE PREPARE stmt2;

-- Adding display_order column if it doesn't exist
SELECT COUNT(*) INTO @column_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'right_to_play_questions' AND column_name = 'display_order';
SET @add_column = 'ALTER TABLE `right_to_play_questions` ADD COLUMN `display_order` INT DEFAULT 0';
PREPARE stmt FROM @add_column;
SET @column_exists = IF(@column_exists = 0, 'EXECUTE stmt', 'SELECT \'Column already exists\'');
PREPARE stmt2 FROM @column_exists;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt;
DEALLOCATE PREPARE stmt2;

-- Adding is_required column if it doesn't exist
SELECT COUNT(*) INTO @column_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'right_to_play_questions' AND column_name = 'is_required';
SET @add_column = 'ALTER TABLE `right_to_play_questions` ADD COLUMN `is_required` TINYINT(1) DEFAULT 0';
PREPARE stmt FROM @add_column;
SET @column_exists = IF(@column_exists = 0, 'EXECUTE stmt', 'SELECT \'Column already exists\'');
PREPARE stmt2 FROM @column_exists;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt;
DEALLOCATE PREPARE stmt2;

-- Adding has_file_upload column if it doesn't exist
SELECT COUNT(*) INTO @column_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'right_to_play_questions' AND column_name = 'has_file_upload';
SET @add_column = 'ALTER TABLE `right_to_play_questions` ADD COLUMN `has_file_upload` TINYINT(1) DEFAULT 0';
PREPARE stmt FROM @add_column;
SET @column_exists = IF(@column_exists = 0, 'EXECUTE stmt', 'SELECT \'Column already exists\'');
PREPARE stmt2 FROM @column_exists;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt;
DEALLOCATE PREPARE stmt2;

-- Adding target column if it doesn't exist
SELECT COUNT(*) INTO @column_exists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'right_to_play_questions' AND column_name = 'target';
SET @add_column = 'ALTER TABLE `right_to_play_questions` ADD COLUMN `target` VARCHAR(50) NULL';
PREPARE stmt FROM @add_column;
SET @column_exists = IF(@column_exists = 0, 'EXECUTE stmt', 'SELECT \'Column already exists\'');
PREPARE stmt2 FROM @column_exists;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt;
DEALLOCATE PREPARE stmt2;