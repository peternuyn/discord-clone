package middleware

import (
	"net/http"
	"strings"

	"discord-clone-backend/internal/auth"
	"discord-clone-backend/pkg/config"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware authenticates requests using JWT tokens
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header or cookie
		var token string
		
		// Try to get from Authorization header first
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			// Extract token from "Bearer <token>" format
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				token = parts[1]
			}
		}
		
		// If not found in header, try to get from cookie
		if token == "" {
			cookie, err := c.Cookie("token")
			if err == nil {
				token = cookie
			}
		}

		// Check if token exists
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
			return
		}

		// Verify token
		claims, err := auth.VerifyToken(token, cfg.JWT.Secret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Set user ID in context
		c.Set("user_id", claims.UserID)
		c.Next()
	}
}

// OptionalAuthMiddleware authenticates requests but doesn't require authentication
func OptionalAuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header or cookie
		var token string
		
		// Try to get from Authorization header first
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			// Extract token from "Bearer <token>" format
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				token = parts[1]
			}
		}
		
		// If not found in header, try to get from cookie
		if token == "" {
			cookie, err := c.Cookie("token")
			if err == nil {
				token = cookie
			}
		}

		// If token exists, verify it
		if token != "" {
			claims, err := auth.VerifyToken(token, cfg.JWT.Secret)
			if err == nil {
				c.Set("user_id", claims.UserID)
			}
		}

		c.Next()
	}
}

// GetUserID extracts the user ID from the context
func GetUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	
	userIDStr, ok := userID.(string)
	if !ok {
		return "", false
	}
	
	return userIDStr, true
}
