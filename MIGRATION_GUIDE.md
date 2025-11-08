# BrowseBaba Backend Migration Guide

## Overview
The Go backend has been completely rebuilt from a generic CRUD API to an extension-specific API designed for BrowseBaba browser extension.

## What Changed

### 1. Database Schema
**Old (Generic CRUD):**
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(50),
    priority VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

**New (Extension-Focused):**
```sql
CREATE TABLE memories (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    title VARCHAR(500),
    content_type VARCHAR(50) NOT NULL,  -- 'page', 'selection', 'video', 'video_selection'
    content TEXT,
    selected_text TEXT,
    context_before VARCHAR(500),        -- Context around selection
    context_after VARCHAR(500),
    full_context TEXT,
    element_type VARCHAR(100),          -- HTML element type
    page_section VARCHAR(100),          -- Section of page
    xpath TEXT,                         -- XPath to element
    tags TEXT,                          -- Comma-separated tags
    notes TEXT,
    video_platform VARCHAR(50),         -- 'youtube', 'netflix', etc.
    video_timestamp INTEGER,            -- Seconds
    video_duration INTEGER,
    video_title VARCHAR(500),
    video_url TEXT,
    thumbnail_url TEXT,
    formatted_timestamp VARCHAR(20),    -- "HH:MM:SS"
    scraped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    memory_id INTEGER REFERENCES memories(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    text VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. API Endpoints
**Old:**
- `POST /api/items` - Create item
- `GET /api/items` - Get all items
- `GET /api/items?id=1` - Get item by ID
- `PUT /api/items?id=1` - Update item
- `DELETE /api/items?id=1` - Delete item

**New:**
- `POST /api/memories` - Save content from extension
- `GET /api/memories` - Get all memories with filtering
- `GET /api/memories?id=1` - Get memory by ID
- `PUT /api/memories?id=1` - Update memory
- `DELETE /api/memories?id=1` - Delete memory
- `POST /api/memories/search` - Full-text search
- `GET /api/memories/stats` - Get usage statistics
- `POST /api/scrape` - Legacy endpoint (maps to memories)

### 3. Data Models
**Old Model:**
```go
type Item struct {
    ID          int
    Title       string
    Description string
    Status      string
    Priority    string
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

**New Model:**
```go
type Memory struct {
    ID                 int
    URL                string
    Title              sql.NullString
    ContentType        string
    Content            sql.NullString
    SelectedText       sql.NullString
    ContextBefore      sql.NullString
    ContextAfter       sql.NullString
    FullContext        sql.NullString
    ElementType        sql.NullString
    PageSection        sql.NullString
    XPath              sql.NullString
    Tags               sql.NullString
    Notes              sql.NullString
    VideoPlatform      sql.NullString
    VideoTimestamp     sql.NullInt64
    VideoDuration      sql.NullInt64
    VideoTitle         sql.NullString
    VideoURL           sql.NullString
    ThumbnailURL       sql.NullString
    FormattedTimestamp sql.NullString
    ScrapedAt          sql.NullString
    CreatedAt          time.Time
    UpdatedAt          time.Time
}
```

## New Features

### 1. Content Types
The API now supports different content types:
- `page` - Full page capture
- `selection` - Text selection only
- `video` - Video bookmark
- `video_selection` - Text selection from video page

### 2. Video Support
Captures video metadata:
- Platform (YouTube, Netflix, Vimeo, Twitch, HTML5)
- Timestamp (in seconds)
- Duration
- Title and URL
- Thumbnail
- Formatted timestamp (HH:MM:SS)

### 3. Context Capture
For text selections:
- Context before (200 chars)
- Context after (200 chars)
- Full context
- Element type (p, div, span, etc.)
- Page section
- XPath for precise location

### 4. Link Extraction
Automatically extracts and stores links from content in separate table.

### 5. Full-Text Search
- PostgreSQL full-text search using `to_tsvector`
- GIN indexes for performance
- Searches across title, content, selected_text, and tags
- Date range filtering
- Content type filtering

### 6. Query Filtering
GET /api/memories supports:
- `?content_type=video` - Filter by type
- `?platform=youtube` - Filter by video platform
- `?tags=javascript,react` - Filter by tags (comma-separated)
- `?search=query` - Search in content
- `?page=1&limit=20` - Pagination

### 7. Statistics
GET /api/memories/stats provides:
- Total memories
- Count by content type
- Count by video platform
- Count by tags
- Recent activity

## Migration Steps

### 1. Database Setup
```bash
# Drop old tables (CAUTION: This will delete data)
DROP TABLE IF EXISTS items CASCADE;

# The new schema will be created automatically when you run the backend
# Tables: memories, links with indexes
```

### 2. Update API Endpoint in Extension
The extension has been updated to use `/api/memories` instead of `/api/scrape`.

However, the backend still supports `/api/scrape` for backward compatibility (it maps to `/api/memories`).

### 3. Test the Backend
```bash
cd api
go run main.go
```

### 4. Test the Extension
1. Load the extension in Chrome
2. Navigate to any webpage
3. Select text and right-click → "Save Selection to BrowseBaba"
4. Go to a YouTube video, right-click → "Save Video Timestamp"
5. Check the popup to see saved memories

### 5. Verify Database
```bash
# Connect to PostgreSQL
psql -U postgres -d browsebaba

# Check memories table
SELECT id, title, content_type, video_platform, video_timestamp FROM memories;

# Check links table
SELECT memory_id, url, text FROM links;

# Test full-text search
SELECT * FROM memories WHERE 
    to_tsvector('english', COALESCE(title, '') || ' ' || 
                COALESCE(content, '') || ' ' || 
                COALESCE(selected_text, '') || ' ' || 
                COALESCE(tags, '')) 
    @@ plainto_tsquery('english', 'your search term');
```

## API Examples

### Save a Text Selection
```bash
curl -X POST http://localhost:8000/api/memories \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article",
    "title": "Great Article",
    "content_type": "selection",
    "selected_text": "This is the selected text",
    "context_before": "...some context before...",
    "context_after": "...some context after...",
    "element_type": "p",
    "xpath": "/html/body/article/p[3]",
    "tags": "javascript,tutorial",
    "notes": "Important concept"
  }'
```

### Save a Video Bookmark
```bash
curl -X POST http://localhost:8000/api/memories \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=abc123",
    "title": "Great Tutorial",
    "content_type": "video",
    "video": {
      "platform": "youtube",
      "timestamp": 305,
      "duration": 1200,
      "video_title": "Learn Go in 20 Minutes",
      "video_url": "https://www.youtube.com/watch?v=abc123",
      "thumbnail_url": "https://i.ytimg.com/vi/abc123/maxresdefault.jpg",
      "formatted_timestamp": "00:05:05"
    },
    "tags": "golang,tutorial",
    "notes": "Good explanation of interfaces"
  }'
```

### Search Memories
```bash
curl -X POST http://localhost:8000/api/memories/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "golang interfaces",
    "content_type": "video",
    "limit": 10
  }'
```

### Get Statistics
```bash
curl http://localhost:8000/api/memories/stats
```

### Filter by Platform
```bash
curl "http://localhost:8000/api/memories?platform=youtube&limit=10"
```

### Filter by Tags
```bash
curl "http://localhost:8000/api/memories?tags=javascript,react"
```

## Backward Compatibility

The backend still supports the legacy `/api/scrape` endpoint, which internally routes to `/api/memories`. This ensures that:
1. Old extension versions continue to work
2. You can migrate gradually
3. Existing integrations aren't broken

## Performance Considerations

### Indexes Created
1. `idx_memories_content_type` - Fast filtering by content type
2. `idx_memories_video_platform` - Fast filtering by video platform
3. `idx_memories_created_at` - Fast sorting by date
4. `idx_memories_tags` - Fast tag-based queries
5. `idx_memories_url` - Fast URL lookups
6. `idx_memories_scraped_at` - Fast filtering by scrape date
7. `idx_links_memory_id` - Fast link lookups
8. `idx_memories_search` (GIN) - Full-text search performance

### Query Optimization
- Use pagination (`page` and `limit` parameters)
- Use specific filters (content_type, platform, tags)
- Full-text search uses PostgreSQL's native GIN indexes
- Links are stored in separate table for better normalization

## Troubleshooting

### Extension Not Saving
1. Check API URL in extension popup settings
2. Verify backend is running: `curl http://localhost:8000/health`
3. Check browser console for errors
4. Check backend logs for errors

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check connection string in `api/config/database.go`
3. Ensure database exists: `createdb browsebaba`
4. Check PostgreSQL logs: `/var/log/postgresql/`

### Search Not Working
1. Verify GIN index exists: `\d memories` in psql
2. Check for NULL values in search fields
3. Test with simple queries first
4. Check PostgreSQL full-text search configuration

## Next Steps

1. **Add Authentication**: Implement JWT authentication for multi-user support
2. **Add Tags Management**: Separate tags table for tag autocomplete
3. **Add Collections**: Group memories into collections
4. **Add Sharing**: Share memories with others
5. **Add Export**: Export memories to JSON/CSV
6. **Add Search Filters UI**: Build a rich search interface
7. **Add Analytics**: Track usage patterns
8. **Add Browser Sync**: Sync across multiple browsers

## Files Changed

### Backend
- `api/models/item.go` - Replaced with Memory model
- `api/config/database.go` - New schema
- `api/controllers/memory_controller.go` - New controller
- `api/routes/routes.go` - Updated routes

### Extension
- `extension/background.js` - Updated API endpoint
- `extension/popup.js` - Updated API endpoint
- `extension/content.js` - Enhanced with video detection

### Legacy Files (Can be removed)
- `api/controllers/item_controller.go` - Old generic CRUD controller
- Can keep for reference or remove completely
