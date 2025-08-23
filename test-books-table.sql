-- Test Books Table Structure and Data
-- Run this in your Supabase SQL Editor

-- 1. Check if books table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'books'
) AS books_table_exists;

-- 2. If it exists, show the structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'books'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'books';

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'books';

-- 5. Check if there are any books in the table
SELECT COUNT(*) as total_books FROM books;

-- 6. Check a few sample books
SELECT id, title, author, owner_id, available_for_swap, created_at
FROM books 
LIMIT 5;

-- 7. Check if there are any books with your user ID
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from the console
SELECT id, title, author, owner_id, available_for_swap
FROM books 
WHERE owner_id = 'YOUR_USER_ID_HERE';  -- Replace this with your user ID

-- 8. Check the current user from auth
SELECT auth.uid() as current_user_id;
