package models

import (
	"time"

	"discord-clone-backend/pkg/utils"
	"gorm.io/gorm"
)

// Server represents a Discord-like server
type Server struct {
	ID          string    `json:"id" gorm:"type:varchar(255);primaryKey"`
	Name        string    `json:"name" gorm:"type:varchar(255);not null"`
	Description *string   `json:"description" gorm:"type:text"`
	Icon        *string   `json:"icon" gorm:"type:text"`
	OwnerID     string    `json:"owner_id" gorm:"type:varchar(255);not null"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	Members []ServerMember `json:"members,omitempty" gorm:"foreignKey:ServerID"`
	Channels []Channel     `json:"channels,omitempty" gorm:"foreignKey:ServerID"`
	Invites  []Invite      `json:"invites,omitempty" gorm:"foreignKey:ServerID"`
}

// TableName returns the table name for the Server model
func (Server) TableName() string {
	return "servers"
}

// BeforeCreate generates a unique ID before creating a server
func (s *Server) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = utils.GenerateID()
	}
	return nil
}

// ServerMember represents the relationship between users and servers
type ServerMember struct {
	ID       string    `json:"id" gorm:"type:varchar(255);primaryKey"`
	ServerID string    `json:"server_id" gorm:"type:varchar(255);not null"`
	UserID   string    `json:"user_id" gorm:"type:varchar(255);not null"`
	Role     string    `json:"role" gorm:"type:varchar(50);default:'member'"`
	JoinedAt time.Time `json:"joined_at" gorm:"autoCreateTime"`

	// Relationships
	Server Server `json:"server,omitempty" gorm:"foreignKey:ServerID;constraint:OnDelete:CASCADE"`
	User   User   `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

// TableName returns the table name for the ServerMember model
func (ServerMember) TableName() string {
	return "server_members"
}

// BeforeCreate generates a unique ID before creating a server member
func (sm *ServerMember) BeforeCreate(tx *gorm.DB) error {
	if sm.ID == "" {
		sm.ID = utils.GenerateID()
	}
	return nil
}
