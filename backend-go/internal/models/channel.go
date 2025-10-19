package models

import (
	"time"

	"discord-clone-backend/pkg/utils"
	"gorm.io/gorm"
)

// Channel represents a channel within a server
type Channel struct {
	ID               string    `json:"id" gorm:"type:varchar(255);primaryKey"`
	Name             string    `json:"name" gorm:"type:varchar(255);not null"`
	Type             string    `json:"type" gorm:"type:varchar(50);not null"` // text, voice, announcement
	ServerID         string    `json:"server_id" gorm:"type:varchar(255);not null"`
	Position         int       `json:"position" gorm:"not null"`
	MaxParticipants  *int      `json:"max_participants" gorm:"type:integer"` // For voice channels
	CreatedAt        time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	Server      Server       `json:"server,omitempty" gorm:"foreignKey:ServerID;constraint:OnDelete:CASCADE"`
	Messages    []Message    `json:"messages,omitempty" gorm:"foreignKey:ChannelID"`
	VoiceStates []VoiceState `json:"voice_states,omitempty" gorm:"foreignKey:ChannelID"`
}

// TableName returns the table name for the Channel model
func (Channel) TableName() string {
	return "channels"
}

// BeforeCreate generates a unique ID before creating a channel
func (c *Channel) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = utils.GenerateID()
	}
	return nil
}

// Message represents a message in a channel
type Message struct {
	ID        string    `json:"id" gorm:"type:varchar(255);primaryKey"`
	Content   string    `json:"content" gorm:"type:text;not null"`
	UserID    string    `json:"user_id" gorm:"type:varchar(255);not null"`
	ChannelID string    `json:"channel_id" gorm:"type:varchar(255);not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	User      User       `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Channel   Channel    `json:"channel,omitempty" gorm:"foreignKey:ChannelID;constraint:OnDelete:CASCADE"`
	Reactions []Reaction `json:"reactions,omitempty" gorm:"foreignKey:MessageID"`
}

// TableName returns the table name for the Message model
func (Message) TableName() string {
	return "messages"
}

// BeforeCreate generates a unique ID before creating a message
func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = utils.GenerateID()
	}
	return nil
}

// Reaction represents a reaction to a message
type Reaction struct {
	ID        string    `json:"id" gorm:"type:varchar(255);primaryKey"`
	Emoji     string    `json:"emoji" gorm:"type:varchar(100);not null"`
	MessageID string    `json:"message_id" gorm:"type:varchar(255);not null"`
	UserID    string    `json:"user_id" gorm:"type:varchar(255);not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`

	// Relationships
	Message Message `json:"message,omitempty" gorm:"foreignKey:MessageID;constraint:OnDelete:CASCADE"`
	User    User    `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

// TableName returns the table name for the Reaction model
func (Reaction) TableName() string {
	return "reactions"
}

// BeforeCreate generates a unique ID before creating a reaction
func (r *Reaction) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = utils.GenerateID()
	}
	return nil
}
