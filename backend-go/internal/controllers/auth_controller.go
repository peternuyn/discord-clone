package controllers

import (
	"net/http"

	"discord-clone-backend/internal/auth"
	"discord-clone-backend/internal/middleware"
	"discord-clone-backend/internal/models"
	"discord-clone-backend/pkg/database"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthController handles authentication-related requests
type AuthController struct {
	jwtSecret string
}

// NewAuthController creates a new auth controller
func NewAuthController(jwtSecret string) *AuthController {
	return &AuthController{
		jwtSecret: jwtSecret,
	}
}

// RegisterRequest represents the request body for user registration
type RegisterRequest struct {
	Username       string `json:"username" binding:"required,min=3,max=20"`
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

// LoginRequest represents the request body for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Register handles user registration
func (ac *AuthController) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Validate passwords match
	if req.Password != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Passwords don't match",
		})
		return
	}

	// Validate username format
	if !auth.IsValidUsername(req.Username) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username can only contain letters, numbers, and underscores",
		})
		return
	}

	// Check if user already exists
	var existingUser models.User
	result := database.DB.Where("email = ? OR username = ?", req.Email, req.Username).First(&existingUser)
	if result.Error == nil {
		errorMsg := "User already exists"
		if existingUser.Email == req.Email {
			errorMsg = "Email already registered"
		} else {
			errorMsg = "Username already taken"
		}
		c.JSON(http.StatusBadRequest, gin.H{
			"error": errorMsg,
		})
		return
	}

	// Generate unique discriminator
	discriminator := auth.GenerateDiscriminator()
	for {
		var user models.User
		result := database.DB.Where("discriminator = ?", discriminator).First(&user)
		if result.Error != nil {
			break // Discriminator is unique
		}
		discriminator = auth.GenerateDiscriminator()
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process password",
		})
		return
	}

	// Create user
	user := models.User{
		ID:            uuid.New().String(),
		Username:      req.Username,
		Email:         req.Email,
		Password:      hashedPassword,
		Discriminator: discriminator,
		Avatar:        nil, // Will be set to default avatar URL
		Status:        "offline",
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	// Return user data (excluding password)
	userResponse := gin.H{
		"id":            user.ID,
		"username":      user.Username,
		"email":         user.Email,
		"discriminator": user.Discriminator,
		"avatar":        user.Avatar,
		"status":        user.Status,
		"created_at":    user.CreatedAt,
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    userResponse,
	})
}

// Login handles user login
func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Find user by email
	var user models.User
	result := database.DB.Where("email = ?", req.Email).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	// Verify password
	if err := auth.VerifyPassword(req.Password, user.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, ac.jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})
		return
	}

	// Update user status to online
	user.Status = "online"
	database.DB.Save(&user)

	// Set HTTP-only cookie
	c.SetCookie("token", token, 7*24*60*60, "/", "", false, true) // 7 days, HTTP-only

	// Return user data
	userResponse := gin.H{
		"id":            user.ID,
		"username":      user.Username,
		"email":         user.Email,
		"discriminator": user.Discriminator,
		"avatar":        user.Avatar,
		"status":        user.Status,
		"bio":           user.Bio,
		"location":      user.Location,
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user":    userResponse,
	})
}

// Logout handles user logout
func (ac *AuthController) Logout(c *gin.Context) {
	// Clear the token cookie
	c.SetCookie("token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// GetCurrentUser returns the current authenticated user
func (ac *AuthController) GetCurrentUser(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	// Find user by ID
	var user models.User
	result := database.DB.Where("id = ?", userID).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	// Return user data (excluding password)
	userResponse := gin.H{
		"id":            user.ID,
		"username":      user.Username,
		"email":         user.Email,
		"discriminator": user.Discriminator,
		"avatar":        user.Avatar,
		"status":        user.Status,
		"bio":           user.Bio,
		"location":      user.Location,
		"created_at":    user.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"user": userResponse,
	})
}
