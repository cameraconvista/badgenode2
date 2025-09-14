#!/bin/bash
# ===== BADGENODE | REC-003 AUTOWIRE (MUTATION OBSERVER, NO LAYOUT CHANGE) =====
# Obiettivo: attivare automaticamente la VirtualTable quando lo storico viene popolato.
# Sicurezza: backup, modifica minima in storico.html (script già REC-003), fallback se mount non disponibile.
# Rollback: cp -r .backups/REC003_AUTOWIRE_$ts/* ./

set -euo pipefail
ts=$(date +%Y%m%d-%H%M%S)
RUN_ID="REC003-AUTOWIRE-$ts-$RANDOM"

echo "==> RUN_ID: $RUN_ID"
mkdir -p ".backups/REC003_AUTOWIRE_$ts"
cp -vr storico.html assets/scripts/virtual-table.js ".backups/REC003_AUTOWIRE_$ts/" 2>/dev/null | cat || true

# Pre-check: serve il hook REC003 già presente (aggiunto negli step precedenti)
if ! grep -q 'window.__REC003__' storico.html; then
  echo "[ERRORE] Hook REC003 non trovato in storico.html. Interrompo in sicurezza."
  exit 1
fi

# Inserisce/aggiorna un blocco di autowire dentro lo script REC003 esistente, in modo idempotente.
# Cerca il blocco <script type="module"> che già importa virtual-table e definisce window.__REC003__
# e inietta l'auto-wire se non presente.
if ! grep -q 'REC003-AUTOWIRE' storico.html; then
  # Inserimento subito dopo la definizione di window.__REC003__.mount
  awk '{
    print $0
  } /window\.__REC003__\.mount.*\}\;[[:space:]]*<\/script>/ && !x {
    print "<script type=\"module\">"
    print "/* REC003-AUTOWIRE — attiva VirtualTable in automatico, nessun cambio layout */"
    print "document.addEventListener('\''DOMContentLoaded'\'',()=>{"
    print "  try{"
    print "    const tb = document.querySelector('\''#storico-body'\'');"
    print "    if(!tb) return;"
    print "    if(tb.hasAttribute('\''data-rec003-off'\'')) { console.info('\''[REC003] autowire disattivato via data-rec003-off'\''); return; }"
    print "    let armed = false;"
    print "    const run = ()=>{"
    print "      if(armed) return;"
    print "      const trs = tb.querySelectorAll('\''tr'\'');"
    print "      if(trs.length > 150){"
    print "        const rowsHTML = Array.from(trs, tr => tr.outerHTML);"
    print "        if(window.__REC003__?.mount){"
    print "          window.__REC003__.mount(rowsHTML);"
    print "          console.info('\''[REC003] VirtualTable attiva (autowire)'\'', rowsHTML.length, '\''righe'\'');"
    print "          armed = true;"
    print "          obs.disconnect();"
    print "        }"
    print "      }"
    print "    };"
    print "    const obs = new MutationObserver(()=>{ try{ run(); }catch(e){ console.warn('\''[REC003] autowire fallback:'\'', e?.message||e); } });"
    print "    obs.observe(tb, { childList:true });"
    print "    /* tentativo anche se la tabella è già pronta */"
    print "    setTimeout(()=>{ try{ run(); }catch{} }, 0);"
    print "  }catch(e){ console.warn('\''[REC003] autowire non attivo:'\'', e?.message||e); }"
    print "});"
    print "</script>"
    x=1
  }' storico.html > storico.html.tmp && mv storico.html.tmp storico.html
  echo "[PATCH] Inserito blocco REC003-AUTOWIRE in storico.html"
else
  echo "[INFO] REC003-AUTOWIRE già presente in storico.html (idempotente, nessuna modifica)."
fi

# Report finale sintetico
cat > REC003_AUTOWIRE_REPORT.txt <<LOG
# ===== BADGENODE REC-003 AUTOWIRE REPORT =====
# Data: $ts
# RUN_ID: $RUN_ID
# Tipo: Attivazione automatica VirtualTable con MutationObserver

## OPERAZIONI
- Backup: .backups/REC003_AUTOWIRE_$ts/
- File modificato: storico.html (solo script REC-003 interno)
- Aggiunto blocco: /* REC003-AUTOWIRE */
- Comportamento:
  * Osserva #storico-body; quando ci sono >150 <tr> → monta VirtualTable
  * Disattivabile aggiungendo l'attributo data-rec003-off su #storico-body
  * Fallback: se mount non disponibile, nessun errore e tabella resta tradizionale

## VALIDAZIONI SUGGERITE
1) Apri "storico" con dataset ampio → lo scroll deve essere fluido.
2) Console: deve comparire "[REC003] VirtualTable attiva (autowire)".
3) Export PDF/XLSX e azioni CRUD invariati.
4) Nessun errore rosso in console; SW sempre unregistered.

## ROLLBACK
cp -r .backups/REC003_AUTOWIRE_$ts/* ./

# ===== FINE REPORT =====
LOG

echo "==> COMPLETATO. Vedi REC003_AUTOWIRE_REPORT.txt"
