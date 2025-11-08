package routes

import (
	"net/http"
	"strings"

	"api/controllers"
	"api/middleware"
)

// SetupRoutes configures all API routes
func SetupRoutes() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Apply CORS middleware
		middleware.CORS(handleRoutes)(w, r)
	}
}

func handleRoutes(w http.ResponseWriter, r *http.Request) {
	// Apply logger middleware
	middleware.Logger(routeHandler)(w, r)
}

func routeHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	// Health check endpoint
	if path == "/api" || path == "/api/" || path == "/health" {
		handleHealthCheck(w, r)
		return
	}

	// Extension endpoints - Main API
	if strings.HasPrefix(path, "/api/memories") {
		if path == "/api/memories/search" {
			controllers.SearchMemories(w, r)
			return
		}
		if path == "/api/memories/stats" {
			controllers.GetStats(w, r)
			return
		}
		handleMemoryRoutes(w, r, path)
		return
	}

	// Legacy scrape endpoint (maps to memories)
	if path == "/api/scrape" {
		controllers.CreateMemory(w, r)
		return
	}

	// 404 - Not Found
	middleware.ErrorResponse(w, http.StatusNotFound, "Endpoint not found")
}

func handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	response := map[string]interface{}{
		"success": true,
		"message": "BrowseBaba API is running",
		"version": "2.0.0",
		"purpose": "Browser Extension Backend",
		"endpoints": map[string]string{
			"GET /api":                      "Health check",
			"GET /health":                   "Health check",
			"POST /api/scrape":              "Save content from extension (legacy)",
			"POST /api/memories":            "Save content from extension",
			"GET /api/memories":             "Get all saved memories",
			"GET /api/memories?id=":         "Get memory by ID",
			"PUT /api/memories?id=":         "Update memory by ID",
			"DELETE /api/memories?id=":      "Delete memory by ID",
			"POST /api/memories/search":     "Full-text search memories",
			"GET /api/memories/stats":       "Get usage statistics",
		},
		"features": []string{
			"Save web content, selections, and video timestamps",
			"Full-text search across all saved content",
			"Tag-based organization",
			"Video platform support (YouTube, Netflix, etc.)",
			"Context-aware text capture",
			"Link extraction and storage",
		},
	}
	middleware.JSONResponse(w, http.StatusOK, response)
}

func handleMemoryRoutes(w http.ResponseWriter, r *http.Request, path string) {
	// Check if ID is provided in query string
	id := r.URL.Query().Get("id")

	// Route based on method and ID presence
	switch r.Method {
	case http.MethodGet:
		if id != "" {
			controllers.GetMemoryByID(w, r)
		} else {
			controllers.GetAllMemories(w, r)
		}
	case http.MethodPost:
		if id != "" {
			middleware.ErrorResponse(w, http.StatusBadRequest, "ID should not be provided for POST requests")
			return
		}
		controllers.CreateMemory(w, r)
	case http.MethodPut:
		if id == "" {
			middleware.ErrorResponse(w, http.StatusBadRequest, "Memory ID is required")
			return
		}
		controllers.UpdateMemory(w, r)
	case http.MethodDelete:
		if id == "" {
			middleware.ErrorResponse(w, http.StatusBadRequest, "Memory ID is required")
			return
		}
		controllers.DeleteMemory(w, r)
	default:
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}
