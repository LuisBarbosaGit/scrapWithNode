#!/bin/sh
set -e

echo "Aplicando migrations Prisma..."
npx prisma migrate deploy

echo "Iniciando scraper..."
exec node dist/index.js
