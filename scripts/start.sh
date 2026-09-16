#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

# docker stack deploy doesn't reliably auto-read .env the way docker
# compose does — export it into the shell explicitly first.
if [ -f .env ]; then
  set -a
  source .env
  set +a
else
  echo ".env not found in $(pwd) — copy .env.example to .env and fill in real values first."
  exit 1
fi

docker stack deploy --resolve-image never -c docker-stack.yml mitcompare
