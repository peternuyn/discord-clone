package controllers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"discord-clone-backend/internal/db"
	"discord-clone-backend/internal/middleware"
	"discord-clone-backend/internal/realtime"
	"discord-clone-backend/pkg/database"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ServerController handles server-related requests
type ServerController struct {
	queries *db.Queries
	socket  *realtime.SocketServer
}

// NewServerController creates a new server controller
func NewServerController(socket *realtime.SocketServer) *ServerController {
	return &ServerController{
		queries: db.New(database.GetDB()),
		socket:  socket,
	}
}

// CreateServerRequest represents the request body for creating a server
type CreateServerRequest struct {
	Name        string  `json:"name" binding:"required,min=2"`
	Description *string `json:"description"`
	Icon        *string `json:"icon"`
}

// CreateChannelRequest represents the request body for creating a channel
type CreateChannelRequest struct {
	ServerID string `json:"serverId"`
	Name     string `json:"name"`
	Type     string `json:"type"`
}

// buildServerResponse builds a server response with channels and members
func (sc *ServerController) buildServerResponse(ctx context.Context, server db.Server) (gin.H, error) {
	// Get channels
	channels, err := sc.queries.GetChannelsByServerID(ctx, server.ID)
	if err != nil {
		return nil, err
	}

	// Get members
	members, err := sc.queries.GetServerMembers(ctx, server.ID)
	if err != nil {
		return nil, err
	}

	// Convert channels to response format
	channelsResp := make([]gin.H, len(channels))
	for i, ch := range channels {
		channelsResp[i] = gin.H{
			"id":               ch.ID,
			"name":             ch.Name,
			"type":             ch.Type,
			"server_id":        ch.ServerID,
			"position":         ch.Position,
			"max_participants": ch.MaxParticipants,
			"created_at":       ch.CreatedAt,
			"updated_at":       ch.UpdatedAt,
		}
	}

	// Convert members to response format
	membersResp := make([]gin.H, len(members))
	for i, m := range members {
		membersResp[i] = gin.H{
			"id":        m.ID,
			"server_id": m.ServerID,
			"user_id":   m.UserID,
			"role":      database.PgTextToString(m.Role),
			"joined_at": m.JoinedAt,
		}
	}

	return gin.H{
		"id":          server.ID,
		"name":        server.Name,
		"description": database.PgTextToString(server.Description),
		"icon":        database.PgTextToString(server.Icon),
		"owner_id":    server.OwnerID,
		"created_at":  server.CreatedAt,
		"updated_at":  server.UpdatedAt,
		"channels":    channelsResp,
		"members":     membersResp,
	}, nil
}

// CreateServer creates a new server
func (sc *ServerController) CreateServer(c *gin.Context) {
	ctx := c.Request.Context()
	userID, _ := middleware.GetUserID(c)

	var req CreateServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Create server
	serverID := uuid.New().String()
	server, err := sc.queries.CreateServer(ctx, db.CreateServerParams{
		ID:          serverID,
		Name:        req.Name,
		Description: database.StringToPgText(req.Description),
		Icon:        database.StringToPgText(req.Icon),
		OwnerID:     userID,
	})
	if err != nil {
		fmt.Printf("Error creating server: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create server",
		})
		return
	}

	// Create server member (owner)
	memberID := uuid.New().String()
	_, err = sc.queries.CreateServerMember(ctx, db.CreateServerMemberParams{
		ID:       memberID,
		ServerID: server.ID,
		UserID:   userID,
		Role:     pgtype.Text{String: "owner", Valid: true},
	})
	if err != nil {
		fmt.Printf("Error creating server member: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create server membership",
		})
		return
	}

	// Create default general text channel
	textChannelID := uuid.New().String()
	_, err = sc.queries.CreateChannel(ctx, db.CreateChannelParams{
		ID:              textChannelID,
		Name:            "general",
		Type:            "text",
		ServerID:        server.ID,
		Position:        0,
		MaxParticipants: pgtype.Int4{Valid: false},
	})
	if err != nil {
		fmt.Printf("Error creating text channel: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create default text channel",
		})
		return
	}

	// Create default general voice channel
	voiceChannelID := uuid.New().String()
	_, err = sc.queries.CreateChannel(ctx, db.CreateChannelParams{
		ID:              voiceChannelID,
		Name:            "General",
		Type:            "voice",
		ServerID:        server.ID,
		Position:        1,
		MaxParticipants: pgtype.Int4{Valid: false},
	})
	if err != nil {
		fmt.Printf("Error creating voice channel: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create default voice channel",
		})
		return
	}

	// Fetch server with relationships
	serverResp, err := sc.buildServerResponse(ctx, server)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch server details",
		})
		return
	}

	c.JSON(http.StatusCreated, serverResp)
}

