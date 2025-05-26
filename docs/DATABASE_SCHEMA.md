# Database Schema Documentation

This document describes the complete database schema for the FoodApp API using PostgreSQL with Supabase.

## Overview

The database uses PostgreSQL with additional extensions for vector operations and UUID generation. All tables use UUID primary keys and include created_at/updated_at timestamps for audit purposes.

## Extensions Required

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector operations for AI search
CREATE EXTENSION IF NOT EXISTS vector;
```

## Core Tables

### users

Stores user account information and authentication data.

| Column                 | Type         | Constraints                             | Description                |
| ---------------------- | ------------ | --------------------------------------- | -------------------------- |
| id                     | uuid         | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier     |
| name                   | varchar(255) | NOT NULL                                | User's full name           |
| email                  | varchar(255) | UNIQUE, NOT NULL                        | Email address for login    |
| password               | varchar(255) | NOT NULL                                | Bcrypt hashed password     |
| date_of_birth          | date         | NULL                                    | User's birth date          |
| country                | varchar(100) | NULL                                    | User's country             |
| url_avatar             | text         | NULL                                    | Profile picture URL        |
| saved_recipes          | uuid[]       | DEFAULT '{}'                            | Array of saved recipe IDs  |
| password_reset_token   | varchar(255) | NULL                                    | Token for password reset   |
| password_reset_expires | timestamptz  | NULL                                    | Reset token expiration     |
| created_at             | timestamptz  | DEFAULT NOW()                           | Account creation timestamp |
| updated_at             | timestamptz  | DEFAULT NOW()                           | Last update timestamp      |

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### recipes

Stores recipe information including ingredients, instructions, and AI embeddings.

| Column       | Type          | Constraints                             | Description                |
| ------------ | ------------- | --------------------------------------- | -------------------------- |
| id           | uuid          | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique recipe identifier   |
| title        | varchar(255)  | NOT NULL                                | Recipe title               |
| author       | varchar(255)  | NOT NULL                                | Recipe author name         |
| author_id    | uuid          | REFERENCES users(id) ON DELETE CASCADE  | Recipe author user ID      |
| ingredients  | text[]        | NOT NULL                                | Array of ingredients       |
| instructions | text[]        | NOT NULL                                | Array of instruction steps |
| image_url    | text          | NULL                                    | Recipe image URL           |
| tags         | varchar(50)[] | DEFAULT '{}'                            | Recipe categories/tags     |
| time         | varchar(50)   | NULL                                    | Cooking/prep time          |
| comments     | jsonb         | DEFAULT '{}'                            | Legacy comments data       |
| rating       | jsonb         | DEFAULT '{}'                            | Legacy rating data         |
| embedding    | vector(1024)  | NULL                                    | AI embedding for search    |
| created_at   | timestamptz   | DEFAULT NOW()                           | Recipe creation timestamp  |
| updated_at   | timestamptz   | DEFAULT NOW()                           | Last update timestamp      |

**Indexes:**

```sql
CREATE INDEX idx_recipes_author_id ON recipes(author_id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at);
CREATE INDEX idx_recipes_title ON recipes USING gin(to_tsvector('english', title));
CREATE INDEX idx_recipes_tags ON recipes USING gin(tags);
CREATE INDEX idx_recipes_embedding ON recipes USING ivfflat (embedding vector_cosine_ops);
```

### sessions

Manages user authentication sessions and JWT tokens.

| Column     | Type        | Constraints                             | Description                |
| ---------- | ----------- | --------------------------------------- | -------------------------- |
| id         | uuid        | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique session identifier  |
| user_id    | uuid        | REFERENCES users(id) ON DELETE CASCADE  | Session owner              |
| token      | text        | NOT NULL                                | JWT token hash             |
| user_agent | text        | NULL                                    | Browser/device information |
| ip_address | inet        | NULL                                    | User's IP address          |
| is_valid   | boolean     | DEFAULT true                            | Session validity status    |
| expires_at | timestamptz | NOT NULL                                | Session expiration time    |
| created_at | timestamptz | DEFAULT NOW()                           | Session creation time      |
| updated_at | timestamptz | DEFAULT NOW()                           | Last update time           |

**Indexes:**

```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### comments

Stores user comments on recipes with like/dislike functionality.

| Column     | Type        | Constraints                              | Description                    |
| ---------- | ----------- | ---------------------------------------- | ------------------------------ |
| id         | uuid        | PRIMARY KEY, DEFAULT uuid_generate_v4()  | Unique comment identifier      |
| recipe_id  | uuid        | REFERENCES recipes(id) ON DELETE CASCADE | Associated recipe              |
| user_id    | uuid        | REFERENCES users(id) ON DELETE CASCADE   | Comment author                 |
| content    | text        | NOT NULL                                 | Comment text content           |
| likes      | uuid[]      | DEFAULT '{}'                             | Array of user IDs who liked    |
| dislikes   | uuid[]      | DEFAULT '{}'                             | Array of user IDs who disliked |
| created_at | timestamptz | DEFAULT NOW()                            | Comment creation time          |
| updated_at | timestamptz | DEFAULT NOW()                            | Last update time               |

**Indexes:**

```sql
CREATE INDEX idx_comments_recipe_id ON comments(recipe_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
```

### ratings

Stores recipe ratings from users (1-5 star system).

| Column     | Type         | Constraints                              | Description              |
| ---------- | ------------ | ---------------------------------------- | ------------------------ |
| id         | uuid         | PRIMARY KEY, DEFAULT uuid_generate_v4()  | Unique rating identifier |
| recipe_id  | uuid         | REFERENCES recipes(id) ON DELETE CASCADE | Associated recipe        |
| user_id    | uuid         | REFERENCES users(id) ON DELETE CASCADE   | Rating author            |
| rating     | decimal(2,1) | CHECK (rating >= 1 AND rating <= 5)      | Rating value (1.0-5.0)   |
| created_at | timestamptz  | DEFAULT NOW()                            | Rating creation time     |
| updated_at | timestamptz  | DEFAULT NOW()                            | Last update time         |

