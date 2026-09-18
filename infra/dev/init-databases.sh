#!/bin/bash
set -e

for svc in auth calendar finance tracking notification; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE USER ${svc}_service WITH PASSWORD '${svc}_service';
    CREATE DATABASE ${svc}_db OWNER ${svc}_service;
    REVOKE ALL ON DATABASE ${svc}_db FROM PUBLIC;
    GRANT ALL PRIVILEGES ON DATABASE ${svc}_db TO ${svc}_service;
EOSQL
done
