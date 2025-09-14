#!/bin/bash
# ===== BADGENODE | REC-005 ESTRAZIONE CSS INLINE =====
# Obiettivo: spostare i CSS inline (<style>...</style>) in file dedicati dentro assets/styles/.
# Vantaggi: HTML più pulito, CSS riutilizzabile e cachabile.
# Sicurezza: backup automatico, nessun cambio funzionale/visivo.
# Rollback: cp -r .backups/REC005_$ts/* ./
# Genera sempre report su file txt.

set -euo pipefail
ts=$(date +%Y%m%d-%H%M%S)
RUN_ID="REC005-$ts-$RANDOM"
echo "==> RUN_ID: $RUN_ID"

mkdir -p ".backups/REC005_$ts"
cp -vr index.html utenti.html storico.html ex-dipendenti.html style.css assets ".backups/REC005_$ts/" 2>/dev/null | cat || true
mkdir -p assets/styles

report="REC005_REPORT.txt"
echo "# ===== BADGENODE REC-005 REPORT =====" > $report
echo "# Data: $ts" >> $report
echo "# RUN_ID: $RUN_ID" >> $report
echo "# Obiettivo: estrazione CSS inline in file dedicati" >> $report
echo "" >> $report

process_file(){
  f="$1"
  base=$(basename "$f" .html)
  cssf="assets/styles/${base}.css"

  if grep -q '<style>' "$f"; then
    # Estrae il contenuto CSS tra i tag <style>
    awk 'BEGIN{p=0} /<style>/{p=1; next} /<\/style>/{p=0; next} p{print}' "$f" > "$cssf" || true
    # Rimuove i tag <style> e il loro contenuto usando perl per supporto multiline
    perl -i.bak -pe 'BEGIN{undef $/;} s#<style[^>]*>.*?</style>##gms' "$f"
    # Aggiunge il link al CSS estratto
    sed -i -E "s#</head>#  <link rel=\"stylesheet\" href=\"${cssf}\" />\n</head>#" "$f"
    rm -f "$f.bak"
    echo "- $f → CSS estratto in $cssf" >> $report
    echo "[OK] Estrazione CSS da $f"
  else
    echo "- $f → Nessun CSS inline trovato (skip)" >> $report
    echo "[INFO] Nessun CSS inline in $f"
  fi
}

for f in utenti.html storico.html index.html ex-dipendenti.html; do
  [ -f "$f" ] && process_file "$f"
done

echo "" >> $report
echo "## Backup creato in .backups/REC005_$ts/" >> $report
echo "## Rollback: cp -r .backups/REC005_$ts/* ./" >> $report
echo "" >> $report
echo "# ===== FINE REPORT =====" >> $report

echo "==> COMPLETATO. Vedi file $report"
