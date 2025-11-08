package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"api/config"
	"api/middleware"
	"api/models"
)

// CreateScrapedData creates a new scraped data entry
func CreateScrapedData(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by JWT middleware)
	userID := middleware.GetUserID(r)
	if userID == "" {
		middleware.ErrorResponse(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.CreateScrapedDataRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := middleware.ValidateStruct(&req); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	// Convert metadata to JSON
	metadataJSON, err := json.Marshal(req.Metadata)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid metadata format")
		return
	}

	// Convert tags array to comma-separated string
	tags := strings.Join(req.Tags, ",")

	// Insert into database
	query := `
		INSERT INTO scraped_data (user_id, url, title, content, metadata, tags, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`

	var scrapedData models.ScrapedData
	scrapedData.UserID = userID
	scrapedData.URL = req.URL
	scrapedData.Title = req.Title
	scrapedData.Content = req.Content
	scrapedData.Tags = tags

	err = config.DB.QueryRow(
		query,
		userID,
		req.URL,
		req.Title,
		req.Content,
		metadataJSON,
		tags,
		time.Now(),
		time.Now(),
	).Scan(&scrapedData.ID, &scrapedData.CreatedAt, &scrapedData.UpdatedAt)

	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to create scraped data: "+err.Error())
		return
	}

	// Set metadata as JSON string for response
	scrapedData.Metadata = string(metadataJSON)

	middleware.JSONResponse(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "Scraped data created successfully",
		"data":    scrapedData,
	})
}

// GetAllScrapedData retrieves all scraped data for the authenticated user
func GetAllScrapedData(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := middleware.GetUserID(r)
	if userID == "" {
		middleware.ErrorResponse(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Parse query parameters
	urlFilter := r.URL.Query().Get("url")
	tagFilter := r.URL.Query().Get("tag")
	limitStr := r.URL.Query().Get("limit")
	pageStr := r.URL.Query().Get("page")

	// Set defaults
	limit := 50
	page := 1

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	offset := (page - 1) * limit

	// Build query
	query := `SELECT id, user_id, url, title, content, metadata, tags, created_at, updated_at
	          FROM scraped_data WHERE user_id = $1`
	args := []interface{}{userID}
	argCount := 1

	if urlFilter != "" {
		argCount++
		query += " AND url ILIKE $" + strconv.Itoa(argCount)
		args = append(args, "%"+urlFilter+"%")
	}

	if tagFilter != "" {
		argCount++
		query += " AND tags ILIKE $" + strconv.Itoa(argCount)
		args = append(args, "%"+tagFilter+"%")
	}

	query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argCount+1) + " OFFSET $" + strconv.Itoa(argCount+2)
	args = append(args, limit, offset)

	rows, err := config.DB.Query(query, args...)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch scraped data: "+err.Error())
		return
	}
	defer rows.Close()

	var scrapedDataList []models.ScrapedData
	for rows.Next() {
		var data models.ScrapedData
		var metadataJSON []byte

		err := rows.Scan(
			&data.ID,
			&data.UserID,
			&data.URL,
			&data.Title,
			&data.Content,
			&metadataJSON,
			&data.Tags,
			&data.CreatedAt,
			&data.UpdatedAt,
		)
		if err != nil {
			middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to scan scraped data: "+err.Error())
			return
		}

		data.Metadata = string(metadataJSON)
		scrapedDataList = append(scrapedDataList, data)
	}

	if scrapedDataList == nil {
		scrapedDataList = []models.ScrapedData{}
	}

	middleware.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    scrapedDataList,
		"page":    page,
		"limit":   limit,
	})
}

// GetScrapedDataByID retrieves a specific scraped data entry by ID
func GetScrapedDataByID(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := middleware.GetUserID(r)
	if userID == "" {
		middleware.ErrorResponse(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	idStr := r.URL.Query().Get("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	query := `SELECT id, user_id, url, title, content, metadata, tags, created_at, updated_at
	          FROM scraped_data WHERE id = $1 AND user_id = $2`

	var data models.ScrapedData
	var metadataJSON []byte

	err = config.DB.QueryRow(query, id, userID).Scan(
		&data.ID,
		&data.UserID,
		&data.URL,
		&data.Title,
		&data.Content,
		&metadataJSON,
		&data.Tags,
		&data.CreatedAt,
		&data.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		middleware.ErrorResponse(w, http.StatusNotFound, "Scraped data not found")
		return
	} else if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch scraped data: "+err.Error())
		return
	}

	data.Metadata = string(metadataJSON)

	middleware.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    data,
	})
}

// UpdateScrapedData updates an existing scraped data entry
func UpdateScrapedData(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := middleware.GetUserID(r)
	if userID == "" {
		middleware.ErrorResponse(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	idStr := r.URL.Query().Get("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	var req models.UpdateScrapedDataRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := middleware.ValidateStruct(&req); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	// Build update query dynamically
	updates := []string{}
	args := []interface{}{}
	argCount := 0

	if req.Title != "" {
		argCount++
		updates = append(updates, "title = $"+strconv.Itoa(argCount))
		args = append(args, req.Title)
	}

	if req.Content != "" {
		argCount++
		updates = append(updates, "content = $"+strconv.Itoa(argCount))
		args = append(args, req.Content)
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid metadata format")
			return
		}
		argCount++
		updates = append(updates, "metadata = $"+strconv.Itoa(argCount))
		args = append(args, metadataJSON)
	}

	if req.Tags != nil {
		tags := strings.Join(req.Tags, ",")
		argCount++
		updates = append(updates, "tags = $"+strconv.Itoa(argCount))
		args = append(args, tags)
	}

	if len(updates) == 0 {
		middleware.ErrorResponse(w, http.StatusBadRequest, "No fields to update")
		return
	}

	argCount++
	updates = append(updates, "updated_at = $"+strconv.Itoa(argCount))
	args = append(args, time.Now())

	argCount++
	args = append(args, id)
	argCount++
	args = append(args, userID)

	query := "UPDATE scraped_data SET " + strings.Join(updates, ", ") +
		" WHERE id = $" + strconv.Itoa(argCount-1) + " AND user_id = $" + strconv.Itoa(argCount)

	result, err := config.DB.Exec(query, args...)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to update scraped data: "+err.Error())
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		middleware.ErrorResponse(w, http.StatusNotFound, "Scraped data not found")
		return
	}

	middleware.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Scraped data updated successfully",
	})
}

// DeleteScrapedData deletes a scraped data entry
func DeleteScrapedData(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := middleware.GetUserID(r)
	if userID == "" {
		middleware.ErrorResponse(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	idStr := r.URL.Query().Get("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	query := `DELETE FROM scraped_data WHERE id = $1 AND user_id = $2`
	result, err := config.DB.Exec(query, id, userID)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete scraped data: "+err.Error())
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		middleware.ErrorResponse(w, http.StatusNotFound, "Scraped data not found")
		return
	}

	middleware.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Scraped data deleted successfully",
	})
}
