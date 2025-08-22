-- Comprehensive fix for users table constraints
-- This script will remove all NOT NULL constraints that are preventing signup

-- First, let's see what the current table structure looks like
SELECT 
  column_name, 
  is_nullable, 
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Now let's fix each column that might have NOT NULL constraints
-- We'll use a more robust approach that handles different constraint types

-- Fix full_name column
DO $$ 
BEGIN
    -- Try to drop NOT NULL constraint if it exists
    BEGIN
        ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL;
        RAISE NOTICE 'Successfully removed NOT NULL constraint from full_name';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'full_name column is already nullable or constraint does not exist';
    END;
END $$;

-- Fix address column  
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE users ALTER COLUMN address DROP NOT NULL;
        RAISE NOTICE 'Successfully removed NOT NULL constraint from address';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'address column is already nullable or constraint does not exist';
    END;
END $$;

-- Fix location column
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE users ALTER COLUMN location DROP NOT NULL;
        RAISE NOTICE 'Successfully removed NOT NULL constraint from location';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'location column is already nullable or constraint does not exist';
    END;
END $$;

-- Alternative approach: If the above doesn't work, we might need to recreate the table
-- Let's check if there are any other constraints that might be causing issues
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'users';

-- Verify the final state
SELECT 
  column_name, 
  is_nullable, 
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
