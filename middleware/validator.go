package middleware

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

// ValidateStruct validates a struct using validator tags
func ValidateStruct(s interface{}) error {
	return validate.Struct(s)
}

// JSONResponse sends a JSON response
func JSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// ErrorResponse sends an error response
func ErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	response := map[string]interface{}{
		"success": false,
		"error":   message,
	}
	JSONResponse(w, statusCode, response)
}

// SuccessResponse sends a success response
func SuccessResponse(w http.ResponseWriter, statusCode int, message string, data interface{}) {
	response := map[string]interface{}{
		"success": true,
		"message": message,
		"data":    data,
	}
	JSONResponse(w, statusCode, response)
}
