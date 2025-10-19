package controllers

import (
	"net/http"

	"discord-clone-backend/internal/middleware"
	"discord-clone-backend/internal/models"
	"discord-clone-backend/pkg/database"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ServerController handles server-related requests
type ServerController struct{}

// NewServerController creates a new server controller
func NewServerController() *ServerController {
	return &ServerController{}
}

// CreateServerRequest represents the request body for creating a server
type CreateServerRequest struct {
	Name        string  `json:"name" binding:"required,min=2"`
	Description *string `json:"description"`
	Icon        *string `json:"icon"`
}

// CreateServer creates a new server
func (sc *ServerController) CreateServer(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req CreateServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Create server
	server := models.Server{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Icon:        req.Icon,
		OwnerID:     userID,
	}

	if err := database.DB.Create(&server).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create server",
		})
		return
	}

	// Create server member (owner)
	member := models.ServerMember{
		ID:       uuid.New().String(),
		ServerID: server.ID,
		UserID:   userID,
		Role:     "owner",
	}

	if err := database.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create server membership",
		})
		return
	}

	// Create default general channel
	channel := models.Channel{
		ID:       uuid.New().String(),
		Name:     "general",
		Type:     "text",
		ServerID: server.ID,
		Position: 0,
	}

	if err := database.DB.Create(&channel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create default channel",
		})
		return
	}

	// Fetch server with relationships
	var createdServer models.Server
	database.DB.Preload("Members").Preload("Channels").Where("id = ?", server.ID).First(&createdServer)

	c.JSON(http.StatusCreated, createdServer)
}

// GetUserServers returns all servers for the current user
func (sc *ServerController) GetUserServers(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var servers []models.Server
	result := database.DB.Preload("Channels").Preload("Members.User").
		Joins("JOIN server_members ON servers.id = server_members.server_id").
		Where("server_members.user_id = ?", userID).
		Find(&servers)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch servers",
		})
		return
	}

	c.JSON(http.StatusOK, servers)
}

// GetServer returns a specific server by ID
func (sc *ServerController) GetServer(c *gin.Context) {
	serverID := c.Param("id")
	userID, _ := middleware.GetUserID(c)

	// Check if user is a member of the server
	var member models.ServerMember
	result := database.DB.Where("server_id = ? AND user_id = ?", serverID, userID).First(&member)
	if result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Not a member of this server",
		})
		return
	}

	var server models.Server
	result = database.DB.Preload("Channels").Preload("Members.User").Where("id = ?", serverID).First(&server)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Server not found",
		})
		return
	}

	c.JSON(http.StatusOK, server)
}

// UpdateServer updates a server's information
func (sc *ServerController) UpdateServer(c *gin.Context) {
	serverID := c.Param("id")
	userID, _ := middleware.GetUserID(c)

	// Check if user has permission to update the server
	var member models.ServerMember
	result := database.DB.Where("server_id = ? AND user_id = ?", serverID, userID).First(&member)
	if result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Not a member of this server",
		})
		return
	}

	// Only owners and admins can update servers
	if member.Role != "owner" && member.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Only server owners and admins can update the server",
		})
		return
	}

	var updateData struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
		Icon        *string `json:"icon"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Update server
	updates := make(map[string]interface{})
	if updateData.Name != nil {
		updates["name"] = *updateData.Name
	}
	if updateData.Description != nil {
		updates["description"] = *updateData.Description
	}
	if updateData.Icon != nil {
		updates["icon"] = *updateData.Icon
	}

	result = database.DB.Model(&models.Server{}).Where("id = ?", serverID).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update server",
		})
		return
	}

	// Fetch updated server
	var server models.Server
	database.DB.Preload("Members").Preload("Channels").Where("id = ?", serverID).First(&server)

	c.JSON(http.StatusOK, server)
}

// DeleteServer deletes a server
func (sc *ServerController) DeleteServer(c *gin.Context) {
	serverID := c.Param("id")
	userID, _ := middleware.GetUserID(c)

	// Check if user has permission to delete the server
	var member models.ServerMember
	result := database.DB.Where("server_id = ? AND user_id = ?", serverID, userID).First(&member)
	if result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Not a member of this server",
		})
		return
	}

	// Only owners and admins can delete servers
	if member.Role != "owner" && member.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Only server owners and admins can delete the server",
		})
		return
	}

	// Delete server (cascade will handle related records)
	result = database.DB.Delete(&models.Server{}, "id = ?", serverID)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete server",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Server deleted successfully",
	})
}

// QuitServer removes a user from a server
func (sc *ServerController) QuitServer(c *gin.Context) {
	serverID := c.Param("id")
	userID, _ := middleware.GetUserID(c)

	// Check if user is a member of the server
	var member models.ServerMember
	result := database.DB.Where("server_id = ? AND user_id = ?", serverID, userID).First(&member)
	if result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Not a member of this server",
		})
		return
	}

	// Check if user is the owner (owners can't quit, they must delete)
	if member.Role == "owner" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Server owners cannot quit. Use delete server instead.",
		})
		return
	}

	// Remove user from server
	result = database.DB.Delete(&member)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to quit server",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully left the server",
	})
}

// Placeholder methods for channels and invites (to be implemented)
func (sc *ServerController) CreateChannel(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "CreateChannel not implemented yet",
	})
}

func (sc *ServerController) GetChannel(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "GetChannel not implemented yet",
	})
}

func (sc *ServerController) UpdateChannel(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "UpdateChannel not implemented yet",
	})
}

func (sc *ServerController) DeleteChannel(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "DeleteChannel not implemented yet",
	})
}

func (sc *ServerController) CreateInvite(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "CreateInvite not implemented yet",
	})
}

func (sc *ServerController) GetInvite(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "GetInvite not implemented yet",
	})
}

func (sc *ServerController) AcceptInvite(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "AcceptInvite not implemented yet",
	})
}
