package database

import (
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// IsNoRowsError checks if an error is a "no rows" error
func IsNoRowsError(err error) bool {
	return err == pgx.ErrNoRows
}

// StringToPgText converts *string to pgtype.Text
func StringToPgText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

// PgTextToString converts pgtype.Text to *string
func PgTextToString(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}
