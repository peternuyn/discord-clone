package controllers

import (
	"net/http"

	"discord-clone-backend/internal/db"
	"discord-clone-backend/internal/middleware"
	"discord-clone-backend/pkg/database"

	"github.com/gin-gonic/gin"
)

// UserController handles user-related requests
type UserController struct {
	queries *db.Queries
}

// NewUserController creates a new user controller
func NewUserController() *UserController {
	return &UserController{
		queries: db.New(database.GetDB()),
	}
}

// GetUsers returns a list of users
func (uc *UserController) GetUsers(c *gin.Context) {
	ctx := c.Request.Context()

	users, err := uc.queries.GetUsers(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch users",
		})
		return
	}

	// Convert to response format (excluding password)
	usersResp := make([]gin.H, len(users))
	for i, user := range users {
		usersResp[i] = gin.H{
			"id":            user.ID,
			"username":      user.Username,
			"email":         user.Email,
			"discriminator": user.Discriminator,
			"avatar":        database.PgTextToString(user.Avatar),
			"status":        database.PgTextToString(user.Status),
			"bio":           database.PgTextToString(user.Bio),
			"location":      database.PgTextToString(user.Location),
			"created_at":    user.CreatedAt,
			"updated_at":    user.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"users": usersResp,
	})
}

// GetUser returns a specific user by ID
func (uc *UserController) GetUser(c *gin.Context) {
	ctx := c.Request.Context()
	userID := c.Param("id")

	user, err := uc.queries.GetUserByID(ctx, userID)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch user",
		})
		return
	}

	// Return user data (excluding password)
	userResp := gin.H{
		"id":            user.ID,
		"username":      user.Username,
		"email":         user.Email,
		"discriminator": user.Discriminator,
		"avatar":        database.PgTextToString(user.Avatar),
		"status":        database.PgTextToString(user.Status),
		"bio":           database.PgTextToString(user.Bio),
		"location":      database.PgTextToString(user.Location),
		"created_at":    user.CreatedAt,
		"updated_at":    user.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"user": userResp,
	})
}

// UpdateUser updates a user's information
func (uc *UserController) UpdateUser(c *gin.Context) {
	ctx := c.Request.Context()
	userID := c.Param("id")
	currentUserID, _ := middleware.GetUserID(c)

	// Users can only update their own profile
	if userID != currentUserID {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "You can only update your own profile",
		})
		return
	}

	var updateData struct {
		Username *string `json:"username"`
		Bio      *string `json:"bio"`
		Location *string `json:"location"`
		Avatar   *string `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Get current user to preserve fields that aren't being updated
	currentUser, err := uc.queries.GetUserByID(ctx, userID)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch user",
		})
		return
	}

	// Update only provided fields, preserve others
	username := currentUser.Username
	if updateData.Username != nil {
		username = *updateData.Username
	}

	email := currentUser.Email // Email shouldn't be updated via this endpoint, but preserve it

	avatar := database.PgTextToString(currentUser.Avatar)
	if updateData.Avatar != nil {
		avatar = updateData.Avatar
	}

	status := database.PgTextToString(currentUser.Status)
	if status == nil {
		statusStr := "offline"
		status = &statusStr
	}

	bio := database.PgTextToString(currentUser.Bio)
	if updateData.Bio != nil {
		bio = updateData.Bio
	}

	location := database.PgTextToString(currentUser.Location)
	if updateData.Location != nil {
		location = updateData.Location
	}

	// Update user
	updatedUser, err := uc.queries.UpdateUser(ctx, db.UpdateUserParams{
		ID:       userID,
		Username: username,
		Email:    email,
		Avatar:   database.StringToPgText(avatar),
		Status:   database.StringToPgText(status),
		Bio:      database.StringToPgText(bio),
		Location: database.StringToPgText(location),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update user",
		})
		return
	}

	// Return updated user data (excluding password)
	userResp := gin.H{
		"id":            updatedUser.ID,
		"username":      updatedUser.Username,
		"email":         updatedUser.Email,
		"discriminator": updatedUser.Discriminator,
		"avatar":        database.PgTextToString(updatedUser.Avatar),
		"status":        database.PgTextToString(updatedUser.Status),
		"bio":           database.PgTextToString(updatedUser.Bio),
		"location":      database.PgTextToString(updatedUser.Location),
		"created_at":    updatedUser.CreatedAt,
		"updated_at":    updatedUser.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User updated successfully",
		"user":    userResp,
	})
}
