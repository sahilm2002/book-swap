-- Debug script to check the current state of the users table
-- Run this in your Supabase SQL editor to see what's happening

-- Check current table structure
SELECT 
  column_name, 
  is_nullable, 
  data_type,
  column_default,
  is_identity
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check current constraints
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

-- Check current data (be careful with this in production)
SELECT 
    id,
    email,
    username,
    full_name,
    address,
    created_at,
    updated_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Check for duplicate emails
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id) as user_ids
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Check for any NOT NULL constraint violations
SELECT 
    id,
    email,
    username,
    full_name,
    address
FROM users 
WHERE email IS NULL 
   OR username IS NULL 
   OR full_name IS NULL 
   OR address IS NULL;
