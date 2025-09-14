#!/bin/bash
# ===== BADGENODE | REC-003 AUTOWIRE TUNING (SOGLIA 20 + FORCE TRIGGER) =====
# Cosa fa: abbassa soglia autowire da 150→20 righe e aggiunge window.__REC003__.force()
# Sicurezza: backup e patch idempotente solo su storico.html; nessun cambio layout/CRUD
# Rollback: cp -r .backups/REC003_TUNING_$ts/* ./

set -euo pipefail
ts=$(date +%Y%m%d-%H%M%S)
RUN_ID="REC003-TUNING-$ts-$RANDOM"
echo "==> RUN_ID: $RUN_ID"

mkdir -p ".backups/REC003_TUNING_$ts"
cp -vr storico.html ".backups/REC003_TUNING_$ts/" 2>/dev/null | cat || true

# 1) Abbassa soglia 150 -> 20 nel blocco REC003-AUTOWIRE (se presente)
if grep -q 'REC003-AUTOWIRE' storico.html; then
  # sostituzione sicura del confronto > 150 con > 20
  sed -i.bak -E "s/(trs\.length\s*>\s*)150/\120/g" storico.html || true
  # se già 20, non cambia nulla
  echo "[PATCH] Soglia autowire impostata a 20 righe"
  rm -f storico.html.bak
else
  echo "[WARN] Blocco REC003-AUTOWIRE non rilevato in storico.html; nessuna modifica."
fi

# 2) Aggiunge un trigger manuale window.__REC003__.force() (idempotente)
# Inserisce un nuovo <script type="module"> con la sola definizione di force se non esiste già
if ! grep -q 'window\.__REC003__\.force' storico.html; then
  awk '1; /<\/body>/ && !x {
    print "<script type=\"module\">"
    print "/* REC003-FORCE — trigger manuale per attivare la VirtualTable a prescindere dal numero di righe */"
    print "try{"
    print "  window.__REC003__ = window.__REC003__ || {};"
    print "  window.__REC003__.force = ()=>{"
    print "    try{"
    print "      const tb = document.querySelector('\''#storico-body'\'');"
    print "      if(!tb){ console.warn('\''[REC003] force: tbody #storico-body non trovato'\''); return; }"
    print "      const trs = tb.querySelectorAll('\''tr'\'');"
    print "      const rowsHTML = Array.from(trs, tr => tr.outerHTML);"
    print "      if(window.__REC003__?.mount){"
    print "        window.__REC003__.mount(rowsHTML);"
    print "        console.info('\''[REC003] VirtualTable attiva (force)'\'', rowsHTML.length, '\''righe'\'');"
    print "      } else {"
    print "        console.warn('\''[REC003] force: mount non disponibile'\'');"
    print "      }"
    print "    }catch(e){ console.warn('\''[REC003] force errore:'\'', e?.message||e); }"
    print "  };"
    print "}catch(e){ console.warn('\''[REC003] force non definito:'\'', e?.message||e); }"
    print "</script>"
    x=1
  }' storico.html > storico.html.tmp && mv storico.html.tmp storico.html
  echo "[PATCH] Aggiunto trigger manuale window.__REC003__.force() in storico.html"
else
  echo "[INFO] window.__REC003__.force() già presente (skip)"
fi

# 3) Report
cat > REC003_TUNING_REPORT.txt <<LOG
# ===== BADGENODE REC-003 TUNING REPORT =====
# Data: $ts
# RUN_ID: $RUN_ID
# Intervento: abbassata soglia autowire a 20 righe + aggiunto trigger manuale

## FILE MODIFICATI
- storico.html
  * Soglia autowire: 20 (prima 150)
  * Nuovo helper: window.__REC003__.force()

## COME TESTARE
1) Apri la pagina "storico" con 21+ righe:
   - Dovresti vedere in console: "[REC003] VirtualTable attiva (autowire)".
2) In qualsiasi momento puoi forzare manualmente:
   - Esegui in console: window.__REC003__.force()
3) Verifica che export PDF/XLSX e CRUD siano invariati.

## NOTE
- Nessun cambio di layout/CSS.
- Fallback invariato: se VirtualTable non è disponibile, la tabella resta tradizionale.

## ROLLBACK
cp -r .backups/REC003_TUNING_$ts/* ./

# ===== FINE REPORT =====
LOG

echo "==> COMPLETATO. Vedi REC003_TUNING_REPORT.txt"
