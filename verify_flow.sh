#!/usr/bin/env bash
set -euo pipefail
API="http://localhost:5000/api"
TS=$(date +%s)
SRC="QA_SRC_$TS"
CONC_SRC="CONC_$TS"

login=$(curl -s -c /tmp/tops.cookies -H 'Content-Type: application/json' -d '{"email":"admin@transitops.local","password":"Password123"}' "$API/auth/login")
token=$(echo "$login" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
auth="Authorization: Bearer $token"

# ensure unique vehicle and driver
curl -s -o /tmp/o1 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d "{\"registrationNumber\":\"QA-500-$TS\",\"model\":\"QA Truck\",\"type\":\"truck\",\"maxLoadCapacity\":500,\"odometer\":1000,\"acquisitionCost\":500000,\"region\":\"QA\",\"status\":\"available\"}" "$API/vehicles" > /tmp/c1
vcode=$(cat /tmp/c1)
if [[ "$vcode" != "201" ]]; then echo "vehicle_create FAIL $vcode"; cat /tmp/o1; exit 1; fi

curl -s -o /tmp/o2 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d "{\"name\":\"QA Driver $TS\",\"licenseNumber\":\"QA-LIC-$TS\",\"licenseCategory\":\"HMV\",\"licenseExpiryDate\":\"2099-12-31\",\"contactNumber\":\"9$TS\",\"safetyScore\":88,\"status\":\"available\",\"suspended\":false,\"email\":\"qa$TS@local\"}" "$API/drivers" > /tmp/c2

veh_id=$(sed -n 's/.*"id":\([0-9]\+\).*/\1/p' /tmp/o1 | head -n1)
drv_id=$(sed -n 's/.*"id":\([0-9]\+\).*/\1/p' /tmp/o2 | head -n1)

# valid trip 450
curl -s -o /tmp/o3 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d "{\"source\":\"$SRC\",\"destination\":\"QA_DEST\",\"vehicleId\":$veh_id,\"driverId\":$drv_id,\"cargoWeight\":450,\"plannedDistance\":100,\"revenue\":1000}" "$API/trips" > /tmp/c3
[[ "$(cat /tmp/c3)" == "201" ]] || { echo "trip_450 FAIL $(cat /tmp/c3)"; cat /tmp/o3; exit 1; }
trip_id=$(sed -n 's/.*"id":\([0-9]\+\).*/\1/p' /tmp/o3 | head -n1)

# overweight reject
curl -s -o /tmp/o4 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d "{\"source\":\"$SRC-OV\",\"destination\":\"QA_DEST\",\"vehicleId\":$veh_id,\"driverId\":$drv_id,\"cargoWeight\":700,\"plannedDistance\":100,\"revenue\":1000}" "$API/trips" > /tmp/c4
[[ "$(cat /tmp/c4)" == "422" ]] || { echo "trip_overweight FAIL $(cat /tmp/c4)"; cat /tmp/o4; exit 1; }

# dispatch
curl -s -o /tmp/o5 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d '{}' "$API/trips/$trip_id/dispatch" > /tmp/c5
[[ "$(cat /tmp/c5)" == "204" ]] || { echo "dispatch FAIL $(cat /tmp/c5)"; cat /tmp/o5; exit 1; }

# reject assign while busy
curl -s -o /tmp/o6 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d "{\"source\":\"$SRC-BUSY\",\"destination\":\"QA_DEST\",\"vehicleId\":$veh_id,\"driverId\":$drv_id,\"cargoWeight\":100,\"plannedDistance\":50}" "$API/trips" > /tmp/c6
[[ "$(cat /tmp/c6)" == "409" ]] || { echo "double_assign FAIL $(cat /tmp/c6)"; cat /tmp/o6; exit 1; }

# complete
curl -s -o /tmp/o7 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d '{"actualDistance":102,"fuelConsumed":12,"finalOdometer":1200}' "$API/trips/$trip_id/complete" > /tmp/c7
[[ "$(cat /tmp/c7)" == "204" ]] || { echo "complete FAIL $(cat /tmp/c7)"; cat /tmp/o7; exit 1; }

# maintenance open
curl -s -o /tmp/o8 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d "{\"vehicleId\":$veh_id,\"maintenanceType\":\"qa_check\",\"description\":\"qa\",\"cost\":100}" "$API/maintenance" > /tmp/c8
[[ "$(cat /tmp/c8)" == "201" ]] || { echo "maintenance_open FAIL $(cat /tmp/c8)"; cat /tmp/o8; exit 1; }

# reject in_shop trip
curl -s -o /tmp/o9 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d "{\"source\":\"$SRC-SHOP\",\"destination\":\"QA_DEST\",\"vehicleId\":$veh_id,\"driverId\":$drv_id,\"cargoWeight\":100,\"plannedDistance\":50}" "$API/trips" > /tmp/c9
[[ "$(cat /tmp/c9)" == "409" ]] || { echo "dispatch_in_shop FAIL $(cat /tmp/c9)"; cat /tmp/o9; exit 1; }

maint_id=$(curl -s -H "$auth" "$API/maintenance" | tr -d '\n' | sed -n "s/.*\"id\":\([0-9]\+\),\"vehicle_id\":$veh_id,\"maintenance_type\":\"qa_check\".*/\1/p")

curl -s -o /tmp/o10 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d '{}' "$API/maintenance/$maint_id/close" > /tmp/c10
[[ "$(cat /tmp/c10)" == "204" ]] || { echo "maintenance_close FAIL $(cat /tmp/c10)"; cat /tmp/o10; exit 1; }

# dashboard/reports
kpi=$(curl -s -o /tmp/o11 -w "%{http_code}" -H "$auth" "$API/dashboard")
rep=$(curl -s -o /tmp/o12 -w "%{http_code}" -H "$auth" "$API/reports/summary")
[[ "$kpi" == "200" && "$rep" == "200" ]] || { echo "dashboard_reports FAIL $kpi/$rep"; exit 1; }

# concurrency setup
curl -s -o /tmp/o13 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d "{\"source\":\"$CONC_SRC\",\"destination\":\"RACE\",\"vehicleId\":5,\"driverId\":1,\"cargoWeight\":100,\"plannedDistance\":20}" "$API/trips" > /tmp/c13
[[ "$(cat /tmp/c13)" == "201" ]] || { echo "concurrency_setup FAIL $(cat /tmp/c13)"; cat /tmp/o13; exit 1; }
conc_id=$(sed -n 's/.*"id":\([0-9]\+\).*/\1/p' /tmp/o13 | head -n1)

(curl -s -o /tmp/co1 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d '{}' "$API/trips/$conc_id/dispatch" > /tmp/cc1) &
(curl -s -o /tmp/co2 -w "%{http_code}" -H "$auth" -H 'Content-Type: application/json' -d '{}' "$API/trips/$conc_id/dispatch" > /tmp/cc2) &
wait
c1=$(cat /tmp/cc1); c2=$(cat /tmp/cc2)
[[ "$c1$c2" == *204* && "$c1$c2" == *409* ]] || { echo "concurrency_dispatch FAIL $c1/$c2"; exit 1; }

echo "ALL_FLOW_CHECKS_PASS"
echo "RACE_CODES $c1 $c2"
