package config

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

var (
	DB     *sql.DB
	dbOnce sync.Mutex
)

// ConnectDB initializes the PostgreSQL connection. It returns an error instead of exiting the process
// so serverless environments (like Vercel) can return HTTP errors instead of crashing.
func ConnectDB() error {
	// avoid reinitializing if already connected
	if DB != nil {
		return nil
	}

	// In local development load .env if present. Vercel sets the VERCEL env var in its runtime,
	// so only load .env when VERCEL is not present to avoid overriding platform envs.
	if os.Getenv("VERCEL") == "" {
		_ = godotenv.Load()
	}

	postgresURI := os.Getenv("POSTGRES_URI")
	if postgresURI == "" {
		// In production (VERCEL set) we should fail fast and return an error. Locally fall back to
		// a sensible default for development convenience.
		if os.Getenv("VERCEL") != "" {
			return errors.New("POSTGRES_URI not set in environment")
		}
		postgresURI = "postgres://postgres:postgres@localhost:5432/golearn?sslmode=disable"
		log.Println("POSTGRES_URI not set, using default: postgres://postgres:postgres@localhost:5432/golearn?sslmode=disable")
	}

	dbOnce.Lock()
	defer dbOnce.Unlock()

	var err error
	DB, err = sql.Open("postgres", postgresURI)
	if err != nil {
		return fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	// Verify connection
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping PostgreSQL: %w", err)
	}

	// Set connection pool settings
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)

	log.Println("Successfully connected to PostgreSQL!")

	// Create tables if they don't exist
	if err := createTables(); err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	return nil
}

// createTables creates the necessary tables if they don't exist
func createTables() error {
	query := `
	-- Main memories table for browser extension data
	CREATE TABLE IF NOT EXISTS memories (
		id SERIAL PRIMARY KEY,
		url TEXT NOT NULL,
		title TEXT NOT NULL,
		content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('page', 'selection', 'video_timestamp', 'links', 'custom')),
		content TEXT,
		selected_text TEXT,
		context_before TEXT,
		context_after TEXT,
		full_context TEXT,
		element_type VARCHAR(50),
		page_section VARCHAR(50),
		xpath TEXT,
		tags TEXT,
		notes TEXT,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		scraped_at TIMESTAMP NOT NULL,
		
		-- Video-specific fields
		video_platform VARCHAR(50),
		video_timestamp BIGINT,
		video_duration BIGINT,
		video_title TEXT,
		video_url TEXT,
		thumbnail_url TEXT,
		formatted_timestamp VARCHAR(20)
	);

	-- Links table for storing extracted links
	CREATE TABLE IF NOT EXISTS links (
		id SERIAL PRIMARY KEY,
		memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
		text TEXT,
		href TEXT NOT NULL,
		link_title TEXT,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	-- Indexes for better query performance
	CREATE INDEX IF NOT EXISTS idx_memories_url ON memories(url);
	CREATE INDEX IF NOT EXISTS idx_memories_content_type ON memories(content_type);
	CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_memories_scraped_at ON memories(scraped_at DESC);
	CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING gin(to_tsvector('english', COALESCE(tags, '')));
	CREATE INDEX IF NOT EXISTS idx_memories_content ON memories USING gin(to_tsvector('english', COALESCE(content, '')));
	CREATE INDEX IF NOT EXISTS idx_memories_video_platform ON memories(video_platform) WHERE video_platform IS NOT NULL;
	CREATE INDEX IF NOT EXISTS idx_links_memory_id ON links(memory_id);

	-- Full-text search index
	CREATE INDEX IF NOT EXISTS idx_memories_search ON memories USING gin(
		to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(selected_text, '') || ' ' || COALESCE(tags, ''))
	);
	`

	_, err := DB.Exec(query)
	return err
}

// GetDB returns the database connection
func GetDB() *sql.DB {
	return DB
}
