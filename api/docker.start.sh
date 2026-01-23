#!/bin/sh
set -e

echo "Running migrations..."
pnpm prisma migrate deploy

echo "Starting API..."
node dist/src/main.js
