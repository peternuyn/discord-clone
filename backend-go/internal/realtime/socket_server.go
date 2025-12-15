package realtime

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"discord-clone-backend/internal/auth"
	"discord-clone-backend/internal/db"
	"discord-clone-backend/pkg/database"

	socketio "github.com/googollee/go-socket.io"
)

// SocketServer wraps socket.io setup plus presence tracking.
type SocketServer struct {
	srv       *socketio.Server
	queries   *db.Queries
	jwtSecret string

	mu          sync.RWMutex
	onlineUsers map[string]OnlineUser      // socketID -> user
	userSockets map[string]map[string]bool // userID -> socketID set
}

// OnlineUser represents a connected socket.
type OnlineUser struct {
	UserID        string
	Username      string
	Discriminator string
	Avatar        *string
	SocketID      string
	ConnectedAt   time.Time
}

type socketUser struct {
	ID            string
	Username      string
	Discriminator string
	Avatar        *string
}

// NewSocketServer configures the socket server and registers handlers.
func NewSocketServer(queries *db.Queries, jwtSecret string) (*SocketServer, error) {
	srv := socketio.NewServer(nil)

	s := &SocketServer{
		srv:         srv,
		queries:     queries,
		jwtSecret:   jwtSecret,
		onlineUsers: make(map[string]OnlineUser),
		userSockets: make(map[string]map[string]bool),
	}

	s.registerHandlers()
	return s, nil
}

// Handler exposes the http.Handler for routing (e.g., /socket.io/*any).
func (s *SocketServer) Handler() http.Handler {
	return s.srv
}

// Serve starts the socket.io server loops.
func (s *SocketServer) Serve() error {
	return s.srv.Serve()
}

// Close shuts down the socket.io server.
func (s *SocketServer) Close() error {
	return s.srv.Close()
}

func (s *SocketServer) registerHandlers() {
	s.srv.OnConnect("/", func(c socketio.Conn) error {
		user, err := s.authenticate(c)
		if err != nil {
			return err
		}

		c.SetContext(user)
		s.trackOnline(c, user)

		ctx := context.Background()
		s.setUserStatus(ctx, user.ID, "online")
		s.joinUserServers(ctx, c, user)
		s.emitPresence(ctx, user, "user:online")

		log.Printf("socket connected: %s user=%s", c.ID(), user.ID)
		return nil
	})

	s.srv.OnEvent("/", "join", func(c socketio.Conn, channelID string) {
		if channelID != "" {
			c.Join(channelID)
		}
	})

	s.srv.OnEvent("/", "leave", func(c socketio.Conn, channelID string) {
		if channelID != "" {
			c.Leave(channelID)
		}
	})

	s.srv.OnEvent("/", "joinServer", func(c socketio.Conn, serverID string) {
		user := s.userFromConn(c)
		if user == nil || serverID == "" {
			return
		}
		ctx := context.Background()
		if s.isServerMember(ctx, serverID, user.ID) {
			c.Join(serverID)
		} else {
			c.Emit("error", "not a member of this server")
		}
	})

	s.srv.OnEvent("/", "leaveServer", func(c socketio.Conn, serverID string) {
		if serverID != "" {
			c.Leave(serverID)
		}
	})

	s.srv.OnEvent("/", "message:new", func(c socketio.Conn, payload map[string]interface{}) {
		channelID := readString(payload, "channelId", "channel_id")
		if channelID == "" {
			return
		}
		s.srv.BroadcastToRoom("/", channelID, "message:new", payload)
	})

	s.srv.OnError("/", func(c socketio.Conn, err error) {
		log.Printf("socket error %s: %v", c.ID(), err)
	})

	s.srv.OnDisconnect("/", func(c socketio.Conn, reason string) {
		user := s.userFromConn(c)
		online, last := s.untrackOnline(c.ID())

		targetUser := online
		if user != nil {
			targetUser = OnlineUser{
				UserID:        user.ID,
				Username:      user.Username,
				Discriminator: user.Discriminator,
				Avatar:        user.Avatar,
				SocketID:      c.ID(),
			}
		}

		if targetUser.UserID == "" {
			return
		}

		if last {
			ctx := context.Background()
			s.setUserStatus(ctx, targetUser.UserID, "offline")
			s.emitPresence(ctx, &socketUser{
				ID:            targetUser.UserID,
				Username:      targetUser.Username,
				Discriminator: targetUser.Discriminator,
				Avatar:        targetUser.Avatar,
			}, "user:offline")
		}

		log.Printf("socket disconnected: %s user=%s reason=%s", c.ID(), targetUser.UserID, reason)
	})
}

