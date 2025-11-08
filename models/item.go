package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Item represents the main data model for our CRUD application
type Item struct {
	ID          primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	Title       string             `json:"title" bson:"title" validate:"required,min=3,max=100"`
	Description string             `json:"description" bson:"description" validate:"max=500"`
	Status      string             `json:"status" bson:"status" validate:"required,oneof=pending in_progress completed"`
	Priority    string             `json:"priority" bson:"priority" validate:"required,oneof=low medium high"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
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
