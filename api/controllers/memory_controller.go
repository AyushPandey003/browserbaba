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

	"github.com/google/uuid"
)

// CreateMemory handles POST /api/memories (from extension)
func CreateMemory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.CreateMemoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	// Set defaults if missing
	if req.Title == "" {
		req.Title = "Untitled"
	}
	if req.ContentType == "" {
		req.ContentType = "page"
	}

	// Validate request - Skip URL validation if it's a special browser URL
	if err := middleware.ValidateStruct(req); err != nil {
		// If URL validation fails, check if it's a special browser URL or missing
		if strings.Contains(err.Error(), "url") || strings.Contains(err.Error(), "URL") {
			if req.URL != "" && (strings.HasPrefix(req.URL, "chrome://") ||
				strings.HasPrefix(req.URL, "chrome-extension://") ||
				strings.HasPrefix(req.URL, "edge://") ||
				strings.HasPrefix(req.URL, "about:")) {
				// Skip validation for browser-specific URLs
			} else if req.URL == "" {
				req.URL = "unknown" // Set default for missing URL
			} else {
				middleware.ErrorResponse(w, http.StatusBadRequest, "Validation error: "+err.Error())
				return
			}
		} else {
			middleware.ErrorResponse(w, http.StatusBadRequest, "Validation error: "+err.Error())
			return
		}
	}

	now := time.Now()
	if req.ScrapedAt.IsZero() {
		req.ScrapedAt = now
	}

	// Start transaction
	tx, err := config.GetDB().Begin()
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to start transaction")
		return
	}
	defer tx.Rollback()

	// Prepare tags string
	tagsString := strings.Join(req.Tags, ",")

	// Generate UUID for the new memory
	memoryID := uuid.New().String()

	// Insert memory
	query := `
		INSERT INTO memories (
			id, url, title, content_type, content, selected_text,
			context_before, context_after, full_context,
			element_type, page_section, xpath, tags, notes,
			created_at, updated_at, scraped_at,
			video_platform, video_timestamp, video_duration,
			video_title, video_url, thumbnail_url, formatted_timestamp
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
			$15, $16, $17, $18, $19, $20, $21, $22, $23, $24
		)
	`

	var videoPlatform, videoTitle, videoURL, thumbnailURL, formattedTime sql.NullString
	var videoTimestamp, videoDuration sql.NullInt64

	if req.VideoData != nil {
		videoPlatform = sql.NullString{String: req.VideoData.Platform, Valid: true}
		videoTimestamp = sql.NullInt64{Int64: req.VideoData.Timestamp, Valid: true}
		videoDuration = sql.NullInt64{Int64: req.VideoData.Duration, Valid: true}
		videoTitle = sql.NullString{String: req.VideoData.VideoTitle, Valid: true}
		videoURL = sql.NullString{String: req.VideoData.VideoURL, Valid: true}
		thumbnailURL = sql.NullString{String: req.VideoData.ThumbnailURL, Valid: true}
		formattedTime = sql.NullString{String: req.VideoData.FormattedTimestamp, Valid: true}
	}

	_, err = tx.Exec(
		query,
		memoryID, nullString(req.URL), req.Title, req.ContentType, nullString(req.Content), nullString(req.SelectedText),
		nullString(req.ContextBefore), nullString(req.ContextAfter), nullString(req.FullContext),
		nullString(req.ElementType), nullString(req.PageSection), nullString(req.XPath),
		nullString(tagsString), nullString(req.Notes),
		now, now, req.ScrapedAt,
		videoPlatform, videoTimestamp, videoDuration,
		videoTitle, videoURL, thumbnailURL, formattedTime,
	)

	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to create memory: "+err.Error())
		return
	}

	// Insert links if provided
	if len(req.Links) > 0 {
		linkQuery := `INSERT INTO links (memory_id, text, href, link_title) VALUES ($1, $2, $3, $4)`
		for _, link := range req.Links {
			_, err := tx.Exec(linkQuery, memoryID, link.Text, link.Href, link.Title)
			if err != nil {
				middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to save links")
				return
			}
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to commit transaction")
		return
	}

	// Fetch the created memory
	memory, err := getMemoryByID(memoryID)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Memory created but failed to fetch")
		return
	}

	middleware.SuccessResponse(w, http.StatusCreated, "Memory saved successfully", memory)
}

