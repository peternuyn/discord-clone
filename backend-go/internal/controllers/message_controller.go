package controllers

import (
	"net/http"
	"strconv"

	"discord-clone-backend/internal/db"
	"discord-clone-backend/internal/middleware"
	"discord-clone-backend/internal/realtime"
	"discord-clone-backend/pkg/database"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// MessageController handles message-related requests
type MessageController struct {
	queries *db.Queries
	socket  *realtime.SocketServer
}

// NewMessageController creates a new message controller
func NewMessageController(socket *realtime.SocketServer) *MessageController {
	return &MessageController{
		queries: db.New(database.GetDB()),
		socket:  socket,
	}
}

type createMessageRequest struct {
	ChannelID string `json:"channelId" binding:"required"`
	Content   string `json:"content" binding:"required"`
}

// CreateMessage persists a message and emits it to the channel room
func (mc *MessageController) CreateMessage(c *gin.Context) {
	ctx := c.Request.Context()
	userID, _ := middleware.GetUserID(c)

	var req createMessageRequest
	_ = c.ShouldBindJSON(&req) // allow missing to fall back to path param

	// Allow channelId from path (e.g., /channels/:channelId/messages)
	if req.ChannelID == "" {
		req.ChannelID = c.Param("channelId")
	}
	if req.ChannelID == "" {
		req.ChannelID = c.Param("id")
	}

	if req.ChannelID == "" || req.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "channelId and content are required"})
		return
	}

	channelID := req.ChannelID

	// Ensure channel exists
	channel, err := mc.queries.GetChannelByID(ctx, channelID)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Channel not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load channel"})
		return
	}

	// Ensure user is a member of the server
	_, err = mc.queries.GetServerMember(ctx, db.GetServerMemberParams{
		ServerID: channel.ServerID,
		UserID:   userID,
	})
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not a member of this server"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify membership"})
		return
	}

	// Insert message
	messageID := uuid.New().String()
	var msg db.Message
	err = database.GetDB().QueryRow(ctx, `
        INSERT INTO messages (id, content, user_id, channel_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, content, user_id, channel_id, created_at, updated_at
    `, messageID, req.Content, userID, channelID).Scan(
		&msg.ID,
		&msg.Content,
		&msg.UserID,
		&msg.ChannelID,
		&msg.CreatedAt,
		&msg.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create message"})
		return
	}

	// Load user info for response shape expected by frontend
	user, _ := mc.queries.GetUserByID(ctx, userID)
	userResp := gin.H{
		"id":            user.ID,
		"username":      user.Username,
		"discriminator": user.Discriminator,
		"avatar":        database.PgTextToString(user.Avatar),
	}

	resp := gin.H{
		"id":        msg.ID,
		"content":   msg.Content,
		"userId":    msg.UserID,
		"channelId": msg.ChannelID,
		"createdAt": msg.CreatedAt.Time,
		"updatedAt": msg.UpdatedAt.Time,
		"user":      userResp,
		"reactions": []gin.H{},
	}

	// Emit to channel room
	if mc.socket != nil {
		mc.socket.BroadcastToRoom(msg.ChannelID, "message:new", resp)
	}

	c.JSON(http.StatusCreated, gin.H{"message": resp})
}

// ListMessages returns messages for a channel with basic pagination
func (mc *MessageController) ListMessages(c *gin.Context) {
	ctx := c.Request.Context()
	channelID := c.Param("channelId")
	if channelID == "" {
		channelID = c.Param("id")
	}
	if channelID == "" {
		channelID = c.Query("channelId")
	}
	userID, _ := middleware.GetUserID(c)

	// Ensure channel exists
	channel, err := mc.queries.GetChannelByID(ctx, channelID)
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Channel not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load channel"})
		return
	}

	// Ensure user is a member of the server
	_, err = mc.queries.GetServerMember(ctx, db.GetServerMemberParams{
		ServerID: channel.ServerID,
		UserID:   userID,
	})
	if err != nil {
		if database.IsNoRowsError(err) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not a member of this server"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify membership"})
		return
	}

	limit := 50
	if v := c.Query("limit"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	offset := 0
	if v := c.Query("offset"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	rows, err := database.GetDB().Query(ctx, `
        SELECT id, content, user_id, channel_id, created_at, updated_at
        FROM messages
        WHERE channel_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
    `, channelID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}
	defer rows.Close()

	messages := []gin.H{}
	userIDs := map[string]struct{}{}
	for rows.Next() {
		var m db.Message
		if err := rows.Scan(&m.ID, &m.Content, &m.UserID, &m.ChannelID, &m.CreatedAt, &m.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse messages"})
			return
		}
		userIDs[m.UserID] = struct{}{}
		messages = append(messages, gin.H{
			"id":        m.ID,
			"content":   m.Content,
			"userId":    m.UserID,
			"channelId": m.ChannelID,
			"createdAt": m.CreatedAt.Time,
			"updatedAt": m.UpdatedAt.Time,
		})
	}

	// Load user info for all unique user IDs
	users := map[string]gin.H{}
	for uid := range userIDs {
		if u, err := mc.queries.GetUserByID(ctx, uid); err == nil {
			users[uid] = gin.H{
				"id":            u.ID,
				"username":      u.Username,
				"discriminator": u.Discriminator,
				"avatar":        database.PgTextToString(u.Avatar),
			}
		}
	}

	// Attach user/reactions to messages
	for i := range messages {
		uid, _ := messages[i]["userId"].(string)
		if user, ok := users[uid]; ok {
			messages[i]["user"] = user
		}
		messages[i]["reactions"] = []gin.H{}
	}

	// Get total count for pagination
	var total int
	if err := database.GetDB().QueryRow(ctx, `SELECT COUNT(*) FROM messages WHERE channel_id = $1`, channelID).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count messages"})
		return
	}
	hasMore := offset+len(messages) < total

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"pagination": gin.H{
			"total":   total,
			"limit":   limit,
			"offset":  offset,
			"hasMore": hasMore,
		},
	})
}
