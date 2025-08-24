-- Fix users table constraints to allow NULL values for full_name and address
-- This allows users to sign up without providing these fields initially

-- Make full_name nullable (remove NOT NULL constraint if it exists)
ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL;

-- Make address nullable (remove NOT NULL constraint if it exists)
ALTER TABLE users ALTER COLUMN address DROP NOT NULL;

-- Verify the changes
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('full_name', 'address');

-- Note: If the above ALTER statements fail with "column is not of type NOT NULL",
-- it means the columns are already nullable, which is fine.
