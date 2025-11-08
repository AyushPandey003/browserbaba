-- Initial database schema for items table
-- Run this migration manually if needed, or it will be auto-created by the application

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_priority ON items(priority);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

-- Optional: Insert sample data for testing
-- INSERT INTO items (title, description, status, priority) VALUES
-- ('Sample Task 1', 'This is a sample task', 'pending', 'high'),
-- ('Sample Task 2', 'Another sample task', 'in_progress', 'medium'),
-- ('Sample Task 3', 'Completed sample task', 'completed', 'low');
