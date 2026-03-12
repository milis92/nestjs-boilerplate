#!/bin/bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# --- Step 1: Generate BetterAuth SQL to a temp file ---
TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

echo "==> Generating BetterAuth schema to temp file..."
pnpm dotenvx run -- pnpm dlx auth generate --config auth.ts --output "$TMPFILE" --yes
echo ""

# --- Step 2: Compare with the most recent better-auth migration ---
LATEST_BA_MIGRATION=$(find .database -maxdepth 1 -type d -name '*_better-auth' | sort | tail -n 1)

if [ -n "$LATEST_BA_MIGRATION" ] && [ -f "$LATEST_BA_MIGRATION/migration.sql" ]; then
  if diff -q "$TMPFILE" "$LATEST_BA_MIGRATION/migration.sql" > /dev/null 2>&1; then
    echo "==> BetterAuth schema unchanged. Skipping custom migration."
  else
    echo "==> BetterAuth schema changed. Creating custom migration..."
    CREATE_BA_MIGRATION=true
  fi
else
  echo "==> No existing BetterAuth migration found. Creating initial custom migration..."
  CREATE_BA_MIGRATION=true
fi

if [ "${CREATE_BA_MIGRATION:-}" = "true" ]; then
  # --- Step 3: Create custom migration and write BetterAuth SQL into it ---
  echo "==> Running drizzle-kit generate --custom --name=better-auth..."
  OUTPUT=$(pnpm drizzle-kit generate --config=drizzle.config.ts --custom --name=better-auth 2>&1)
  echo "$OUTPUT"
  echo ""

  # Extract the migration folder path from drizzle-kit output.
  # drizzle-kit prints something like: [✓] Your SQL migration file ➜ .database/0001_better-auth/migration.sql
  MIGRATION_DIR=$(echo "$OUTPUT" | grep -oP '➜\s+\K\S+')

  if [ -z "$MIGRATION_DIR" ]; then
    echo "ERROR: Could not parse migration path from drizzle-kit output."
    exit 1
  fi

  MIGRATION_SQL="$MIGRATION_DIR/migration.sql"
  echo "==> Writing BetterAuth schema into $MIGRATION_SQL..."
  cp "$TMPFILE" "$MIGRATION_SQL"
  echo ""
fi

# --- Step 4: Regular Drizzle generate (runs after BetterAuth so timestamps are ordered correctly) ---
echo "==> Running drizzle-kit generate..."
pnpm drizzle-kit generate --config=drizzle.config.ts

echo ""
echo "==> Done. Migration files generated."