// GetAllMemories handles GET /api/memories
func GetAllMemories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Parse query parameters
	contentType := r.URL.Query().Get("content_type")
	platform := r.URL.Query().Get("platform")
	tags := r.URL.Query().Get("tags")
	search := r.URL.Query().Get("search")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	query := `
		SELECT id, url, title, content_type, content, selected_text,
			context_before, context_after, full_context,
			element_type, page_section, xpath, tags, notes,
			created_at, updated_at, scraped_at,
			video_platform, video_timestamp, video_duration,
			video_title, video_url, thumbnail_url, formatted_timestamp
		FROM memories WHERE 1=1
	`
	args := []interface{}{}
	argCount := 1

	if contentType != "" {
		query += " AND content_type = $" + strconv.Itoa(argCount)
		args = append(args, contentType)
		argCount++
	}

	if platform != "" {
		query += " AND video_platform = $" + strconv.Itoa(argCount)
		args = append(args, platform)
		argCount++
	}

	if tags != "" {
		query += " AND tags LIKE $" + strconv.Itoa(argCount)
		args = append(args, "%"+tags+"%")
		argCount++
	}

	if search != "" {
		query += " AND (title ILIKE $" + strconv.Itoa(argCount) +
			" OR content ILIKE $" + strconv.Itoa(argCount) +
			" OR selected_text ILIKE $" + strconv.Itoa(argCount) + ")"
		args = append(args, "%"+search+"%")
		argCount++
	}

	query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argCount) + " OFFSET $" + strconv.Itoa(argCount+1)
	args = append(args, limit, offset)

	rows, err := config.GetDB().Query(query, args...)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch memories: "+err.Error())
		return
	}
	defer rows.Close()

	var memories []models.MemoryResponse
	for rows.Next() {
		var memory models.Memory
		err := rows.Scan(
			&memory.ID, &memory.URL, &memory.Title, &memory.ContentType,
			&memory.Content, &memory.SelectedText,
			&memory.ContextBefore, &memory.ContextAfter, &memory.FullContext,
			&memory.ElementType, &memory.PageSection, &memory.XPath,
			&memory.TagsString, &memory.Notes,
			&memory.CreatedAt, &memory.UpdatedAt, &memory.ScrapedAt,
			&memory.VideoPlatform, &memory.VideoTimestamp, &memory.VideoDuration,
			&memory.VideoTitle, &memory.VideoURL, &memory.ThumbnailURL, &memory.FormattedTime,
		)
		if err != nil {
			middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to parse memories")
			return
		}

		response := buildMemoryResponse(memory)
		memories = append(memories, response)
	}

	if memories == nil {
		memories = []models.MemoryResponse{}
	}

	middleware.SuccessResponse(w, http.StatusOK, "Memories retrieved successfully", map[string]interface{}{
		"memories": memories,
		"count":    len(memories),
		"limit":    limit,
		"offset":   offset,
	})
}

// GetMemoryByID handles GET /api/memories?id=
func GetMemoryByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Memory ID is required")
		return
	}

	// Validate UUID format
	if _, err := uuid.Parse(id); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid memory ID format")
		return
	}

	memory, err := getMemoryByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.ErrorResponse(w, http.StatusNotFound, "Memory not found")
		} else {
			middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch memory")
		}
		return
	}

	middleware.SuccessResponse(w, http.StatusOK, "Memory retrieved successfully", memory)
}

