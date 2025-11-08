package middleware

import (
	"log"
	"net/http"
	"time"
)

// Logger middleware logs incoming requests
func Logger(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		log.Printf(
			"[%s] %s %s",
			r.Method,
			r.RequestURI,
			r.RemoteAddr,
		)

		next(w, r)

		log.Printf(
			"[%s] %s completed in %v",
			r.Method,
			r.RequestURI,
			time.Since(start),
		)
	}
}
