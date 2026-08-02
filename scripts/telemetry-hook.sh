#!/usr/bin/env bash
# Cursor hook helper: read JSON from stdin and POST to the Docker telemetry service.
# Configure TELEMETRY_ENDPOINT where Cursor executes hooks (SSH remote / VM / host).
#
# Canonical (Docker telemetry published on host :4310):
#   export TELEMETRY_ENDPOINT=http://127.0.0.1:4310
#
# Cursor on another machine (LAN to the Docker host):
#   export TELEMETRY_ENDPOINT=http://192.168.1.150:4310
#
# Via Traefik (same SQLite volume as local :4310):
#   export TELEMETRY_ENDPOINT=https://apps.songara.uk/telemetry
#
# See docs/guides/ai-dev-dashboard-setup.md
set -u

ENDPOINT_BASE="${TELEMETRY_ENDPOINT:-http://127.0.0.1:4310}"
# Accept either base URL or full /hooks URL.
case "$ENDPOINT_BASE" in
  */hooks) HOOKS_URL="$ENDPOINT_BASE" ;;
  */)      HOOKS_URL="${ENDPOINT_BASE}hooks" ;;
  *)       HOOKS_URL="${ENDPOINT_BASE}/hooks" ;;
esac

echo "$(date) Posting to $HOOKS_URL" >> /tmp/telemetry-hook.log

TMP_BODY="$(mktemp)"
TMP_RESP="$(mktemp)"
cleanup() { rm -f "$TMP_BODY" "$TMP_RESP"; }
trap cleanup EXIT

cat >"$TMP_BODY"

HTTP_CODE=0
CURL_ERR=0
HTTP_CODE="$(
  curl -sS -X POST "$HOOKS_URL" \
    -H "Content-Type: application/json" \
    -H "User-Agent: songara-telemetry-hook/1.7" \
    --connect-timeout 3 \
    --max-time 8 \
    --data-binary @"$TMP_BODY" \
    -o "$TMP_RESP" \
    -w "%{http_code}"
)" || CURL_ERR=$?

if [[ "$CURL_ERR" -ne 0 ]]; then
  echo "[telemetry-hook] ERROR: unreachable endpoint ${HOOKS_URL} (curl exit ${CURL_ERR})" >&2
  # Never block the agent if telemetry is down.
  exit 0
fi

if [[ "$HTTP_CODE" -lt 200 || "$HTTP_CODE" -ge 300 ]]; then
  echo "[telemetry-hook] ERROR: POST ${HOOKS_URL} returned HTTP ${HTTP_CODE}: $(head -c 200 "$TMP_RESP")" >&2
  exit 0
fi

exit 0
