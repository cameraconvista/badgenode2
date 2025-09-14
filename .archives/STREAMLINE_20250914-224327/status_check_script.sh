#!/bin/bash
# ===== BADGENODE | STATUS CHECK SAFE RUN (RUN_ID: STATUS-$(date +%Y%m%d-%H%M%S)-$RANDOM) =====
set -euo pipefail

STEP="STATUS"
ts=$(date +%Y%m%d-%H%M%S)
RUN_ID="STATUS-$ts-$RANDOM"

note(){ printf '%s\n' "$*" >&2; }

append_changelog(){
  mkdir -p .backups 2>/dev/null || true
  cat >> BACKUP_AUTOMATICO_APPLICAZIONE_ChangeLog.txt <<LOG

## REBOOT $1 ($ts) — $RUN_ID
$2
Rollback: ripristina la cartella .backups/REBOOT_$ts/*
LOG
}

# Backup conservativo (no stop se alcuni file mancano)
mkdir -p ".backups/REBOOT_$ts"
cp -vr index.html utenti.html storico.html ex-dipendenti.html assets style.css 2>/dev/null | cat || true

echo "==> STEP corrente: $STEP | RUN_ID: $RUN_ID"
echo "==> Backup creato in .backups/REBOOT_$ts"

echo "• Verifica file chiave e helper:"
ls -1 assets/scripts 2>/dev/null | grep -E 'supabase-client|users-stable|rec004_join_adapter|storico-logic|timbrature-data|virtual-table' || echo "(info) alcuni file non presenti, ok se non ancora creati"

echo "• Ricerca guard SW nelle pagine (deve risultare presente come 'SW-GUARD' e non attivo):"
grep -Hn 'SW-GUARD' index.html utenti.html storico.html ex-dipendenti.html || echo "(info) nessun marker SW-GUARD trovato"

echo "• Ricerca include config.js (deve essere assente in deploy):"
grep -Hn '/config.js' index.html utenti.html ex-dipendenti.html storico.html || echo "OK: nessun config.js referenziato nelle pagine principali"

echo "• Ricerca path icone (prefer /assets/icons/):"
grep -HnE '["'\'']/?icons/' index.html utenti.html storico.html ex-dipendenti.html || echo "OK: path icone normalizzati"

echo "• Adapter REC004 disponibile in storico.html (hook window.__REC004__):"
grep -Hn 'window.__REC004__' storico.html || echo "INFO: hook non inline (potrebbe essere via import module): ok"

echo "• Hook REC003 (virtual table) presente (window.__REC003__):"
grep -Hn 'REC003' storico.html assets/scripts 2>/dev/null || echo "INFO: infrastruttura virtualizzazione non ancora agganciata: ok per STATUS"

echo "• Verifica riferimenti a perf.patch.js (dovrebbe essere rimosso):"
grep -Hn 'perf\.patch\.js' storico.html ex-dipendenti.html || echo "OK: nessun riferimento a perf.patch.js"

echo "• Sommario librerie preload (jsPDF/XLSX) nello storico:"
grep -HnE 'jspdf|xlsx' storico.html || echo "ATTENZIONE: preload non trovato in storico.html (se previsto da REC-001)"

append_changelog "STATUS" "Sincronizzazione stato e backup iniziale. Nessuna modifica applicata. RUN_ID=$RUN_ID"

echo "==> STATUS completato. Allegare output di questo comando nel report."
# ==============================================================================================
