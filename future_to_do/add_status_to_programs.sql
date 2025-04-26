-- SQL script to add status field to programs table and set default value
-- Create file: future_to_do/add_status_to_programs.sql

-- Temporarily disable safe update mode
SET SQL_SAFE_UPDATES = 0;

-- Add the status column to programs table if it doesn't exist
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active';

-- Update all existing rows to have 'active' status
UPDATE programs SET status = 'active';

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;