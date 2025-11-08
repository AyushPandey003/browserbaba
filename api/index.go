package handler

import (
	"log"
	"net/http"

	"api/config"
	"api/routes"
)

// Handler is the main entry point for Vercel serverless function
// It attempts to (lazily) initialize the DB and returns a 500 if DB setup fails so the runtime
// doesn't exit the process on startup.
func Handler(w http.ResponseWriter, r *http.Request) {
	if err := config.ConnectDB(); err != nil {
		log.Println("database connection error:", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	routes.SetupRoutes()(w, r)
}