func (s *SocketServer) authenticate(c socketio.Conn) (*socketUser, error) {
	u := c.URL()
	token := u.Query().Get("token")

	if token == "" {
		authHeader := c.RemoteHeader().Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if token == "" {
		for _, cookieHeader := range c.RemoteHeader().Values("Cookie") {
			parts := strings.Split(cookieHeader, ";")
			for _, part := range parts {
				part = strings.TrimSpace(part)
				if strings.HasPrefix(part, "token=") {
					token = strings.TrimPrefix(part, "token=")
					break
				}
			}
			if token != "" {
				break
			}
		}
	}

	if token == "" {
		return nil, fmt.Errorf("authentication required")
	}

	claims, err := auth.VerifyToken(token, s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("invalid or expired token")
	}

	ctx := context.Background()
	user, err := s.queries.GetUserByID(ctx, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	return &socketUser{
		ID:            user.ID,
		Username:      user.Username,
		Discriminator: user.Discriminator,
		Avatar:        database.PgTextToString(user.Avatar),
	}, nil
}

func (s *SocketServer) trackOnline(c socketio.Conn, user *socketUser) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.onlineUsers[c.ID()] = OnlineUser{
		UserID:        user.ID,
		Username:      user.Username,
		Discriminator: user.Discriminator,
		Avatar:        user.Avatar,
		SocketID:      c.ID(),
		ConnectedAt:   time.Now(),
	}

	if _, ok := s.userSockets[user.ID]; !ok {
		s.userSockets[user.ID] = make(map[string]bool)
	}
	s.userSockets[user.ID][c.ID()] = true
}

func (s *SocketServer) untrackOnline(socketID string) (OnlineUser, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	user, ok := s.onlineUsers[socketID]
	if !ok {
		return OnlineUser{}, false
	}

	delete(s.onlineUsers, socketID)

	sockets := s.userSockets[user.UserID]
	if sockets != nil {
		delete(sockets, socketID)
		if len(sockets) == 0 {
			delete(s.userSockets, user.UserID)
			return user, true
		}
		s.userSockets[user.UserID] = sockets
	}

	return user, false
}

func (s *SocketServer) setUserStatus(ctx context.Context, userID, status string) {
	_, err := s.queries.UpdateUserStatus(ctx, db.UpdateUserStatusParams{
		ID:     userID,
		Status: database.StringToPgText(&status),
	})
	if err != nil {
		log.Printf("socket: failed to update status for user %s: %v", userID, err)
	}
}

func (s *SocketServer) joinUserServers(ctx context.Context, c socketio.Conn, user *socketUser) {
	servers, err := s.queries.GetUserServers(ctx, user.ID)
	if err != nil {
		log.Printf("socket: failed to load user servers for %s: %v", user.ID, err)
		return
	}

	for _, server := range servers {
		c.Join(server.ID)
	}
}

func (s *SocketServer) emitPresence(ctx context.Context, user *socketUser, event string) {
	servers, err := s.queries.GetUserServers(ctx, user.ID)
	if err != nil {
		log.Printf("socket: failed to emit presence for %s: %v", user.ID, err)
		return
	}

	payload := map[string]interface{}{
		"userId":        user.ID,
		"username":      user.Username,
		"discriminator": user.Discriminator,
		"avatar":        user.Avatar,
	}

	for _, server := range servers {
		s.srv.BroadcastToRoom("/", server.ID, event, payload)
	}
}

func (s *SocketServer) isServerMember(ctx context.Context, serverID, userID string) bool {
	_, err := s.queries.GetServerMember(ctx, db.GetServerMemberParams{
		ServerID: serverID,
		UserID:   userID,
	})
	return err == nil
}

// BroadcastToRoom sends an event to all clients in a given room (namespace "/").
func (s *SocketServer) BroadcastToRoom(roomID, event string, payload interface{}) {
	s.srv.BroadcastToRoom("/", roomID, event, payload)
}

func (s *SocketServer) userFromConn(c socketio.Conn) *socketUser {
	val := c.Context()
	if val == nil {
		return nil
	}
	user, ok := val.(*socketUser)
	if !ok {
		return nil
	}
	return user
}

func readString(payload map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		if val, ok := payload[key]; ok {
			if str, ok := val.(string); ok {
				return str
			}
		}
	}
	return ""
}
