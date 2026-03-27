#!/usr/bin/env bash
# Blocks Write/Edit on protected files (.env, lock files)
FILE_PATH=$(jq -r '.tool_input.file_path // empty')
if echo "$FILE_PATH" | grep -qE '(\.env|\.lock$|pnpm-lock)'; then
  echo "BLOCK: Protected file — .env and lock files should not be edited by Claude"
  exit 2
fi
exit 0
