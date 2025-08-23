-- Book Swap Schema for the BookSwap platform
-- DEPENDENCY: Run common-triggers.sql first to create shared functions
-- DEPENDENCY: Ensure books table exists with proper structure

-- 1. Update books table to add swap-related fields
ALTER TABLE books ADD COLUMN IF NOT EXISTS available_for_swap BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS swap_status TEXT DEFAULT 'available' CHECK (swap_status IN ('available', 'pending', 'swapped', 'unavailable'));

-- Create index for swap queries
CREATE INDEX IF NOT EXISTS idx_books_available_for_swap ON books(available_for_swap);
CREATE INDEX IF NOT EXISTS idx_books_swap_status ON books(swap_status);

-- 2. Create book_swaps table for tracking swap requests
CREATE TABLE IF NOT EXISTS book_swaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_requested_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_offered_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure unique swap request per user per book combination
  UNIQUE(requester_id, book_requested_id, book_offered_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_book_swaps_requester_id ON book_swaps(requester_id);
CREATE INDEX IF NOT EXISTS idx_book_swaps_book_requested_id ON book_swaps(book_requested_id);
CREATE INDEX IF NOT EXISTS idx_book_swaps_book_offered_id ON book_swaps(book_offered_id);
CREATE INDEX IF NOT EXISTS idx_book_swaps_status ON book_swaps(status);
CREATE INDEX IF NOT EXISTS idx_book_swaps_created_at ON book_swaps(created_at);

-- 3. Create swap_history table for completed swaps
CREATE TABLE IF NOT EXISTS swap_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  swap_id UUID NOT NULL REFERENCES book_swaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_given_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_received_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  swap_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for swap history
CREATE INDEX IF NOT EXISTS idx_swap_history_user_id ON swap_history(user_id);
CREATE INDEX IF NOT EXISTS idx_swap_history_partner_id ON swap_history(partner_id);
CREATE INDEX IF NOT EXISTS idx_swap_history_swap_date ON swap_history(swap_date);

-- 4. Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('swap_request', 'swap_approved', 'swap_denied', 'swap_cancelled', 'swap_completed', 'offer_cancelled')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_swap_id UUID REFERENCES book_swaps(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 5. Enable Row Level Security on all new tables
ALTER TABLE book_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for book_swaps
-- Users can view swaps they're involved in (as requester or book owner)
CREATE POLICY "Users can view swaps they're involved in" ON book_swaps
  FOR SELECT USING (
    auth.uid() = requester_id OR 
    auth.uid() IN (
      SELECT user_id FROM books WHERE id = book_requested_id
    )
  );

-- Users can create swap requests
CREATE POLICY "Users can create swap requests" ON book_swaps
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Book owners can update swap status (approve/deny/cancel)
CREATE POLICY "Book owners can update swap status" ON book_swaps
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM books WHERE id = book_requested_id
    )
  );

-- Users can cancel their own swap requests
CREATE POLICY "Users can cancel their own swap requests" ON book_swaps
  FOR UPDATE USING (auth.uid() = requester_id);

-- 7. Create RLS policies for swap_history
-- Users can view their own swap history
CREATE POLICY "Users can view their own swap history" ON swap_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert swap history records (system only)
CREATE POLICY "System can insert swap history" ON swap_history
  FOR INSERT WITH CHECK (true);

-- 8. Create RLS policies for notifications
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert notifications for themselves
CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 9. Create triggers for automatic updates
CREATE TRIGGER update_book_swaps_updated_at 
  BEFORE UPDATE ON book_swaps 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Create function to automatically cancel pending offers when book is swapped
CREATE OR REPLACE FUNCTION cancel_pending_offers_for_book()
RETURNS TRIGGER AS $$
BEGIN
  -- If a book's ownership changes (swap completed), cancel all pending offers for that book
  IF NEW.user_id != OLD.user_id THEN
    UPDATE book_swaps 
    SET status = 'cancelled', 
        cancelled_at = NOW(), 
        cancel_reason = 'Book ownership changed - no longer available for swap'
    WHERE book_requested_id = NEW.id 
      AND status = 'pending';
    
    -- Create notifications for cancelled offers
    INSERT INTO notifications (user_id, type, title, message, related_swap_id)
    SELECT 
      bs.requester_id,
      'offer_cancelled',
      'Swap Offer Cancelled',
      'Your swap offer for "' || b.title || '" was cancelled because the book is no longer available.',
      bs.id
    FROM book_swaps bs
    JOIN books b ON bs.book_requested_id = b.id
    WHERE bs.book_requested_id = NEW.id 
      AND bs.status = 'cancelled'
      AND bs.cancelled_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function when book ownership changes
CREATE TRIGGER trigger_cancel_pending_offers
  AFTER UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION cancel_pending_offers_for_book();

-- 11. Create function to create notifications for swap events
CREATE OR REPLACE FUNCTION create_swap_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for swap request
  IF NEW.status = 'pending' THEN
    -- Notify book owner about new swap request
    INSERT INTO notifications (user_id, type, title, message, related_swap_id)
    SELECT 
      b.user_id,
      'swap_request',
      'New Swap Request',
      'Someone wants to swap "' || bo.title || '" for your book "' || br.title || '"',
      NEW.id
    FROM books b
    JOIN books br ON br.id = NEW.book_requested_id
    JOIN books bo ON bo.id = NEW.book_offered_id
    WHERE b.id = NEW.book_requested_id;
  END IF;
  
  -- Create notification for swap approval/denial
  IF NEW.status IN ('approved', 'denied') AND OLD.status = 'pending' THEN
    -- Notify requester about swap decision
    INSERT INTO notifications (user_id, type, title, message, related_swap_id)
    VALUES (
      NEW.requester_id,
      CASE WHEN NEW.status = 'approved' THEN 'swap_approved' ELSE 'swap_denied' END,
      CASE WHEN NEW.status = 'approved' THEN 'Swap Approved!' ELSE 'Swap Denied' END,
      CASE WHEN NEW.status = 'approved' 
        THEN 'Your swap request was approved! Check your dashboard for contact details.'
        ELSE 'Your swap request was denied.'
      END,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the notification function
CREATE TRIGGER trigger_create_swap_notifications
  AFTER INSERT OR UPDATE ON book_swaps
  FOR EACH ROW
  EXECUTE FUNCTION create_swap_notification();

-- 12. Grant necessary permissions (adjust based on your Supabase setup)
-- These permissions should be handled by Supabase automatically with RLS
