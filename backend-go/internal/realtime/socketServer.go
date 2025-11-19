package realtime

import (
	"log"
	"sync"

	socketio "github.com/googollee/go-socket.io"
)

var (
	// SocketServer holds the shared Socket.IO style server instance
	SocketServer *socketio.Server
	once         sync.Once
)

// InitSocketServer creates (once) and configures the socket server.
// Call this from main during startup, then mount the handlers on Gin:
//
//	srv := realtime.InitSocketServer()
//	go srv.Serve()
//	router.GET("/socket.io/*any", gin.WrapH(srv))
//	router.POST("/socket.io/*any", gin.WrapH(srv))
func InitSocketServer() *socketio.Server {
	once.Do(func() {
		server := socketio.NewServer(nil)

		server.OnConnect("/", func(conn socketio.Conn) error {
			log.Printf("[socket] client connected: %s", conn.ID())
			return nil
		})

		server.OnEvent("/", "join", func(conn socketio.Conn, channelID string) {
			conn.Join(channelID)
			log.Printf("[socket] %s joined channel %s", conn.ID(), channelID)
		})

		server.OnEvent("/", "leave", func(conn socketio.Conn, channelID string) {
			conn.Leave(channelID)
			log.Printf("[socket] %s left channel %s", conn.ID(), channelID)
		})

		server.OnEvent("/", "joinServer", func(conn socketio.Conn, serverID string) {
			conn.Join(serverID)
			log.Printf("[socket] %s joined server room %s", conn.ID(), serverID)
		})

		server.OnEvent("/", "leaveServer", func(conn socketio.Conn, serverID string) {
			conn.Leave(serverID)
			log.Printf("[socket] %s left server room %s", conn.ID(), serverID)
		})

		server.OnEvent("/", "message:new", func(conn socketio.Conn, payload map[string]any) {
			channelID, _ := payload["channelId"].(string)
			if channelID == "" {
				channelID = "general"
			}
			server.BroadcastToRoom("/", channelID, "message:new", payload)
		})

		server.OnDisconnect("/", func(conn socketio.Conn, reason string) {
			log.Printf("[socket] client %s disconnected: %s", conn.ID(), reason)
		})

		server.OnError("/", func(conn socketio.Conn, err error) {
			log.Printf("[socket] error for %s: %v", conn.ID(), err)
		})

		SocketServer = server
	})

	return SocketServer
}

// MustGetSocketServer returns the singleton socket server or panics if InitSocketServer was never called.
func MustGetSocketServer() *socketio.Server {
	if SocketServer == nil {
		panic("socket server not initialized: call realtime.InitSocketServer() first")
	}
	return SocketServer
}
