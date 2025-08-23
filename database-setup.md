# Database Setup Guide for Books & Booze Platform

## Setup Order

To properly set up the database schema, execute the SQL files in the following order:

### 1. Common Functions First
```sql
-- Run this file first to create shared functions
\i common-triggers.sql
```

### 2. Core Schema
```sql
-- Run the main database schema
\i database-schema.sql
```

### 3. Users Schema
```sql
-- Run the users schema
\i users-schema.sql
```

### 4. Book Reviews Schema
```sql
-- Run the book reviews schema
\i book-reviews-schema.sql
```

## File Dependencies

- **`common-triggers.sql`** - Contains shared trigger functions
  - `update_updated_at_column()` - Automatically updates `updated_at` timestamps
- **`database-schema.sql`** - Core platform tables and policies
  - Depends on functions from `common-triggers.sql`
- **`users-schema.sql`** - User profile tables and policies
  - Depends on functions from `common-triggers.sql`
- **`book-reviews-schema.sql`** - Book review system tables and policies
  - Depends on functions from `common-triggers.sql`

## Benefits of This Structure

✅ **Single Source of Truth** - Trigger functions defined once
✅ **Easier Maintenance** - Update functions in one place
✅ **Consistent Behavior** - All tables use the same function
✅ **Reduced Errors** - No duplicate definitions to maintain
✅ **Clear Dependencies** - Execution order is documented

## Manual Setup (if not using \i)

If you're not using PostgreSQL's `\i` command, execute the files in this order:

1. Copy and paste contents of `common-triggers.sql`
2. Copy and paste contents of `database-schema.sql`
3. Copy and paste contents of `users-schema.sql`
4. Copy and paste contents of `book-reviews-schema.sql`

## Verification

After setup, you can verify the function exists:
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column';
```