// GetUserServers returns all servers for the current user
func (sc *ServerController) GetUserServers(c *gin.Context) {
	ctx := c.Request.Context()
	userID, _ := middleware.GetUserID(c)

	servers, err := sc.queries.GetUserServers(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch servers",
		})
		return
	}

	// Build response with channels for each server
	serversResp := make([]gin.H, len(servers))
	for i, server := range servers {
		serverResp, err := sc.buildServerResponse(ctx, server)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch server details",
			})
			return
		}
		serversResp[i] = serverResp
	}

	c.JSON(http.StatusOK, serversResp)
}

// GetServer returns a specific server by ID
func (sc *ServerController) GetServer(c *gin.Context) {
	ctx := c.Request.Context()
	serverID := c.Param("id")
	userID, _ := middleware.GetUserID(c)

	// Check if user is a member of the server
	_, err := sc.queries.GetServerMember(ctx, db.GetServerMemberParams{
		ServerID: serverID,
		UserID:   userID,
	})
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Not a member of this server",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check membership",
		})
		return
	}

	server, err := sc.queries.GetServerByID(ctx, serverID)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Server not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch server",
		})
		return
	}

	serverResp, err := sc.buildServerResponse(ctx, server)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch server details",
		})
		return
	}

	c.JSON(http.StatusOK, serverResp)
}

// UpdateServer updates a server's information
func (sc *ServerController) UpdateServer(c *gin.Context) {
	ctx := c.Request.Context()
	serverID := c.Param("id")
	userID, _ := middleware.GetUserID(c)

	// Check if user has permission to update the server
	member, err := sc.queries.GetServerMember(ctx, db.GetServerMemberParams{
		ServerID: serverID,
		UserID:   userID,
	})
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Not a member of this server",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check membership",
		})
		return
	}

	// Only owners and admins can update servers
	role := database.PgTextToString(member.Role)
	if role == nil || (*role != "owner" && *role != "admin") {
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

	// Get current server to preserve fields
	currentServer, err := sc.queries.GetServerByID(ctx, serverID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch server",
		})
		return
	}

	// Update only provided fields
	name := currentServer.Name
	if updateData.Name != nil {
		name = *updateData.Name
	}

	description := database.PgTextToString(currentServer.Description)
	if updateData.Description != nil {
		description = updateData.Description
	}

	icon := database.PgTextToString(currentServer.Icon)
	if updateData.Icon != nil {
		icon = updateData.Icon
	}

	server, err := sc.queries.UpdateServer(ctx, db.UpdateServerParams{
		ID:          serverID,
		Name:        name,
		Description: database.StringToPgText(description),
		Icon:        database.StringToPgText(icon),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update server",
		})
		return
	}

	serverResp, err := sc.buildServerResponse(ctx, server)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch server details",
		})
		return
	}

	c.JSON(http.StatusOK, serverResp)
}

// DeleteServer deletes a server
func (sc *ServerController) DeleteServer(c *gin.Context) {
	ctx := c.Request.Context()
	serverID := c.Param("id")
	userID, _ := middleware.GetUserID(c)

	// Check if user has permission to delete the server
	member, err := sc.queries.GetServerMember(ctx, db.GetServerMemberParams{
		ServerID: serverID,
		UserID:   userID,
	})
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Not a member of this server",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check membership",
		})
		return
	}

	// Only owners and admins can delete servers
	role := database.PgTextToString(member.Role)
	if role == nil || (*role != "owner" && *role != "admin") {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Only server owners and admins can delete the server",
		})
		return
	}

	// Delete server (cascade will handle related records)
	err = sc.queries.DeleteServer(ctx, serverID)
	if err != nil {
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
	ctx := c.Request.Context()
	serverID := c.Param("id")
	userID, _ := middleware.GetUserID(c)

	// Check if user is a member of the server
	member, err := sc.queries.GetServerMember(ctx, db.GetServerMemberParams{
		ServerID: serverID,
		UserID:   userID,
	})
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Not a member of this server",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check membership",
		})
		return
	}

	// Check if user is the owner (owners can't quit, they must delete)
	role := database.PgTextToString(member.Role)
	if role != nil && *role == "owner" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Server owners cannot quit. Use delete server instead.",
		})
		return
	}

	// Remove user from server
	err = sc.queries.DeleteServerMember(ctx, db.DeleteServerMemberParams{
		ServerID: serverID,
		UserID:   userID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to quit server",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully left the server",
	})
}

