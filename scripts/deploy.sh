#!/bin/bash
set -e

# ChainHopper Deployment Script
# Usage: ./scripts/deploy.sh [environment] [action]
# Environment: staging | production
# Action: up | down | restart | logs | status | build

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ENV="${1:-staging}"
ACTION="${2:-up}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
    log_error "Invalid environment: $ENV"
    echo "Usage: ./scripts/deploy.sh [staging|production] [up|down|restart|logs|status|build]"
    exit 1
fi

# Set environment file
ENV_FILE="$PROJECT_ROOT/.env.$ENV"
if [[ ! -f "$ENV_FILE" ]]; then
    log_error "Environment file not found: $ENV_FILE"
    log_info "Copy .env.example to .env.$ENV and configure it"
    exit 1
fi

# Docker compose command based on environment
if [[ "$ENV" == "production" ]]; then
    COMPOSE_CMD="docker-compose -f $PROJECT_ROOT/docker-compose.yml -f $PROJECT_ROOT/docker-compose.prod.yml --env-file $ENV_FILE"
else
    COMPOSE_CMD="docker-compose -f $PROJECT_ROOT/docker-compose.yml --env-file $ENV_FILE"
fi

case "$ACTION" in
    up)
        log_info "Starting ChainHopper ($ENV)..."
        $COMPOSE_CMD up -d
        log_info "Services started. Run './scripts/deploy.sh $ENV status' to check."
        ;;

    down)
        log_info "Stopping ChainHopper ($ENV)..."
        $COMPOSE_CMD down
        log_info "Services stopped."
        ;;

    restart)
        log_info "Restarting ChainHopper ($ENV)..."
        $COMPOSE_CMD restart
        log_info "Services restarted."
        ;;

    logs)
        SERVICE="${3:-}"
        if [[ -n "$SERVICE" ]]; then
            $COMPOSE_CMD logs -f "$SERVICE"
        else
            $COMPOSE_CMD logs -f
        fi
        ;;

    status)
        log_info "ChainHopper Status ($ENV):"
        $COMPOSE_CMD ps
        echo ""
        log_info "Health Check:"
        $COMPOSE_CMD ps --format "table {{.Name}}\t{{.Status}}"
        ;;

    build)
        log_info "Building ChainHopper images ($ENV)..."
        $COMPOSE_CMD build --no-cache
        log_info "Build complete."
        ;;

    pull)
        log_info "Pulling latest images..."
        $COMPOSE_CMD pull
        ;;

    db-migrate)
        log_info "Running database migrations..."
        $COMPOSE_CMD exec api npx prisma migrate deploy
        log_info "Migrations complete."
        ;;

    db-seed)
        log_info "Seeding database..."
        $COMPOSE_CMD exec api npx prisma db seed
        log_info "Seeding complete."
        ;;

    shell)
        SERVICE="${3:-api}"
        log_info "Opening shell in $SERVICE..."
        $COMPOSE_CMD exec "$SERVICE" /bin/sh
        ;;

    *)
        log_error "Unknown action: $ACTION"
        echo "Available actions: up, down, restart, logs, status, build, pull, db-migrate, db-seed, shell"
        exit 1
        ;;
esac
