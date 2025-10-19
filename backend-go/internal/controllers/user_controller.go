package controllers

import (
	"net/http"

	"discord-clone-backend/internal/middleware"
	"discord-clone-backend/internal/models"
	"discord-clone-backend/pkg/database"

	"github.com/gin-gonic/gin"
)

// UserController handles user-related requests
type UserController struct{}

// NewUserController creates a new user controller
func NewUserController() *UserController {
	return &UserController{}
}

// GetUsers returns a list of users
func (uc *UserController) GetUsers(c *gin.Context) {
	var users []models.User
	result := database.DB.Select("id, username, email, discriminator, avatar, status, bio, location, created_at").Find(&users)
	
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch users",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})
}

// GetUser returns a specific user by ID
func (uc *UserController) GetUser(c *gin.Context) {
	userID := c.Param("id")
	
	var user models.User
	result := database.DB.Select("id, username, email, discriminator, avatar, status, bio, location, created_at").Where("id = ?", userID).First(&user)
	
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// UpdateUser updates a user's information
func (uc *UserController) UpdateUser(c *gin.Context) {
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

	// Update user
	updates := make(map[string]interface{})
	if updateData.Username != nil {
		updates["username"] = *updateData.Username
	}
	if updateData.Bio != nil {
		updates["bio"] = *updateData.Bio
	}
	if updateData.Location != nil {
		updates["location"] = *updateData.Location
	}
	if updateData.Avatar != nil {
		updates["avatar"] = *updateData.Avatar
	}

	result := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update user",
		})
		return
	}

	// Fetch updated user
	var user models.User
	database.DB.Select("id, username, email, discriminator, avatar, status, bio, location, created_at, updated_at").Where("id = ?", userID).First(&user)

	c.JSON(http.StatusOK, gin.H{
		"message": "User updated successfully",
		"user":    user,
	})
}
