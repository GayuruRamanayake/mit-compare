#!/bin/bash
set -euo pipefail

# baked into the frontend build at build time (Vite's VITE_API_BASE_URL).
# Same domain as the page itself, since common_nginx serves both the
# frontend and the backend's /health + /comparisons routes under one
# hostname — see deploy/nginx-server-block.conf.example.
PUBLIC_URL="https://mitcompare.test2.app"

docker build -t mitcompare-backend:latest ./backend

docker build \
  --build-arg VITE_API_BASE_URL="$PUBLIC_URL" \
  -t mitcompare-frontend:latest \
  ./frontend
