-- Book reviews schema for the Books & Booze platform
-- DEPENDENCY: Run common-triggers.sql first to create shared functions
--
-- Add book_reviews table to your existing schema
-- This table will store reviews for individual books

CREATE TABLE book_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one review per user per book
  UNIQUE(book_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX idx_book_reviews_book_id ON book_reviews(book_id);
CREATE INDEX idx_book_reviews_user_id ON book_reviews(user_id);
CREATE INDEX idx_book_reviews_rating ON book_reviews(rating);

-- Add Row Level Security (RLS)
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all book reviews
CREATE POLICY "Users can read all book reviews" ON book_reviews
  FOR SELECT USING (true);

-- Policy: Users can insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON book_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON book_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON book_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Note: The update_updated_at_column() function is defined in common-triggers.sql
-- Make sure to run that file first before executing this schema

CREATE TRIGGER update_book_reviews_updated_at 
    BEFORE UPDATE ON book_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
