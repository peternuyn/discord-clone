package routes

import (
	"discord-clone-backend/internal/controllers"
	"discord-clone-backend/internal/middleware"
	"discord-clone-backend/internal/realtime"
	"discord-clone-backend/pkg/config"

	"github.com/gin-gonic/gin"
)

// SetupRoutes sets up all API routes
func SetupRoutes(router *gin.RouterGroup, cfg *config.Config, socket *realtime.SocketServer) {
	// Initialize controllers
	authController := controllers.NewAuthController(cfg.JWT.Secret)
	userController := controllers.NewUserController()
	serverController := controllers.NewServerController(socket)
	messageController := controllers.NewMessageController(socket)

	// Auth routes (public)
	auth := router.Group("/auth")
	{
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
		auth.POST("/logout", authController.Logout)
		auth.GET("/me", middleware.AuthMiddleware(cfg), authController.GetCurrentUser)
	}

	// User routes (protected)
	users := router.Group("/users")
	users.Use(middleware.AuthMiddleware(cfg))
	{
		users.GET("/", userController.GetUsers)
		// Online users routes (must come before /:id to avoid route conflicts)
		users.GET("/online", userController.GetOnlineUsers)
		users.GET("/online/server/:serverId", userController.GetOnlineUsersForServer)
		users.GET("/online/:userId", userController.IsUserOnline)
		users.GET("/:id", userController.GetUser)
		users.PUT("/:id", userController.UpdateUser)
	}

	// Server routes (protected)
	servers := router.Group("/servers")
	servers.Use(middleware.AuthMiddleware(cfg))
	{
		servers.POST("", serverController.CreateServer)
		servers.GET("", serverController.GetUserServers)
		servers.GET("/:id", serverController.GetServer)
		servers.PUT("/:id", serverController.UpdateServer)
		servers.DELETE("/:id", serverController.DeleteServer)
		servers.POST("/:id/quit", serverController.QuitServer)
	}

	// Channel routes (protected)
	channels := router.Group("/channels")
	channels.Use(middleware.AuthMiddleware(cfg))
	{
		channels.POST("/server/:serverId", serverController.CreateChannel)
		channels.GET("/:id", serverController.GetChannel)
		channels.PUT("/:id", serverController.UpdateChannel)
		channels.DELETE("/:id", serverController.DeleteChannel)
		// Messages under channels
		channels.POST("/:id/messages", messageController.CreateMessage)
		channels.GET("/:id/messages", messageController.ListMessages)
	}

	// Invite routes (protected)
	invites := router.Group("/invites")
	invites.Use(middleware.AuthMiddleware(cfg))
	{
		invites.POST("", serverController.CreateInvite)
		invites.GET("/:code", serverController.GetInvite)
		invites.POST("/:code/accept", serverController.AcceptInvite)
	}

}