**Constraints:**

```sql
ALTER TABLE ratings ADD CONSTRAINT unique_user_recipe_rating
UNIQUE (user_id, recipe_id);
```

**Indexes:**

```sql
CREATE INDEX idx_ratings_recipe_id ON ratings(recipe_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
```

### notifications

Stores real-time notifications for user interactions.

| Column     | Type        | Constraints                             | Description                               |
| ---------- | ----------- | --------------------------------------- | ----------------------------------------- |
| id         | uuid        | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique notification identifier            |
| user_id    | uuid        | REFERENCES users(id) ON DELETE CASCADE  | Notification recipient                    |
| sender_id  | uuid        | REFERENCES users(id) ON DELETE SET NULL | Notification sender                       |
| type       | varchar(50) | NOT NULL                                | Notification type                         |
| message    | text        | NOT NULL                                | Notification message                      |
| related_id | uuid        | NULL                                    | Related entity ID (recipe, comment, etc.) |
| is_read    | boolean     | DEFAULT false                           | Read status                               |
| created_at | timestamptz | DEFAULT NOW()                           | Notification timestamp                    |

**Notification Types:**

- `comment` - New comment on user's recipe
- `rating` - New rating on user's recipe
- `like` - Comment liked
- `recipe_saved` - Recipe saved by another user

**Indexes:**

```sql
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

## Database Functions

### Vector Search Function

Used for AI-powered recipe search with embeddings.

```sql
CREATE OR REPLACE FUNCTION vector_search(
  query_embedding vector(1024),
  similarity_threshold float DEFAULT 0.5,
  match_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  author text,
  image_url text,
  ingredients text[],
  instructions text[],
  tags text[],
  time text,
  rating jsonb,
  comments jsonb,
  created_at timestamp,
  updated_at timestamp,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    r.id,
    r.title,
    r.author,
    r.image_url,
    r.ingredients,
    r.instructions,
    r.tags,
    r.time,
    r.rating,
    r.comments,
    r.created_at,
    r.updated_at,
    1 - (r.embedding <=> query_embedding) as similarity
  FROM recipes r
  WHERE r.embedding IS NOT NULL
    AND 1 - (r.embedding <=> query_embedding) > similarity_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_limit;
$$;
```

### Session Cleanup Function

Automatically removes expired sessions.

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM sessions
  WHERE expires_at < NOW() OR is_valid = false;
$$;
```

## Triggers

### Update Timestamps

Automatically update the `updated_at` column on record changes.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS)

Enable RLS for data protection in multi-tenant scenarios.

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on requirements)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view recipes" ON recipes
  FOR SELECT USING (true);

CREATE POLICY "Users can create recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (auth.uid() = author_id);
```

## Relationships

### Foreign Key Relationships

```sql
-- Recipe author relationship
ALTER TABLE recipes
ADD CONSTRAINT fk_recipes_author
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

-- Session ownership
ALTER TABLE sessions
ADD CONSTRAINT fk_sessions_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Comment relationships
ALTER TABLE comments
ADD CONSTRAINT fk_comments_recipe
FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;

ALTER TABLE comments
ADD CONSTRAINT fk_comments_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Rating relationships
ALTER TABLE ratings
ADD CONSTRAINT fk_ratings_recipe
FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;

ALTER TABLE ratings
ADD CONSTRAINT fk_ratings_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Notification relationships
ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_sender
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;
```

## Performance Considerations

### Indexes for Common Queries

```sql
-- Full-text search on recipe titles and ingredients
CREATE INDEX idx_recipes_fulltext ON recipes
USING gin(to_tsvector('english', title || ' ' || array_to_string(ingredients, ' ')));

-- User's saved recipes lookup
CREATE INDEX idx_users_saved_recipes ON users USING gin(saved_recipes);

-- Recent activities
CREATE INDEX idx_comments_recent ON comments(recipe_id, created_at DESC);
CREATE INDEX idx_ratings_recent ON ratings(recipe_id, created_at DESC);

-- User notification lookups
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
```

### Partitioning (for large datasets)

```sql
-- Partition notifications by month for better performance
CREATE TABLE notifications_y2024m01 PARTITION OF notifications
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE notifications_y2024m02 PARTITION OF notifications
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- Continue for other months...
```

## Backup and Maintenance

### Scheduled Jobs

```sql
-- Schedule session cleanup (run daily)
SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');

-- Update recipe statistics (run hourly)
SELECT cron.schedule('update-recipe-stats', '0 * * * *', $$
  UPDATE recipes
  SET rating = (
    SELECT jsonb_build_object(
      'average', COALESCE(ROUND(AVG(rating), 2), 0),
      'count', COUNT(*)
    )
    FROM ratings
    WHERE recipe_id = recipes.id
  );
$$);
```

## Migration Scripts

### Initial Schema Creation

```sql
-- Create all tables, indexes, functions, and triggers
-- Run in sequence to establish the complete schema
```

### Data Migration Helpers

```sql
-- Migrate legacy comment data to new structure
INSERT INTO comments (recipe_id, user_id, content, created_at)
SELECT
  r.id as recipe_id,
  u.id as user_id,
  comment->>'content' as content,
  (comment->>'created_at')::timestamptz as created_at
FROM recipes r, users u,
jsonb_array_elements(r.comments) as comment
WHERE comment->>'user_id' = u.id::text;
```

This schema provides a robust foundation for the FoodApp API with proper relationships, indexing, and performance considerations.
