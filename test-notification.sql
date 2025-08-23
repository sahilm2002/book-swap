-- Test notification creation manually
-- First, let's check if the notifications table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications'
);

-- If it exists, let's see its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Let's also check what users exist
SELECT id, email, username FROM users LIMIT 5;

-- And check what books exist with their owners
SELECT 
  b.id as book_id,
  b.title,
  b.owner_id,
  u.email as owner_email
FROM books b
LEFT JOIN users u ON b.owner_id = u.id
LIMIT 5;

-- Now let's try to create a test notification
-- Replace the user_id with an actual user ID from the users table
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  related_swap_id,
  created_at
) VALUES (
  'REPLACE_WITH_ACTUAL_USER_ID',  -- Replace this with a real user ID
  'test',
  'Test Notification',
  'This is a test notification',
  'test-swap-id',
  NOW()
) RETURNING *;
