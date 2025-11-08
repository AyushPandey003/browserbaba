package models

import (
	"time"
)

// Item represents the main data model for our CRUD application
type Item struct {
	ID          int64     `json:"id" db:"id"`
	Title       string    `json:"title" db:"title" validate:"required,min=3,max=100"`
	Description string    `json:"description" db:"description" validate:"max=500"`
	Status      string    `json:"status" db:"status" validate:"required,oneof=pending in_progress completed"`
	Priority    string    `json:"priority" db:"priority" validate:"required,oneof=low medium high"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// CreateItemRequest represents the request body for creating an item
type CreateItemRequest struct {
	Title       string `json:"title" validate:"required,min=3,max=100"`
	Description string `json:"description" validate:"max=500"`
	Status      string `json:"status" validate:"required,oneof=pending in_progress completed"`
	Priority    string `json:"priority" validate:"required,oneof=low medium high"`
}

// UpdateItemRequest represents the request body for updating an item
type UpdateItemRequest struct {
	Title       string `json:"title" validate:"omitempty,min=3,max=100"`
	Description string `json:"description" validate:"max=500"`
	Status      string `json:"status" validate:"omitempty,oneof=pending in_progress completed"`
	Priority    string `json:"priority" validate:"omitempty,oneof=low medium high"`
}

// Response represents a standard API response
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
