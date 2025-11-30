# Migration from GORM to sqlc + pgx

## What's Been Done

### 1. Database Connection Layer
- ✅ Replaced GORM with `pgx/v5` connection pool in `pkg/database/database.go`
- ✅ Updated connection to use `pgxpool.Pool` instead of `gorm.DB`
- ✅ Maintained same configuration interface (environment variables)

### 2. Migrations
- ✅ Created `migrations/000001_init.up.sql` with all table definitions
- ✅ Created `migrations/000001_init.down.sql` for rollback
- ✅ Updated `Makefile` with `make migrate` command (manual execution)
- ✅ Updated `main.go` to skip auto-migration (now manual only)

### 3. sqlc Setup
- ✅ Created `sqlc.yaml` configuration
- ✅ Created `db/queries/` directory with initial SQL queries:
  - `users.sql` - User CRUD operations
  - `servers.sql` - Server and server member operations
  - `channels.sql` - Channel operations

### 4. Dependencies
- ✅ Added `github.com/jackc/pgx/v5` for PostgreSQL driver
- ✅ Added `golang-migrate/migrate/v4` for migrations

## Next Steps

### 1. Install sqlc CLI
```bash
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
# Add $HOME/go/bin to your PATH if not already there
export PATH=$PATH:$HOME/go/bin
```

### 2. Generate sqlc Code
```bash
make sqlc-generate
# or manually:
sqlc generate
```

This will create `internal/db/` with generated Go code from your SQL queries.

### 3. Run Migrations
```bash
# Start database
make docker-up

# Run migrations
make migrate
```

### 4. Replace GORM Usage in Controllers

You'll need to update controllers to use sqlc-generated code instead of GORM:

**Before (GORM):**
```go
var user models.User
database.DB.Where("email = ?", email).First(&user)
```

**After (sqlc):**
```go
queries := db.New(database.GetDB())
user, err := queries.GetUserByEmail(ctx, email)
```

### 5. Update Each Controller

Start with one controller at a time:
1. `internal/controllers/auth_controller.go` - User authentication
2. `internal/controllers/server_controller.go` - Server operations
3. `internal/controllers/user_controller.go` - User operations

### 6. Add More SQL Queries

As you convert controllers, you may need to add more queries to `db/queries/*.sql`:
- Messages queries
- Reactions queries
- Notifications queries
- Invites queries
- Voice states queries

### 7. Remove GORM Dependencies

Once all controllers are converted:
```bash
go mod edit -droprequire gorm.io/gorm
go mod edit -droprequire gorm.io/driver/postgres
go mod tidy
```

## Testing

After migration:
1. Run `make migrate` to apply schema
2. Run `make sqlc-generate` to generate code
3. Update one controller at a time
4. Test each endpoint
5. Continue until all GORM usage is replaced

## Notes

- The old GORM models in `internal/models/` can be kept as DTOs (without GORM tags) or removed entirely
- sqlc generates type-safe code, so you'll get compile-time errors if queries don't match
- All database operations now require a `context.Context` parameter

