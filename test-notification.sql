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
SELECT id, email FROM public.users LIMIT 5;
-- And check what books exist with their owners
SELECT 
  b.id as book_id,
  b.title,
  b.owner_id,
  u.email as owner_email
FROM books b
LEFT JOIN users u ON b.owner_id = u.id
LIMIT 5;

-- Create a test notification for the most recently created user
WITH picked_user AS (
  SELECT id
    FROM public.users
   ORDER BY created_at DESC NULLS LAST
   LIMIT 1
)
INSERT INTO public.notifications (
  user_id,
  type,
  title,
  message,
  related_swap_id
)
SELECT
  id,
  'test',
  'Test Notification',
  'This is a test notification',
  NULL
  FROM picked_user
RETURNING *;
