# Discord Clone Backend Deployment Guide - AWS EC2

This guide covers deploying the Discord Clone backend to AWS EC2 using Docker, while the frontend is deployed on Vercel.

## 🏗️ Architecture Overview

- **Frontend**: Deployed on Vercel (Next.js)
- **Backend**: Deployed on AWS EC2 (Express.js + Socket.IO)
- **Database**: Supabase (PostgreSQL)

## 📋 Prerequisites

1. **AWS EC2 Instance**
   - Ubuntu 20.04 LTS or newer
   - At least t3.small (2 vCPU, 2GB RAM) for production
   - Security group with ports 22 (SSH), 5000 (API), 80 (HTTP), 443 (HTTPS) open
   - Elastic IP address (recommended)

2. **Local Requirements**
   - Git installed
   - SSH access to your EC2 instance

## 🚀 Quick Deployment

### Step 1: Prepare Your EC2 Instance

1. **Connect to your EC2 instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Update the system:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Git:**
   ```bash
   sudo apt install git -y
   ```

### Step 2: Clone and Deploy

1. **Clone your repository:**
   ```bash
   git clone https://github.com/your-username/discord-clone.git
   cd discord-clone
   ```

2. **Copy your environment variables:**
   ```bash
   cd backend
   cp env.production.example .env
   ```

3. **Edit the .env file with your production values:**
   ```bash
   nano .env
   ```
   
   **Important**: Update these values:
   - `JWT_SECRET`: Use a strong, random secret (at least 32 characters)
   - `CORS_ORIGIN`: Add your Vercel domain(s)
   - Keep your existing Supabase database URLs

4. **Run the deployment script:**
   ```bash
   cd ..
   ./deploy-to-ec2.sh
   ```

The script will automatically:
- Install Docker and Docker Compose
- Build the Docker image
- Run the container with proper configuration
- Set up logging and backup systems
- Configure firewall rules

### Step 3: Verify Deployment

1. **Check if the container is running:**
   ```bash
   docker ps
   ```

2. **Test the health endpoint:**
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Check logs if needed:**
   ```bash
   docker logs discord-clone-backend-container
   ```

## 🔧 Environment Configuration

### Backend (.env)

```env
# Database URLs (from your Supabase project)
DATABASE_URL="postgresql://postgres.xxx:xxx@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:xxx@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"

# Environment
NODE_ENV="production"

# Security - CHANGE THIS!
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-make-it-very-long-and-random"

# Server Configuration
PORT=5000

# CORS Configuration - Add your Vercel domains
CORS_ORIGIN="https://your-app.vercel.app,https://your-custom-domain.com"

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (Vercel Environment Variables)

In your Vercel dashboard, add these environment variables:

```env
NEXT_PUBLIC_API_URL=http://your-ec2-ip:5000/api
# or if using a domain:
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

## 🛡️ Security Considerations

### 1. Firewall Configuration
```bash
# The deployment script configures UFW, but you can also manually set:
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 5000/tcp  # Backend API
sudo ufw --force enable
```

### 2. SSL/TLS (Recommended)

For production, consider setting up a reverse proxy with SSL:

1. **Install nginx:**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```

2. **Create nginx configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/discord-clone
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable the site and get SSL certificate:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/discord-clone /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 📊 Monitoring and Maintenance

### Container Management

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# Check container logs
docker logs -f discord-clone-backend-container

# Restart container
docker restart discord-clone-backend-container

# Stop container
docker stop discord-clone-backend-container

# Remove container
docker rm discord-clone-backend-container

# View container resource usage
docker stats discord-clone-backend-container
```

### System Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker disk usage
docker system df
```

### Automated Backups

The deployment script sets up automatic daily backups:
- Location: `/opt/backups/`
- Schedule: Daily at 2 AM
- Retention: 7 days

Manual backup:
```bash
/opt/discord-clone/backup.sh
```

## 🔄 Updates and Redeployment

### Method 1: Using the Update Script
```bash
# Pull latest changes
git pull origin main

# Run deployment
./deploy-to-ec2.sh
```

### Method 2: Manual Update
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
cd backend
docker build -t discord-clone-backend:latest .
docker stop discord-clone-backend-container
docker rm discord-clone-backend-container
docker run -d --name discord-clone-backend-container --restart unless-stopped -p 5000:5000 --env-file .env discord-clone-backend:latest
```

## 🐛 Troubleshooting

### Common Issues

1. **Container won't start:**
   ```bash
   docker logs discord-clone-backend-container
   ```

2. **Port already in use:**
   ```bash
   sudo lsof -i :5000
   sudo kill -9 <PID>
   ```

3. **Database connection issues:**
   - Check your Supabase connection strings
   - Verify firewall rules
   - Test connection from EC2

4. **CORS issues:**
   - Verify `CORS_ORIGIN` in `.env` includes your Vercel domain
   - Check that the frontend is using the correct API URL

### Health Checks

```bash
# Test API health
curl http://localhost:5000/api/health

# Test from external
curl http://your-ec2-ip:5000/api/health

# Check container health
docker inspect discord-clone-backend-container | grep Health -A 10
```

## 📞 Support

If you encounter issues:

1. Check the container logs
2. Verify environment variables
3. Test network connectivity
4. Check system resources
5. Review firewall rules

## 🔄 Rollback Strategy

If something goes wrong:

1. **Stop current container:**
   ```bash
   docker stop discord-clone-backend-container
   ```

2. **Run previous image:**
   ```bash
   docker run -d --name discord-clone-backend-container --restart unless-stopped -p 5000:5000 --env-file .env discord-clone-backend:previous
   ```

3. **Or restore from backup:**
   ```bash
   # List available backups
   ls -la /opt/backups/
   
   # Restore specific backup
   docker run -d --name discord-clone-backend-container --restart unless-stopped -p 5000:5000 --env-file .env -v /opt/backups/app_backup_YYYYMMDD_HHMMSS.tar.gz:/restore.tar.gz discord-clone-backend:latest
   ```

---

🎉 **Your Discord Clone backend is now successfully deployed on AWS EC2!**

Remember to update your Vercel environment variables to point to your new EC2 backend endpoint.
