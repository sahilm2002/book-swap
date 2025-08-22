-- Create Books Table if it doesn't exist
-- Run this in your Supabase SQL Editor

-- Check if books table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'books') THEN
        -- Create the books table
        CREATE TABLE books (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            isbn TEXT,
            genre TEXT[] DEFAULT '{}',
            description TEXT,
            cover_image TEXT,
            published_year INTEGER,
            page_count INTEGER,
            language TEXT DEFAULT 'English',
            condition TEXT NOT NULL DEFAULT 'good',
            owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            location TEXT DEFAULT 'Unknown',
            available_for_swap BOOLEAN DEFAULT false,
            swap_status TEXT DEFAULT 'available' CHECK (swap_status IN ('available', 'pending', 'swapped', 'unavailable')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_books_owner_id ON books(owner_id);
        CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
        CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
        CREATE INDEX IF NOT EXISTS idx_books_genre ON books USING GIN(genre);
        CREATE INDEX IF NOT EXISTS idx_books_available_for_swap ON books(available_for_swap);
        CREATE INDEX IF NOT EXISTS idx_books_swap_status ON books(swap_status);
        CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
        
        -- Enable Row Level Security
        ALTER TABLE books ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        -- Users can view all books
        CREATE POLICY "Users can view all books" ON books
            FOR SELECT USING (true);
        
        -- Users can insert their own books
        CREATE POLICY "Users can insert their own books" ON books
            FOR INSERT WITH CHECK (auth.uid() = owner_id);
        
        -- Users can update their own books
        CREATE POLICY "Users can update their own books" ON books
            FOR UPDATE USING (auth.uid() = owner_id);
        
        -- Users can delete their own books
        CREATE POLICY "Users can delete their own books" ON books
            FOR DELETE USING (auth.uid() = owner_id);
        
        -- Create trigger for updated_at
        CREATE TRIGGER update_books_updated_at 
            BEFORE UPDATE ON books 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Books table created successfully';
    ELSE
        RAISE NOTICE 'Books table already exists';
    END IF;
END $$;

-- Check the current books table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'books'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'books';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'books';
