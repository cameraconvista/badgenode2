#!/bin/bash
# ===== BADGENODE | REC-007 CLEANUP FILE OBSOLETI =====
# Obiettivo: spostare in backup file obsoleti/non usati (sw.js, offline.html, utenti-loader.js).
# Sicuro: nessuna cancellazione, solo spostamento in .backups/.
# Rollback: cp -r .backups/REC007_$ts/* ./
# Genera sempre report su file txt.

set -euo pipefail
ts=$(date +%Y%m%d-%H%M%S)
RUN_ID="REC007-$ts-$RANDOM"
echo "==> RUN_ID: $RUN_ID"

mkdir -p ".backups/REC007_$ts"
report="REC007_REPORT.txt"
echo "# ===== BADGENODE REC-007 REPORT =====" > $report
echo "# Data: $ts" >> $report
echo "# RUN_ID: $RUN_ID" >> $report
echo "# Obiettivo: pulizia file obsoleti" >> $report
echo "" >> $report

# Lista file considerati obsoleti
files="sw.js offline.html assets/scripts/utenti-loader.js"
removed=0

for f in $files; do
  if [ -f "$f" ]; then
    # Crea directory se necessaria per preservare struttura
    mkdir -p ".backups/REC007_$ts/$(dirname "$f")"
    mv -v "$f" ".backups/REC007_$ts/$f.removed"
    echo "- $f → spostato in backup" >> $report
    removed=$((removed+1))
  else
    echo "- $f → non trovato (ok)" >> $report
  fi
done

if [ $removed -eq 0 ]; then
  echo "" >> $report
  echo "## Nessun file obsoleto trovato, repo già pulito." >> $report
fi

echo "" >> $report
echo "## Backup creato in .backups/REC007_$ts/" >> $report
echo "## Rollback: cp -r .backups/REC007_$ts/* ./" >> $report
echo "" >> $report
echo "# ===== FINE REPORT =====" >> $report

echo "==> COMPLETATO. Vedi file $report"
