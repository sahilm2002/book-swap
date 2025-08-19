-- Database schema for the Books & Booze platform
-- DEPENDENCY: Run common-triggers.sql first to create shared functions
--
-- Create reviews table for book ratings and reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL CHECK (length(review) >= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, user_id) -- One review per user per book
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Note: The update_updated_at_column() function is defined in common-triggers.sql
-- Make sure to run that file first before executing this schema

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_reviews_updated_at 
  BEFORE UPDATE ON reviews 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
