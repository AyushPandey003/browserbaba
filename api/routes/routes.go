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
	if path == "/api" || path == "/api/" {
		handleHealthCheck(w, r)
		return
	}

	// Item routes
	if strings.HasPrefix(path, "/api/items") {
		handleItemRoutes(w, r, path)
		return
	}

	// Scraped data routes (protected with JWT)
	if strings.HasPrefix(path, "/api/scraped") {
		handleScrapedDataRoutes(w, r, path)
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
		"message": "API is running",
		"version": "1.0.0",
		"endpoints": map[string]string{
			"GET /api":                     "Health check",
			"POST /api/items":              "Create an item",
			"GET /api/items":               "Get all items",
			"GET /api/items?id=":           "Get item by ID",
			"PUT /api/items?id=":           "Update item by ID",
			"DELETE /api/items?id=":        "Delete item by ID",
			"POST /api/scraped":            "Create scraped data (JWT required)",
			"GET /api/scraped":             "Get all scraped data (JWT required)",
			"GET /api/scraped?id=":         "Get scraped data by ID (JWT required)",
			"PUT /api/scraped?id=":         "Update scraped data (JWT required)",
			"DELETE /api/scraped?id=":      "Delete scraped data (JWT required)",
		},
	}
	middleware.JSONResponse(w, http.StatusOK, response)
}

func handleItemRoutes(w http.ResponseWriter, r *http.Request, path string) {
	// Check if ID is provided in query string
	id := r.URL.Query().Get("id")

	// Route based on method and ID presence
	switch r.Method {
	case http.MethodGet:
		if id != "" {
			controllers.GetItemByID(w, r)
		} else {
			controllers.GetAllItems(w, r)
		}
	case http.MethodPost:
		if id != "" {
			middleware.ErrorResponse(w, http.StatusBadRequest, "ID should not be provided for POST requests")
			return
		}
		controllers.CreateItem(w, r)
	case http.MethodPut:
		if id == "" {
			middleware.ErrorResponse(w, http.StatusBadRequest, "Item ID is required")
			return
		}
		controllers.UpdateItem(w, r)
	case http.MethodDelete:
		if id == "" {
			middleware.ErrorResponse(w, http.StatusBadRequest, "Item ID is required")
			return
		}
		controllers.DeleteItem(w, r)
	default:
		middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func handleScrapedDataRoutes(w http.ResponseWriter, r *http.Request, path string) {
	// Apply JWT authentication middleware for all scraped data routes
	middleware.JWTAuth(func(w http.ResponseWriter, r *http.Request) {
		// Check if ID is provided in query string
		id := r.URL.Query().Get("id")

		// Route based on method and ID presence
		switch r.Method {
		case http.MethodGet:
			if id != "" {
				controllers.GetScrapedDataByID(w, r)
			} else {
				controllers.GetAllScrapedData(w, r)
			}
		case http.MethodPost:
			if id != "" {
				middleware.ErrorResponse(w, http.StatusBadRequest, "ID should not be provided for POST requests")
				return
			}
			controllers.CreateScrapedData(w, r)
		case http.MethodPut:
			if id == "" {
				middleware.ErrorResponse(w, http.StatusBadRequest, "Scraped data ID is required")
				return
			}
			controllers.UpdateScrapedData(w, r)
		case http.MethodDelete:
			if id == "" {
				middleware.ErrorResponse(w, http.StatusBadRequest, "Scraped data ID is required")
				return
			}
			controllers.DeleteScrapedData(w, r)
		default:
			middleware.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	})(w, r)
}
