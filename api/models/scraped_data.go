package models

import (
	"time"
)

// ScrapedData represents data scraped from web pages by the browser extension
type ScrapedData struct {
	ID        int64     `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	URL       string    `json:"url" db:"url"`
	Title     string    `json:"title" db:"title"`
	Content   string    `json:"content" db:"content"`
	Metadata  string    `json:"metadata" db:"metadata"` // JSON string for flexible metadata storage
	Tags      string    `json:"tags" db:"tags"`         // Comma-separated tags
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// CreateScrapedDataRequest represents the request body for creating scraped data
type CreateScrapedDataRequest struct {
	URL      string                 `json:"url" validate:"required,url"`
	Title    string                 `json:"title" validate:"required,max=500"`
	Content  string                 `json:"content" validate:"required"`
	Metadata map[string]interface{} `json:"metadata"`
	Tags     []string               `json:"tags"`
}

// UpdateScrapedDataRequest represents the request body for updating scraped data
type UpdateScrapedDataRequest struct {
	Title    string                 `json:"title" validate:"omitempty,max=500"`
	Content  string                 `json:"content"`
	Metadata map[string]interface{} `json:"metadata"`
	Tags     []string               `json:"tags"`
}

// ScrapedDataQueryParams represents query parameters for filtering scraped data
type ScrapedDataQueryParams struct {
	URL   string `json:"url"`
	Tag   string `json:"tag"`
	Limit int    `json:"limit"`
	Page  int    `json:"page"`
}
