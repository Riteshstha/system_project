#!/usr/bin/env bash
# deploy.sh — Reproducible deployment script for production server.
# Run as the non-root admin user (not root) on the production server.
# Usage: ./scripts/deploy.sh [--skip-db-migrate]

set -euo pipefail

# ========== CONFIG ==========
APP_DIR="/opt/app"
REPO_URL="https://github.com/your-org/your-repo.git"  # CHANGE THIS
BRANCH="main"
DOCKER_COMPOSE_FILE="${APP_DIR}/docker-compose.yml"
ENV_FILE="${APP_DIR}/.env"
# =============================

SKIP_DB_MIGRATE=false
for arg in "$@"; do
  case $arg in
    --skip-db-migrate) SKIP_DB_MIGRATE=true ;;
    *) echo "Unknown argument: $arg" && exit 1 ;;
  esac
done

echo "=== Deployment started at $(date -u) ==="

# 1. Ensure app directory exists
mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

# 2. Clone or update repository
if [ ! -d ".git" ]; then
  echo "Cloning repository..."
  git clone --branch "${BRANCH}" "${REPO_URL}" .
else
  echo "Updating repository..."
  git fetch origin
  git reset --hard "origin/${BRANCH}"
  git clean -fd
fi

# 3. Ensure .env exists
if [ ! -f "${ENV_FILE}" ]; then
  echo "ERROR: ${ENV_FILE} not found. Create it from .env.example first."
  exit 1
fi

# 4. Pull latest images (pinned versions in docker-compose.yml)
echo "Pulling Docker images..."
docker compose -f "${DOCKER_COMPOSE_FILE}" pull

# 5. Build application image
echo "Building application image..."
docker compose -f "${DOCKER_COMPOSE_FILE}" build --no-cache app

# 6. Database migrations (if not skipped)
if [ "${SKIP_DB_MIGRATE}" = false ]; then
  echo "Running database migrations..."
  docker compose -f "${DOCKER_COMPOSE_FILE}" run --rm app npx prisma migrate deploy
else
  echo "Skipping database migrations (--skip-db-migrate flag)."
fi

# 7. Start / restart services
echo "Starting services..."
docker compose -f "${DOCKER_COMPOSE_FILE}" up -d

# 8. Wait for health
echo "Waiting for app to be healthy..."
for i in {1..30}; do
  if curl -fsS "http://localhost:3000/api/health" > /dev/null 2>&1; then
    echo "App is healthy."
    break
  fi
  sleep 2
  if [ $i -eq 30 ]; then
    echo "WARNING: App health check timed out. Check logs:"
    docker compose -f "${DOCKER_COMPOSE_FILE}" logs --tail=50 app
  fi
done

# 9. Prune old Docker images
echo "Pruning old Docker images..."
docker image prune -f

echo "=== Deployment completed at $(date -u) ==="