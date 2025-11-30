-- name: GetInviteByCode :one
SELECT * FROM invites
WHERE code = $1 LIMIT 1;

-- name: CreateInvite :one
INSERT INTO invites (
    id, code, server_id, single_use, expires_at
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: UpdateInvite :one
UPDATE invites
SET used = $2, used_by_id = $3, used_at = CURRENT_TIMESTAMP
WHERE code = $1
RETURNING *;

-- name: GetInvitesByServerID :many
SELECT * FROM invites
WHERE server_id = $1
ORDER BY created_at DESC;

