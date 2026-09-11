#!/usr/bin/env bash
# Testa um deploy: espera a API subir e bate nos endpoints principais.
# Uso: bash scripts/smoke-test.sh <base-url>   (ex: http://localhost:8081)
set -euo pipefail

BASE="${1:-http://localhost:8080}"
TIMEOUT="${TIMEOUT:-180}"

echo "==> Aguardando $BASE/health (timeout ${TIMEOUT}s)"
for ((i = 0; i < TIMEOUT; i += 3)); do
  if curl -fsS "$BASE/health" >/dev/null 2>&1; then
    echo "    API respondeu em ${i}s"
    break
  fi
  sleep 3
done

echo "==> 1/4 GET /health"
curl -fsS "$BASE/health"; echo

echo "==> 2/4 POST /api/auth/login"
TOKEN=$(curl -fsS -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"usuario":"admin","senha":"123456"}' \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
[ -n "$TOKEN" ] || { echo "FALHA: login nao devolveu token"; exit 1; }
echo "    token obtido (${#TOKEN} caracteres)"

echo "==> 3/4 GET /api/consumos (prova que a API alcanca o banco)"
curl -fsS "$BASE/api/consumos?page=1&pageSize=5" >/dev/null
echo "    ok"

echo "==> 4/4 GET /api/alertas (prova que o JWT funciona)"
curl -fsS "$BASE/api/alertas?page=1&pageSize=5" -H "Authorization: Bearer $TOKEN" >/dev/null
echo "    ok"

echo "==> SMOKE TEST PASSOU em $BASE"
