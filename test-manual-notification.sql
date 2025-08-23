-- Test manual notification creation
-- First, let's see what users exist
SELECT id, email FROM auth.users LIMIT 5;

-- Let's see what books exist with their owners
SELECT 
  b.id as book_id,
  b.title,
  b.owner_id,
  u.email as owner_email
FROM books b
LEFT JOIN auth.users u ON b.owner_id = u.id
LIMIT 5;

-- Now let's try to create a test notification
-- Replace 'USER_ID_HERE' with an actual user ID from the first query
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  related_swap_id,
  created_at
) VALUES (
  'USER_ID_HERE',  -- Replace with actual user ID
  'test',
  'Test Notification',
  'This is a test notification to verify the system works',
  NULL,
  NOW()
) RETURNING *;

-- Check if the notification was created
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
