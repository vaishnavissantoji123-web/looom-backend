-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

----------------------------------
-- USERS TABLE
----------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

----------------------------------
-- POSTS TABLE (posts + replies)
----------------------------------
CREATE TABLE IF NOT EXISTS posts (
    post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- NULL = top-level post
    -- NOT NULL = reply to another post
    parent_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,

    content TEXT NOT NULL,

    -- Cached counters
    likes_count INT DEFAULT 0,
    replies_count INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

----------------------------------
-- LIKES TABLE
----------------------------------
CREATE TABLE IF NOT EXISTS likes (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, post_id)
);

----------------------------------
-- FOLLOWS TABLE
----------------------------------
CREATE TABLE IF NOT EXISTS follows ( 
    follower_id UUID REFERENCES users(user_id) ON DELETE CASCADE, 
    following_id UUID REFERENCES users(user_id) ON DELETE CASCADE, 
    PRIMARY KEY (follower_id, following_id), 
    CHECK (follower_id <> following_id)
);

----------------------------------
-- INDEXES
----------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);

----------------------------------
-- TRIGGER FUNCTIONS
----------------------------------

-- Update like count
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1
        WHERE post_id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1
        WHERE post_id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update reply count
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        UPDATE posts SET replies_count = replies_count + 1
        WHERE post_id = NEW.parent_id;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
        UPDATE posts SET replies_count = replies_count - 1
        WHERE post_id = OLD.parent_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

----------------------------------
-- TRIGGERS
----------------------------------
DROP TRIGGER IF EXISTS like_added ON likes;
CREATE TRIGGER like_added
AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION update_like_count();

DROP TRIGGER IF EXISTS like_removed ON likes;
CREATE TRIGGER like_removed
AFTER DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_like_count();

DROP TRIGGER IF EXISTS reply_added ON posts;
CREATE TRIGGER reply_added
AFTER INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION update_reply_count();

DROP TRIGGER IF EXISTS reply_removed ON posts;
CREATE TRIGGER reply_removed
AFTER DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION update_reply_count();