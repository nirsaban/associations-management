#!/usr/bin/env bash
set -euo pipefail

# Idempotent server bootstrap for amutot platform
# Safe to run multiple times — only creates what doesn't exist

INSTALL_DIR="/opt/miltech-association"
NETWORK_NAME="miltech-association-net"

echo "=== Amutot Platform — Server Bootstrap ==="

# 1. Create directory structure
echo "Creating directories..."
mkdir -p "$INSTALL_DIR"/{data/postgres,data/backups,logs}

# 2. Check Docker
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing..."
    curl -fsSL https://get.docker.com | sh
else
    echo "Docker already installed: $(docker --version)"
fi

# 3. Create Docker network if missing
if ! docker network inspect "$NETWORK_NAME" &> /dev/null; then
    echo "Creating Docker network: $NETWORK_NAME"
    docker network create "$NETWORK_NAME"
else
    echo "Docker network $NETWORK_NAME already exists"
fi

# 4. Weekly Postgres backup cron
CRON_JOB="0 3 * * 0 cd $INSTALL_DIR && docker compose -f docker-compose.prod.yml exec -T postgres pg_dumpall -U amutot | gzip > $INSTALL_DIR/data/backups/pg-\$(date +\\%F).sql.gz && find $INSTALL_DIR/data/backups -name 'pg-*.sql.gz' -mtime +14 -delete"

if crontab -l 2>/dev/null | grep -q "miltech-association"; then
    echo "Backup cron already exists"
else
    echo "Adding weekly Postgres backup cron..."
    (crontab -l 2>/dev/null; echo "# miltech-association weekly pg backup"; echo "$CRON_JOB") | crontab -
fi

# 5. Firewall — ensure 3100 is not blocked (but don't touch existing rules)
if command -v ufw &> /dev/null; then
    ufw status | grep -q "active" && {
        ufw allow 3100/tcp comment "amutot-nginx" 2>/dev/null || true
    }
fi

echo ""
echo "=== Bootstrap complete ==="
echo "Directory: $INSTALL_DIR"
echo "Network:   $NETWORK_NAME"
echo ""
echo "Next steps:"
echo "  1. Create $INSTALL_DIR/.env with your secrets"
echo "  2. Push to main to trigger the first deploy"
