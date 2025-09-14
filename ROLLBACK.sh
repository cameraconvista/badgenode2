#!/bin/bash
# ===== BADGENODE ROLLBACK SCRIPT =====
# Ripristina tutti i file archiviati da .archives/FINALIZE_20250914-224611

set -euo pipefail

if [ ! -d ".archives/FINALIZE_20250914-224611" ]; then
  echo "ERROR: Archive directory .archives/FINALIZE_20250914-224611 not found"
  exit 1
fi

echo "==> Restoring files from .archives/FINALIZE_20250914-224611"
cp -r ".archives/FINALIZE_20250914-224611"/* ./
echo "==> Rollback completed"
echo "==> Files restored from archive to current directory"
