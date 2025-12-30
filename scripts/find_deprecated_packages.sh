#!/bin/bash

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: 'node' is not found."
    exit 1
fi

echo "🔍 Forcing resolution to capture deprecation warnings..."
echo "   (Using 'pnpm install --resolution-only --force')"
echo "------------------------------------------------------------"

# 1. Run pnpm install and capture output.
# We process the output with Node to handle the comma-separated list reliably.
DEPRECATED_PACKAGES=$(pnpm install --resolution-only --force --reporter=default 2>&1 | node -e "
  const fs = require('fs');
  const stdin = fs.readFileSync(0, 'utf-8');
  const lines = stdin.split('\n');
  const found = new Set();

  lines.forEach(line => {
    // MATCH PATTERN 1: Aggregated list (What you are seeing)
    // Example: 'WARN 7 deprecated subdependencies found: pkgA@1.0, pkgB@2.0'
    if (line.includes('deprecated subdependencies found:')) {
      // Split the line at the colon
      const parts = line.split('deprecated subdependencies found:');
      if (parts[1]) {
        // Split by comma, trim whitespace
        const packages = parts[1].split(',');
        packages.forEach(p => {
            let clean = p.trim();
            // Remove trailing commas or weird hidden chars if any
            if (clean) found.add(clean);
        });
      }
    }

    // MATCH PATTERN 2: Single line warnings (Legacy/Standard fallback)
    // Example: 'WARN deprecated uuid@3.4.0: ...'
    // We ignore lines containing 'subdependencies found' here to avoid double matching
    else if (line.includes('deprecated') && !line.includes('subdependencies found')) {
      // Look for standard 'pkg@version' pattern after 'deprecated'
      const match = line.match(/deprecated\s+((@[^/]+\/)?[^@]+@[0-9][^:\s]*)/);
      if (match) {
        found.add(match[1]);
      }
    }
  });

  // Print unique packages to stdout for the bash script to read
  found.forEach(pkg => console.log(pkg));
")

# Check if variable is empty or contains only whitespace
if [ -z "$(echo "$DEPRECATED_PACKAGES" | tr -d '[:space:]')" ]; then
    echo "✅ No deprecated packages found."
    exit 0
fi

echo "⚠️  FOUND DEPRECATED PACKAGES:"
echo "============================================================"

# 2. Loop through results and run pnpm why
# Set Internal Field Separator to newline to handle the list iteration cleanly
IFS=$'\n'
for pkg_id in $DEPRECATED_PACKAGES; do
    # Trim whitespace just in case
    pkg_id=$(echo "$pkg_id" | xargs)

    # Skip empty lines
    if [ -z "$pkg_id" ]; then continue; fi

    # Extract name for 'pnpm why' (remove the version part)
    # Logic: remove the last @ and everything following it
    pkg_name=$(echo "$pkg_id" | sed -E 's/@[^@]+$//')

    echo ""
    echo "============================================================"
    echo "📦 PACKAGE: $pkg_id"
    echo "============================================================"
    echo
    # Run pnpm why
    pnpm why "$pkg_name" --aggregate-output --depth 3 --stream

    echo
    echo "============================================================"
    echo ""
done