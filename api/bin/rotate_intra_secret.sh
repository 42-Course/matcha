#!/usr/bin/env bash
#
# Rotate the 42 Intra OAuth client secret in .env and (optionally) push the
# new envs to production with Kamal.
#
# WHY: 42 Intra application secrets expire roughly every month. You can
# generate the *next* secret in advance from the intra application settings;
# during the overlap the OAuth endpoint accepts both. The API tries
# INTRA_CLIENT_SECRET first and falls back to INTRA_CLIENT_NEXT_SECRET
# (see app/controllers/auth_controller.rb), so rotation is zero-downtime:
#
#   1. Well before expiry: generate the NEXT secret, store it in
#      INTRA_CLIENT_NEXT_SECRET (INTRA_CLIENT_SECRET keeps working).
#   2. When the current one expires: promote NEXT -> CURRENT and generate a
#      fresh NEXT.
#
# Usage:
#   bin/rotate_intra_secret.sh            # interactive
#   ENV_FILE=/path/.env bin/rotate_intra_secret.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

CURRENT_KEY="INTRA_CLIENT_SECRET"
NEXT_KEY="INTRA_CLIENT_NEXT_SECRET"

# ---------------------------------------------------------------- helpers ---

# Value of KEY in the env file (empty if the key is absent). Last one wins.
get_env() {
  local key="$1"
  [ -f "$ENV_FILE" ] || return 0
  grep -E "^${key}=" "$ENV_FILE" | tail -n1 | sed -E "s/^${key}=//" || true
}

# Show a secret without leaking it: prefix + suffix + length.
mask() {
  local v="$1" n=${#1}
  if   [ "$n" -eq 0 ]; then printf '(empty)'
  elif [ "$n" -le 8 ]; then printf '•••• (%d chars)' "$n"
  else printf '%s…%s (%d chars)' "${v:0:4}" "${v: -2}" "$n"
  fi
}

# Set (or insert) KEY=VALUE, preserving every other line. Value is written
# verbatim — never interpreted — so arbitrary secret characters are safe.
set_env() {
  local key="$1" value="$2" tmp replaced=0
  tmp="$(mktemp)"
  if [ -f "$ENV_FILE" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      if [[ "$line" == "${key}="* ]]; then
        printf '%s=%s\n' "$key" "$value" >>"$tmp"
        replaced=1
      else
        printf '%s\n' "$line" >>"$tmp"
      fi
    done <"$ENV_FILE"
  fi
  [ "$replaced" -eq 0 ] && printf '%s=%s\n' "$key" "$value" >>"$tmp"
  mv "$tmp" "$ENV_FILE"
}

# Read a secret silently into REPLY_SECRET (no terminal echo).
prompt_secret() {
  local val
  printf '%s' "$1" >&2
  read -rs val
  printf '\n' >&2
  REPLY_SECRET="$val"
}

# ------------------------------------------------------------------- main ---

echo "🔐 Rotate 42 Intra client secret"
echo "   env file: $ENV_FILE"
[ -f "$ENV_FILE" ] || echo "⚠️  $ENV_FILE not found — it will be created."

cur_current="$(get_env "$CURRENT_KEY")"
cur_next="$(get_env "$NEXT_KEY")"

echo
echo "Current values:"
echo "  $CURRENT_KEY      = $(mask "$cur_current")"
echo "  $NEXT_KEY = $(mask "$cur_next")"
echo

new_current=""

# Common case: the live secret just expired — promote the pre-generated NEXT.
if [ -n "$cur_next" ]; then
  read -rp "Promote existing NEXT secret to CURRENT? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] && new_current="$cur_next"
fi

if [ -z "$new_current" ]; then
  prompt_secret "Enter CURRENT $CURRENT_KEY (blank = keep existing): "
  new_current="${REPLY_SECRET:-$cur_current}"
fi

prompt_secret "Enter NEXT $NEXT_KEY, generated in advance (blank = keep existing): "
new_next="${REPLY_SECRET:-$cur_next}"

if [ -z "$new_current" ]; then
  echo "❌ CURRENT secret cannot be empty." >&2
  exit 1
fi
if [ "$new_current" = "$new_next" ]; then
  echo "⚠️  CURRENT and NEXT are identical — the fallback gives no protection."
fi

echo
echo "About to write:"
echo "  $CURRENT_KEY      = $(mask "$new_current")"
echo "  $NEXT_KEY = $(mask "$new_next")"
read -rp "Proceed? [y/N] " go
[[ "$go" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }

if [ -f "$ENV_FILE" ]; then
  backup="$ENV_FILE.bak.$(date +%Y%m%d%H%M%S)"
  cp "$ENV_FILE" "$backup"
  echo "🗂️  Backup: $backup"
fi

set_env "$CURRENT_KEY" "$new_current"
set_env "$NEXT_KEY" "$new_next"
echo "✅ Updated $ENV_FILE"

echo
read -rp "Deploy the new envs with Kamal now (kamal env push)? [y/N] " dep
if [[ "$dep" =~ ^[Yy]$ ]]; then
  if command -v kamal >/dev/null 2>&1; then
    ( cd "$ROOT_DIR" && kamal env push )
    echo "🚀 kamal env push complete"
  else
    echo "❌ 'kamal' not found on PATH — skipping deploy." >&2
    exit 1
  fi
else
  echo "Skipped deploy. Run 'kamal env push' from $ROOT_DIR when ready."
fi
