-- name: GetServerByID :one
SELECT * FROM servers
WHERE id = $1 LIMIT 1;

-- name: GetUserServers :many
SELECT s.* FROM servers s
INNER JOIN server_members sm ON s.id = sm.server_id
WHERE sm.user_id = $1
ORDER BY s.created_at DESC;

-- name: CreateServer :one
INSERT INTO servers (
    id, name, description, icon, owner_id
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: UpdateServer :one
UPDATE servers
SET name = $2, description = $3, icon = $4, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteServer :exec
DELETE FROM servers
WHERE id = $1;

-- name: GetServerMember :one
SELECT * FROM server_members
WHERE server_id = $1 AND user_id = $2 LIMIT 1;

-- name: CreateServerMember :one
INSERT INTO server_members (
    id, server_id, user_id, role
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: DeleteServerMember :exec
DELETE FROM server_members
WHERE server_id = $1 AND user_id = $2;

-- name: GetServerMembers :many
SELECT * FROM server_members
WHERE server_id = $1
ORDER BY joined_at ASC;

-- name: GetServerMembersWithUsers :many
SELECT sm.*, u.id as user_id, u.username, u.email, u.discriminator, u.avatar, u.status, u.bio, u.location
FROM server_members sm
INNER JOIN users u ON sm.user_id = u.id
WHERE sm.server_id = $1
ORDER BY sm.joined_at ASC;

