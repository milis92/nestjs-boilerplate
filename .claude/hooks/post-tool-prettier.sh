#!/usr/bin/env bash
# Auto-format .ts files with Prettier after Write/Edit
FILE_PATH=$(jq -r '.tool_input.file_path // empty')
if echo "$FILE_PATH" | grep -qE '\.ts$'; then
  pnpm prettier --write "$FILE_PATH" 2>/dev/null
fi
exit 0
