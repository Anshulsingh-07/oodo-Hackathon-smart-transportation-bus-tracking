#!/usr/bin/env bash
set -euo pipefail
API="http://localhost:5000/api"

login() {
  local email="$1"
  local pass="$2"
  curl -s -c /tmp/cookies.txt -H 'Content-Type: application/json' -d "{\"email\":\"$email\",\"password\":\"$pass\"}" "$API/auth/login"
}

token_of() {
  echo "$1" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p'
}

status() {
  local code
  code=$(curl -s -o /tmp/out.json -w "%{http_code}" "$@")
  echo "$code"
}

run_check() {
  local role="$1" email="$2"
  local login_res token code
  login_res=$(login "$email" "Password123")
  token=$(token_of "$login_res")
  if [[ -z "$token" ]]; then
    echo "$role login: FAIL"
    echo "$login_res"
    return
  fi
  echo "$role login: PASS"

  code=$(status -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d '{"registrationNumber":"TEST-RBAC-1","model":"RBAC","type":"truck","maxLoadCapacity":1000,"odometer":0,"acquisitionCost":1000,"status":"available"}' "$API/vehicles")
  echo "$role create vehicle status: $code"

  code=$(status -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d '{"vehicleId":5,"maintenanceType":"check","description":"rbac","cost":100}' "$API/maintenance")
  echo "$role open maintenance status: $code"

  code=$(status -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d '{"vehicleId":5,"logDate":"2026-07-12","liters":10,"cost":100}' "$API/costs/fuel")
  echo "$role add fuel status: $code"

  code=$(status -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d '{"vehicleId":5,"category":"toll","amount":99,"expenseDate":"2026-07-12"}' "$API/costs/expenses")
  echo "$role add expense status: $code"

  code=$(status -H "Authorization: Bearer $token" "$API/reports/summary")
  echo "$role reports summary status: $code"
  echo "---"
}

run_check "ADMIN" "admin@transitops.local"
run_check "FLEET" "fleet@transitops.local"
run_check "DISPATCH" "dispatch@transitops.local"
run_check "SAFETY" "safety@transitops.local"
run_check "FINANCE" "finance@transitops.local"
