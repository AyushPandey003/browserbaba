-- BrowseBaba Database Migration Script
-- This script helps migrate from the old 'items' table to the new 'memories' schema

-- ============================================
-- OPTION 1: Fresh Start (Recommended for development)
-- ============================================
-- Warning: This will delete all existing data

-- Drop old tables
DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS items CASCADE;

-- The new schema will be automatically created by the Go backend
-- when it runs for the first time. Just start the server:
-- cd api && go run main.go

-- ============================================
-- OPTION 2: Preserve Old Data (For production)
-- ============================================
-- Uncomment the following section if you want to keep old data

/*
-- Rename old table as backup
ALTER TABLE IF EXISTS items RENAME TO items_backup;

-- Create new tables (this will be done by Go backend automatically)
-- But if you want to do it manually:

CREATE TABLE IF NOT EXISTS memories (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    title VARCHAR(500),
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('page', 'selection', 'video', 'video_selection')),
    content TEXT,
    selected_text TEXT,
    context_before VARCHAR(500),
    context_after VARCHAR(500),
    full_context TEXT,
    element_type VARCHAR(100),
    page_section VARCHAR(100),
    xpath TEXT,
    tags TEXT,
    notes TEXT,
    video_platform VARCHAR(50),
    video_timestamp INTEGER,
    video_duration INTEGER,
    video_title VARCHAR(500),
    video_url TEXT,
    thumbnail_url TEXT,
    formatted_timestamp VARCHAR(20),
    scraped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS links (
    id SERIAL PRIMARY KEY,
    memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    text VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memories_content_type ON memories(content_type);
CREATE INDEX IF NOT EXISTS idx_memories_video_platform ON memories(video_platform);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories(tags);
CREATE INDEX IF NOT EXISTS idx_memories_url ON memories(url);
CREATE INDEX IF NOT EXISTS idx_memories_scraped_at ON memories(scraped_at);
CREATE INDEX IF NOT EXISTS idx_links_memory_id ON links(memory_id);

-- Full-text search index (GIN for performance)
CREATE INDEX IF NOT EXISTS idx_memories_search ON memories 
USING GIN (to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(content, '') || ' ' || 
    COALESCE(selected_text, '') || ' ' || 
    COALESCE(tags, '')
));

-- Optional: Migrate old items to new memories table
-- This is a simple migration that converts old items to page-type memories
INSERT INTO memories (url, title, content, content_type, notes, created_at, updated_at)
SELECT 
    'https://migrated-item-' || id,  -- Generate placeholder URL
    title,
    description AS content,
    'page' AS content_type,
    'Status: ' || COALESCE(status, 'none') || ', Priority: ' || COALESCE(priority, 'none') AS notes,
    created_at,
    updated_at
FROM items_backup
WHERE title IS NOT NULL;

-- Verify migration
SELECT 
    COUNT(*) as total_migrated,
    content_type
FROM memories 
GROUP BY content_type;
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Use these queries to verify your database setup

-- Check if tables exist
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('memories', 'links')
ORDER BY table_name;

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'memories' 
ORDER BY ordinal_position;

-- Check indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename IN ('memories', 'links')
ORDER BY tablename, indexname;

-- Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('memories', 'links');

-- ============================================
-- SAMPLE QUERIES
-- ============================================
-- Use these to test your setup after migration

-- Count memories by type
SELECT 
    content_type, 
    COUNT(*) as count 
FROM memories 
GROUP BY content_type 
ORDER BY count DESC;

-- Count video memories by platform
SELECT 
    video_platform, 
    COUNT(*) as count 
FROM memories 
WHERE content_type IN ('video', 'video_selection')
    AND video_platform IS NOT NULL
GROUP BY video_platform 
ORDER BY count DESC;

-- Most used tags
SELECT 
    TRIM(unnest(string_to_array(tags, ','))) as tag,
    COUNT(*) as count
FROM memories 
WHERE tags IS NOT NULL AND tags != ''
GROUP BY tag
ORDER BY count DESC
LIMIT 20;

-- Recent memories with video info
SELECT 
    id,
    title,
    content_type,
    video_platform,
    formatted_timestamp,
    created_at
FROM memories 
WHERE video_platform IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- Memories with links
SELECT 
    m.id,
    m.title,
    m.content_type,
    COUNT(l.id) as link_count
FROM memories m
LEFT JOIN links l ON m.id = l.memory_id
GROUP BY m.id, m.title, m.content_type
HAVING COUNT(l.id) > 0
ORDER BY link_count DESC;

-- Full-text search test
SELECT 
    id,
    title,
    content_type,
    LEFT(content, 100) as content_preview
FROM memories 
WHERE to_tsvector('english', 
        COALESCE(title, '') || ' ' || 
        COALESCE(content, '') || ' ' || 
        COALESCE(selected_text, '') || ' ' || 
        COALESCE(tags, '')
    ) @@ plainto_tsquery('english', 'your search term here')
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- CLEANUP (Use with caution)
-- ============================================
-- Uncomment to remove backup table after verifying migration

/*
-- Remove old backup table
DROP TABLE IF EXISTS items_backup CASCADE;
*/