// UpdateMemory handles PUT /api/memories?id=
func UpdateMemory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Memory ID is required")
		return
	}

	// Validate UUID format
	if _, err := uuid.Parse(id); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid memory ID format")
		return
	}

	var req models.UpdateMemoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	updates := []string{}
	args := []interface{}{}
	argCount := 1

	if req.Title != "" {
		updates = append(updates, "title = $"+strconv.Itoa(argCount))
		args = append(args, req.Title)
		argCount++
	}

	if len(req.Tags) > 0 {
		updates = append(updates, "tags = $"+strconv.Itoa(argCount))
		args = append(args, strings.Join(req.Tags, ","))
		argCount++
	}

	if req.Notes != "" {
		updates = append(updates, "notes = $"+strconv.Itoa(argCount))
		args = append(args, req.Notes)
		argCount++
	}

	updates = append(updates, "updated_at = $"+strconv.Itoa(argCount))
	args = append(args, time.Now())
	argCount++

	args = append(args, id)

	query := "UPDATE memories SET " + strings.Join(updates, ", ") + " WHERE id = $" + strconv.Itoa(argCount)

	result, err := config.GetDB().Exec(query, args...)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to update memory")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		middleware.ErrorResponse(w, http.StatusNotFound, "Memory not found")
		return
	}

	memory, _ := getMemoryByID(id)
	middleware.SuccessResponse(w, http.StatusOK, "Memory updated successfully", memory)
}

// DeleteMemory handles DELETE /api/memories?id=
func DeleteMemory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Memory ID is required")
		return
	}

	// Validate UUID format
	if _, err := uuid.Parse(id); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid memory ID format")
		return
	}

	query := "DELETE FROM memories WHERE id = $1"
	result, err := config.GetDB().Exec(query, id)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete memory")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		middleware.ErrorResponse(w, http.StatusNotFound, "Memory not found")
		return
	}

	middleware.SuccessResponse(w, http.StatusOK, "Memory deleted successfully", nil)
}

// SearchMemories handles POST /api/memories/search
func SearchMemories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.SearchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Limit == 0 {
		req.Limit = 50
	}
	if req.Limit > 100 {
		req.Limit = 100
	}

	query := `
		SELECT id, url, title, content_type, content, selected_text,
			context_before, context_after, full_context,
			element_type, page_section, xpath, tags, notes,
			created_at, updated_at, scraped_at,
			video_platform, video_timestamp, video_duration,
			video_title, video_url, thumbnail_url, formatted_timestamp
		FROM memories WHERE 1=1
	`
	args := []interface{}{}
	argCount := 1

	if req.Query != "" {
		query += ` AND to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || 
			COALESCE(selected_text, '') || ' ' || COALESCE(tags, '')) @@ plainto_tsquery('english', $` + strconv.Itoa(argCount) + ")"
		args = append(args, req.Query)
		argCount++
	}

	if req.ContentType != "" {
		query += " AND content_type = $" + strconv.Itoa(argCount)
		args = append(args, req.ContentType)
		argCount++
	}

	if req.Platform != "" {
		query += " AND video_platform = $" + strconv.Itoa(argCount)
		args = append(args, req.Platform)
		argCount++
	}

	if len(req.Tags) > 0 {
		for _, tag := range req.Tags {
			query += " AND tags LIKE $" + strconv.Itoa(argCount)
			args = append(args, "%"+tag+"%")
			argCount++
		}
	}

	if req.StartDate != "" {
		query += " AND created_at >= $" + strconv.Itoa(argCount)
		args = append(args, req.StartDate)
		argCount++
	}

	if req.EndDate != "" {
		query += " AND created_at <= $" + strconv.Itoa(argCount)
		args = append(args, req.EndDate)
		argCount++
	}

	query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argCount) + " OFFSET $" + strconv.Itoa(argCount+1)
	args = append(args, req.Limit, req.Offset)

	rows, err := config.GetDB().Query(query, args...)
	if err != nil {
		middleware.ErrorResponse(w, http.StatusInternalServerError, "Search failed: "+err.Error())
		return
	}
	defer rows.Close()

	var memories []models.MemoryResponse
	for rows.Next() {
		var memory models.Memory
		err := rows.Scan(
			&memory.ID, &memory.URL, &memory.Title, &memory.ContentType,
			&memory.Content, &memory.SelectedText,
			&memory.ContextBefore, &memory.ContextAfter, &memory.FullContext,
			&memory.ElementType, &memory.PageSection, &memory.XPath,
			&memory.TagsString, &memory.Notes,
			&memory.CreatedAt, &memory.UpdatedAt, &memory.ScrapedAt,
			&memory.VideoPlatform, &memory.VideoTimestamp, &memory.VideoDuration,
			&memory.VideoTitle, &memory.VideoURL, &memory.ThumbnailURL, &memory.FormattedTime,
		)
		if err != nil {
			continue
		}

		response := buildMemoryResponse(memory)
		memories = append(memories, response)
	}

	if memories == nil {
		memories = []models.MemoryResponse{}
	}

	middleware.SuccessResponse(w, http.StatusOK, "Search completed", map[string]interface{}{
		"memories": memories,
		"count":    len(memories),
	})
}

