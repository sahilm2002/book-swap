-- Common trigger functions for the Books & Booze platform
-- This file contains shared functions that can be used across multiple tables

-- Function to automatically update the updated_at timestamp column
-- This function is used by multiple tables to maintain accurate modification timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: This function should be created before any tables that use it
-- Tables can reference this function in their trigger definitions
