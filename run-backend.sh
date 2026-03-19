#!/usr/bin/env bash
set -e

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

./mvnw spring-boot:run
