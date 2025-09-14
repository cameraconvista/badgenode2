#!/bin/bash
# ===== BADGENODE | POST-REBOOT VALIDATION SWEEP (READ-ONLY) =====
# Scopo: eseguire controlli finali non-invasivi e produrre un report unico.
# Modifiche: nessuna ai file sorgente, solo crea POST_REBOOT_VALIDATION_REPORT.txt
# Rollback: non necessario (read-only)

set -euo pipefail
ts=$(date +%Y%m%d-%H%M%S)
REPORT="POST_REBOOT_VALIDATION_REPORT.txt"
echo "# ===== BADGENODE POST-REBOOT VALIDATION =====" > "$REPORT"
echo "# Data: $ts" >> "$REPORT"
echo "" >> "$REPORT"

exists(){ [ -f "$1" ] && echo "✓ $1" || echo "— $1 (non trovato)"; }

echo "## File chiave presenti" >> "$REPORT"
for f in assets/scripts/supabase-client.js assets/scripts/timbrature-data.js assets/scripts/rec004_join_adapter.js assets/scripts/virtual-table.js assets/styles/utenti.css assets/styles/ex-dipendenti.css public/_headers; do
  printf " - %s\n" "$(exists "$f")" >> "$REPORT"
done
echo "" >> "$REPORT"

echo "## Guard e riferimenti rischiosi (devono essere assenti/ok)" >> "$REPORT"
{
  echo "- SW-GUARD markers:"
  grep -Hn 'SW-GUARD' index.html utenti.html storico.html ex-dipendenti.html 2>/dev/null || echo "  (nessun marker trovato: ok se non previsto)"
  echo
  echo "- Riferimenti /config.js:"
  if grep -Hn '/config.js' index.html utenti.html storico.html ex-dipendenti.html 2>/dev/null; then
    echo "  ⚠️ Trovato /config.js: rimuovere in produzione"
  else
    echo "  ✓ Nessun /config.js referenziato"
  fi
  echo
  echo "- Riferimenti perf.patch.js:"
  if grep -Hn 'perf\.patch\.js' storico.html ex-dipendenti.html 2>/dev/null; then
    echo "  ⚠️ Trovato perf.patch.js: rimuovere"
  else
    echo "  ✓ Nessun perf.patch.js"
  fi
} >> "$REPORT"
echo "" >> "$REPORT"

echo "## Link CSS estratti (devono esistere)" >> "$REPORT"
{
  echo "- utenti.html → assets/styles/utenti.css:"
  grep -Hn 'assets/styles/utenti\.css' utenti.html 2>/dev/null || echo "  ⚠️ Link non trovato"
  echo "- ex-dipendenti.html → assets/styles/ex-dipendenti.css:"
  grep -Hn 'assets/styles/ex-dipendenti\.css' ex-dipendenti.html 2>/dev/null || echo "  ⚠️ Link non trovato"
} >> "$REPORT"
echo "" >> "$REPORT"

echo "## Verifica header cache (statico)" >> "$REPORT"
if [ -f public/_headers ]; then
  echo "Contenuto public/_headers:" >> "$REPORT"
  sed 's/^/  | /' public/_headers >> "$REPORT"
else
  echo "⚠️ public/_headers mancante" >> "$REPORT"
fi
echo "" >> "$REPORT"

echo "## Residui comuni (solo segnalazioni, nessuna modifica)" >> "$REPORT"
{
  echo "- File PWA o SW residui:"
  ls sw.js offline.html 2>/dev/null || echo "  ✓ Nessun file PWA in root"
  echo "- Script non referenziati (heuristic: cerca file in assets/scripts/ non citati negli HTML)"
  for s in assets/scripts/*.js; do
    [ -f "$s" ] || continue
    bn=$(basename "$s")
    if ! grep -Rqs "$bn" index.html utenti.html storico.html ex-dipendenti.html; then
      echo "  • Potenzialmente non referenziato: $s"
    fi
  done
} >> "$REPORT"
echo "" >> "$REPORT"

echo "## Esito" >> "$REPORT"
echo "Se non compaiono '⚠️', l'ambiente è pulito e allineato post REC-003 → REC-007." >> "$REPORT"
echo "" >> "$REPORT"
echo "# ===== FINE REPORT =====" >> "$REPORT"

echo "==> COMPLETATO. Vedi $REPORT"
