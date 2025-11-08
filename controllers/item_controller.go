package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"api/config"
	"api/middleware"
	"api/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const collectionName = "items"

// CreateItem handles POST /api/items
func CreateItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.CreateItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := middleware.ValidateStruct(req); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	// Create item
	item := models.Item{
		ID:          primitive.NewObjectID(),
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Priority:    req.Priority,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	collection := config.GetCollection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, item)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to create item")
		return
	}

	middleware.SuccessResponse(w, http.StatusCreated, "Item created successfully", item)
}

// GetAllItems handles GET /api/items
func GetAllItems(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	collection := config.GetCollection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Parse query parameters for filtering and sorting
	status := r.URL.Query().Get("status")
	priority := r.URL.Query().Get("priority")

	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}
	if priority != "" {
		filter["priority"] = priority
	}

	// Sort by creation date (newest first)
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch items")
		return
	}
	defer cursor.Close(ctx)

	var items []models.Item
	if err = cursor.All(ctx, &items); err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to decode items")
		return
	}

	// Return empty array instead of null if no items
	if items == nil {
		items = []models.Item{}
	}

	middleware.SuccessResponse(w, http.StatusOK, "Items retrieved successfully", items)
}

// GetItemByID handles GET /api/items/{id}
func GetItemByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Extract ID from URL path
	id := r.URL.Query().Get("id")
	if id == "" {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Item ID is required")
		return
	}

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid item ID")
		return
	}

	collection := config.GetCollection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var item models.Item
	err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&item)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusNotFound, "Item not found")
		return
	}

	middleware.SuccessResponse(w, http.StatusOK, "Item retrieved successfully", item)
}

// UpdateItem handles PUT /api/items/{id}
func UpdateItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Extract ID from URL
	id := r.URL.Query().Get("id")
	if id == "" {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Item ID is required")
		return
	}

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid item ID")
		return
	}

	var req models.UpdateItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := middleware.ValidateStruct(req); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	// Build update document
	update := bson.M{
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}

	if req.Title != "" {
		update["$set"].(bson.M)["title"] = req.Title
	}
	if req.Description != "" {
		update["$set"].(bson.M)["description"] = req.Description
	}
	if req.Status != "" {
		update["$set"].(bson.M)["status"] = req.Status
	}
	if req.Priority != "" {
		update["$set"].(bson.M)["priority"] = req.Priority
	}

	collection := config.GetCollection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, bson.M{"_id": objectID}, update)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to update item")
		return
	}

	if result.MatchedCount == 0 {
		middleware.ErrorResponse(w, http.StatusNotFound, "Item not found")
		return
	}

	// Fetch updated item
	var updatedItem models.Item
	err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&updatedItem)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch updated item")
		return
	}

	middleware.SuccessResponse(w, http.StatusOK, "Item updated successfully", updatedItem)
}

// DeleteItem handles DELETE /api/items/{id}
func DeleteItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Extract ID from URL
	id := r.URL.Query().Get("id")
	if id == "" {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Item ID is required")
		return
	}

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid item ID")
		return
	}

	collection := config.GetCollection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete item")
		return
	}

	if result.DeletedCount == 0 {
		middleware.ErrorResponse(w, http.StatusNotFound, "Item not found")
		return
	}

	middleware.SuccessResponse(w, http.StatusOK, "Item deleted successfully", nil)
}
