package main

import (
	"log"
	"net/http"
	"os"

	"api/config"
	"api/routes"
)

func main() {
	// Load port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize database connection
	config.ConnectDB()

	// Setup routes
	http.HandleFunc("/", routes.SetupRoutes())

	// Start server
	log.Printf("🚀 Server starting on http://localhost:%s", port)
	log.Printf("📡 API endpoint: http://localhost:%s/api", port)
	log.Printf("📋 Health check: http://localhost:%s/api", port)
	log.Println("Press Ctrl+C to stop the server")

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
