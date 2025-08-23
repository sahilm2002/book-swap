-- Check what tables exist in your database
-- Run this in your Supabase SQL Editor

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if books table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'books'
) AS books_table_exists;

-- If books table exists, show its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'books'
ORDER BY ordinal_position;

-- Check if common-triggers functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column';

-- Add missing columns to books table if they don't exist
-- Run these commands if the columns are missing:

-- ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn TEXT;
-- ALTER TABLE books ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';
-- ALTER TABLE books ADD COLUMN IF NOT EXISTS published_year INTEGER;
-- ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT;

-- Check the current books table structure after adding columns
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'books'
-- ORDER BY ordinal_position;
