-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    joke_key TEXT NOT NULL UNIQUE,
    thumbs_up INTEGER DEFAULT 0,
    thumbs_down INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on joke_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_joke_key ON ratings(joke_key);

-- Create user_ratings table to track individual user votes
CREATE TABLE IF NOT EXISTS user_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    joke_key TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating TEXT NOT NULL CHECK(rating IN ('up', 'down')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(joke_key, user_id)
);

-- Create index for faster user rating lookups
CREATE INDEX IF NOT EXISTS idx_user_ratings ON user_ratings(joke_key, user_id);
