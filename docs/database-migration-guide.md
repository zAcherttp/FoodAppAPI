# Database Migration Guide

This guide explains how to migrate your existing Food App database to the new schema that separates comments and ratings from recipes into their own tables.

## Overview

In the new database schema:
1. Comments are stored in a dedicated `comments` table
2. Ratings are stored in a dedicated `ratings` table
3. Comment interactions (likes/dislikes) are stored in a `comment_interactions` table
4. The `recipes` table no longer stores comments and ratings as nested arrays

## Migration Steps

Follow these steps to migrate your database:

### 1. Create New Tables

Run the SQL script to create the new tables:

```bash
# Navigate to your project folder
cd path/to/FoodAppAPI

# Run the SQL script using your database client
# If using Supabase, you can copy and paste the SQL from src/scripts/create_comments_ratings_tables.sql
# into the Supabase SQL Editor
```

### 2. Migrate Existing Data

Run the migration script to transfer data from embedded arrays to separate tables:

```bash
# Build the TypeScript files
npm run build

# Run the migration script
node dist/scripts/migrateCommentsAndRatings.js
```

This script will:
- Extract comments from recipes and insert them into the `comments` table
- Extract likes/dislikes from comments and insert them into the `comment_interactions` table
- Extract ratings from recipes and insert them into the `ratings` table

### 3. Normalize Recipe Data

After successful migration, run the normalization script to remove the embedded arrays from recipes:

```bash
# Run the normalization script
node dist/scripts/normalizeExistingRecipes.js
```

This script will update all recipes to remove the now-redundant `comments` and `rating` arrays.

### 4. Verify Migration

Perform these checks to ensure your migration was successful:

1. Check that the comments were migrated:
   ```sql
   SELECT COUNT(*) FROM comments;
   ```

2. Check that the ratings were migrated:
   ```sql
   SELECT COUNT(*) FROM ratings;
   ```

3. Check that interactions were migrated:
   ```sql
   SELECT COUNT(*) FROM comment_interactions;
   ```

4. Ensure recipes no longer have embedded comments and ratings:
   ```sql
   SELECT COUNT(*) FROM recipes WHERE comments IS NOT NULL OR rating IS NOT NULL;
   ```
   This should return 0 if all recipes were normalized correctly.

## Rollback Plan

If you need to roll back the migration:

1. Restore your database from backup (recommended)
2. Alternatively, run a script to revert the changes (requires additional implementation)

## Troubleshooting

- **Issue**: Missing comments or ratings after migration
  **Solution**: Check the logs from the migration scripts for errors. You may need to run the migration script again with fixes.

- **Issue**: Duplicate entries in comments or ratings tables
  **Solution**: Remove duplicates using SQL and re-run the migration with a fix to prevent duplicates.

- **Issue**: API errors after migration
  **Solution**: Ensure all API endpoints have been updated to use the new data structure. Check server logs for specific errors.
