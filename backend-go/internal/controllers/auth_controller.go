package controllers

import (
	"discord-clone-backend/internal/auth"
	"discord-clone-backend/internal/db"
	"discord-clone-backend/internal/middleware"
	"discord-clone-backend/pkg/database"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// AuthController handles authentication-related requests
type AuthController struct {
	jwtSecret string
	queries   *db.Queries
}

// NewAuthController creates a new auth controller
func NewAuthController(jwtSecret string) *AuthController {
	return &AuthController{
		jwtSecret: jwtSecret,
		queries:   db.New(database.GetDB()),
	}
}

// RegisterRequest represents the request body for user registration
type RegisterRequest struct {
	Username        string `json:"username" binding:"required,min=3,max=20"`
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

// LoginRequest represents the request body for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Register handles user registration
func (ac *AuthController) Register(c *gin.Context) {
	ctx := c.Request.Context()
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
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
	existingUser, err := ac.queries.GetUserByEmailOrUsername(ctx, db.GetUserByEmailOrUsernameParams{
		Email:    req.Email,
		Username: req.Username,
	})
	if err == nil {
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
	if !database.IsNoRowsError(err) {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check user existence",
		})
		return
	}

	// Generate unique discriminator
	discriminator := auth.GenerateDiscriminator()
	for {
		_, err := ac.queries.GetUserByDiscriminator(ctx, discriminator)
		if err != nil {
			if database.IsNoRowsError(err) {
				break // Discriminator is unique
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to check discriminator",
			})
			return
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
	userID := uuid.New().String()
	user, err := ac.queries.CreateUser(ctx, db.CreateUserParams{
		ID:            userID,
		Username:      req.Username,
		Email:         req.Email,
		Password:      hashedPassword,
		Discriminator: discriminator,
		Avatar:        pgtype.Text{Valid: false}, // nil
		Status:        pgtype.Text{String: "offline", Valid: true},
		Bio:           pgtype.Text{Valid: false}, // nil
		Location:      pgtype.Text{Valid: false}, // nil
	})
	if err != nil {
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
		"avatar":        database.PgTextToString(user.Avatar),
		"status":        database.PgTextToString(user.Status),
		"created_at":    user.CreatedAt,
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    userResponse,
	})
}

// Login handles user login
func (ac *AuthController) Login(c *gin.Context) {
	ctx := c.Request.Context()
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Find user by email
	user, err := ac.queries.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid email or password",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to find user",
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

	print("JWT token: ", token + "\n")
	// Update user status to online
	updatedUser, err := ac.queries.UpdateUserStatus(ctx, db.UpdateUserStatusParams{
		ID:     user.ID,
		Status: pgtype.Text{String: "online", Valid: true},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update user status",
		})
		return
	}

	// Set HTTP-only cookie
	c.SetCookie("token", token, 7*24*60*60, "/", "", false, true) // 7 days, HTTP-only

	// Return user data
	userResponse := gin.H{
		"id":            updatedUser.ID,
		"username":      updatedUser.Username,
		"email":         updatedUser.Email,
		"discriminator": updatedUser.Discriminator,
		"avatar":        database.PgTextToString(updatedUser.Avatar),
		"status":        database.PgTextToString(updatedUser.Status),
		"bio":           database.PgTextToString(updatedUser.Bio),
		"location":      database.PgTextToString(updatedUser.Location),
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
	ctx := c.Request.Context()
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	// Find user by ID
	user, err := ac.queries.GetUserByID(ctx, userID)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to find user",
		})
		return
	}

	// Return user data (excluding password)
	userResponse := gin.H{
		"id":            user.ID,
		"username":      user.Username,
		"email":         user.Email,
		"discriminator": user.Discriminator,
		"avatar":        database.PgTextToString(user.Avatar),
		"status":        database.PgTextToString(user.Status),
		"bio":           database.PgTextToString(user.Bio),
		"location":      database.PgTextToString(user.Location),
		"created_at":    user.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"user": userResponse,
	})
}
