package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"

// JWTAuth validates JWT tokens from the Authorization header
func JWTAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get the Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			ErrorResponse(w, http.StatusUnauthorized, "Authorization header required")
			return
		}

		// Check if it's a Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			ErrorResponse(w, http.StatusUnauthorized, "Invalid authorization format. Use: Bearer <token>")
			return
		}

		tokenString := parts[1]

		// Get JWT secret from environment
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			ErrorResponse(w, http.StatusInternalServerError, "Server configuration error")
			return
		}

		// Parse and validate the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate the signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			ErrorResponse(w, http.StatusUnauthorized, "Invalid token: "+err.Error())
			return
		}

		if !token.Valid {
			ErrorResponse(w, http.StatusUnauthorized, "Invalid token")
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			ErrorResponse(w, http.StatusUnauthorized, "Invalid token claims")
			return
		}

		// Get user ID from claims (adjust field name based on your JWT structure)
		var userID string
		if id, ok := claims["sub"].(string); ok {
			userID = id
		} else if id, ok := claims["userId"].(string); ok {
			userID = id
		} else if id, ok := claims["user_id"].(string); ok {
			userID = id
		} else {
			ErrorResponse(w, http.StatusUnauthorized, "User ID not found in token")
			return
		}

		// Add user ID to request context
		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// GetUserID retrieves the user ID from the request context
func GetUserID(r *http.Request) string {
	if userID, ok := r.Context().Value(UserIDKey).(string); ok {
		return userID
	}
	return ""
}
