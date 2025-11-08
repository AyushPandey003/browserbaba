package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"api/config"
	"api/middleware"
	"api/models"
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
	now := time.Now()
	query := `
		INSERT INTO items (title, description, status, priority, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, title, description, status, priority, created_at, updated_at
	`

	var item models.Item
	err := config.GetDB().QueryRow(
		query,
		req.Title,
		req.Description,
		req.Status,
		req.Priority,
		now,
		now,
	).Scan(
		&item.ID,
		&item.Title,
		&item.Description,
		&item.Status,
		&item.Priority,
		&item.CreatedAt,
		&item.UpdatedAt,
	)

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

	// Parse query parameters for filtering and sorting
	status := r.URL.Query().Get("status")
	priority := r.URL.Query().Get("priority")

	query := "SELECT id, title, description, status, priority, created_at, updated_at FROM items WHERE 1=1"
	args := []interface{}{}
	argCount := 1

	if status != "" {
		query += " AND status = $" + strconv.Itoa(argCount)
		args = append(args, status)
		argCount++
	}
	if priority != "" {
		query += " AND priority = $" + strconv.Itoa(argCount)
		args = append(args, priority)
		argCount++
	}

	// Sort by creation date (newest first)
	query += " ORDER BY created_at DESC"

	rows, err := config.GetDB().Query(query, args...)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch items")
		return
	}
	defer rows.Close()

	var items []models.Item
	for rows.Next() {
		var item models.Item
		if err := rows.Scan(
			&item.ID,
			&item.Title,
			&item.Description,
			&item.Status,
			&item.Priority,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to decode items")
			return
		}
		items = append(items, item)
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

	itemID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid item ID")
		return
	}

	query := "SELECT id, title, description, status, priority, created_at, updated_at FROM items WHERE id = $1"

	var item models.Item
	err = config.GetDB().QueryRow(query, itemID).Scan(
		&item.ID,
		&item.Title,
		&item.Description,
		&item.Status,
		&item.Priority,
		&item.CreatedAt,
		&item.UpdatedAt,
	)

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

	itemID, err := strconv.ParseInt(id, 10, 64)
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

	// Build update query dynamically
	updates := []string{}
	args := []interface{}{}
	argCount := 1

	if req.Title != "" {
		updates = append(updates, "title = $"+strconv.Itoa(argCount))
		args = append(args, req.Title)
		argCount++
	}
	if req.Description != "" {
		updates = append(updates, "description = $"+strconv.Itoa(argCount))
		args = append(args, req.Description)
		argCount++
	}
	if req.Status != "" {
		updates = append(updates, "status = $"+strconv.Itoa(argCount))
		args = append(args, req.Status)
		argCount++
	}
	if req.Priority != "" {
		updates = append(updates, "priority = $"+strconv.Itoa(argCount))
		args = append(args, req.Priority)
		argCount++
	}

	// Always update the updated_at field
	updates = append(updates, "updated_at = $"+strconv.Itoa(argCount))
	args = append(args, time.Now())
	argCount++

	// Add ID as the last parameter
	args = append(args, itemID)

	query := "UPDATE items SET " + updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += " WHERE id = $" + strconv.Itoa(argCount) + " RETURNING id, title, description, status, priority, created_at, updated_at"

	var updatedItem models.Item
	err = config.GetDB().QueryRow(query, args...).Scan(
		&updatedItem.ID,
		&updatedItem.Title,
		&updatedItem.Description,
		&updatedItem.Status,
		&updatedItem.Priority,
		&updatedItem.CreatedAt,
		&updatedItem.UpdatedAt,
	)

	if err != nil {
		middleware.ErrorResponse(w, http.StatusNotFound, "Item not found")
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

	itemID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid item ID")
		return
	}

	query := "DELETE FROM items WHERE id = $1"
	result, err := config.GetDB().Exec(query, itemID)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete item")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to verify deletion")
		return
	}

	if rowsAffected == 0 {
		middleware.ErrorResponse(w, http.StatusNotFound, "Item not found")
		return
	}

	middleware.SuccessResponse(w, http.StatusOK, "Item deleted successfully", nil)
}
