package config

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	DB     *mongo.Database
	dbOnce sync.Mutex
)

// ConnectDB initializes the MongoDB connection. It returns an error instead of exiting the process
// so serverless environments (like Vercel) can return HTTP errors instead of crashing.
func ConnectDB() error {
	// avoid reinitializing if already connected
	if DB != nil {
		return nil
	}

	// In local development load .env if present. Vercel sets the VERCEL env var in its runtime,
	// so only load .env when VERCEL is not present to avoid overriding platform envs.
	if os.Getenv("VERCEL") == "" {
		_ = godotenv.Load()
	}

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		// In production (VERCEL set) we should fail fast and return an error. Locally fall back to
		// a sensible default for development convenience.
		if os.Getenv("VERCEL") != "" {
			return errors.New("MONGODB_URI not set in environment")
		}
		mongoURI = "mongodb://localhost:27017"
		log.Println("MONGODB_URI not set, using default: mongodb://localhost:27017")
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		if os.Getenv("VERCEL") != "" {
			return errors.New("DB_NAME not set in environment")
		}
		dbName = "golearn"
		log.Println("DB_NAME not set, using default: golearn")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(mongoURI)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping the database to verify connection
	if err = client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	dbOnce.Lock()
	DB = client.Database(dbName)
	dbOnce.Unlock()

	log.Println("Successfully connected to MongoDB!")
	return nil
}

// GetCollection returns a collection from the database
func GetCollection(collectionName string) *mongo.Collection {
	if DB == nil {
		return nil
	}
	return DB.Collection(collectionName)
}
