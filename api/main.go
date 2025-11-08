package main

import (
	"log"
	"net/http"
	"os"

	"api/config"
	"api/routes"
)

func main() {
	// Load port from environment or default to 8000 (to match extension)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	// Initialize database connection
	config.ConnectDB()

	// Setup routes
	http.HandleFunc("/", routes.SetupRoutes())

	// Start server
	log.Printf("🚀 BrowseBaba Backend starting on http://localhost:%s", port)
	log.Printf("📡 Main API endpoint: http://localhost:%s/api/memories", port)
	log.Printf("📋 Health check: http://localhost:%s/health", port)
	log.Printf("🔍 Extension endpoint: http://localhost:%s/api/scrape (legacy)", port)
	log.Println("✨ Extension-focused backend ready!")
	log.Println("Press Ctrl+C to stop the server")

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
