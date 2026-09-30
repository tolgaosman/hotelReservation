#!/bin/sh
set -e

# Only the "backend" service sets RUN_MIGRATIONS=true; the "scheduler"
# service reuses this same image/entrypoint but must not race it on migrate.
# docker-compose's db healthcheck (depends_on: condition: service_healthy)
# is what guarantees MySQL is already up by the time this runs.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php artisan migrate --force
  
  # Automatically seed the database if it's completely empty (e.g. fresh deployment)
  php artisan tinker --execute="if(\App\Models\User::count()===0) { echo 'Database empty. Seeding mock dataset...'; \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]); }" || true

  php artisan config:cache
fi

exec "$@"
