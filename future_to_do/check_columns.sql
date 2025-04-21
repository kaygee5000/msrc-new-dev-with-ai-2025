-- Script to check which columns exist in the right_to_play_questions table
SELECT 
    column_name AS 'Column Name',
    column_type AS 'Data Type',
    is_nullable AS 'Nullable',
    column_default AS 'Default Value'
FROM 
    information_schema.columns 
WHERE 
    table_schema = DATABASE() 
    AND table_name = 'right_to_play_questions'
ORDER BY 
    ordinal_position;