func (sc *ServerController) CreateChannel(c *gin.Context) {
	ctx := c.Request.Context()
	userID, _ := middleware.GetUserID(c)

	var req CreateChannelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Prefer URL param
	serverID := c.Param("serverId")
	if serverID == "" {
		serverID = req.ServerID
	}
	if serverID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Server ID is required"})
		return
	}

	if req.Name == "" || req.Type == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Channel name and type are required"})
		return
	}

	// Ensure user is a member
	_, err := sc.queries.GetServerMember(ctx, db.GetServerMemberParams{
		ServerID: serverID,
		UserID:   userID,
	})
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not a member of this server"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify server membership"})
		return
	}

	// Calculate next position
	count, err := sc.queries.CountChannelsByServerID(ctx, serverID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate channel position"})
		return
	}

	channelID := uuid.New().String()
	channel, err := sc.queries.CreateChannel(ctx, db.CreateChannelParams{
		ID:              channelID,
		Name:            req.Name,
		Type:            req.Type,
		ServerID:        serverID,
		Position:        int32(count),
		MaxParticipants: pgtype.Int4{Valid: false},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create channel"})
		return
	}

	// -----------------------------------------
	// 🔵 SOCKET EVENT EMISSION
	// -----------------------------------------
	if sc.socket != nil {
		fmt.Println("Emitting socket event to server room:", serverID)

		// Convert channel to map for socket emission
		channelMap := gin.H{
			"id":               channel.ID,
			"name":             channel.Name,
			"type":             channel.Type,
			"server_id":        channel.ServerID,
			"position":         channel.Position,
			"max_participants": channel.MaxParticipants,
			"created_at":       channel.CreatedAt,
			"updated_at":       channel.UpdatedAt,
		}

		// Send channel:new event
		sc.socket.BroadcastToRoom(serverID, "channel:new", channelMap)

		// Test event (same as TS)
		sc.socket.BroadcastToRoom(serverID, "test:event", map[string]any{
			"message":   "Test event from Go channel creation",
			"channelId": channel.ID,
		})

		fmt.Println("Socket events emitted successfully")
	}

	// Return channel in response format
	channelResp := gin.H{
		"id":               channel.ID,
		"name":             channel.Name,
		"type":             channel.Type,
		"server_id":        channel.ServerID,
		"position":         channel.Position,
		"max_participants": channel.MaxParticipants,
		"created_at":       channel.CreatedAt,
		"updated_at":       channel.UpdatedAt,
	}

	c.JSON(http.StatusCreated, channelResp)
}

func (sc *ServerController) GetChannel(c *gin.Context) {
	ctx := c.Request.Context()
	channelID := c.Param("id")

	// Get channel by ID
	channel, err := sc.queries.GetChannelByID(ctx, channelID)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Channel not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch channel",
		})
		return
	}

	// Return channel in response format
	channelResp := gin.H{
		"id":               channel.ID,
		"name":             channel.Name,
		"type":             channel.Type,
		"server_id":        channel.ServerID,
		"position":         channel.Position,
		"max_participants": channel.MaxParticipants,
		"created_at":       channel.CreatedAt,
		"updated_at":       channel.UpdatedAt,
	}

	c.JSON(http.StatusOK, channelResp)
}

