package models

import (
	"time"

	"discord-clone-backend/pkg/utils"
	"gorm.io/gorm"
)

// User represents a user in the Discord clone
type User struct {
	ID            string    `json:"id" gorm:"type:varchar(255);primaryKey"`
	Username      string    `json:"username" gorm:"type:varchar(255);not null"`
	Email         string    `json:"email" gorm:"type:varchar(255);uniqueIndex;not null"`
	Password      string    `json:"-" gorm:"type:varchar(255);not null"` // Hidden from JSON
	Discriminator string    `json:"discriminator" gorm:"type:varchar(4);not null"`
	Avatar        *string   `json:"avatar" gorm:"type:text"`
	Status        string    `json:"status" gorm:"type:varchar(20);default:'offline'"`
	Bio           *string   `json:"bio" gorm:"type:text"`
	Location      *string   `json:"location" gorm:"type:varchar(255)"`
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	Servers       []ServerMember `json:"servers,omitempty" gorm:"foreignKey:UserID"`
	Messages      []Message      `json:"messages,omitempty" gorm:"foreignKey:UserID"`
	Reactions     []Reaction     `json:"reactions,omitempty" gorm:"foreignKey:UserID"`
	Notifications []Notification `json:"notifications,omitempty" gorm:"foreignKey:UserID"`
	Invites       []Invite       `json:"invites,omitempty" gorm:"foreignKey:UsedByID"`
	VoiceState    *VoiceState    `json:"voice_state,omitempty" gorm:"foreignKey:UserID"`
}

// TableName returns the table name for the User model
func (User) TableName() string {
	return "users"
}

// BeforeCreate generates a unique ID before creating a user
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = utils.GenerateID()
	}
	return nil
}
