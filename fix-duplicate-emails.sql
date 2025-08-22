-- Fix script for duplicate email issues in users table
-- This script will help resolve the "duplicate key value violates unique constraint users_email_key" error

-- First, let's see what duplicate emails we have
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id) as user_ids,
    array_agg(created_at) as created_dates
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- For each duplicate email, we need to decide which record to keep
-- Usually we want to keep the one with the most recent activity or the one that matches the current auth user

-- Option 1: Keep the most recent record and delete others
-- WARNING: This will delete data - make sure you have backups
/*
WITH duplicate_emails AS (
    SELECT 
        email,
        id,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM users
    WHERE email IN (
        SELECT email 
        FROM users 
        GROUP BY email 
        HAVING COUNT(*) > 1
    )
)
DELETE FROM users 
WHERE id IN (
    SELECT id 
    FROM duplicate_emails 
    WHERE rn > 1
);
*/

-- Option 2: Update the older records to have different emails (safer approach)
-- This adds a timestamp to make emails unique
UPDATE users 
SET email = email || '_' || EXTRACT(EPOCH FROM created_at)::text
WHERE id IN (
    SELECT u1.id
    FROM users u1
    JOIN users u2 ON u1.email = u2.email AND u1.id != u2.id
    WHERE u1.created_at < u2.created_at
);

-- Option 3: If you want to keep only one record per email, you can use this:
-- (Uncomment and run after reviewing the duplicates above)
/*
DELETE FROM users 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id
    FROM users
    ORDER BY email, created_at DESC
);
*/

-- After running one of the above options, verify the fix:
SELECT 
    email,
    COUNT(*) as count
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Should return no rows if the fix worked