// GetStats handles GET /api/memories/stats
func GetStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	stats := models.Stats{
		ByContentType: make(map[string]int),
		ByPlatform:    make(map[string]int),
		MostUsedTags:  []models.TagCount{},
	}

	// Total memories
	config.GetDB().QueryRow("SELECT COUNT(*) FROM memories").Scan(&stats.TotalMemories)

	// By content type
	rows, _ := config.GetDB().Query("SELECT content_type, COUNT(*) FROM memories GROUP BY content_type")
	for rows.Next() {
		var contentType string
		var count int
		rows.Scan(&contentType, &count)
		stats.ByContentType[contentType] = count
	}
	rows.Close()

	// By platform
	rows, _ = config.GetDB().Query("SELECT video_platform, COUNT(*) FROM memories WHERE video_platform IS NOT NULL GROUP BY video_platform")
	for rows.Next() {
		var platform string
		var count int
		rows.Scan(&platform, &count)
		stats.ByPlatform[platform] = count
	}
	rows.Close()

	// Recent count (last 7 days)
	config.GetDB().QueryRow("SELECT COUNT(*) FROM memories WHERE created_at > NOW() - INTERVAL '7 days'").Scan(&stats.RecentCount)

	middleware.SuccessResponse(w, http.StatusOK, "Stats retrieved", stats)
}

// Helper functions
func getMemoryByID(id string) (models.MemoryResponse, error) {
	query := `
		SELECT id, url, title, content_type, content, selected_text,
			context_before, context_after, full_context,
			element_type, page_section, xpath, tags, notes,
			created_at, updated_at, scraped_at,
			video_platform, video_timestamp, video_duration,
			video_title, video_url, thumbnail_url, formatted_timestamp
		FROM memories WHERE id = $1
	`

	var memory models.Memory
	err := config.GetDB().QueryRow(query, id).Scan(
		&memory.ID, &memory.URL, &memory.Title, &memory.ContentType,
		&memory.Content, &memory.SelectedText,
		&memory.ContextBefore, &memory.ContextAfter, &memory.FullContext,
		&memory.ElementType, &memory.PageSection, &memory.XPath,
		&memory.TagsString, &memory.Notes,
		&memory.CreatedAt, &memory.UpdatedAt, &memory.ScrapedAt,
		&memory.VideoPlatform, &memory.VideoTimestamp, &memory.VideoDuration,
		&memory.VideoTitle, &memory.VideoURL, &memory.ThumbnailURL, &memory.FormattedTime,
	)

	if err != nil {
		return models.MemoryResponse{}, err
	}

	return buildMemoryResponse(memory), nil
}

func buildMemoryResponse(memory models.Memory) models.MemoryResponse {
	response := models.MemoryResponse{
		Memory: memory,
	}

	// Parse tags
	if memory.TagsString.Valid && memory.TagsString.String != "" {
		response.Tags = strings.Split(memory.TagsString.String, ",")
	} else {
		response.Tags = []string{}
	}

	// Build video data if present
	if memory.VideoPlatform.Valid {
		response.VideoData = &models.VideoData{
			Platform:           memory.VideoPlatform.String,
			Timestamp:          memory.VideoTimestamp.Int64,
			Duration:           memory.VideoDuration.Int64,
			VideoTitle:         memory.VideoTitle.String,
			VideoURL:           memory.VideoURL.String,
			ThumbnailURL:       memory.ThumbnailURL.String,
			FormattedTimestamp: memory.FormattedTime.String,
		}
	}

	return response
}

func nullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}
