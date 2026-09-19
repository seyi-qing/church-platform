#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
docker compose -f infra/docker-compose.yml up --build
