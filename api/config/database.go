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
	CREATE TABLE IF NOT EXISTS items (
		id SERIAL PRIMARY KEY,
		title VARCHAR(100) NOT NULL,
		description TEXT,
		status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
		priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
	CREATE INDEX IF NOT EXISTS idx_items_priority ON items(priority);
	CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

	CREATE TABLE IF NOT EXISTS scraped_data (
		id SERIAL PRIMARY KEY,
		user_id VARCHAR(255) NOT NULL,
		url TEXT NOT NULL,
		title VARCHAR(500) NOT NULL,
		content TEXT NOT NULL,
		metadata JSONB,
		tags TEXT,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_scraped_data_user_id ON scraped_data(user_id);
	CREATE INDEX IF NOT EXISTS idx_scraped_data_url ON scraped_data(url);
	CREATE INDEX IF NOT EXISTS idx_scraped_data_created_at ON scraped_data(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_scraped_data_metadata ON scraped_data USING GIN (metadata);
	`

	_, err := DB.Exec(query)
	return err
}

// GetDB returns the database connection
func GetDB() *sql.DB {
	return DB
}
