-- Check if notifications table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications'
);

-- If table exists, show its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Check if there are any notifications in the table
SELECT COUNT(*) as notification_count FROM notifications;

-- Check recent notifications
SELECT 
  id,
  user_id,
  type,
  title,
  message,
  related_swap_id,
  read_at,
  created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any notifications for the specific user
-- Replace 'sahil.mb@gmail.com' with the actual user ID if needed
SELECT 
  n.*,
  u.email as user_email
FROM notifications n
JOIN auth.users u ON n.user_id = u.id
WHERE u.email = 'sahil.mb@gmail.com'
ORDER BY n.created_at DESC;
