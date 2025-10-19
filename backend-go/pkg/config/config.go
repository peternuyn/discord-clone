package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all configuration for our application
type Config struct {
	Database DatabaseConfig
	JWT      JWTConfig
	Server   ServerConfig
	CORS     CORSConfig
	RateLimit RateLimitConfig
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	Secret string
	Expiry string
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port     string
	Environment string
}

// CORSConfig holds CORS configuration
type CORSConfig struct {
	Origin string
}

// RateLimitConfig holds rate limiting configuration
type RateLimitConfig struct {
	Window     string
	MaxRequests int
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	config := &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DATABASE_HOST", "localhost"),
			Port:     getEnv("DATABASE_PORT", "5432"),
			User:     getEnv("DATABASE_USER", "postgres"),
			Password: getEnv("DATABASE_PASSWORD", "password"),
			DBName:   getEnv("DATABASE_NAME", "discord_clone"),
			SSLMode:  getEnv("DATABASE_SSL_MODE", "disable"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "your-super-secret-jwt-key-here"),
			Expiry: getEnv("JWT_EXPIRY", "168h"),
		},
		Server: ServerConfig{
			Port:       getEnv("PORT", "5000"),
			Environment: getEnv("NODE_ENV", "development"),
		},
		CORS: CORSConfig{
			Origin: getEnv("CORS_ORIGIN", "http://localhost:3000"),
		},
		RateLimit: RateLimitConfig{
			Window:      getEnv("RATE_LIMIT_WINDOW", "15m"),
			MaxRequests: getEnvAsInt("RATE_LIMIT_MAX_REQUESTS", 300),
		},
	}

	// Validate required configuration
	if config.JWT.Secret == "your-super-secret-jwt-key-here" {
		log.Println("Warning: Using default JWT secret. Please set JWT_SECRET in your environment.")
	}

	return config, nil
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as an integer with a default value
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// IsProduction returns true if the application is running in production mode
func (c *Config) IsProduction() bool {
	return c.Server.Environment == "production"
}
