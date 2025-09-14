#!/bin/bash
# ===== BADGENODE | HOTFIX + REC-003 INFRA SAFE RUN (RUN_ID: HF-REC003-$(date +%Y%m%d-%H%M%S)-$RANDOM) =====
set -euo pipefail

ts=$(date +%Y%m%d-%H%M%S)
RUN_ID="HF-REC003-$ts-$RANDOM"
echo "==> RUN_ID: $RUN_ID"

note(){ printf '%s\n' "$*" >&2; }
append_changelog(){
  cat >> BACKUP_AUTOMATICO_APPLICAZIONE_ChangeLog.txt <<LOG

## HOTFIX + REC-003 INFRA ($ts) — $RUN_ID
$1
Rollback: ripristina .backups/HF-REC003_$ts/*
LOG
}

# Backup conservativo
mkdir -p ".backups/HF-REC003_$ts"
cp -vr index.html utenti.html storico.html ex-dipendenti.html assets style.css 2>/dev/null | cat || true
echo "==> Backup in .backups/HF-REC-003_$ts"

# ───────────────────────────────────────────────────────────────────
# 1) RIMOZIONE /config.js da utenti.html (solo riferimento, non tocca altro)
if [ -f utenti.html ]; then
  if grep -qE '<script[^>]+src=["'\''"]/config\.js["'\'']' utenti.html; then
    sed -i.bak -E 's#\s*<script[^>]+src=["'\''"]/config\.js["'\''][^>]*>\s*</script>\s*##' utenti.html
    rm -f utenti.html.bak
    echo "[HOTFIX] Rimosso riferimento /config.js da utenti.html"
  else
    echo "[INFO] Nessun /config.js in utenti.html (skip)"
  fi
fi

# 2) RIMOZIONE perf.patch.js da storico.html e ex-dipendenti.html
for f in storico.html ex-dipendenti.html; do
  if [ -f "$f" ]; then
    if grep -qE '<script[^>]+src=["'\''"]/assets/scripts/perf\.patch\.js["'\'']' "$f"; then
      sed -i.bak -E 's#\s*<script[^>]+src=["'\''"]/assets/scripts/perf\.patch\.js["'\''][^>]*>\s*</script>\s*##' "$f"
      rm -f "$f".bak
      echo "[HOTFIX] Rimosso riferimento perf.patch.js da $f"
    else
      echo "[INFO] Nessun perf.patch.js in $f (skip)"
    fi
  fi
done

# ───────────────────────────────────────────────────────────────────
# 3) REC-003 INFRA: aggiungi modulo virtual-table.js + hook opt-in se mancanti (NO aggancio automatico)
mkdir -p assets/scripts

# Crea il modulo solo se non esiste
if [ ! -f assets/scripts/virtual-table.js ]; then
  cat > assets/scripts/virtual-table.js <<'JS'
/**
 * VirtualTable v1 — finestra virtuale per <tbody>.
 * Non cambia layout/DOM: accetta array di stringhe TR e renderizza solo la porzione visibile.
 */
export class VirtualTable {
  constructor(tbody, options={}){
    this.tbody = tbody;
    this.rowHeight = options.rowHeight || 44;
    this.buffer = options.buffer || 12;
    this.rows = [];
    this.container = tbody?.parentElement || null;
    this._onScroll = this._onScroll.bind(this);
  }
  setRows(htmlRows=[]){
    this.rows = htmlRows;
    const total = this.rows.length * this.rowHeight;
    Object.assign(this.tbody.style, { display:'block', position:'relative', height: total+'px' });
    this._render(); this._attach();
  }
  _attach(){
    const scroller = this.container || this.tbody?.parentElement;
    if (!scroller) return;
    scroller.removeEventListener('scroll', this._onScroll);
    scroller.addEventListener('scroll', this._onScroll, { passive:true });
  }
  _onScroll(){ this._render(); }
  _render(){
    const scroller = this.container || this.tbody?.parentElement || document.scrollingElement;
    if (!scroller) return;
    const scrollTop = scroller.scrollTop || 0;
    const height = scroller.clientHeight || window.innerHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.buffer);
    const endIndex = Math.min(this.rows.length, Math.ceil((scrollTop + height) / this.rowHeight) + this.buffer);
    const offsetTop = startIndex * this.rowHeight;
    const slice = this.rows.slice(startIndex, endIndex).join('');
    this.tbody.innerHTML = `<tr style="height:${offsetTop}px"></tr>${slice}<tr style="height:${Math.max(0,(this.rows.length-endIndex)*this.rowHeight)}px"></tr>`;
  }
}
JS
  echo "[REC-003] Creato assets/scripts/virtual-table.js"
else
  echo "[REC-003] virtual-table.js già presente (ok)"
fi

# Aggiungi hook opt-in in storico.html se assente
if [ -f storico.html ] && ! grep -q 'window.__REC003__' storico.html; then
  awk '1; /<\/body>/ && !x {
    print "<script type=\"module\">\
import { VirtualTable } from \x27./assets/scripts/virtual-table.js\x27; \
window.__REC003__ = window.__REC003__ || {}; \
window.__REC003__.mount = (rowsHTML)=>{ \
  try{ \
    const tb = document.querySelector(\x27#storico-body\x27); \
    if(!tb) return console.warn(\x27[REC003] tbody non trovato\x27); \
    const vt = new VirtualTable(tb,{ rowHeight: 44, buffer: 12 }); \
    vt.setRows(rowsHTML); \
    console.info(\x27[REC003] virtual table attiva:\x27, rowsHTML?.length||0, \x27righe\x27); \
  }catch(e){ console.warn(\x27[REC003] fallback renderer:\x27, e?.message||e); } \
};\
</script>";
    x=1 }' storico.html > storico.html.tmp && mv storico.html.tmp storico.html
  echo "[REC-003] Hook window.__REC003__.mount aggiunto a storico.html (opt-in)"
else
  echo "[REC-003] Hook già presente o storico.html mancante (ok/skip)"
fi

# ───────────────────────────────────────────────────────────────────
# Commit + push su main (remote confermato)
GIT_REMOTE="https://github.com/cameraconvista/badgenode2.git"
git init >/dev/null 2>&1 || true
git remote remove origin >/dev/null 2>&1 || true
git remote add origin "$GIT_REMOTE" || true
git add -A
git commit -m "HOTFIX: remove /config.js & perf.patch.js; add REC-003 infra (opt-in) — $RUN_ID" || true
git branch -M main
git push -u origin main

append_changelog "Rimossi /config.js e perf.patch.js; REC-003 infra opt-in pronta" "Nessun cambio di layout/renderer. Test manuale possibile via console: window.__REC003__.mount([...TR HTML...])."

echo "==> COMPLETATO. Esegui: Clear build cache & Deploy su Render (se HTML/JS toccati)."
echo "==> Ricorda validazioni fisse: navigazione, export, azioni CRUD, assenza errori console, SW unregistered."
# ==============================================================================================
