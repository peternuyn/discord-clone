package middleware

import (
	"time"

	"discord-clone-backend/pkg/config"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSMiddleware sets up CORS configuration
func CORSMiddleware(cfg *config.Config) gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins:     []string{cfg.CORS.Origin},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}

// RateLimitMiddleware provides basic rate limiting
func RateLimitMiddleware(cfg *config.Config) gin.HandlerFunc {
	// For now, we'll implement a simple in-memory rate limiter
	// In production, you might want to use Redis for distributed rate limiting
	return func(c *gin.Context) {
		// This is a placeholder - you can implement a more sophisticated rate limiter
		// For now, we'll just pass through
		c.Next()
	}
}
