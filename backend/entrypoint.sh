#!/bin/bash
set -e

echo "=== Waiting for PostgreSQL to be ready ==="
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is up and running!"

echo "=== Running database migrations ==="
python manage.py migrate --noinput

echo "=== Creating default admin user ==="
python manage.py create_default_admin || true

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput

echo "=== Starting Django development server ==="
exec python manage.py runserver 0.0.0.0:8000
