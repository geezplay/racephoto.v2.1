#!/bin/bash
# Rebuild and restart the RacePhoto containers from the repository root.
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== STOP ALL PODMAN ==="
podman stop -a -t 5 2>/dev/null || true
podman rm -f -a 2>/dev/null || true

echo "=== REMOVE OLD IMAGES ==="
podman rmi -f racephoto_backend:latest 2>/dev/null || true
podman rmi -f racephoto_frontend:latest 2>/dev/null || true

echo "=== BUILD BACKEND ==="
podman build --no-cache -f ./apps/api/Containerfile -t racephoto_backend:latest . 2>&1 | tail -3

echo "=== BUILD FRONTEND ==="
podman build --no-cache -f ./apps/web/Containerfile -t racephoto_frontend:latest . 2>&1 | tail -3

echo "=== START ALL ==="
podman-compose -f ./deploy/podman-compose.yml up -d 2>&1 | tail -5

echo "=== WAIT 15s ==="
sleep 15

echo "=== HEALTH CHECK ==="
curl -s http://localhost:5000/health
echo ""
echo "=== DONE ==="
