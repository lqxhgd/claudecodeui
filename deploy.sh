#!/bin/bash
# =============================================================================
# Claude Code UI - Alibaba Cloud Deployment Script
# 阿里云一键部署脚本
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║     Claude Code UI - Deployment Script           ║"
echo "║     阿里云部署脚本                                  ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# =============================================================================
# Step 1: Check/Install Docker
# =============================================================================
echo -e "${YELLOW}[1/6] Checking Docker...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${CYAN}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker installed successfully${NC}"
else
    echo -e "${GREEN}Docker already installed: $(docker --version)${NC}"
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${CYAN}Installing Docker Compose plugin...${NC}"
    apt-get update && apt-get install -y docker-compose-plugin 2>/dev/null || \
    yum install -y docker-compose-plugin 2>/dev/null || \
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose
fi

# =============================================================================
# Step 2: Clone or update repository
# =============================================================================
echo -e "${YELLOW}[2/6] Setting up project...${NC}"

INSTALL_DIR="/opt/claudecodeui"

if [ -d "$INSTALL_DIR" ]; then
    echo "Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/lqxhgd/claudecodeui.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# =============================================================================
# Step 3: Configure environment
# =============================================================================
echo -e "${YELLOW}[3/6] Configuring environment...${NC}"

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${CYAN}Created .env file from template${NC}"
fi

# Prompt for Anthropic API key if not set
if ! grep -q "ANTHROPIC_API_KEY=sk-" .env 2>/dev/null; then
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}You need an Anthropic API key to use Claude.${NC}"
    echo -e "${CYAN}Get one at: https://console.anthropic.com/settings/keys${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    read -p "Enter your ANTHROPIC_API_KEY (sk-ant-...): " API_KEY
    if [ -n "$API_KEY" ]; then
        # Add or update ANTHROPIC_API_KEY in .env
        if grep -q "ANTHROPIC_API_KEY" .env; then
            sed -i "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$API_KEY|" .env
        else
            echo "ANTHROPIC_API_KEY=$API_KEY" >> .env
        fi
        echo -e "${GREEN}API key configured${NC}"
    else
        echo -e "${RED}Warning: No API key provided. Claude features will not work.${NC}"
    fi
fi

# Generate secure JWT secret if still default
if grep -q "JWT_SECRET=change-me-in-production" .env; then
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -d '/+=' | head -c 64)
    sed -i "s|JWT_SECRET=change-me-in-production|JWT_SECRET=$JWT_SECRET|" .env
    echo -e "${GREEN}Generated secure JWT secret${NC}"
fi

# =============================================================================
# Step 4: Configure firewall
# =============================================================================
echo -e "${YELLOW}[4/6] Configuring firewall...${NC}"

# Try to open port 3001
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=3001/tcp 2>/dev/null && firewall-cmd --reload 2>/dev/null
    echo -e "${GREEN}Firewall: port 3001 opened (firewalld)${NC}"
elif command -v ufw &> /dev/null; then
    ufw allow 3001/tcp 2>/dev/null
    echo -e "${GREEN}Firewall: port 3001 opened (ufw)${NC}"
else
    echo -e "${CYAN}No firewall tool found - make sure port 3001 is open in Alibaba Cloud security group${NC}"
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}IMPORTANT: Open port 3001 in Alibaba Cloud Security Group${NC}"
echo -e "${CYAN}重要：请在阿里云安全组中放行 3001 端口${NC}"
echo -e "${CYAN}  控制台 → ECS → 安全组 → 入方向 → 添加规则${NC}"
echo -e "${CYAN}  端口范围: 3001/3001  授权对象: 0.0.0.0/0${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# =============================================================================
# Step 5: Build and start
# =============================================================================
echo -e "${YELLOW}[5/6] Building and starting services...${NC}"

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD down 2>/dev/null || true
$COMPOSE_CMD up -d --build

# =============================================================================
# Step 6: Verify
# =============================================================================
echo -e "${YELLOW}[6/6] Verifying deployment...${NC}"

# Wait for health check
echo "Waiting for server to start..."
for i in {1..30}; do
    if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
        break
    fi
    sleep 2
    echo -n "."
done
echo ""

if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}Health check passed!${NC}"
else
    echo -e "${RED}Server not responding. Check logs: $COMPOSE_CMD logs${NC}"
    exit 1
fi

# Get public IP
PUBLIC_IP=$(curl -sf http://ipinfo.io/ip 2>/dev/null || curl -sf http://ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Deployment Complete! 部署完成!                ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}║  Web UI:  ${CYAN}http://${PUBLIC_IP}:3001${GREEN}                     ║${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}║  DingTalk Webhook:                                     ║${NC}"
echo -e "${GREEN}║  ${CYAN}http://${PUBLIC_IP}:3001/api/bot/dingtalk/webhook${GREEN}     ║${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}║  WeChat Work Webhook:                                  ║${NC}"
echo -e "${GREEN}║  ${CYAN}http://${PUBLIC_IP}:3001/api/bot/wechat/webhook${GREEN}      ║${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Commands / 管理命令:${NC}"
echo -e "  View logs:    cd $INSTALL_DIR && $COMPOSE_CMD logs -f"
echo -e "  Restart:      cd $INSTALL_DIR && $COMPOSE_CMD restart"
echo -e "  Stop:         cd $INSTALL_DIR && $COMPOSE_CMD down"
echo -e "  Update:       cd $INSTALL_DIR && git pull && $COMPOSE_CMD up -d --build"
echo ""