func (sc *ServerController) UpdateChannel(c *gin.Context) {
	ctx := c.Request.Context()
	channelID := c.Param("id")

	// Get current channel to verify it exists
	currentChannel, err := sc.queries.GetChannelByID(ctx, channelID)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Channel not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch channel",
		})
		return
	}

	var updateData struct {
		Name            *string `json:"name"`
		Type            *string `json:"type"`
		Position        *int32  `json:"position"`
		MaxParticipants *int32  `json:"max_participants"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Update only provided fields
	name := currentChannel.Name
	if updateData.Name != nil {
		name = *updateData.Name
	}

	channelType := currentChannel.Type
	if updateData.Type != nil {
		channelType = *updateData.Type
	}

	position := currentChannel.Position
	if updateData.Position != nil {
		position = *updateData.Position
	}

	maxParticipants := currentChannel.MaxParticipants
	if updateData.MaxParticipants != nil {
		maxParticipants = pgtype.Int4{Int32: *updateData.MaxParticipants, Valid: true}
	}

	channel, err := sc.queries.UpdateChannel(ctx, db.UpdateChannelParams{
		ID:              channelID,
		Name:            name,
		Type:            channelType,
		Position:        position,
		MaxParticipants: maxParticipants,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update channel",
		})
		return
	}

	// -----------------------------------------
	// 🔵 SOCKET EVENT EMISSION
	// -----------------------------------------
	if sc.socket != nil {
		fmt.Println("Emitting socket event to server room:", channel.ServerID)

		// Convert channel to map for socket emission
		channelMap := gin.H{
			"id":               channel.ID,
			"name":             channel.Name,
			"type":             channel.Type,
			"server_id":        channel.ServerID,
			"position":         channel.Position,
			"max_participants": channel.MaxParticipants,
			"created_at":       channel.CreatedAt,
			"updated_at":       channel.UpdatedAt,
		}

		// Send channel:update event
		sc.socket.BroadcastToRoom(channel.ServerID, "channel:update", channelMap)

		fmt.Println("Socket event emitted successfully")
	}

	// Return channel in response format
	channelResp := gin.H{
		"id":               channel.ID,
		"name":             channel.Name,
		"type":             channel.Type,
		"server_id":        channel.ServerID,
		"position":         channel.Position,
		"max_participants": channel.MaxParticipants,
		"created_at":       channel.CreatedAt,
		"updated_at":       channel.UpdatedAt,
	}

	c.JSON(http.StatusOK, channelResp)
}

func (sc *ServerController) DeleteChannel(c *gin.Context) {
	ctx := c.Request.Context()
	channelID := c.Param("id")

	// Get channel info before deletion for socket emission
	channel, err := sc.queries.GetChannelByID(ctx, channelID)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Channel not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch channel",
		})
		return
	}

	// Delete channel (cascade will handle related records)
	err = sc.queries.DeleteChannel(ctx, channelID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete channel",
		})
		return
	}

	// -----------------------------------------
	// 🔵 SOCKET EVENT EMISSION
	// -----------------------------------------
	if sc.socket != nil {
		fmt.Println("Emitting socket event to server room:", channel.ServerID)

		// Send channel:delete event (matching TypeScript - emits just the ID)
		sc.socket.BroadcastToRoom(channel.ServerID, "channel:delete", channelID)

		fmt.Println("Socket event emitted successfully")
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Channel deleted",
	})
}

func (sc *ServerController) CreateInvite(c *gin.Context) {
	ctx := c.Request.Context()
	userID, _ := middleware.GetUserID(c)

	var req struct {
		ServerID  string  `json:"serverId" binding:"required"`
		SingleUse *bool   `json:"singleUse"`
		ExpiresAt *string `json:"expiresAt"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Check if user is a member of the server
	_, err := sc.queries.GetServerMember(ctx, db.GetServerMemberParams{
		ServerID: req.ServerID,
		UserID:   userID,
	})
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Not a server member",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check membership",
		})
		return
	}

	// Generate unique invite code
	inviteCode := uuid.New().String()
	inviteID := uuid.New().String()

	// Parse expiresAt if provided
	var expiresAt pgtype.Timestamp
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		expiresTime, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid expiresAt format. Use RFC3339 format",
			})
			return
		}
		expiresAt = pgtype.Timestamp{Time: expiresTime, Valid: true}
	}

	// Set singleUse default to false
	singleUse := pgtype.Bool{Valid: false}
	if req.SingleUse != nil {
		singleUse = pgtype.Bool{Bool: *req.SingleUse, Valid: true}
	}

	invite, err := sc.queries.CreateInvite(ctx, db.CreateInviteParams{
		ID:        inviteID,
		Code:      inviteCode,
		ServerID:  req.ServerID,
		SingleUse: singleUse,
		ExpiresAt: expiresAt,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create invite",
		})
		return
	}

	// Return invite in response format
	inviteResp := gin.H{
		"id":         invite.ID,
		"code":       invite.Code,
		"server_id":  invite.ServerID,
		"created_at": invite.CreatedAt,
		"expires_at": invite.ExpiresAt,
		"used":       invite.Used,
		"single_use": invite.SingleUse,
		"used_by_id": invite.UsedByID,
		"used_at":    invite.UsedAt,
	}

	c.JSON(http.StatusCreated, inviteResp)
}

