package main

import (
	"log"
	"net/http"

	"discord-clone-backend/internal/middleware"
	"discord-clone-backend/internal/routes"
	"discord-clone-backend/pkg/config"
	"discord-clone-backend/pkg/database"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Set Gin mode based on environment
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	if err := database.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Test database connection
	if err := database.TestConnection(); err != nil {
		log.Fatalf("Failed to test database connection: %v", err)
	}

	// Note: Database migrations should be run manually using: make migrate
	database.Migrate() // No-op, just logs a reminder

	// Create Gin router
	router := gin.New()
	
	// Disable automatic redirect trailing slash
	router.RedirectTrailingSlash = false
	router.RedirectFixedPath = false

	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORSMiddleware(cfg))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "OK",
			"timestamp": gin.H{},
		})
	})

	// Setup API routes
	api := router.Group("/api")
	routes.SetupRoutes(api, cfg)

	// Start server
	port := cfg.Server.Port
	if port == "" {
		port = "5000"
	}

	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("📊 Environment: %s", cfg.Server.Environment)
	log.Printf("🔗 Health check: http://localhost:%s/health", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
