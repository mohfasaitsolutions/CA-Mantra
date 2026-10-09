#!/bin/bash
# CORS Fix Deployment Script
# This script updates the nginx configuration on your server

set -e  # Exit on any error

# Resolve repo root (this script lives in scripts/)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NGINX_CONF="$REPO_ROOT/nginx.conf.example"

echo "============================================"
echo "CORS Fix Deployment Script"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if nginx.conf.example exists
if [ ! -f "$NGINX_CONF" ]; then
    echo -e "${RED}Error: nginx.conf.example not found at $NGINX_CONF!${NC}"
    echo "Please run this script from inside the ca-test-series-backend repo"
    exit 1
fi

echo -e "${YELLOW}Step 1: Backing up current nginx configuration...${NC}"
sudo cp /etc/nginx/sites-available/api.camantraa.com /etc/nginx/sites-available/api.camantraa.com.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ Backup created${NC}"
echo ""

echo -e "${YELLOW}Step 2: Updating nginx configuration...${NC}"
sudo cp "$NGINX_CONF" /etc/nginx/sites-available/api.camantraa.com
echo -e "${GREEN}✓ Configuration updated${NC}"
echo ""

echo -e "${YELLOW}Step 3: Testing nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration test failed!${NC}"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/api.camantraa.com.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/api.camantraa.com
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 4: Reloading nginx...${NC}"
sudo systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

echo -e "${YELLOW}Step 5: Restarting backend application...${NC}"
pm2 restart all
echo -e "${GREEN}✓ Application restarted${NC}"
echo ""

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

echo -e "${YELLOW}Testing CORS headers...${NC}"
echo "Running: curl -I -X OPTIONS https://api.camantraa.com/api/students/profile -H \"Origin: https://camantraa.com\""
echo ""
curl -I -X OPTIONS https://api.camantraa.com/api/students/profile \
  -H "Origin: https://camantraa.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization, Content-Type"
echo ""

echo -e "${YELLOW}Check for these headers in the response above:${NC}"
echo "  - Access-Control-Allow-Origin: https://camantraa.com"
echo "  - Access-Control-Allow-Credentials: true"
echo ""
echo -e "${GREEN}If you see those headers, CORS is working correctly!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Clear your browser cache or test in incognito mode"
echo "  2. Check the browser console for CORS errors"
echo "  3. If issues persist, check logs: pm2 logs"
