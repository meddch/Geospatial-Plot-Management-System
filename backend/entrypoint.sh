#!/bin/bash

# Wait for postgres
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "db" -p 5432 -U "postgres" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - executing command"

# Run migrations
python manage.py makemigrations plots
python manage.py migrate

# Start server
exec python manage.py runserver 0.0.0.0:8000 