func (sc *ServerController) GetInvite(c *gin.Context) {
	ctx := c.Request.Context()
	code := c.Param("code")

	invite, err := sc.queries.GetInviteByCode(ctx, code)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Invite not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch invite",
		})
		return
	}

	// Check if invite is expired
	if invite.ExpiresAt.Valid {
		if time.Now().After(invite.ExpiresAt.Time) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invite expired",
			})
			return
		}
	}

	// Check if invite is already used (for single-use invites)
	if invite.SingleUse.Bool && invite.Used.Bool {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invite already used",
		})
		return
	}

	// Get server info for the response
	server, err := sc.queries.GetServerByID(ctx, invite.ServerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch server",
		})
		return
	}

	// Return invite with server info
	inviteResp := gin.H{
		"id":         invite.ID,
		"code":       invite.Code,
		"server_id":  invite.ServerID,
		"created_at": invite.CreatedAt,
		"expires_at": invite.ExpiresAt,
		"used":       invite.Used,
		"single_use": invite.SingleUse,
		"used_by_id": invite.UsedByID,
		"used_at":    invite.UsedAt,
		"server": gin.H{
			"id":          server.ID,
			"name":        server.Name,
			"description": database.PgTextToString(server.Description),
			"icon":        database.PgTextToString(server.Icon),
			"owner_id":    server.OwnerID,
			"created_at":  server.CreatedAt,
			"updated_at":  server.UpdatedAt,
		},
	}

	c.JSON(http.StatusOK, inviteResp)
}

func (sc *ServerController) AcceptInvite(c *gin.Context) {
	ctx := c.Request.Context()
	code := c.Param("code")
	userID, _ := middleware.GetUserID(c)

	// Get invite by code
	invite, err := sc.queries.GetInviteByCode(ctx, code)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Invite not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch invite",
		})
		return
	}

	// Check if invite is expired
	if invite.ExpiresAt.Valid {
		if time.Now().After(invite.ExpiresAt.Time) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invite expired",
			})
			return
		}
	}

	// Check if invite is already used (for single-use invites)
	if invite.SingleUse.Bool && invite.Used.Bool {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invite already used",
		})
		return
	}

	// Check if user is already a member
	_, err = sc.queries.GetServerMember(ctx, db.GetServerMemberParams{
		ServerID: invite.ServerID,
		UserID:   userID,
	})
	if err == nil {
		// User is already a member
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Already a member",
		})
		return
	}
	if !database.IsNoRowsError(err) {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check membership",
		})
		return
	}

	// Add user to server
	memberID := uuid.New().String()
	_, err = sc.queries.CreateServerMember(ctx, db.CreateServerMemberParams{
		ID:       memberID,
		ServerID: invite.ServerID,
		UserID:   userID,
		Role:     pgtype.Text{String: "member", Valid: true},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to join server",
		})
		return
	}

	// Mark invite as used if single-use
	if invite.SingleUse.Bool {
		_, err = sc.queries.UpdateInvite(ctx, db.UpdateInviteParams{
			Code:     code,
			Used:     pgtype.Bool{Bool: true, Valid: true},
			UsedByID: pgtype.Text{String: userID, Valid: true},
		})
		if err != nil {
			// Log error but don't fail the request
			fmt.Printf("Failed to mark invite as used: %v\n", err)
		}
	}

	// Get server info for the response
	server, err := sc.queries.GetServerByID(ctx, invite.ServerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch server",
		})
		return
	}

	serverResp := gin.H{
		"id":          server.ID,
		"name":        server.Name,
		"description": database.PgTextToString(server.Description),
		"icon":        database.PgTextToString(server.Icon),
		"owner_id":    server.OwnerID,
		"created_at":  server.CreatedAt,
		"updated_at":  server.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Joined server",
		"server":  serverResp,
	})
}
