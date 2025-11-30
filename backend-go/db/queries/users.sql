-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 LIMIT 1;

-- name: GetUserByUsername :one
SELECT * FROM users
WHERE username = $1 LIMIT 1;

-- name: CreateUser :one
INSERT INTO users (
    id, username, email, password, discriminator, avatar, status, bio, location
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: UpdateUser :one
UPDATE users
SET username = $2, email = $3, avatar = $4, status = $5, bio = $6, location = $7, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: UpdateUserStatus :one
UPDATE users
SET status = $2, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: GetUserByEmailOrUsername :one
SELECT * FROM users
WHERE email = $1 OR username = $2
LIMIT 1;

-- name: GetUserByDiscriminator :one
SELECT * FROM users
WHERE discriminator = $1 LIMIT 1;

-- name: GetUsers :many
SELECT id, username, email, discriminator, avatar, status, bio, location, created_at, updated_at FROM users
ORDER BY created_at DESC;

