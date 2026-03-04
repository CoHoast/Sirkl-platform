#!/bin/bash
PORT="${PORT:-8080}"
echo "Starting on port $PORT"
exec npx next start -H 0.0.0.0 -p "$PORT"
