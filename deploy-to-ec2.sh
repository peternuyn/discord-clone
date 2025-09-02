#!/bin/bash

# Discord Clone Backend Deployment Script for AWS EC2
# This script deploys the backend using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="discord-clone-backend"
DOCKER_IMAGE="$APP_NAME:latest"
CONTAINER_NAME="$APP_NAME-container"
BACKUP_DIR="/opt/backups"
LOG_DIR="/opt/logs"

echo -e "${BLUE}🚀 Starting deployment of Discord Clone Backend...${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. Consider using a non-root user with sudo privileges."
fi

# Create necessary directories
print_status "Creating necessary directories..."
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p $LOG_DIR
sudo mkdir -p /opt/discord-clone

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install required packages
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_status "Docker installed successfully!"
    print_warning "Please log out and log back in for Docker group changes to take effect."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully!"
fi

# Stop and remove existing container if it exists
if docker ps -a --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
    print_status "Stopping existing container..."
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
fi

# Remove old image if it exists
if docker images --format 'table {{.Repository}}:{{.Tag}}' | grep -q "^$DOCKER_IMAGE$"; then
    print_status "Removing old Docker image..."
    docker rmi $DOCKER_IMAGE || true
fi

# Navigate to backend directory
cd backend

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning "No .env file found. Creating from example..."
    if [ -f "env.production.example" ]; then
        cp env.production.example .env
        print_warning "Please edit .env file with your production values before running the container!"
    else
        print_error ".env file and env.production.example not found!"
        exit 1
    fi
fi

# Build Docker image
print_status "Building Docker image..."
docker build -t $DOCKER_IMAGE .

# Run the container
print_status "Starting new container..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  -v $LOG_DIR:/app/logs \
  $DOCKER_IMAGE

# Wait for container to be ready
print_status "Waiting for container to be ready..."
sleep 10

# Check if container is running
if docker ps --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
    print_status "Container is running successfully!"
    
    # Test health endpoint
    sleep 5
    if curl -f http://localhost:5000/api/health &> /dev/null; then
        print_status "Health check passed! Backend is ready to serve requests."
    else
        print_warning "Health check failed. Check container logs:"
        docker logs $CONTAINER_NAME
    fi
else
    print_error "Container failed to start! Check logs:"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/discord-clone > /dev/null <<EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        docker kill -s USR1 $CONTAINER_NAME 2>/dev/null || true
    endscript
}
EOF

# Create backup script
print_status "Creating backup script..."
sudo tee /opt/discord-clone/backup.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="discord-clone-backend-container"

# Create backup of application data
docker exec $CONTAINER_NAME tar -czf - /app > $BACKUP_DIR/app_backup_$DATE.tar.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: app_backup_$DATE.tar.gz"
EOF

sudo chmod +x /opt/discord-clone/backup.sh

# Create update script
print_status "Creating update script..."
sudo tee /opt/discord-clone/update.sh > /dev/null <<'EOF'
#!/bin/bash
cd /path/to/your/discord-clone  # Update this path
./deploy-to-ec2.sh
EOF

sudo chmod +x /opt/discord-clone/update.sh

# Setup cron job for daily backup
print_status "Setting up daily backup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/discord-clone/backup.sh") | crontab -

# Setup UFW firewall rules
if command -v ufw &> /dev/null; then
    print_status "Configuring firewall rules..."
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 5000/tcp  # Backend API
    sudo ufw allow 80/tcp    # HTTP (if using nginx)
    sudo ufw allow 443/tcp   # HTTPS (if using nginx)
    sudo ufw --force enable
fi

print_status "Deployment completed successfully! 🎉"
echo -e "${BLUE}
📋 Deployment Summary:
- Container Name: $CONTAINER_NAME
- Image: $DOCKER_IMAGE
- Port: 5000
- Logs: docker logs $CONTAINER_NAME
- Status: docker ps | grep $CONTAINER_NAME

🔧 Management Commands:
- View logs: docker logs -f $CONTAINER_NAME
- Restart: docker restart $CONTAINER_NAME
- Stop: docker stop $CONTAINER_NAME
- Update: /opt/discord-clone/update.sh
- Backup: /opt/discord-clone/backup.sh

🌐 Your backend is now accessible at:
- http://YOUR_EC2_IP:5000/api/health (health check)
- http://YOUR_EC2_IP:5000/api (API endpoints)

⚠️  Don't forget to:
1. Update your Vercel frontend environment variables to point to this EC2 instance
2. Update CORS_ORIGIN in .env to include your Vercel domain
3. Consider setting up SSL/TLS with a reverse proxy like nginx
${NC}"
