package models

import (
	"database/sql"
	"time"
)

// Item represents a basic item in the system
type Item struct {
	ID          int64     `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Description string    `json:"description" db:"description"`
	Status      string    `json:"status" db:"status"`
	Priority    string    `json:"priority" db:"priority"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// CreateItemRequest represents the request for creating an item
type CreateItemRequest struct {
	Title       string `json:"title" validate:"required"`
	Description string `json:"description"`
	Status      string `json:"status" validate:"required"`
	Priority    string `json:"priority" validate:"required"`
}

// UpdateItemRequest represents the request for updating an item
type UpdateItemRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Priority    string `json:"priority"`
}

// Memory represents saved content from the browser extension
type Memory struct {
	ID               int64          `json:"id" db:"id"`
	URL              string         `json:"url" db:"url" validate:"required,url"`
	Title            string         `json:"title" db:"title" validate:"required"`
	ContentType      string         `json:"content_type" db:"content_type" validate:"required,oneof=page selection video_timestamp links custom"`
	Content          string         `json:"content" db:"content"`
	SelectedText     string         `json:"selected_text" db:"selected_text"`
	ContextBefore    sql.NullString `json:"context_before,omitempty" db:"context_before"`
	ContextAfter     sql.NullString `json:"context_after,omitempty" db:"context_after"`
	FullContext      sql.NullString `json:"full_context,omitempty" db:"full_context"`
	ElementType      sql.NullString `json:"element_type,omitempty" db:"element_type"`
	PageSection      sql.NullString `json:"page_section,omitempty" db:"page_section"`
	XPath            sql.NullString `json:"xpath,omitempty" db:"xpath"`
	Tags             []string       `json:"tags" db:"-"`
	TagsString       sql.NullString `json:"-" db:"tags"` // Stored as comma-separated in DB
	Notes            sql.NullString `json:"notes,omitempty" db:"notes"`
	CreatedAt        time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at" db:"updated_at"`
	ScrapedAt        time.Time      `json:"scraped_at" db:"scraped_at"`
	
	// Video-specific fields
	VideoPlatform    sql.NullString `json:"video_platform,omitempty" db:"video_platform"`
	VideoTimestamp   sql.NullInt64  `json:"video_timestamp,omitempty" db:"video_timestamp"`
	VideoDuration    sql.NullInt64  `json:"video_duration,omitempty" db:"video_duration"`
	VideoTitle       sql.NullString `json:"video_title,omitempty" db:"video_title"`
	VideoURL         sql.NullString `json:"video_url,omitempty" db:"video_url"`
	ThumbnailURL     sql.NullString `json:"thumbnail_url,omitempty" db:"thumbnail_url"`
	FormattedTime    sql.NullString `json:"formatted_timestamp,omitempty" db:"formatted_timestamp"`
}

// CreateMemoryRequest represents the request from the extension
type CreateMemoryRequest struct {
	URL           string      `json:"url" validate:"required,url"`
	Title         string      `json:"title" validate:"required"`
	ContentType   string      `json:"content_type" validate:"required"`
	Content       string      `json:"content"`
	SelectedText  string      `json:"selected_text"`
	ContextBefore string      `json:"context_before"`
	ContextAfter  string      `json:"context_after"`
	FullContext   string      `json:"full_context"`
	ElementType   string      `json:"element_type"`
	PageSection   string      `json:"page_section"`
	XPath         string      `json:"xpath"`
	Links         []Link      `json:"links"`
	Tags          []string    `json:"tags"`
	Notes         string      `json:"notes"`
	ScrapedAt     time.Time   `json:"scraped_at"`
	VideoData     *VideoData  `json:"video_data"`
}

// VideoData represents video-specific information
type VideoData struct {
	Platform           string `json:"platform"`
	Timestamp          int64  `json:"timestamp"`
	Duration           int64  `json:"duration"`
	VideoTitle         string `json:"video_title"`
	VideoURL           string `json:"video_url"`
	ThumbnailURL       string `json:"thumbnail_url"`
	FormattedTimestamp string `json:"formatted_timestamp"`
}

// Link represents a captured link from the page
type Link struct {
	Text  string `json:"text"`
	Href  string `json:"href"`
	Title string `json:"title"`
}

// UpdateMemoryRequest represents the request for updating a memory
type UpdateMemoryRequest struct {
	Title       string   `json:"title" validate:"omitempty"`
	Tags        []string `json:"tags"`
	Notes       string   `json:"notes"`
	ContentType string   `json:"content_type" validate:"omitempty"`
}

// SearchRequest represents search parameters
type SearchRequest struct {
	Query       string   `json:"query"`
	Tags        []string `json:"tags"`
	ContentType string   `json:"content_type"`
	Platform    string   `json:"platform"`
	StartDate   string   `json:"start_date"`
	EndDate     string   `json:"end_date"`
	Limit       int      `json:"limit"`
	Offset      int      `json:"offset"`
}

// MemoryResponse represents a single memory response
type MemoryResponse struct {
	Memory
	VideoData *VideoData `json:"video_data,omitempty"`
}

// Response represents a standard API response
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Count   int         `json:"count,omitempty"`
}

// Stats represents usage statistics
type Stats struct {
	TotalMemories    int            `json:"total_memories"`
	ByContentType    map[string]int `json:"by_content_type"`
	ByPlatform       map[string]int `json:"by_platform"`
	RecentCount      int            `json:"recent_count"`
	TotalTags        int            `json:"total_tags"`
	MostUsedTags     []TagCount     `json:"most_used_tags"`
}

// TagCount represents a tag with its usage count
type TagCount struct {
	Tag   string `json:"tag"`
	Count int    `json:"count"`
}
