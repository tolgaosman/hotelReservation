#!/bin/sh
set -e

# Only the "backend" service sets RUN_MIGRATIONS=true; the "scheduler"
# service reuses this same image/entrypoint but must not race it on migrate.
# docker-compose's db healthcheck (depends_on: condition: service_healthy)
# is what guarantees MySQL is already up by the time this runs.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php artisan migrate --force
  
  # Automatically seed the database if it's completely empty (e.g. fresh deployment)
  php database/seed_if_empty.php || true

  php artisan config:cache
fi

exec "$@"
