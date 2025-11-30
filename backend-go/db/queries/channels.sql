-- name: GetChannelByID :one
SELECT * FROM channels
WHERE id = $1 LIMIT 1;

-- name: GetChannelsByServerID :many
SELECT * FROM channels
WHERE server_id = $1
ORDER BY position ASC;

-- name: CreateChannel :one
INSERT INTO channels (
    id, name, type, server_id, position, max_participants
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: UpdateChannel :one
UPDATE channels
SET name = $2, type = $3, position = $4, max_participants = $5, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteChannel :exec
DELETE FROM channels
WHERE id = $1;

-- name: CountChannelsByServerID :one
SELECT COUNT(*) FROM channels
WHERE server_id = $1;

