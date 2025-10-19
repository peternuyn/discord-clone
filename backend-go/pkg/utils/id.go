package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"
)

// GenerateID generates a unique ID (similar to Prisma's cuid)
func GenerateID() string {
	// Create a timestamp-based prefix
	timestamp := time.Now().UnixNano()
	
	// Generate random bytes
	randomBytes := make([]byte, 6)
	rand.Read(randomBytes)
	
	// Combine timestamp and random bytes
	return fmt.Sprintf("c%s%s", fmt.Sprintf("%x", timestamp), hex.EncodeToString(randomBytes))
}

// GenerateInviteCode generates a unique invite code
func GenerateInviteCode() string {
	// Generate a random string for invite codes
	randomBytes := make([]byte, 4)
	rand.Read(randomBytes)
	return hex.EncodeToString(randomBytes)
}

// GenerateDiscriminator generates a Discord-style discriminator (0000-9999)
func GenerateDiscriminator() string {
	randomBytes := make([]byte, 2)
	rand.Read(randomBytes)
	// Combine two bytes to get a number between 0-65535, then mod 10000
	value := int(randomBytes[0])<<8 + int(randomBytes[1])
	return fmt.Sprintf("%04d", value%10000)
}
