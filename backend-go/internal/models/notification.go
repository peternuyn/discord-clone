package models

import (
	"time"

	"discord-clone-backend/pkg/utils"
	"gorm.io/gorm"
)

// Notification represents a notification for a user
type Notification struct {
	ID        string    `json:"id" gorm:"type:varchar(255);primaryKey"`
	Type      string    `json:"type" gorm:"type:varchar(50);not null"` // mention, message, reaction, server, friend, system
	Title     string    `json:"title" gorm:"type:varchar(255);not null"`
	Message   string    `json:"message" gorm:"type:text;not null"`
	UserID    string    `json:"user_id" gorm:"type:varchar(255);not null"`
	Read      bool      `json:"read" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

// TableName returns the table name for the Notification model
func (Notification) TableName() string {
	return "notifications"
}

// BeforeCreate generates a unique ID before creating a notification
func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == "" {
		n.ID = utils.GenerateID()
	}
	return nil
}

// Invite represents a server invite
type Invite struct {
	ID        string     `json:"id" gorm:"type:varchar(255);primaryKey"`
	Code      string     `json:"code" gorm:"type:varchar(255);uniqueIndex;not null"`
	ServerID  string     `json:"server_id" gorm:"type:varchar(255);not null"`
	CreatedAt time.Time  `json:"created_at" gorm:"autoCreateTime"`
	ExpiresAt *time.Time `json:"expires_at"`
	Used      bool       `json:"used" gorm:"default:false"`
	SingleUse bool       `json:"single_use" gorm:"default:false"`
	UsedByID  *string    `json:"used_by_id" gorm:"type:varchar(255)"`
	UsedAt    *time.Time `json:"used_at"`

	// Relationships
	Server Server `json:"server,omitempty" gorm:"foreignKey:ServerID"`
	UsedBy *User  `json:"used_by,omitempty" gorm:"foreignKey:UsedByID"`
}

// TableName returns the table name for the Invite model
func (Invite) TableName() string {
	return "invites"
}

// BeforeCreate generates a unique ID and code before creating an invite
func (i *Invite) BeforeCreate(tx *gorm.DB) error {
	if i.ID == "" {
		i.ID = utils.GenerateID()
	}
	if i.Code == "" {
		i.Code = utils.GenerateInviteCode()
	}
	return nil
}

// VoiceState represents a user's voice state
type VoiceState struct {
	ID         string     `json:"id" gorm:"type:varchar(255);primaryKey"`
	UserID     string     `json:"user_id" gorm:"type:varchar(255);uniqueIndex;not null"`
	ChannelID  *string    `json:"channel_id" gorm:"type:varchar(255)"`
	IsMuted    bool       `json:"is_muted" gorm:"default:false"`
	IsDeafened bool       `json:"is_deafened" gorm:"default:false"`
	IsSpeaking bool       `json:"is_speaking" gorm:"default:false"`
	JoinedAt   time.Time  `json:"joined_at" gorm:"autoCreateTime"`

	// Relationships
	User    User     `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Channel *Channel `json:"channel,omitempty" gorm:"foreignKey:ChannelID;constraint:OnDelete:SET NULL"`
}

// TableName returns the table name for the VoiceState model
func (VoiceState) TableName() string {
	return "voice_states"
}

// BeforeCreate generates a unique ID before creating a voice state
func (vs *VoiceState) BeforeCreate(tx *gorm.DB) error {
	if vs.ID == "" {
		vs.ID = utils.GenerateID()
	}
	return nil
}
