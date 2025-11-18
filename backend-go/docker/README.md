# Docker Setup for Discord Clone Backend

This directory contains Docker configurations for running the Discord Clone backend with PostgreSQL and related services.

## Quick Start

### 1. Development Setup

**Start database only:**
```bash
# From the backend-go directory
cd docker
docker-compose up -d postgres
```

**Start with all services (PostgreSQL + pgAdmin):**
```bash
docker-compose up -d
```

**Start with development tools:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 2. Production Setup

**Start production stack:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Build and run application with database:**
```bash
# Build the app
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build app

# Start everything
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Configuration

### Environment Variables

Create a `.env` file in the `docker/` directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

### Port Mapping

Default ports:
- **PostgreSQL**: `5432`
- **pgAdmin**: `5050`
- **Redis**: `6380` (changed to avoid conflicts with system Redis)
- **Adminer**: `8080` (dev only)
- **Application**: `5000`

To change ports, edit the `.env` file or docker-compose files.

## Services

### PostgreSQL

Main database service running PostgreSQL 16 Alpine.

**Features:**
- Persistent data volumes
- Automatic health checks
- Custom initialization scripts
- Optimized for production

**Connect from host:**
```bash
psql -h localhost -p 5432 -U postgres -d discord_clone
```

**Connect from container:**
```bash
docker exec -it discord-clone-postgres psql -U postgres -d discord_clone
```

### pgAdmin (Optional)

Web-based database administration tool.

**Access:**
- URL: http://localhost:5050
- Email: admin@admin.com (default)
- Password: admin (default)

**Add server connection:**
- Host: postgres
- Port: 5432
- Username: postgres
- Password: [from .env]

### Redis (Optional)

In-memory data store for caching and pub/sub.

**Features:**
- Persistence enabled
- Password protected
- Health checks

**Connect:**
```bash
# From inside container
docker exec -it discord-clone-redis redis-cli -a redis

# From host machine (using port 6380)
redis-cli -h localhost -p 6380 -a redis
```

### Adminer (Development Only)

Lightweight database management tool.

**Access:**
- URL: http://localhost:8080
- System: PostgreSQL
- Server: postgres
- Username: postgres
- Password: postgres

## Common Commands

### Start Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# Start with logs
docker-compose up
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100
```

### Database Operations

**Run migrations:**
```bash
# From backend-go directory
go run cmd/server/main.go migrate
```

**Execute SQL:**
```bash
docker exec -i discord-clone-postgres psql -U postgres -d discord_clone < script.sql
```

**Backup database:**
```bash
docker exec discord-clone-postgres pg_dump -U postgres discord_clone > backup.sql
```

**Restore database:**
```bash
docker exec -i discord-clone-postgres psql -U postgres discord_clone < backup.sql
```

**Reset database:**
```bash
# Stop and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d postgres
```

### Health Checks

**Check service health:**
```bash
docker-compose ps
```

**Test database connection:**
```bash
docker exec discord-clone-postgres pg_isready -U postgres
```

**Test application:**
```bash
curl http://localhost:5000/health
```

## Volumes

Data persistence is handled by Docker volumes:

- `postgres_data`: PostgreSQL data directory
- `pgadmin_data`: pgAdmin configuration and logs
- `redis_data`: Redis persistent storage

**Backup volumes:**
```bash
docker run --rm -v discord-clone-postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data
```

**Restore volumes:**
```bash
docker run --rm -v discord-clone-postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" error:

```bash
# Find process using the port
lsof -i :5432  # For PostgreSQL
lsof -i :6379  # For Redis

# Kill the process
kill -9 <PID>

# Or change port in .env
DATABASE_PORT=5433
REDIS_PORT=6381
```

**Note**: Redis default port has been changed to `6380` to avoid conflicts with system Redis running on `6379`.

### Permission Denied

If you get permission errors with volumes:

```bash
# Change ownership
sudo chown -R $USER:$USER ~/.docker/volumes/
```

### Database Not Starting

Check logs:
```bash
docker-compose logs postgres
```

Common issues:
- Insufficient memory
- Corrupted volumes
- Port conflicts

Reset:
```bash
docker-compose down -v
docker-compose up -d postgres
```

### Connection Refused

If application can't connect to database:

1. Check if PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Check connection string in application
3. Verify network connectivity:
   ```bash
   docker network inspect docker_discord-clone-network
   ```

## Performance Tuning

### PostgreSQL

Production settings in `docker-compose.prod.yml`:
- shared_buffers: 256MB
- max_connections: 200
- effective_cache_size: 1GB

Adjust based on your server resources.

### Resource Limits

Add to docker-compose services:
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 512M
```

## Security

### Production Recommendations

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable SSL for database**:
   ```env
   DATABASE_SSL_MODE=require
   ```
4. **Restrict network access**
5. **Regular backups**
6. **Monitor logs**
7. **Keep images updated**

### Secrets Management

For production, consider using Docker secrets or external secret management:
```yaml
secrets:
  db_password:
    external: true

services:
  postgres:
    secrets:
      - db_password
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Database
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: discord_clone_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
```

## Monitoring

### Logs Aggregation

For production, consider:
- ELK Stack
- Grafana Loki
- Datadog
- CloudWatch

### Database Monitoring

Useful queries:
```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;

-- Database size
SELECT pg_size_pretty(pg_database_size('discord_clone'));
```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
