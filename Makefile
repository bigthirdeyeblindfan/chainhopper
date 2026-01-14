# ChainHopper Makefile
# Common development and deployment commands

.PHONY: help install dev build test clean docker-build docker-up docker-down deploy-staging deploy-prod db-migrate db-studio

# Default target
help:
	@echo "ChainHopper Development Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Start development servers"
	@echo "  make build        - Build all packages"
	@echo "  make test         - Run all tests"
	@echo "  make typecheck    - Run TypeScript type checking"
	@echo "  make lint         - Run linting"
	@echo "  make clean        - Clean build artifacts"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-studio    - Open Prisma Studio"
	@echo "  make db-seed      - Seed database with test data"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker images"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make docker-logs  - View container logs"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-staging - Deploy to staging"
	@echo "  make deploy-prod    - Deploy to production"

# Development
install:
	npm ci

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

typecheck:
	npm run typecheck

lint:
	npm run lint

clean:
	npm run clean
	rm -rf node_modules

# Database
db-migrate:
	npm run db:migrate --workspace=@chainhopper/core

db-studio:
	npm run db:studio --workspace=@chainhopper/core

db-seed:
	npm run db:seed --workspace=@chainhopper/core

db-generate:
	npm run db:generate --workspace=@chainhopper/core

# Docker commands
docker-build:
	docker-compose build --no-cache

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-ps:
	docker-compose ps

docker-shell-api:
	docker-compose exec api /bin/sh

docker-shell-bot:
	docker-compose exec bot /bin/sh

# Deployment
deploy-staging:
	./scripts/deploy.sh staging up

deploy-prod:
	./scripts/deploy.sh production up

staging-logs:
	./scripts/deploy.sh staging logs

prod-logs:
	./scripts/deploy.sh production logs

staging-status:
	./scripts/deploy.sh staging status

prod-status:
	./scripts/deploy.sh production status

# Contract commands
contracts-build:
	cd packages/contracts && forge build

contracts-test:
	cd packages/contracts && forge test -vvv

contracts-deploy-local:
	cd packages/contracts && forge script script/Deploy.s.sol --fork-url http://localhost:8545 --broadcast

# Security
audit:
	npm audit
	cd packages/contracts && forge audit 2>/dev/null || echo "Run slither manually"

slither:
	cd packages/contracts && slither .

# Release
version-patch:
	npm version patch --workspaces --include-workspace-root

version-minor:
	npm version minor --workspaces --include-workspace-root

version-major:
	npm version major --workspaces --include-workspace-root
