#!/bin/bash
# ─── AI Code Review - Deployment Script for EC2 ──────
# Usage: chmod +x deploy.sh && ./deploy.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "\n${GREEN}━━━ $1 ━━━${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# ─── Step 1: System Update ──────────────────────────
print_step "Step 1: Updating system packages"
sudo apt update && sudo apt upgrade -y

# ─── Step 2: Install Docker ─────────────────────────
print_step "Step 2: Installing Docker"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_warning "Log out and log back in for Docker group to take effect"
else
    echo "Docker already installed"
fi

# ─── Step 3: Install Docker Compose ─────────────────
print_step "Step 3: Installing Docker Compose"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi

# ─── Step 4: Install Nginx ──────────────────────────
print_step "Step 4: Installing Nginx"
if ! command -v nginx &> /dev/null; then
    sudo apt install nginx -y
    sudo systemctl enable nginx
else
    echo "Nginx already installed"
fi

# ─── Step 5: Install Certbot ────────────────────────
print_step "Step 5: Installing Certbot"
if ! command -v certbot &> /dev/null; then
    sudo apt install certbot -y
else
    echo "Certbot already installed"
fi

# ─── Step 6: Clone repository ───────────────────────
print_step "Step 6: Setting up application"
APP_DIR="/opt/ai-code-review"

if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    git clone https://github.com/YOUR_USERNAME/ai-code-review.git $APP_DIR
else
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR

# ─── Step 7: Configure environment ──────────────────
print_step "Step 7: Configuring environment"
if [ ! -f ".env.production" ]; then
    print_error "Please create .env.production file first!"
fi

# ─── Step 8: Build and start services ───────────────
print_step "Step 8: Building and starting services"
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d

# ─── Step 9: Wait for services ──────────────────────
print_step "Step 9: Waiting for services to be healthy"
sleep 10

# Check health
echo "Checking service health..."
docker compose -f docker-compose.production.yml ps

# ─── Step 10: Setup SSL ─────────────────────────────
print_step "Step 10: SSL Certificate Setup"
echo ""
echo "To setup SSL with Let's Encrypt, run:"
echo "  sudo certbot certonly --webroot -w /var/www/certbot -d YOUR_DOMAIN"
echo ""
echo "Then update nginx/conf.d/default.conf with YOUR_DOMAIN and restart nginx:"
echo "  docker compose -f docker-compose.production.yml restart nginx"

# ─── Done ───────────────────────────────────────────
print_step "Deployment Complete! 🚀"
echo ""
echo "Services status:"
docker compose -f docker-compose.production.yml ps
echo ""
echo "Next steps:"
echo "1. Update .env.production with actual values"
echo "2. Update nginx/conf.d/default.conf with YOUR_DOMAIN"
echo "3. Setup SSL certificate"
echo "4. Point your domain DNS to this server's public IP"
echo ""
echo "Useful commands:"
echo "  docker compose -f docker-compose.production.yml logs -f        # View logs"
echo "  docker compose -f docker-compose.production.yml restart        # Restart all"
echo "  docker compose -f docker-compose.production.yml down           # Stop all"
