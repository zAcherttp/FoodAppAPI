# Database Setup for FoodApp API

This document describes the necessary database tables and relationships to run the FoodApp API properly.

## Required Tables

### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  date_of_birth DATE,
  country TEXT,
  url_avatar TEXT,
  saved_recipes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT,
  user_agent TEXT,
  ip_address TEXT,
  is_valid BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3. recipes
```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL,
  instructions TEXT[] NOT NULL,
  image_url TEXT,
  author TEXT,
  author_id UUID REFERENCES users(id),
  tags TEXT[],
  time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. ratings
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, recipe_id)
);
```

### 6. comments
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Supabase Setup Instructions

1. Create a new project in Supabase
2. Navigate to the SQL Editor
3. Create each table by copying and pasting the SQL statements above
4. Create the following RLS (Row Level Security) policies for each table to secure your data

### Example RLS Policies

For `recipes` table:

```sql
-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view recipes
CREATE POLICY "Anyone can view recipes" 
ON recipes FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own recipes
CREATE POLICY "Users can insert their own recipes" 
ON recipes FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- Allow authenticated users to update their own recipes
CREATE POLICY "Users can update their own recipes" 
ON recipes FOR UPDATE
USING (auth.uid() = author_id);
```

For best practices, apply similar RLS policies to all tables to secure your application data.
