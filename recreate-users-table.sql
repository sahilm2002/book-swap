-- Nuclear option: Recreate the users table with correct constraints
-- This will fix all constraint issues but will delete existing user profiles

-- WARNING: This will delete all existing user profile data
-- Only use this if the other fix scripts don't work

-- First, backup existing data (optional)
CREATE TABLE users_backup AS SELECT * FROM users;

-- Drop the existing table and all its constraints
DROP TABLE IF EXISTS users CASCADE;

-- Recreate the table with correct nullable constraints
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT, -- This allows NULL
  address TEXT,   -- This allows NULL  
  location TEXT,  -- This allows NULL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON users
  FOR DELETE USING (auth.uid() = id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the new table structure
SELECT 
  column_name, 
  is_nullable, 
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Note: If you want to restore data from backup, you can run:
-- INSERT INTO users SELECT * FROM users_backup;
-- But be aware this might reintroduce the constraint issues
